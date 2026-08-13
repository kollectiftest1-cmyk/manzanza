"""
Views for payment vouchers, receipts, and verification
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from django.db import transaction
from datetime import timedelta

from .models import PaymentVoucher, PaymentReceipt, PaymentAuditLog, StudentFee, Payment
from .payment_serializers import (
    PaymentVoucherSerializer, PaymentReceiptSerializer, PaymentAuditLogSerializer,
    CreateVoucherSerializer, ValidatePaymentSerializer, ReceiptVerificationSerializer
)
from .utils import generate_payment_voucher_pdf, generate_payment_receipt_pdf, generate_qr_code
from apps.users.permissions import IsAdminUser, IsSGAOrAdmin, IsCaisseOrAdmin, IsDGOrIAdmin


class PaymentVoucherViewSet(viewsets.ModelViewSet):
    """ViewSet for managing payment vouchers"""
    queryset = PaymentVoucher.objects.select_related(
        'student', 'student_fee__fee_type', 'created_by', 'validated_by'
    ).all()
    serializer_class = PaymentVoucherSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'student', 'student_fee']
    search_fields = ['voucher_number', 'student__first_name', 'student__last_name', 'student__matricule']
    ordering_fields = ['created_at', 'issue_date', 'amount']

    def get_queryset(self):
        """Filter vouchers based on user role"""
        user = self.request.user

        # Students can only see their own vouchers
        if user.role == 'etudiant':
            return self.queryset.filter(student=user)

        # Admin/SGA can see all
        return self.queryset

    def perform_create(self, serializer):
        """Set created_by to current user"""
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'], url_path='lookup', permission_classes=[IsCaisseOrAdmin])
    def lookup(self, request):
        """
        Lookup a voucher by its exact voucher_number (for cashier workflow).
        GET /payments/vouchers/lookup/?code=BON-XXXXXXXX-XXXXX
        """
        code = request.query_params.get('code', '').strip()
        if not code:
            return Response({'error': 'Le paramètre "code" est requis.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            voucher = PaymentVoucher.objects.select_related(
                'student', 'student_fee__fee_type', 'created_by', 'validated_by'
            ).get(voucher_number=code)
        except PaymentVoucher.DoesNotExist:
            return Response({'error': 'Aucun bon trouvé avec ce numéro.'}, status=status.HTTP_404_NOT_FOUND)

        return Response(PaymentVoucherSerializer(voucher).data)

    @action(detail=False, methods=['get'], url_path='caisse-stats', permission_classes=[IsCaisseOrAdmin])
    def caisse_stats(self, request):
        """
        Dashboard stats for the cashier.
        """
        from django.db.models import Sum, Count, Q
        today = timezone.now().date()

        # Today's validated payments
        today_validated = PaymentVoucher.objects.filter(
            paid_date__date=today, status='paid'
        )
        today_count = today_validated.count()
        today_total = today_validated.aggregate(t=Sum('amount'))['t'] or 0

        # Pending vouchers
        pending = PaymentVoucher.objects.filter(status='pending')
        pending_count = pending.count()
        pending_total = pending.aggregate(t=Sum('amount'))['t'] or 0

        # Recent vouchers (last 10)
        recent = PaymentVoucher.objects.select_related(
            'student', 'student_fee__fee_type'
        ).order_by('-created_at')[:10]

        # Overall stats
        all_paid = PaymentVoucher.objects.filter(status='paid')
        total_collected = all_paid.aggregate(t=Sum('amount'))['t'] or 0
        total_validated_count = all_paid.count()

        return Response({
            'today_count': today_count,
            'today_total': float(today_total),
            'pending_count': pending_count,
            'pending_total': float(pending_total),
            'total_collected': float(total_collected),
            'total_validated_count': total_validated_count,
            'recent_vouchers': PaymentVoucherSerializer(recent, many=True).data,
        })

    @action(detail=False, methods=['post'], url_path='create-voucher')
    @transaction.atomic
    def create_voucher(self, request):
        """
        Create a payment voucher for a student fee.
        """
        serializer = CreateVoucherSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        student_fee = StudentFee.objects.select_related('student', 'fee_type').get(
            id=serializer.validated_data['student_fee_id']
        )

        # Check if voucher already exists for this fee
        existing = PaymentVoucher.objects.filter(
            student_fee=student_fee,
            status='pending'
        ).first()

        if existing:
            return Response({
                'error': 'Un bon de paiement en attente existe déjà pour ces frais.',
                'voucher': PaymentVoucherSerializer(existing).data
            }, status=status.HTTP_400_BAD_REQUEST)

        # Calculate expiry date
        expiry_days = serializer.validated_data.get('expiry_days', 30)
        expiry_date = timezone.now() + timedelta(days=expiry_days)

        # Create voucher
        description = serializer.validated_data.get('description') or f"Paiement - {student_fee.fee_type.name}"

        voucher = PaymentVoucher.objects.create(
            student=student_fee.student,
            student_fee=student_fee,
            amount=serializer.validated_data['amount'],
            description=description,
            beneficiary_account=serializer.validated_data['beneficiary_account'],
            beneficiary_name=serializer.validated_data.get('beneficiary_name', 'SYNTAX GU'),
            payment_method=serializer.validated_data.get('payment_method', 'especes'),
            expiry_date=expiry_date,
            created_by=request.user
        )

        # Generate PDF
        pdf_content = generate_payment_voucher_pdf(voucher)
        # Note: We don't save the PDF to the model, but we could add a FileField if needed

        # Create audit log
        PaymentAuditLog.objects.create(
            action='voucher_created',
            voucher=voucher,
            user=request.user,
            details={
                'voucher_number': voucher.voucher_number,
                'amount': float(voucher.amount),
                'student_id': voucher.student.id
            }
        )

        return Response({
            'message': 'Bon de paiement créé avec succès.',
            'voucher': PaymentVoucherSerializer(voucher).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='validate-payment', permission_classes=[IsDGOrIAdmin])
    @transaction.atomic
    def validate_payment(self, request, pk=None):
        """
        Validate a payment and generate receipt.
        """
        voucher = self.get_object()

        if voucher.status != 'pending':
            return Response({
                'error': f'Ce bon est déjà {voucher.get_status_display().lower()}.'
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = ValidatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Update voucher
        voucher.status = 'paid'
        voucher.bank_slip_number = serializer.validated_data.get('bank_slip_number', '') or ''
        voucher.bank_slip_date = serializer.validated_data.get('bank_slip_date')
        voucher.paid_date = timezone.now()
        voucher.validated_by = request.user
        voucher.save()

        # Use payment method chosen by the student on the voucher
        method = voucher.payment_method or 'especes'

        # Create payment record
        payment = Payment.objects.create(
            student_fee=voucher.student_fee,
            amount=voucher.amount,
            payment_method=method,
            status='confirme',
            transaction_id=serializer.validated_data.get('transaction_reference', ''),
            processed_by=request.user,
            payment_date=timezone.now()
        )

        # Update student fee
        voucher.student_fee.amount_paid += voucher.amount
        voucher.student_fee.update_status()

        # Create receipt
        fee_type_name = voucher.student_fee.fee_type.name if voucher.student_fee.fee_type else 'N/A'
        receipt = PaymentReceipt.objects.create(
            voucher=voucher,
            payment=payment,
            student=voucher.student,
            amount_paid=voucher.amount,
            fee_type_name=fee_type_name,
            payment_date=timezone.now(),
            payment_method=method,
            bank_slip_number=voucher.bank_slip_number,
            bank_slip_date=voucher.bank_slip_date,
            transaction_reference=serializer.validated_data.get('transaction_reference', ''),
            generated_by=request.user
        )

        # Generate QR code
        qr_data = receipt.verification_url
        qr_image = generate_qr_code(qr_data)
        receipt.qr_code.save(f'qr_{receipt.receipt_number}.png', qr_image, save=False)

        # Generate PDF
        pdf_content = generate_payment_receipt_pdf(receipt)
        receipt.pdf_file.save(f'recu_{receipt.receipt_number}.pdf', pdf_content, save=False)

        receipt.save()

        # Create audit logs
        PaymentAuditLog.objects.create(
            action='payment_validated',
            voucher=voucher,
            user=request.user,
            details={
                'voucher_number': voucher.voucher_number,
                'bank_slip_number': voucher.bank_slip_number,
                'amount': float(voucher.amount)
            }
        )

        PaymentAuditLog.objects.create(
            action='receipt_generated',
            voucher=voucher,
            receipt=receipt,
            user=request.user,
            details={
                'receipt_number': receipt.receipt_number,
                'verification_code': str(receipt.verification_code)
            }
        )

        # TODO: Send email if requested
        if serializer.validated_data.get('send_email', True):
            # Implement email sending logic here
            pass

        return Response({
            'message': 'Paiement validé avec succès.',
            'voucher': PaymentVoucherSerializer(voucher).data,
            'receipt': PaymentReceiptSerializer(receipt).data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='cancel', permission_classes=[IsDGOrIAdmin])
    def cancel_voucher(self, request, pk=None):
        """Cancel a pending voucher"""
        voucher = self.get_object()

        if voucher.status != 'pending':
            return Response({
                'error': 'Seuls les bons en attente peuvent être annulés.'
            }, status=status.HTTP_400_BAD_REQUEST)

        voucher.status = 'cancelled'
        voucher.save()

        # Create audit log
        PaymentAuditLog.objects.create(
            action='voucher_cancelled',
            voucher=voucher,
            user=request.user,
            details={
                'voucher_number': voucher.voucher_number,
                'reason': request.data.get('reason', 'Non spécifiée')
            }
        )

        return Response({
            'message': 'Bon de paiement annulé.',
            'voucher': PaymentVoucherSerializer(voucher).data
        })


class PaymentReceiptViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing payment receipts"""
    queryset = PaymentReceipt.objects.select_related(
        'student', 'voucher', 'payment', 'generated_by'
    ).all()
    serializer_class = PaymentReceiptSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['student', 'voucher']
    search_fields = ['receipt_number', 'student__first_name', 'student__last_name', 'student__matricule']
    ordering_fields = ['created_at', 'payment_date']

    def get_queryset(self):
        """Filter receipts based on user role"""
        user = self.request.user

        # Students can only see their own receipts
        if user.role == 'etudiant':
            return self.queryset.filter(student=user)

        # Admin/SGA can see all
        return self.queryset

    @action(detail=True, methods=['get'], url_path='download-pdf')
    def download_pdf(self, request, pk=None):
        """Download receipt PDF"""
        receipt = self.get_object()

        if not receipt.pdf_file:
            # Generate PDF if not exists
            pdf_content = generate_payment_receipt_pdf(receipt)
            receipt.pdf_file.save(f'recu_{receipt.receipt_number}.pdf', pdf_content)

        from django.http import FileResponse
        return FileResponse(
            receipt.pdf_file.open('rb'),
            content_type='application/pdf',
            as_attachment=True,
            filename=f'recu_{receipt.receipt_number}.pdf'
        )


class ReceiptVerificationView(APIView):
    """Public endpoint to verify receipt authenticity via QR code"""
    permission_classes = [AllowAny]

    def get(self, request, verification_code):
        """Verify a receipt using its verification code"""
        try:
            receipt = PaymentReceipt.objects.select_related('student').get(
                verification_code=verification_code
            )

            response_data = {
                'valid': True,
                'receipt_number': receipt.receipt_number,
                'student_name': receipt.student.get_full_name(),
                'amount_paid': receipt.amount_paid,
                'payment_date': receipt.payment_date,
                'fee_type': receipt.fee_type_name,
                'message': 'Reçu authentique et valide.'
            }

            serializer = ReceiptVerificationSerializer(response_data)
            return Response(serializer.data)

        except PaymentReceipt.DoesNotExist:
            return Response({
                'valid': False,
                'message': 'Code de vérification invalide. Ce reçu n\'existe pas.'
            }, status=status.HTTP_404_NOT_FOUND)


class PaymentAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing payment audit logs"""
    queryset = PaymentAuditLog.objects.select_related('user', 'voucher', 'receipt').all()
    serializer_class = PaymentAuditLogSerializer
    permission_classes = [IsAuthenticated, IsSGAOrAdmin]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['action', 'voucher', 'receipt', 'user']
    ordering_fields = ['timestamp']
