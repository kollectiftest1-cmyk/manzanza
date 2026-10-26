"""
Finances — phase 3 du cahier des charges v2 :
  * barèmes officiels (facturation automatique à l'inscription annuelle) ;
  * sessions de caisse (ouverture, encaissements espèces rattachés, clôture avec écarts) ;
  * contre-passations (annulation motivée d'un paiement, validée par une autre personne) ;
  * rappel signé (HMAC) de l'opérateur Mobile Money.
"""
import hashlib
import hmac
import json
from decimal import Decimal, InvalidOperation

from django.conf import settings
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework import mixins, permissions, serializers, status, viewsets
from rest_framework.decorators import action, api_view, authentication_classes, permission_classes
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from apps.core.audit import audit
from apps.users.permissions import has_role

from .models import BaremeFrais, CashSession, Contrepassation, Payment

FINANCE_READ = ('caisse', 'comptable', 'sgad', 'pdg', 'directeur_general')
FINANCE_WRITE = ('sgad', 'pdg', 'directeur_general')


class FinanceRead(permissions.BasePermission):
    def has_permission(self, request, view):
        return has_role(request.user, *FINANCE_READ)


# --- Barèmes ----------------------------------------------------------------

class BaremeFraisSerializer(serializers.ModelSerializer):
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    fee_type_name = serializers.CharField(source='fee_type.name', read_only=True)
    filiere_name = serializers.CharField(source='filiere.nom', read_only=True, default=None)
    billed_count = serializers.SerializerMethodField()

    class Meta:
        model = BaremeFrais
        fields = ['id', 'academic_year', 'academic_year_name', 'fee_type', 'fee_type_name', 'libelle', 'filiere',
                  'filiere_name', 'niveau', 'vacation', 'amount', 'currency', 'due_date', 'is_mandatory',
                  'required_for_admin_validation', 'billed_count', 'created_at']
        read_only_fields = ['created_at']

    def get_billed_count(self, obj):
        return obj.dettes.count()

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Le montant doit être positif.")
        return value


class BaremeFraisViewSet(viewsets.ModelViewSet):
    serializer_class = BaremeFraisSerializer
    permission_classes = [FinanceRead]
    filterset_fields = ['academic_year', 'fee_type', 'filiere', 'niveau', 'currency']

    def get_queryset(self):
        return BaremeFrais.objects.select_related('academic_year', 'fee_type', 'filiere')

    def _check_write(self):
        if not has_role(self.request.user, *FINANCE_WRITE):
            raise PermissionDenied("Les barèmes sont fixés par le SGAD / la direction.")

    def perform_create(self, serializer):
        self._check_write()
        obj = serializer.save(created_by=self.request.user)
        audit('payment', obj, details={'action': 'bareme_cree', 'montant': str(obj.amount), 'devise': obj.currency})

    def perform_update(self, serializer):
        self._check_write()
        if serializer.instance.dettes.exclude(status='annule').filter(amount_paid__gt=0).exists() and \
                'amount' in serializer.validated_data and serializer.validated_data['amount'] != serializer.instance.amount:
            raise ValidationError({'amount': "Des paiements existent déjà : créez un barème complémentaire "
                                             "plutôt que de modifier le montant."})
        obj = serializer.save()
        audit('payment', obj, details={'action': 'bareme_modifie'})

    def perform_destroy(self, instance):
        self._check_write()
        if instance.dettes.filter(amount_paid__gt=0).exists():
            raise ValidationError({'detail': "Ce barème a déjà été encaissé : il ne peut pas être supprimé."})
        instance.delete(user=self.request.user)

    @action(detail=True, methods=['post'])
    def apply(self, request, pk=None):
        """Facture le barème à toutes les inscriptions actives de l'année (idempotent)."""
        self._check_write()
        from apps.scolarite.models import InscriptionAnnuelle
        from apps.scolarite.services.finance import generate_fees_for_inscription
        bareme = self.get_object()
        created = 0
        for ins in InscriptionAnnuelle.objects.filter(academic_year=bareme.academic_year,
                                                      statut__in=InscriptionAnnuelle.ACTIVE_STATUTS) \
                .select_related('auditoire', 'student'):
            created += len([f for f in generate_fees_for_inscription(ins) if f.bareme_id == bareme.id])
        audit('payment', bareme, details={'action': 'bareme_applique', 'factures': created})
        return Response({'created': created})


# --- Sessions de caisse -----------------------------------------------------

def _decimal_map(data):
    out = {}
    for cur, val in (data or {}).items():
        try:
            out[str(cur).upper()] = Decimal(str(val))
        except (InvalidOperation, TypeError):
            raise ValidationError({'detail': f"Montant invalide pour {cur}."})
    return out


def session_expected(session):
    expected = {k: Decimal(str(v)) for k, v in (session.opening_float or {}).items()}
    rows = Payment.objects.filter(cash_session=session, status='confirme', payment_method='especes') \
        .values('student_fee__currency').annotate(total=Sum('amount'))
    for row in rows:
        cur = row['student_fee__currency'] or 'USD'
        expected[cur] = expected.get(cur, Decimal(0)) + (row['total'] or 0)
    return expected


class CashSessionSerializer(serializers.ModelSerializer):
    cashier_name = serializers.CharField(source='cashier.name', read_only=True)
    payments_count = serializers.SerializerMethodField()
    live_expected = serializers.SerializerMethodField()

    class Meta:
        model = CashSession
        fields = ['id', 'cashier', 'cashier_name', 'status', 'opened_at', 'closed_at', 'opening_float',
                  'expected', 'counted', 'difference', 'justification', 'payments_count', 'live_expected']
        read_only_fields = fields

    def get_payments_count(self, obj):
        return obj.payments.count()

    def get_live_expected(self, obj):
        return {k: float(v) for k, v in session_expected(obj).items()} if obj.status == 'open' else None


class CashSessionViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = CashSessionSerializer
    permission_classes = [FinanceRead]
    filterset_fields = ['cashier', 'status']

    def get_queryset(self):
        qs = CashSession.objects.select_related('cashier')
        if has_role(self.request.user, 'comptable', 'sgad', 'pdg', 'directeur_general'):
            return qs
        return qs.filter(cashier=self.request.user)

    @action(detail=False, methods=['get'])
    def current(self, request):
        session = CashSession.objects.filter(cashier=request.user, status='open').first()
        return Response(self.get_serializer(session).data if session else None)

    @action(detail=False, methods=['post'])
    def open(self, request):
        if not has_role(request.user, 'caisse', 'pdg'):
            raise PermissionDenied("Seul un caissier ouvre une session de caisse.")
        if CashSession.objects.filter(cashier=request.user, status='open').exists():
            raise ValidationError({'detail': "Vous avez déjà une session ouverte : clôturez-la d'abord."})
        floats = {k: str(v) for k, v in _decimal_map(request.data.get('opening_float')).items()}
        session = CashSession.objects.create(cashier=request.user, opening_float=floats)
        audit('payment', session, details={'action': 'caisse_ouverte', 'fonds': floats})
        return Response(self.get_serializer(session).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def close(self, request, pk=None):
        session = self.get_object()
        if session.cashier_id != request.user.id and not has_role(request.user, 'pdg'):
            raise PermissionDenied("Seul le caissier titulaire clôture sa session.")
        if session.status != 'open':
            raise ValidationError({'detail': "Session déjà clôturée."})
        if session.payments.filter(status='en_attente').exists():
            raise ValidationError({'detail': "Des paiements de cette session sont encore en attente."})
        counted = _decimal_map(request.data.get('counted'))
        expected = session_expected(session)
        diff = {}
        for cur in set(expected) | set(counted):
            d = counted.get(cur, Decimal(0)) - expected.get(cur, Decimal(0))
            diff[cur] = str(d)
        has_gap = any(Decimal(v) != 0 for v in diff.values())
        justification = (request.data.get('justification') or '').strip()
        if has_gap and not justification:
            raise ValidationError({'justification': "Écart de caisse constaté : justification obligatoire.",
                                   'difference': diff})
        session.expected = {k: str(v) for k, v in expected.items()}
        session.counted = {k: str(v) for k, v in counted.items()}
        session.difference = diff
        session.justification = justification
        session.status = 'closed'
        session.closed_at = timezone.now()
        session.save()
        audit('payment', session, details={'action': 'caisse_cloturee', 'attendu': session.expected,
                                           'compte': session.counted, 'ecart': diff})
        return Response(self.get_serializer(session).data)


# --- Contre-passations ------------------------------------------------------

class ContrepassationSerializer(serializers.ModelSerializer):
    payment_reference = serializers.CharField(source='payment.reference', read_only=True)
    amount = serializers.DecimalField(source='payment.amount', max_digits=12, decimal_places=2, read_only=True)
    currency = serializers.CharField(source='payment.currency', read_only=True)
    student_name = serializers.CharField(source='payment.student_fee.student.name', read_only=True)
    requested_by_name = serializers.CharField(source='requested_by.name', read_only=True)
    decided_by_name = serializers.CharField(source='decided_by.name', read_only=True, default=None)
    status_label = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Contrepassation
        fields = ['id', 'payment', 'payment_reference', 'amount', 'currency', 'student_name', 'reason', 'status',
                  'status_label', 'requested_by_name', 'requested_at', 'decided_by_name', 'decided_at',
                  'decision_note']
        read_only_fields = ['status', 'requested_at', 'decided_at', 'decision_note']


class ContrepassationViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin,
                             viewsets.GenericViewSet):
    serializer_class = ContrepassationSerializer
    permission_classes = [FinanceRead]
    filterset_fields = ['status']

    def get_queryset(self):
        return Contrepassation.objects.select_related('payment__student_fee__student', 'requested_by', 'decided_by')

    def perform_create(self, serializer):
        if not has_role(self.request.user, 'caisse', 'comptable', 'pdg'):
            raise PermissionDenied()
        payment = serializer.validated_data['payment']
        if payment.status != 'confirme':
            raise ValidationError({'payment': "Seul un paiement confirmé peut être contre-passé."})
        if Contrepassation.objects.filter(payment=payment).exists():
            raise ValidationError({'payment': "Une contre-passation existe déjà pour ce paiement."})
        if not (serializer.validated_data.get('reason') or '').strip():
            raise ValidationError({'reason': "Motif obligatoire."})
        obj = serializer.save(requested_by=self.request.user)
        audit('payment', payment, details={'action': 'contrepassation_demandee', 'motif': obj.reason})

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def decide(self, request, pk=None):
        obj = self.get_object()
        if not has_role(request.user, 'comptable', 'sgad', 'pdg'):
            raise PermissionDenied("La décision revient au comptable / SGAD.")
        if obj.requested_by_id == request.user.id:
            raise PermissionDenied("Séparation des tâches : le demandeur ne peut pas valider sa propre demande.")
        if obj.status != 'pending':
            raise ValidationError({'detail': "Demande déjà traitée."})
        approve = str(request.data.get('approve', '')).lower() in ('1', 'true', 'oui')
        obj.status = 'approved' if approve else 'rejected'
        obj.decided_by = request.user
        obj.decided_at = timezone.now()
        obj.decision_note = (request.data.get('note') or '').strip()
        obj.save()
        if approve:
            payment = obj.payment
            payment.status = 'annule'
            payment.notes = ((payment.notes or '') + f"\nContre-passation : {obj.reason}").strip()
            payment.save(update_fields=['status', 'notes', 'updated_at'])
            payment.student_fee.recompute_paid()
        audit('payment', obj.payment, details={'action': 'contrepassation_' + obj.status,
                                               'note': obj.decision_note})
        return Response(self.get_serializer(obj).data)


# --- Rappel Mobile Money (opérateur → université) ----------------------------

@api_view(['POST'])
@authentication_classes([])
@permission_classes([permissions.AllowAny])
def mobile_money_callback(request):
    """
    Rappel de l'agrégateur Mobile Money. Le corps brut est signé :
    X-Signature: hex(HMAC-SHA256(MOBILE_MONEY_WEBHOOK_SECRET, body)).
    Corps : {"transaction_id": "...", "status": "success|failed", "amount": "25.00"}.
    """
    secret = getattr(settings, 'MOBILE_MONEY_WEBHOOK_SECRET', '')
    if not secret:
        return Response({'detail': "Intégration Mobile Money non configurée."}, status=503)
    expected = hmac.new(secret.encode(), request.body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, request.headers.get('X-Signature', '')):
        audit('security', None, details={'action': 'mobile_money_signature_invalide'})
        return Response({'detail': 'Signature invalide.'}, status=403)
    try:
        payload = json.loads(request.body or b'{}')
    except ValueError:
        return Response({'detail': 'JSON invalide.'}, status=400)
    with transaction.atomic():
        payment = Payment.objects.select_for_update().filter(transaction_id=payload.get('transaction_id'),
                                                             payment_method='mobile').first()
        if payment is None:
            return Response({'detail': 'Transaction inconnue.'}, status=404)
        if payment.status != 'en_attente':
            return Response({'detail': 'Déjà traitée.', 'status': payment.status})
        try:
            amount = Decimal(str(payload.get('amount')))
        except (InvalidOperation, TypeError):
            return Response({'detail': 'Montant invalide.'}, status=400)
        if payload.get('status') == 'success' and amount == payment.amount:
            payment.status = 'confirme'
        else:
            payment.status = 'rejete'
            payment.notes = ((payment.notes or '') + f"\nRappel opérateur : {payload.get('status')} "
                             f"({amount})").strip()
        payment.save()
        payment.student_fee.recompute_paid()
    audit('payment', payment, details={'action': 'mobile_money_rappel', 'statut': payment.status})
    return Response({'detail': 'OK', 'status': payment.status})
