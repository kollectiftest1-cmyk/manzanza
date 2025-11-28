"""
Payment views
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import FeeType, StudentFee, Payment
from .serializers import FeeTypeSerializer, StudentFeeSerializer, PaymentSerializer
from apps.users.permissions import IsCaisseOrAdmin


class FeeTypeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for FeeType model
    """
    queryset = FeeType.objects.all()
    serializer_class = FeeTypeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'is_mandatory', 'is_active', 'academic_year']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'amount', 'created_at']

    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsCaisseOrAdmin()]
        return super().get_permissions()


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

        if user.role in ['iadmin', 'caisse', 'sgad']:
            return self.queryset
        elif user.role == 'etudiant':
            # Students see only their own fees
            return self.queryset.filter(student=user)

        return self.queryset.none()

    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsCaisseOrAdmin()]
        return super().get_permissions()

    @action(detail=False, methods=['get'])
    def my_fees(self, request):
        """Get current user's fees"""
        if request.user.role != 'etudiant':
            return Response(
                {'error': 'Seuls les étudiants peuvent consulter leurs frais.'},
                status=status.HTTP_403_FORBIDDEN
            )

        fees = self.queryset.filter(student=request.user)
        serializer = self.get_serializer(fees, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get payment statistics"""
        if request.user.role not in ['iadmin', 'caisse', 'sgad']:
            return Response(
                {'error': 'Vous n\'avez pas la permission.'},
                status=status.HTTP_403_FORBIDDEN
            )

        from django.db.models import Sum, Count
        stats = self.queryset.aggregate(
            total_fees=Sum('total_amount'),
            total_paid=Sum('amount_paid'),
            total_outstanding=Sum('total_amount') - Sum('amount_paid'),
            total_students=Count('student', distinct=True),
            paid_count=Count('id', filter=models.Q(status='paye')),
            unpaid_count=Count('id', filter=models.Q(status='impaye')),
            partial_count=Count('id', filter=models.Q(status='partiel'))
        )

        return Response(stats)


class PaymentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Payment model
    """
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['student_fee', 'payment_method', 'status']
    search_fields = ['reference', 'transaction_id']
    ordering_fields = ['payment_date', 'amount', 'created_at']

    def get_queryset(self):
        """Filter payments based on user role"""
        user = self.request.user

        if user.role in ['iadmin', 'caisse', 'sgad']:
            return self.queryset
        elif user.role == 'etudiant':
            # Students see only their own payments
            return self.queryset.filter(student_fee__student=user)

        return self.queryset.none()

    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsCaisseOrAdmin()]
        return super().get_permissions()

    def perform_create(self, serializer):
        """Set processed_by and update student fee"""
        payment = serializer.save(processed_by=self.request.user)

        # Update student fee if payment is confirmed
        if payment.status == 'confirme':
            student_fee = payment.student_fee
            student_fee.amount_paid += payment.amount
            student_fee.update_status()

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirm a payment"""
        payment = self.get_object()

        if payment.status == 'confirme':
            return Response(
                {'error': 'Ce paiement a déjà été confirmé.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        payment.status = 'confirme'
        payment.save()

        # Update student fee
        student_fee = payment.student_fee
        student_fee.amount_paid += payment.amount
        student_fee.update_status()

        return Response({'detail': 'Paiement confirmé.'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a payment"""
        payment = self.get_object()

        if payment.status != 'en_attente':
            return Response(
                {'error': 'Seuls les paiements en attente peuvent être rejetés.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        payment.status = 'rejete'
        payment.save()

        return Response({'detail': 'Paiement rejeté.'})
