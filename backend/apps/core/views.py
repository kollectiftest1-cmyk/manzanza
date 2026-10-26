from django.db.models import Count
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.permissions import IsAdminUser

from .audit import audit
from .models import AcademicCalendarEvent, AuditLog, InstitutionSettings, TrashItem
from .serializers import SupportTicketSerializer  # noqa: E402
from .serializers import (
    AcademicCalendarEventSerializer, AuditLogSerializer, InstitutionSettingsSerializer, TrashItemSerializer,
)
from .trash import purge_expired, restore_batch, visible_trash_items


def _is_pdg(user):
    return bool(user and user.is_authenticated and (user.is_superuser or user.role == 'pdg'))


class IsIAdmin(BasePermission):
    message = "Réservé au PDG (administrateur général)."

    def has_permission(self, request, view):
        return _is_pdg(request.user)


class CanReadAudit(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and (
            user.is_superuser or user.role in ['pdg', 'directeur_general']
        ))


class AcademicCalendarEventViewSet(viewsets.ModelViewSet):
    queryset = AcademicCalendarEvent.objects.all()
    serializer_class = AcademicCalendarEventSerializer
    permission_classes = [IsAdminUser]


class TrashViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """
    Corbeille.
      GET  /api/core/trash/                 lots visibles (racines), jours restants
      GET  /api/core/trash/{id}/            détail d'un lot
      GET  /api/core/trash/{id}/contents/   éléments supprimés avec la racine
      POST /api/core/trash/{id}/restore/    restauration du lot complet
    Aucune suppression définitive manuelle n'est exposée : seule la purge automatique
    supprime, une fois la durée de conservation écoulée.
    """
    serializer_class = TrashItemSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ['object_repr', 'reason']
    ordering_fields = ['deleted_at', 'object_repr', 'module']
    filterset_fields = ['module']

    def get_queryset(self):
        return visible_trash_items(self.request.user).order_by('-deleted_at')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['retention_days'] = InstitutionSettings.load().trash_retention_days
        context['batch_counts'] = dict(
            TrashItem.objects.values('batch').annotate(n=Count('id')).values_list('batch', 'n')
        )
        return context

    def list(self, request, *args, **kwargs):
        # Purge opportuniste : la corbeille affichée ne montre jamais d'éléments expirés.
        purge_expired()
        response = super().list(request, *args, **kwargs)
        settings_obj = InstitutionSettings.load()
        if isinstance(response.data, dict):
            response.data['retention_days'] = settings_obj.trash_retention_days
        return response

    @action(detail=True, methods=['get'])
    def contents(self, request, pk=None):
        root = self.get_object()
        items = TrashItem.objects.filter(batch=root.batch).select_related('content_type', 'deleted_by')
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        root = self.get_object()
        restored = restore_batch(root.batch, user=request.user)
        return Response({
            'detail': f"« {restored} » a été restauré avec tous les éléments supprimés en même temps.",
        }, status=status.HTTP_200_OK)


class InstitutionSettingsView(APIView):
    """GET : lecture (utilisateurs connectés). PATCH/PUT : PDG uniquement."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(InstitutionSettingsSerializer(InstitutionSettings.load()).data)

    # Règles académiques et financières : fixées par la direction ; la corbeille par le PDG.
    POLICY_FIELDS = {'exam_min_paid_percent', 'results_require_clearance', 'admission_requires_application_fee',
                     'institution_name', 'institution_city', 'rector_name', 'sga_name'}

    def patch(self, request):
        from apps.users.permissions import has_role
        fields = set(request.data.keys())
        is_admin = _is_pdg(request.user)
        is_direction = has_role(request.user, 'pdg', 'directeur_general')
        if not is_admin and not (is_direction and fields <= self.POLICY_FIELDS):
            return Response({'detail': "Paramètres réservés à la direction (règles) et au PDG (système)."},
                            status=status.HTTP_403_FORBIDDEN)
        obj = InstitutionSettings.load()
        before = InstitutionSettingsSerializer(obj).data
        serializer = InstitutionSettingsSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        after = InstitutionSettingsSerializer(obj).data
        changes = {k: {'avant': before.get(k), 'apres': after.get(k)} for k in fields
                   if k in after and before.get(k) != after.get(k)}
        audit('settings', obj, user=request.user, details=changes)
        return Response(after)

    put = patch


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related('content_type').all()
    serializer_class = AuditLogSerializer
    permission_classes = [CanReadAudit]
    filterset_fields = ['action']
    search_fields = ['actor_repr', 'object_repr']
    ordering_fields = ['timestamp']


class SupportTicketViewSet(viewsets.ModelViewSet):
    """
    Helpdesk : tout utilisateur ouvre un ticket et suit les siens ; le Service IT
    (et le PDG) voit tout, prend en charge, résout. Un ticket ne se supprime pas : il se ferme.
    """
    serializer_class = SupportTicketSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'head', 'options']
    filterset_fields = ['status', 'priority', 'category']
    search_fields = ['title', 'description', 'created_by__last_name']

    def _is_it(self):
        from apps.users.permissions import has_role
        return has_role(self.request.user, 'service_it', 'pdg')

    def get_queryset(self):
        from .models import SupportTicket
        qs = SupportTicket.objects.select_related('created_by', 'assigned_to')
        return qs if self._is_it() else qs.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        ticket = serializer.save(created_by=self.request.user)
        try:
            from apps.notifications.models import Notification
            from apps.users.models import User
            for agent in User.objects.filter(role='service_it', is_active=True):
                Notification.objects.create(recipient=agent, title=f"Nouveau ticket : {ticket.title}",
                                            message=f"{ticket.get_priority_display()} — {ticket.created_by}",
                                            notification_type='systeme', link='/service-it')
        except Exception:
            pass

    @action(detail=True, methods=['post'])
    def take(self, request, pk=None):
        if not self._is_it():
            return Response({'detail': "Réservé au Service IT."}, status=status.HTTP_403_FORBIDDEN)
        t = self.get_object()
        if t.status in ('resolu', 'ferme'):
            return Response({'detail': "Ticket déjà clôturé."}, status=status.HTTP_400_BAD_REQUEST)
        t.assigned_to = request.user
        t.status = 'en_cours'
        t.save()
        return Response(self.get_serializer(t).data)

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        from django.utils import timezone
        if not self._is_it():
            return Response({'detail': "Réservé au Service IT."}, status=status.HTTP_403_FORBIDDEN)
        t = self.get_object()
        resolution = (request.data.get('resolution') or '').strip()
        if not resolution:
            return Response({'resolution': "Décrivez la solution apportée."}, status=status.HTTP_400_BAD_REQUEST)
        t.status = 'resolu'
        t.resolution = resolution
        t.resolved_at = timezone.now()
        t.assigned_to = t.assigned_to or request.user
        t.save()
        try:
            from apps.notifications.models import Notification
            Notification.objects.create(recipient=t.created_by, title=f"Ticket résolu : {t.title}",
                                        message=resolution[:300], notification_type='systeme')
        except Exception:
            pass
        return Response(self.get_serializer(t).data)

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        t = self.get_object()
        if not (self._is_it() or t.created_by_id == request.user.id):
            return Response(status=status.HTTP_403_FORBIDDEN)
        t.status = 'ferme'
        t.save()
        return Response(self.get_serializer(t).data)
