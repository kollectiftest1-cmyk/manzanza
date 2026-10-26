"""
API Scolarité (/api/scolarite/) : UE, inscriptions annuelles, affectations de rôles,
délibérations & résultats, documents officiels (émission, téléchargement, vérification publique).
"""
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Q
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes, throttle_classes
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from apps.core.audit import audit
from apps.users.permissions import ACADEMIC_ADMIN_ROLES, DIRECTION_ROLES, has_role, scoped_affectations

from .models import (AffectationRole, Memoire, Deliberation, DocumentOfficiel, InscriptionAnnuelle, ResultatDeliberation,
                     UniteEnseignement)
from .serializers import (AffectationRoleSerializer, MemoireSerializer, DeliberationSerializer, DocumentOfficielSerializer,
                          InscriptionAnnuelleSerializer, ResultatSerializer, UniteEnseignementSerializer)
from .services import deliberation as delib_svc
from .services import documents as doc_svc
from .services import enrollment
from .services.finance import clearance

READ_ACADEMIC = ACADEMIC_ADMIN_ROLES + DIRECTION_ROLES + ['chef_section', 'chef_departement', 'apparitorat']


def _scope_filieres(user):
    """None = toutes les filières ; sinon ensemble des filières visibles (chefs)."""
    if has_role(user, *ACADEMIC_ADMIN_ROLES, *DIRECTION_ROLES, 'apparitorat'):
        return None
    ids = set()
    for aff in scoped_affectations(user, 'chef_departement'):
        if aff.filiere_id:
            ids.add(aff.filiere_id)
    from apps.auditoires.models import Filiere
    for aff in scoped_affectations(user, 'chef_section'):
        if aff.section_id:
            ids |= set(Filiere.objects.filter(section_id=aff.section_id).values_list('id', flat=True))
    if user.role == 'chef_departement' and user.filiere_id:
        ids.add(user.filiere_id)
    if user.role == 'chef_section' and user.section_id:
        ids |= set(Filiere.objects.filter(section_id=user.section_id).values_list('id', flat=True))
    return ids


def _sync_ue_inscriptions(ue):
    """Une UE ajoutée en cours d'année est inscrite au programme des étudiants concernés."""
    from .models import InscriptionUE
    for ins in InscriptionAnnuelle.objects.filter(auditoire__filiere=ue.filiere, niveau=ue.niveau,
                                                  statut__in=InscriptionAnnuelle.ACTIVE_STATUTS):
        InscriptionUE.objects.get_or_create(inscription=ins, ue=ue)


class AcademicWrite(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return has_role(request.user, *ACADEMIC_ADMIN_ROLES)


class UniteEnseignementViewSet(viewsets.ModelViewSet):
    serializer_class = UniteEnseignementSerializer
    permission_classes = [AcademicWrite]
    filterset_fields = ['filiere', 'niveau', 'semestre', 'is_active']
    search_fields = ['code', 'intitule']

    def get_queryset(self):
        return UniteEnseignement.objects.select_related('filiere').prefetch_related('cours').order_by(
            'filiere__nom', 'niveau', 'semestre', 'code')

    def perform_create(self, serializer):
        obj = serializer.save()
        _sync_ue_inscriptions(obj)
        audit('create', obj)

    @action(detail=True, methods=['get'])
    def candidates(self, request, pk=None):
        """Cours rattachables : ceux des groupes de la même filière et du même niveau."""
        from apps.courses.models import Course
        ue = self.get_object()
        qs = Course.objects.filter(auditoire__filiere=ue.filiere, auditoire__niveau=ue.niveau, is_active=True) \
            .select_related('auditoire', 'ue').order_by('auditoire__nom', 'name')
        return Response([{'id': c.id, 'code': c.code, 'name': c.name, 'credits': c.credits,
                          'auditoire': c.auditoire.nom, 'annee': c.auditoire.annee_academique,
                          'ue': c.ue_id, 'ue_code': c.ue.code if c.ue_id else None} for c in qs])

    @action(detail=True, methods=['post'], url_path='set-courses')
    def set_courses(self, request, pk=None):
        """Rattache à l'UE exactement les cours indiqués (même filière et même niveau)."""
        from apps.courses.models import Course
        ue = self.get_object()
        ids = [int(i) for i in request.data.get('courses', [])]
        courses = list(Course.objects.filter(id__in=ids).select_related('auditoire'))
        bad = [c.name for c in courses if not c.auditoire_id or c.auditoire.filiere_id != ue.filiere_id
               or c.auditoire.niveau != ue.niveau]
        if bad:
            raise ValidationError({'courses': "Cours hors filière/niveau de l'UE : " + ', '.join(bad)})
        Course.objects.filter(ue=ue).exclude(id__in=ids).update(ue=None)
        Course.objects.filter(id__in=ids).update(ue=ue)
        _sync_ue_inscriptions(ue)
        audit('update', ue, details={'action': 'cours_rattaches', 'cours': ids})
        return Response(self.get_serializer(ue).data)

    def perform_destroy(self, instance):
        if instance.cours.filter(is_active=True).exists():
            raise ValidationError({'detail': "Retirez ou désactivez d'abord les cours rattachés à cette UE."})
        instance.delete(user=self.request.user)


class InscriptionAnnuelleViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin,
                                 mixins.DestroyModelMixin, viewsets.GenericViewSet):
    """
    Inscription annuelle : en_attente → administrative (frais requis réglés, apparitorat/SGA)
    → pédagogique (UE validées, SGA / chef de filière). Un étudiant ne voit que les siennes.
    """
    serializer_class = InscriptionAnnuelleSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['academic_year', 'auditoire', 'statut', 'niveau', 'type_inscription', 'student']
    search_fields = ['student__first_name', 'student__last_name', 'student__matricule', 'student__email']

    def get_queryset(self):
        user = self.request.user
        qs = InscriptionAnnuelle.objects.select_related(
            'student', 'academic_year', 'auditoire__filiere').prefetch_related('ues__ue__cours')
        if user.role == 'etudiant':
            return qs.filter(student=user)
        if has_role(user, *READ_ACADEMIC, 'caisse', 'comptable', 'sgad'):
            scope = _scope_filieres(user) if not has_role(user, 'caisse', 'comptable', 'sgad') else None
            return qs if scope is None else qs.filter(auditoire__filiere_id__in=scope)
        return qs.none()

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['with_finance'] = self.action in ('retrieve', 'me') or self.request.query_params.get('finance') == '1'
        return ctx

    def create(self, request, *args, **kwargs):
        if not has_role(request.user, *ACADEMIC_ADMIN_ROLES):
            raise PermissionDenied("Seul le SGA crée des inscriptions annuelles.")
        from apps.auditoires.models import Auditoire
        from apps.users.models import User
        student = get_object_or_404(User, pk=request.data.get('student'))
        auditoire = get_object_or_404(Auditoire, pk=request.data.get('auditoire'))
        ins = enrollment.create_inscription(student, auditoire, user=request.user,
                                            type_inscription=request.data.get('type_inscription', 'nouvelle'))
        if student.auditoire_id != auditoire.id:
            student.auditoire = auditoire
            student.save(update_fields=['auditoire'])
        return Response(self.get_serializer(ins).data, status=status.HTTP_201_CREATED)

    def perform_destroy(self, instance):
        if not has_role(self.request.user, *ACADEMIC_ADMIN_ROLES):
            raise PermissionDenied()
        if instance.statut not in ('en_attente',):
            raise ValidationError({'detail': "Une inscription validée ne se supprime pas : passez-la en abandon."})
        instance.delete(user=self.request.user)

    @action(detail=False, methods=['get'])
    def me(self, request):
        ins = self.get_queryset().filter(student=request.user).order_by('-academic_year__start_date')
        return Response(self.get_serializer(ins, many=True).data)

    @action(detail=True, methods=['post'], url_path='validate-admin')
    def validate_admin(self, request, pk=None):
        if not has_role(request.user, *ACADEMIC_ADMIN_ROLES, 'apparitorat'):
            raise PermissionDenied()
        force = str(request.data.get('force', '')).lower() in ('1', 'true') and has_role(request.user, 'sga', 'pdg')
        ins = enrollment.validate_admin(self.get_object(), request.user, force=force)
        return Response(self.get_serializer(ins).data)

    @action(detail=True, methods=['post'], url_path='validate-peda')
    def validate_peda(self, request, pk=None):
        ins = self.get_object()
        scope = _scope_filieres(request.user)
        allowed = has_role(request.user, *ACADEMIC_ADMIN_ROLES) or (
            scope is not None and ins.auditoire.filiere_id in scope)
        if not allowed:
            raise PermissionDenied("Validation pédagogique : SGA ou chef de la filière.")
        ins = enrollment.validate_peda(ins, request.user)
        return Response(self.get_serializer(ins).data)

    @action(detail=True, methods=['post'], url_path='change-status')
    def change_status(self, request, pk=None):
        if not has_role(request.user, *ACADEMIC_ADMIN_ROLES):
            raise PermissionDenied()
        ins = self.get_object()
        new = request.data.get('statut')
        if new not in ('suspendue', 'abandon', 'pedagogique', 'administrative'):
            raise ValidationError({'statut': "Statut non autorisé."})
        reason = (request.data.get('reason') or '').strip()
        if new in ('suspendue', 'abandon') and not reason:
            raise ValidationError({'reason': "Motif obligatoire."})
        before = ins.statut
        ins.statut = new
        if reason:
            ins.notes = (ins.notes + '\n' if ins.notes else '') + f"[{timezone.localdate():%d/%m/%Y}] {new}: {reason}"
        ins.save()
        audit('inscription', ins, details={'action': 'changement_statut', 'avant': before, 'apres': new,
                                           'motif': reason})
        return Response(self.get_serializer(ins).data)

    @action(detail=False, methods=['post'], url_path='backfill')
    def backfill(self, request):
        if not has_role(request.user, 'pdg', 'sga'):
            raise PermissionDenied()
        return Response({'created': enrollment.backfill_from_legacy()})


class AffectationRoleViewSet(viewsets.ModelViewSet):
    serializer_class = AffectationRoleSerializer
    filterset_fields = ['user', 'role', 'filiere', 'section']

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = AffectationRole.objects.select_related('user', 'filiere', 'section')
        if has_role(self.request.user, 'pdg', 'sga', 'sgad', *DIRECTION_ROLES):
            return qs
        return qs.filter(user=self.request.user)

    def _check_write(self, role):
        user = self.request.user
        finance_roles = {'comptable', 'caisse'}
        if has_role(user, 'pdg'):
            return
        if role in finance_roles and has_role(user, 'sgad'):
            return
        if role not in finance_roles and has_role(user, 'sga'):
            return
        raise PermissionDenied("Vous ne pouvez pas attribuer ce rôle.")

    def perform_create(self, serializer):
        self._check_write(serializer.validated_data['role'])
        obj = serializer.save(created_by=self.request.user)
        audit('role', obj.user, details={'action': 'affectation', 'role': obj.role,
                                                'du': str(obj.start_date), 'au': str(obj.end_date or '')})

    def perform_update(self, serializer):
        self._check_write(serializer.validated_data.get('role', serializer.instance.role))
        obj = serializer.save()
        audit('role', obj.user, details={'action': 'affectation_modifiee', 'role': obj.role})

    def perform_destroy(self, instance):
        self._check_write(instance.role)
        instance.delete(user=self.request.user)


def visible_deliberations(user):
    qs = Deliberation.objects.all()
    if has_role(user, *ACADEMIC_ADMIN_ROLES, *DIRECTION_ROLES, 'apparitorat'):
        return qs
    if user.role == 'etudiant':
        return qs.none()
    scope = _scope_filieres(user)
    cond = Q(president=user) | Q(secretaire=user) | Q(membres=user)
    if scope:
        cond |= Q(auditoire__filiere_id__in=scope)
    return qs.filter(id__in=qs.filter(cond).values('id'))


class DeliberationViewSet(viewsets.ModelViewSet):
    serializer_class = DeliberationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['auditoire', 'session', 'statut', 'academic_year']
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        return visible_deliberations(self.request.user).select_related(
            'auditoire__filiere', 'academic_year', 'president', 'secretaire').prefetch_related('membres')

    def perform_create(self, serializer):
        if not has_role(self.request.user, *ACADEMIC_ADMIN_ROLES):
            raise PermissionDenied("Le SGA constitue les jurys.")
        aud = serializer.validated_data['auditoire']
        year = aud.academic_year or enrollment.academic_year_for_label(aud.annee_academique)
        obj = serializer.save(created_by=self.request.user, academic_year=year)
        audit('grade', obj, details={'action': 'jury_constitue', 'president': obj.president_id})

    def perform_update(self, serializer):
        if not has_role(self.request.user, *ACADEMIC_ADMIN_ROLES):
            raise PermissionDenied()
        serializer.save()

    def _ok(self, obj):
        obj.refresh_from_db()
        return Response(self.get_serializer(obj).data)

    @action(detail=True, methods=['post'])
    def open(self, request, pk=None):
        force = str(request.data.get('force', '')).lower() in ('1', 'true') and has_role(request.user, 'sga', 'pdg')
        return self._ok(delib_svc.open_deliberation(self.get_object(), request.user, force=force))

    @action(detail=True, methods=['post'])
    def compute(self, request, pk=None):
        obj = self.get_object()
        delib_svc.compute_results(obj, request.user)
        return self._ok(obj)

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        return self._ok(delib_svc.close_deliberation(self.get_object(), request.user))

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        date = parse_datetime(request.data['publication_date']) if request.data.get('publication_date') else None
        return self._ok(delib_svc.publish(self.get_object(), request.user, publication_date=date))

    @action(detail=True, methods=['get'])
    def resultats(self, request, pk=None):
        obj = self.get_object()
        qs = obj.resultats.select_related('student').order_by('rang', 'student__last_name')
        return Response(ResultatSerializer(qs, many=True).data)

    @action(detail=True, methods=['get'])
    def pv(self, request, pk=None):
        obj = self.get_object()
        if not obj.pv_file:
            raise ValidationError({'detail': "Le PV est généré à la clôture."})
        audit('export', obj, details={'action': 'telechargement_pv'})
        return FileResponse(obj.pv_file.open('rb'), as_attachment=True,
                            filename=f"PV_{obj.auditoire.nom}_S{obj.session}.pdf", content_type='application/pdf')

    @action(detail=True, methods=['post'], url_path='prepare-reinscriptions')
    def prepare_reinscriptions(self, request, pk=None):
        if not has_role(request.user, *ACADEMIC_ADMIN_ROLES):
            raise PermissionDenied()
        obj = self.get_object()
        if obj.statut != 'publiee':
            raise ValidationError({'detail': "Les réinscriptions se préparent après publication."})
        from apps.schedules.models import AcademicYear
        next_year = get_object_or_404(AcademicYear, pk=request.data.get('academic_year'))
        if obj.academic_year and next_year.start_date <= obj.academic_year.start_date:
            raise ValidationError({'academic_year': "Choisissez une année postérieure."})
        return Response(enrollment.prepare_reinscriptions(obj, next_year, request.user))


class ResultatViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = ResultatSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['deliberation', 'student', 'decision']

    def get_queryset(self):
        user = self.request.user
        qs = ResultatDeliberation.objects.select_related('student', 'deliberation__auditoire')
        if user.role == 'etudiant':
            now = timezone.now()
            return qs.filter(student=user, deliberation__statut='publiee').filter(
                Q(deliberation__publication_date__isnull=True) | Q(deliberation__publication_date__lte=now))
        return qs.filter(deliberation__in=visible_deliberations(user))

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Résultats publiés de l'étudiant ; détails masqués si les frais ne sont pas en règle."""
        from apps.core.models import InstitutionSettings
        qs = ResultatDeliberation.objects.filter(student=request.user).select_related('deliberation__auditoire')
        now = timezone.now()
        qs = qs.filter(deliberation__statut='publiee').filter(
            Q(deliberation__publication_date__isnull=True) | Q(deliberation__publication_date__lte=now))
        require = InstitutionSettings.load().results_require_clearance
        out = []
        for res in qs.order_by('-deliberation__created_at'):
            data = ResultatSerializer(res).data
            data['auditoire_name'] = res.deliberation.auditoire.nom
            data['session_label'] = res.deliberation.get_session_display()
            data['annee'] = res.deliberation.auditoire.annee_academique
            fin = clearance(request.user, res.inscription)
            data['finance'] = {'cleared': fin['cleared'], 'paid_percent': float(fin['paid_percent']),
                               'required_percent': fin['required_percent']}
            if require and not fin['cleared']:
                data.update({'moyenne': None, 'details': {}, 'mention': '', 'mention_label': '', 'rang': None,
                             'credits_obtenus': None, 'blocked': True})
                data['decision_label'] = 'Résultat disponible après régularisation des frais'
            out.append(data)
        return Response(out)

    @action(detail=True, methods=['post'])
    def override(self, request, pk=None):
        res = self.get_object()
        res = delib_svc.override_decision(res, request.user, request.data.get('decision'),
                                          request.data.get('justification', ''), request.data.get('mention'))
        return Response(self.get_serializer(res).data)


class DocumentOfficielViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = DocumentOfficielSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['type_document', 'student', 'revoked', 'academic_year']
    search_fields = ['numero', 'student__last_name', 'student__matricule']

    def get_queryset(self):
        user = self.request.user
        qs = DocumentOfficiel.objects.select_related('student', 'issued_by')
        if has_role(user, *ACADEMIC_ADMIN_ROLES, *DIRECTION_ROLES, 'apparitorat'):
            return qs
        return qs.filter(student=user, revoked=False)

    @action(detail=False, methods=['post'])
    def issue(self, request):
        if not has_role(request.user, *ACADEMIC_ADMIN_ROLES, 'apparitorat'):
            raise PermissionDenied("Émission réservée au secrétariat académique.")
        type_document = request.data.get('type_document')
        if type_document not in dict(DocumentOfficiel.TYPE_CHOICES):
            raise ValidationError({'type_document': "Type inconnu."})
        if type_document == 'diplome' and not has_role(request.user, *ACADEMIC_ADMIN_ROLES):
            raise PermissionDenied("Le diplôme est émis par le SGA.")
        resultat = inscription = None
        if request.data.get('resultat'):
            resultat = get_object_or_404(ResultatDeliberation, pk=request.data['resultat'])
            student = resultat.student
        elif request.data.get('inscription'):
            inscription = get_object_or_404(InscriptionAnnuelle, pk=request.data['inscription'])
            student = inscription.student
        else:
            raise ValidationError({'detail': "Indiquez un résultat (relevé, attestation, diplôme) ou une inscription."})
        force = str(request.data.get('ignore_clearance', '')).lower() in ('1', 'true') and has_role(request.user, 'sga', 'pdg')
        doc = doc_svc.issue_document(type_document, student, request.user, resultat=resultat, inscription=inscription,
                                     check_clearance=not force)
        return Response(self.get_serializer(doc).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        doc = self.get_object()
        if not doc.pdf_file:
            raise ValidationError({'detail': "Fichier indisponible."})
        return FileResponse(doc.pdf_file.open('rb'), as_attachment=True, filename=f"{doc.numero}.pdf",
                            content_type='application/pdf')

    @action(detail=True, methods=['post'])
    def revoke(self, request, pk=None):
        if not has_role(request.user, *ACADEMIC_ADMIN_ROLES):
            raise PermissionDenied()
        doc = self.get_object()
        reason = (request.data.get('reason') or '').strip()
        if not reason:
            raise ValidationError({'reason': "Motif obligatoire."})
        doc.revoked = True
        doc.revoked_reason = reason
        doc.save(update_fields=['revoked', 'revoked_reason'])
        audit('update', doc, details={'action': 'document_revoque', 'motif': reason})
        return Response(self.get_serializer(doc).data)


class VerifyThrottle(AnonRateThrottle):
    scope = 'public_form'


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
@throttle_classes([VerifyThrottle])
def verify_document(request, code):
    """Vérification publique (QR code) : n'expose que le strict nécessaire."""
    try:
        doc = DocumentOfficiel.objects.select_related('student').get(verification_code=code)
    except (DocumentOfficiel.DoesNotExist, ValueError, DjangoValidationError):
        return Response({'valid': False, 'detail': "Aucun document ne correspond à ce code."},
                        status=status.HTTP_404_NOT_FOUND)
    from apps.core.models import InstitutionSettings
    snap = doc.snapshot or {}
    return Response({
        'valid': not doc.revoked,
        'revoked': doc.revoked,
        'revoked_reason': doc.revoked_reason if doc.revoked else '',
        'numero': doc.numero,
        'type_label': doc.get_type_document_display(),
        'student_name': doc.student.name,
        'matricule': doc.student.matricule,
        'issued_at': doc.issued_at,
        'filiere': snap.get('filiere'),
        'niveau': snap.get('niveau_label'),
        'annee': snap.get('annee'),
        'decision': snap.get('decision_label'),
        'mention': snap.get('mention_label'),
        'institution': InstitutionSettings.load().institution_name,
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_clearance(request):
    ins = InscriptionAnnuelle.objects.filter(student=request.user).order_by('-academic_year__start_date').first()
    data = clearance(request.user, ins)
    data['paid_percent'] = float(data['paid_percent'])
    for row in data['overdue']:
        row['total_amount'] = float(row['total_amount'])
        row['amount_paid'] = float(row['amount_paid'])
    return Response(data)



class MemoireViewSet(viewsets.ModelViewSet):
    """
    TFC / mémoires : l'étudiant propose son sujet et son directeur, le chef de filière (ou le SGA)
    valide, l'étudiant dépose, le SGA / chef programme la soutenance et compose le jury,
    le président du jury saisit la note (reportée dans le cours TFC/mémoire s'il est lié).
    """
    serializer_class = MemoireSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['statut', 'type_travail', 'directeur']
    search_fields = ['titre', 'student__last_name', 'student__matricule']
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        qs = Memoire.objects.select_related('student', 'directeur', 'encadreur', 'president_jury',
                                            'inscription__auditoire').prefetch_related('membres_jury')
        if has_role(user, *ACADEMIC_ADMIN_ROLES, *DIRECTION_ROLES):
            return qs
        if user.role == 'etudiant':
            return qs.filter(student=user)
        scope = _scope_filieres(user)
        cond = Q(directeur=user) | Q(encadreur=user) | Q(president_jury=user) | Q(membres_jury=user)
        if scope:
            cond |= Q(inscription__auditoire__filiere_id__in=scope)
        return qs.filter(cond).distinct()

    def _can_manage(self, m):
        user = self.request.user
        if has_role(user, *ACADEMIC_ADMIN_ROLES):
            return True
        scope = _scope_filieres(user)
        return bool(scope and m.inscription_id and m.inscription.auditoire.filiere_id in scope)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'etudiant':
            student = user
        else:
            if not has_role(user, *ACADEMIC_ADMIN_ROLES, 'chef_section', 'chef_departement'):
                raise PermissionDenied()
            student = serializer.validated_data.get('student')
            if not student:
                raise ValidationError({'student': "Indiquez l'étudiant."})
        ins = InscriptionAnnuelle.objects.filter(student=student).order_by('-academic_year__start_date').first()
        if Memoire.objects.filter(student=student, inscription=ins).exclude(statut='refuse').exists():
            raise ValidationError({'detail': "Un travail de fin de cycle est déjà en cours pour cette année."})
        m = serializer.save(student=student, inscription=ins)
        audit('create', m, details={'action': 'sujet_propose'})

    def perform_update(self, serializer):
        m = serializer.instance
        user = self.request.user
        if m.statut not in ('propose', 'refuse'):
            raise ValidationError({'detail': "Le sujet ne se modifie plus après validation."})
        if not (m.student_id == user.id or self._can_manage(m)):
            raise PermissionDenied()
        serializer.save(statut='propose')

    @action(detail=False, methods=['get'])
    def options(self, request):
        """Listes utiles au formulaire : enseignants (directeur, jury) et cours de l'étudiant."""
        from apps.courses.models import Course
        from apps.users.models import User
        teachers = User.objects.filter(is_active=True, role__in=['enseignant', 'chef_section', 'chef_departement',
                                                                 'assistant', 'jury']).order_by('last_name')
        student = request.user if request.user.role == 'etudiant' else None
        courses = Course.objects.filter(is_active=True)
        if student:
            courses = courses.filter(auditoire_id=student.auditoire_id) if student.auditoire_id else courses.none()
        else:
            courses = courses.filter(Q(name__icontains='mémoire') | Q(name__icontains='memoire') | Q(name__icontains='tfc'))
        return Response({
            'enseignants': [{'id': u.id, 'name': u.name, 'role': u.role} for u in teachers[:500]],
            'cours': [{'id': c.id, 'name': c.name, 'code': c.code} for c in courses.order_by('name')[:300]],
        })

    @action(detail=True, methods=['post'])
    def decide(self, request, pk=None):
        m = self.get_object()
        if not self._can_manage(m):
            raise PermissionDenied("Validation du sujet : chef de filière ou SGA.")
        if m.statut != 'propose':
            raise ValidationError({'detail': "Seul un sujet proposé se valide."})
        accept = str(request.data.get('accept', '')).lower() in ('1', 'true', 'oui')
        motif = (request.data.get('motif') or '').strip()
        if not accept and not motif:
            raise ValidationError({'motif': 'Motif du refus obligatoire.'})
        m.statut = 'valide' if accept else 'refuse'
        m.motif_refus = '' if accept else motif
        m.save()
        _notify(m.student, 'Sujet ' + ('validé' if accept else 'refusé'), f"« {m.titre} »" + (f" — {motif}" if motif else ''))
        return Response(self.get_serializer(m).data)

    @action(detail=True, methods=['post'])
    def deposit(self, request, pk=None):
        m = self.get_object()
        if request.user.id not in (m.student_id, m.directeur_id) and not self._can_manage(m):
            raise PermissionDenied()
        if m.statut not in ('valide', 'depose'):
            raise ValidationError({'detail': "Le dépôt suppose un sujet validé."})
        f = request.FILES.get('fichier')
        if not f:
            raise ValidationError({'fichier': 'Fichier PDF requis.'})
        if not f.name.lower().endswith('.pdf') or f.read(4) != b'%PDF':
            raise ValidationError({'fichier': 'Seul un PDF est accepté.'})
        f.seek(0)
        if f.size > 30 * 1024 * 1024:
            raise ValidationError({'fichier': '30 Mo maximum.'})
        m.fichier = f
        m.statut = 'depose'
        m.depose_le = timezone.now()
        m.save()
        _notify(m.directeur, 'Travail déposé', f"{m.student} a déposé « {m.titre} ».")
        return Response(self.get_serializer(m).data)

    @action(detail=True, methods=['post'])
    def schedule(self, request, pk=None):
        from django.utils.dateparse import parse_datetime
        from apps.users.models import User
        m = self.get_object()
        if not self._can_manage(m):
            raise PermissionDenied("Programmation : chef de filière ou SGA.")
        if m.statut not in ('depose', 'programme'):
            raise ValidationError({'detail': "La soutenance se programme après le dépôt."})
        when = parse_datetime(str(request.data.get('date_soutenance') or ''))
        president = User.objects.filter(pk=request.data.get('president_jury')).first()
        membres = list(User.objects.filter(pk__in=request.data.get('membres_jury') or []))
        if not when or not president:
            raise ValidationError({'detail': 'Date et président du jury obligatoires.'})
        if president.id == m.student_id or any(u.id == m.student_id for u in membres):
            raise ValidationError({'detail': "L'étudiant ne peut pas siéger dans son jury."})
        m.date_soutenance = when
        m.salle = (request.data.get('salle') or '').strip()
        m.president_jury = president
        m.statut = 'programme'
        m.save()
        m.membres_jury.set(membres)
        for u in [m.student, president, m.directeur, *membres]:
            _notify(u, 'Soutenance programmée', f"« {m.titre} » ({m.student}) le {when:%d/%m/%Y à %H:%M}, {m.salle or 'salle à préciser'}.")
        audit('update', m, details={'action': 'soutenance_programmee', 'date': when.isoformat()})
        return Response(self.get_serializer(m).data)

    @action(detail=True, methods=['post'])
    def grade(self, request, pk=None):
        from decimal import Decimal, InvalidOperation
        m = self.get_object()
        if not (request.user.id == m.president_jury_id or has_role(request.user, *ACADEMIC_ADMIN_ROLES)):
            raise PermissionDenied("La note est saisie par le président du jury.")
        if m.statut != 'programme':
            raise ValidationError({'detail': "La soutenance doit être programmée."})
        try:
            note = Decimal(str(request.data.get('note')))
        except (InvalidOperation, TypeError):
            raise ValidationError({'note': 'Note invalide.'})
        if not 0 <= note <= 20:
            raise ValidationError({'note': 'Note sur 20.'})
        m.note = note
        m.observations = (request.data.get('observations') or '').strip()
        m.statut = 'soutenu'
        m.save()
        reported = False
        if m.course_id:
            from apps.grades.models import GradeCategory
            from apps.grades.workflow import sync_grade
            cat = GradeCategory.objects.filter(category_type='examen').first()
            if cat:
                reported = sync_grade(m.student, m.course, cat, 1, note, f"Soutenance — {m.get_type_travail_display()}") is not None
        _notify(m.student, 'Soutenance notée', f"« {m.titre} » : {note}/20 {m.mention}.")
        audit('grade', m, details={'action': 'soutenance_notee', 'note': str(note), 'report_cours': reported})
        data = self.get_serializer(m).data
        data['note_reportee'] = reported
        return Response(data)


def _notify(user, title, message):
    try:
        from apps.notifications.models import Notification
        if user:
            Notification.objects.create(recipient=user, title=title, message=message, notification_type='cours',
                                        link='/memoires')
    except Exception:
        pass
