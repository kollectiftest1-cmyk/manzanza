"""
Extended serializers for payment vouchers and receipts
"""
from rest_framework import serializers
from .models import PaymentVoucher, PaymentReceipt, PaymentAuditLog, StudentFee


class PaymentVoucherSerializer(serializers.ModelSerializer):
    """Serializer for PaymentVoucher"""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_matricule = serializers.CharField(source='student.matricule', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    fee_type_name = serializers.CharField(source='student_fee.fee_type.name', read_only=True)
    currency = serializers.CharField(source='student_fee.fee_campaign.currency', read_only=True, default='USD')
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True, allow_null=True)
    validated_by_name = serializers.CharField(source='validated_by.get_full_name', read_only=True, allow_null=True)

    class Meta:
        model = PaymentVoucher
        fields = [
            'id', 'voucher_number',
            'student', 'student_name', 'student_matricule', 'student_email',
            'student_fee', 'fee_type_name', 'currency',
            'amount', 'description',
            'beneficiary_account', 'beneficiary_name',
            'status', 'status_display',
            'issue_date', 'expiry_date', 'paid_date',
            'bank_slip_number', 'bank_slip_date',
            'created_by', 'created_by_name',
            'validated_by', 'validated_by_name',
            'payment_method',
            'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'voucher_number', 'created_at', 'updated_at',
            'issue_date', 'paid_date', 'created_by', 'validated_by'
        ]


class PaymentReceiptSerializer(serializers.ModelSerializer):
    """Serializer for PaymentReceipt"""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_matricule = serializers.CharField(source='student.matricule', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    voucher_number = serializers.CharField(source='voucher.voucher_number', read_only=True)
    generated_by_name = serializers.CharField(source='generated_by.get_full_name', read_only=True, allow_null=True)
    verification_url = serializers.CharField(read_only=True)

    class Meta:
        model = PaymentReceipt
        fields = [
            'id', 'receipt_number', 'verification_code', 'verification_url',
            'voucher', 'voucher_number', 'payment',
            'student', 'student_name', 'student_matricule', 'student_email',
            'amount_paid', 'fee_type_name', 'payment_date', 'payment_method',
            'bank_slip_number', 'bank_slip_date', 'transaction_reference',
            'pdf_file', 'qr_code',
            'email_sent', 'email_sent_at',
            'generated_by', 'generated_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'receipt_number', 'verification_code', 'verification_url',
            'pdf_file', 'qr_code',
            'email_sent', 'email_sent_at',
            'generated_by', 'created_at', 'updated_at'
        ]


class PaymentAuditLogSerializer(serializers.ModelSerializer):
    """Serializer for PaymentAuditLog"""
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True, allow_null=True)

    class Meta:
        model = PaymentAuditLog
        fields = [
            'id', 'action', 'action_display',
            'voucher', 'receipt',
            'user', 'user_name',
            'details', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']


class CreateVoucherSerializer(serializers.Serializer):
    """Serializer for creating a payment voucher"""
    student_fee_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    description = serializers.CharField(required=False, allow_blank=True)
    beneficiary_account = serializers.CharField(max_length=100)
    beneficiary_name = serializers.CharField(max_length=200, default='SYNTAX GU')
    expiry_days = serializers.IntegerField(default=30, help_text='Nombre de jours avant expiration')
    payment_method = serializers.CharField(max_length=50, default='especes')

    def validate_student_fee_id(self, value):
        """Validate that student_fee exists"""
        try:
            StudentFee.objects.get(id=value)
        except StudentFee.DoesNotExist:
            raise serializers.ValidationError("Frais étudiant non trouvé.")
        return value


class ValidatePaymentSerializer(serializers.Serializer):
    """Serializer for validating a payment by the cashier"""
    bank_slip_number = serializers.CharField(max_length=100, required=False, allow_blank=True)
    bank_slip_date = serializers.DateField(required=False, allow_null=True)
    transaction_reference = serializers.CharField(max_length=200, required=False, allow_blank=True)
    send_email = serializers.BooleanField(default=True)


class ReceiptVerificationSerializer(serializers.Serializer):
    """Serializer for receipt verification response"""
    valid = serializers.BooleanField()
    receipt_number = serializers.CharField()
    student_name = serializers.CharField()
    amount_paid = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_date = serializers.DateTimeField()
    fee_type = serializers.CharField()
    message = serializers.CharField()
