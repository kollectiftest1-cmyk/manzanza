"""
Payment views
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum, Count, Q
from django.utils import timezone
from .models import FeeType, Fee, StudentFee, Payment
from .serializers import FeeTypeSerializer, FeeSerializer, StudentFeeSerializer, PaymentSerializer
from apps.users.permissions import IsCaisseOrAdmin, IsDGOrIAdmin
from apps.core.audit import audit
from decimal import Decimal, InvalidOperation


class FeeTypeViewSet(viewsets.ModelViewSet):
    """ViewSet for FeeType (fee category templates)"""
    queryset = FeeType.objects.all()
    serializer_class = FeeTypeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'is_mandatory', 'is_active', 'academic_year']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'amount', 'created_at']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsDGOrIAdmin()]
        return super().get_permissions()


class FeeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Fee campaigns (created by SGAD, auto-targeted to students).
    """
    queryset = Fee.objects.select_related(
        'fee_type', 'created_by', 'target_section', 'target_filiere',
        'target_auditoire', 'target_student'
    ).all()
    serializer_class = FeeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'target_type', 'academic_year', 'currency']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'due_date', 'amount']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsDGOrIAdmin()]
        return super().get_permissions()

    def perform_create(self, serializer):
        """Save fee and auto-generate StudentFee records."""
        fee = serializer.save(created_by=self.request.user)
        count = fee.generate_student_fees()
        fee._assigned_count = count  # expose to response

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        fee = serializer.instance
        return Response({
            'fee': FeeSerializer(fee).data,
            'assigned_count': getattr(fee, '_assigned_count', 0),
            'message': f"Frais créé et assigné à {getattr(fee, '_assigned_count', 0)} étudiant(s)."
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Re-run auto-generation of StudentFee records (idempotent)."""
        fee = self.get_object()
        count = fee.generate_student_fees()
        return Response({
            'message': f'{count} nouveau(x) frais assigné(s). Total: {fee.students_count}.',
            'assigned_count': count,
            'total_count': fee.students_count,
        })

    @action(detail=True, methods=['get'])
    def students(self, request, pk=None):
        """List all students targeted by this fee and their payment status."""
        fee = self.get_object()
        student_fees = StudentFee.objects.filter(fee_campaign=fee).select_related('student')
        serializer = StudentFeeSerializer(student_fees, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """SGAD dashboard: collected, pending, total assigned."""
        from apps.users.permissions import has_role
        if not has_role(request.user, 'caisse', 'comptable', 'sgad', 'directeur_general'):
            return Response({'error': 'Non autorisé.'}, status=403)

        total_student_fees = StudentFee.objects.count()
        agg = StudentFee.objects.aggregate(
            total_expected=Sum('total_amount'),
            total_paid=Sum('amount_paid'),
        )
        total_expected = float(agg['total_expected'] or 0)
        total_paid = float(agg['total_paid'] or 0)
        total_pending = total_expected - total_paid

        # Totaux par devise : on n'additionne jamais des USD et des CDF.
        by_currency = {}
        for row in StudentFee.objects.values('fee_campaign__currency').annotate(
            expected=Sum('total_amount'), paid=Sum('amount_paid')
        ):
            cur = row['fee_campaign__currency'] or 'USD'
            bucket = by_currency.setdefault(cur, {'expected': 0.0, 'paid': 0.0})
            bucket['expected'] += float(row['expected'] or 0)
            bucket['paid'] += float(row['paid'] or 0)
        for bucket in by_currency.values():
            bucket['pending'] = bucket['expected'] - bucket['paid']

        return Response({
            'total_fees_campaigns': Fee.objects.count(),
            'active_campaigns': Fee.objects.filter(is_active=True).count(),
            'total_student_fees': total_student_fees,
            'paid_count': StudentFee.objects.filter(status='paye').count(),
            'unpaid_count': StudentFee.objects.filter(status='impaye').count(),
            'partial_count': StudentFee.objects.filter(status='partiel').count(),
            'total_expected': total_expected,
            'total_paid': total_paid,
            'total_pending': total_pending,
            'collection_rate': round(total_paid / total_expected * 100, 1) if total_expected else 0,
            'by_currency': by_currency,
        })


class StudentFeeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for StudentFee model
    """
    queryset = StudentFee.objects.all()
    serializer_class = StudentFeeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['student', 'fee_type', 'status']
    search_fields = ['student__first_name', 'student__last_name', 'fee_type__name']
    ordering_fields = ['due_date', 'total_amount', 'created_at']

    def get_queryset(self):
        """Filter fees based on user role"""
        user = self.request.user

        if user.role in ['pdg', 'caisse', 'sgad', 'directeur_general'] or user.is_superuser:
            return self.queryset
        elif user.role == 'etudiant':
            # Students see only their own fees
            return self.queryset.filter(student=user)

        return self.queryset.none()

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsDGOrIAdmin()] if self.action == 'destroy' else [IsCaisseOrAdmin()]
        return super().get_permissions()

    def perform_destroy(self, instance):
        # Corbeille ; refusée automatiquement si des paiements existent.
        instance.delete(user=self.request.user)

    @action(detail=False, methods=['get'])
    def my_fees(self, request):
        """Get current student's fees."""
        fees = StudentFee.objects.filter(student=request.user).select_related(
            'fee_type', 'fee_campaign'
        ).prefetch_related('payments')
        serializer = self.get_serializer(fees, many=True)
        return Response(serializer.data)


class PaymentViewSet(viewsets.ModelViewSet):
    """ViewSet for Payment model"""
    queryset = Payment.objects.select_related('student_fee__student', 'student_fee__fee_type',
                                              'student_fee__fee_campaign', 'processed_by').all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['student_fee', 'payment_method', 'status']
    search_fields = ['reference', 'transaction_id', 'student_fee__student__last_name']
    ordering_fields = ['payment_date', 'amount', 'created_at']

    def get_queryset(self):
        user = self.request.user
        from apps.users.permissions import has_role
        if has_role(user, 'pdg', 'caisse', 'comptable', 'sgad', 'directeur_general'):
            return self.queryset
        elif user.role == 'etudiant':
            return self.queryset.filter(student_fee__student=user)
        return self.queryset.none()

    # Un paiement est immuable : ni modification ni suppression. Les corrections passent
    # par le rejet (paiement en attente) ou une contre-passation (phase 1).
    http_method_names = ['get', 'post', 'head', 'options']

    def get_permissions(self):
        if self.action in ['create', 'confirm', 'reject']:
            return [IsCaisseOrAdmin()]
        return super().get_permissions()

    def perform_create(self, serializer):
        from rest_framework.exceptions import PermissionDenied, ValidationError
        from apps.users.permissions import has_role
        from .models import CashSession
        user = self.request.user
        # Séparation des tâches : seul un caissier encaisse ; la direction consulte.
        if not has_role(user, 'caisse', 'pdg'):
            raise PermissionDenied("L'encaissement est réservé à la caisse.")
        session = None
        if serializer.validated_data.get('payment_method') == 'especes':
            session = CashSession.objects.filter(cashier=user, status='open').first()
            if session is None:
                raise ValidationError({'detail': "Ouvrez votre session de caisse avant d'encaisser des espèces."})
        payment = serializer.save(processed_by=user, cash_session=session)
        payment.student_fee.recompute_paid()
        audit('payment', payment, details={'action': 'saisie', 'montant': str(payment.amount),
                                           'statut': payment.status, 'mode': payment.payment_method})

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirmer un paiement EN ATTENTE (caisse uniquement)."""
        from apps.users.permissions import has_role
        if not has_role(request.user, 'caisse', 'comptable', 'pdg'):
            return Response({'error': 'Confirmation réservée à la caisse / comptabilité.'}, status=403)
        payment = self.get_object()
        if payment.status != 'en_attente':
            return Response({'error': 'Seul un paiement en attente peut être confirmé.'}, status=400)
        payment.status = 'confirme'
        payment.processed_by = request.user
        payment.save()
        payment.student_fee.recompute_paid()
        audit('payment', payment, details={'action': 'confirmation', 'montant': str(payment.amount)})
        return Response({'detail': 'Paiement confirmé.', 'payment': PaymentSerializer(payment).data})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a pending payment."""
        payment = self.get_object()
        if payment.status != 'en_attente':
            return Response({'error': 'Seuls les paiements en attente peuvent être rejetés.'}, status=400)
        reason = (request.data.get('reason') or '').strip()
        if not reason:
            return Response({'error': 'Le motif du rejet est obligatoire.'}, status=400)
        payment.status = 'rejete'
        payment.notes = ((payment.notes or '') + f"\nRejet : {reason}").strip()
        payment.processed_by = request.user
        payment.save()
        payment.student_fee.recompute_paid()
        audit('payment', payment, details={'action': 'rejet', 'motif': reason})
        return Response({'detail': 'Paiement rejeté.'})

    @action(detail=False, methods=['post'], url_path='mobile-money')
    def mobile_money(self, request):
        """
        Initiate a Mobile Money payment for a StudentFee.
        Simulation: immediately marks as confirmed.
        Body: { student_fee_id, amount, provider, phone_number }
        """
        student_fee_id = request.data.get('student_fee_id')
        amount = request.data.get('amount')
        provider = request.data.get('provider')
        phone_number = request.data.get('phone_number')

        if not all([student_fee_id, amount, provider, phone_number]):
            return Response({'error': 'Champs requis: student_fee_id, amount, provider, phone_number.'}, status=400)

        try:
            sf = StudentFee.objects.get(id=student_fee_id)
        except StudentFee.DoesNotExist:
            return Response({'error': 'Frais introuvable.'}, status=404)

        # Only the owning student or admin can pay
        if request.user.role == 'etudiant' and sf.student != request.user:
            return Response({'error': 'Non autorisé.'}, status=403)

        if sf.status == 'paye':
            return Response({'error': 'Ce frais est déjà entièrement payé.'}, status=400)

        try:
            amount = Decimal(str(amount))
        except (InvalidOperation, TypeError):
            return Response({'error': 'Montant invalide.'}, status=400)
        if amount <= 0:
            return Response({'error': 'Le montant doit être positif.'}, status=400)
        remaining = sf.amount_remaining
        if amount > remaining + Decimal('0.01'):
            return Response({'error': f'Montant dépasse le solde dû ({remaining}).'}, status=400)
        if request.user.role not in ['etudiant', 'caisse', 'pdg'] and not request.user.is_superuser:
            return Response({'error': 'Non autorisé.'}, status=403)

        # Generate transaction ID
        import uuid as _uuid
        txn_id = f"MM-{provider.upper()}-{_uuid.uuid4().hex[:12].upper()}"

        payment = Payment.objects.create(
            student_fee=sf,
            amount=amount,
            payment_method='mobile',
            mobile_money_provider=provider,
            mobile_money_number=phone_number,
            transaction_id=txn_id,
            # SÉCURITÉ : jamais de confirmation automatique. Le paiement reste « en attente »
            # jusqu'au rappel signé de l'opérateur (intégration à venir) ou au rapprochement
            # par la caisse via /payments/{id}/confirm/.
            status='en_attente',
            processed_by=request.user,
            notes=f'Mobile Money {provider.upper()} — {phone_number}',
        )
        audit('payment', payment, details={'action': 'mobile_money_initie', 'montant': str(amount),
                                           'operateur': provider})
        sf.refresh_from_db()

        return Response({
            'success': True,
            'message': (f'Demande de paiement Mobile Money enregistrée ({provider.upper()}). '
                        'Elle sera confirmée après vérification de la transaction.'),
            'payment': PaymentSerializer(payment).data,
            'student_fee_status': sf.status,
            'transaction_id': txn_id,
        })
