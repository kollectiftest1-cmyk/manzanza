"""
Payment serializers
"""
from rest_framework import serializers
from .models import FeeType, StudentFee, Payment


class FeeTypeSerializer(serializers.ModelSerializer):
    """FeeType Serializer"""

    class Meta:
        model = FeeType
        fields = [
            'id', 'name', 'category', 'description', 'amount',
            'is_mandatory', 'is_active', 'academic_year',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PaymentSerializer(serializers.ModelSerializer):
    """Payment Serializer"""

    student_name = serializers.CharField(source='student_fee.student.get_full_name', read_only=True)
    fee_name = serializers.CharField(source='student_fee.fee_type.name', read_only=True)
    processed_by_name = serializers.CharField(source='processed_by.get_full_name', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'student_fee', 'student_name', 'fee_name',
            'amount', 'payment_method', 'reference', 'status',
            'transaction_id', 'receipt', 'notes',
            'processed_by', 'processed_by_name', 'payment_date',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'reference', 'created_at', 'updated_at']


class StudentFeeSerializer(serializers.ModelSerializer):
    """StudentFee Serializer"""

    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    fee_type_name = serializers.CharField(source='fee_type.name', read_only=True)
    amount_remaining = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    payment_percentage = serializers.FloatField(read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = StudentFee
        fields = [
            'id', 'student', 'student_name', 'fee_type', 'fee_type_name',
            'total_amount', 'amount_paid', 'amount_remaining',
            'payment_percentage', 'due_date', 'status', 'notes',
            'payments', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'amount_remaining', 'payment_percentage', 'created_at', 'updated_at']
