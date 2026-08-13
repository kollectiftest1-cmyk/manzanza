"""
Payment serializers
"""
from rest_framework import serializers
from .models import FeeType, Fee, StudentFee, Payment


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


class FeeSerializer(serializers.ModelSerializer):
    """Fee Campaign Serializer"""
    fee_type_name = serializers.CharField(source='fee_type.name', read_only=True, default=None)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True, default=None)
    target_section_name = serializers.CharField(source='target_section.nom', read_only=True, default=None)
    target_filiere_name = serializers.CharField(source='target_filiere.nom', read_only=True, default=None)
    target_auditoire_name = serializers.CharField(source='target_auditoire.nom', read_only=True, default=None)
    target_student_name = serializers.CharField(source='target_student.get_full_name', read_only=True, default=None)
    target_display = serializers.SerializerMethodField()

    class Meta:
        model = Fee
        fields = [
            'id', 'fee_type', 'fee_type_name', 'name', 'description',
            'amount', 'currency',
            'target_type', 'target_display',
            'target_section', 'target_section_name',
            'target_filiere', 'target_filiere_name',
            'target_auditoire', 'target_auditoire_name',
            'target_student', 'target_student_name',
            'academic_year', 'due_date', 'is_active', 'students_count',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'students_count', 'created_by', 'created_at', 'updated_at']

    def get_target_display(self, obj):
        if obj.target_type == 'tous':
            return 'Tous les étudiants'
        elif obj.target_type == 'section':
            return f"Section: {obj.target_section.nom if obj.target_section else '—'}"
        elif obj.target_type == 'filiere':
            return f"Filière: {obj.target_filiere.nom if obj.target_filiere else '—'}"
        elif obj.target_type == 'auditoire':
            return f"Auditoire: {obj.target_auditoire.nom if obj.target_auditoire else '—'}"
        elif obj.target_type == 'etudiant':
            return f"Étudiant: {obj.target_student.get_full_name() if obj.target_student else '—'}"
        return obj.get_target_type_display()

    def validate(self, data):
        target_type = data.get('target_type')
        if target_type == 'section' and not data.get('target_section'):
            raise serializers.ValidationError({'target_section': 'Sélectionnez une section.'})
        if target_type == 'filiere' and not data.get('target_filiere'):
            raise serializers.ValidationError({'target_filiere': 'Sélectionnez une filière.'})
        if target_type == 'auditoire' and not data.get('target_auditoire'):
            raise serializers.ValidationError({'target_auditoire': 'Sélectionnez un auditoire.'})
        if target_type == 'etudiant' and not data.get('target_student'):
            raise serializers.ValidationError({'target_student': 'Sélectionnez un étudiant.'})
        return data


class PaymentSerializer(serializers.ModelSerializer):
    """Payment Serializer"""

    student_name = serializers.CharField(source='student_fee.student.get_full_name', read_only=True)
    student_matricule = serializers.CharField(source='student_fee.student.matricule', read_only=True)
    fee_name = serializers.SerializerMethodField()
    processed_by_name = serializers.CharField(source='processed_by.get_full_name', read_only=True, default=None)
    mobile_money_provider_display = serializers.CharField(source='get_mobile_money_provider_display', read_only=True, default=None)

    class Meta:
        model = Payment
        fields = [
            'id', 'student_fee', 'student_name', 'student_matricule', 'fee_name',
            'amount', 'payment_method', 'reference', 'status',
            'mobile_money_provider', 'mobile_money_provider_display', 'mobile_money_number',
            'transaction_id', 'notes',
            'processed_by', 'processed_by_name', 'payment_date',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'reference', 'created_at', 'updated_at']

    def get_fee_name(self, obj):
        sf = obj.student_fee
        if sf.fee_campaign:
            return sf.fee_campaign.name
        if sf.fee_type:
            return sf.fee_type.name
        return '—'


class StudentFeeSerializer(serializers.ModelSerializer):
    """StudentFee Serializer"""

    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_matricule = serializers.CharField(source='student.matricule', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    fee_type_name = serializers.CharField(source='fee_type.name', read_only=True, default=None)
    fee_campaign_name = serializers.CharField(source='fee_campaign.name', read_only=True, default=None)
    fee_campaign_currency = serializers.CharField(source='fee_campaign.currency', read_only=True, default='USD')
    fee_name = serializers.SerializerMethodField()
    amount_remaining = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    payment_percentage = serializers.FloatField(read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = StudentFee
        fields = [
            'id', 'student', 'student_name', 'student_matricule', 'student_email',
            'fee_type', 'fee_type_name', 'fee_campaign', 'fee_campaign_name', 'fee_campaign_currency',
            'fee_name',
            'total_amount', 'amount_paid', 'amount_remaining',
            'payment_percentage', 'due_date', 'status', 'notes',
            'payments', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'amount_remaining', 'payment_percentage', 'created_at', 'updated_at']

    def get_fee_name(self, obj):
        if obj.fee_campaign:
            return obj.fee_campaign.name
        if obj.fee_type:
            return obj.fee_type.name
        return '—'



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
            'transaction_id', 'receipt_file', 'notes',
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
