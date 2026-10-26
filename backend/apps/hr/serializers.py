"""
HR serializers
"""
from rest_framework import serializers
from .models import Contract, Employee, Leave, Payroll, PayrollSettings, StaffAttendance
from apps.users.models import User


class UserSimpleSerializer(serializers.ModelSerializer):
    """Simple User Serializer for potential employees"""
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'role', 'phone']


class EmployeeSerializer(serializers.ModelSerializer):
    """Employee Serializer"""

    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)
    user_profiles_count = serializers.SerializerMethodField()
    position_display = serializers.CharField(source='get_position_display', read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'user', 'user_name', 'user_email', 'user_role',
            'employee_id', 'position', 'position_display', 'department',
            'hire_date', 'end_date',
            'prestation_type', 'salaire_journalier', 'salaire_horaire', 'currency',
            'base_monthly_salary', 'housing_allowance', 'transport_allowance', 'dependents',
            'statutory_teaching_hours', 'extra_hour_rate', 'payment_account',
            'status', 'emergency_contact', 'emergency_phone',
            'notes', 'user_profiles_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_user_profiles_count(self, obj):
        return Employee.objects.filter(user=obj.user).count()

    def validate(self, attrs):
        """Validate max 3 profiles and unique position per user."""
        user = attrs.get('user', getattr(self.instance, 'user', None))
        position = attrs.get('position', getattr(self.instance, 'position', None))
        instance_pk = self.instance.pk if self.instance else None

        if user:
            existing_count = Employee.objects.filter(user=user).exclude(pk=instance_pk).count()
            if existing_count >= Employee.MAX_PROFILES:
                raise serializers.ValidationError(
                    f'Un utilisateur ne peut avoir que {Employee.MAX_PROFILES} profils employé maximum.'
                )
            if position and Employee.objects.filter(user=user, position=position).exclude(pk=instance_pk).exists():
                raise serializers.ValidationError(
                    f'Cet utilisateur a déjà un profil avec ce poste.'
                )
        return attrs


class ContractSerializer(serializers.ModelSerializer):
    """Contract Serializer"""

    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)

    class Meta:
        model = Contract
        fields = [
            'id', 'employee', 'employee_name', 'contract_type',
            'start_date', 'end_date', 'salary', 'hours_per_week',
            'status', 'contract_file', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PayrollSerializer(serializers.ModelSerializer):
    """Payroll Serializer with duplicate-prevention validation."""

    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    position = serializers.CharField(source='employee.position', read_only=True)
    position_display = serializers.CharField(source='employee.get_position_display', read_only=True)
    prestation_type = serializers.CharField(source='employee.prestation_type', read_only=True)
    salaire_journalier = serializers.DecimalField(
        source='employee.salaire_journalier', max_digits=10, decimal_places=2, read_only=True)
    salaire_horaire = serializers.DecimalField(
        source='employee.salaire_horaire', max_digits=10, decimal_places=2, read_only=True)
    currency = serializers.CharField(source='employee.currency', read_only=True)
    period_label = serializers.CharField(read_only=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    validated_by_name = serializers.CharField(source='validated_by.name', read_only=True, default=None)

    class Meta:
        model = Payroll
        fields = [
            'id', 'employee', 'employee_name', 'employee_id', 'position', 'position_display',
            'prestation_type', 'salaire_journalier', 'salaire_horaire', 'currency',
            'mois', 'annee', 'period_label',
            'jours_prestes', 'heures_prestees',
            'base_salary', 'bonuses', 'deductions', 'net_salary', 'status', 'status_label',
            'payment_date', 'payment_method', 'notes',
            'jours_ouvrables', 'jours_absence_injustifiee', 'retenue_absences', 'heures_cours',
            'heures_complementaires', 'montant_heures_complementaires', 'heures_supplementaires',
            'montant_heures_supplementaires', 'indemnites', 'brut_imposable', 'inss_salarie', 'ipr',
            'inss_patronal', 'inpp', 'onem', 'cout_employeur', 'details', 'computed_at',
            'validated_by_name', 'validated_at',
            'created_at', 'updated_at'
        ]
        # Tout le calcul est fait par le serveur (apps/hr/payroll.py) : seuls les primes,
        # les retenues diverses (avances) et les notes se saisissent.
        read_only_fields = [
            'id', 'base_salary', 'net_salary', 'period_label', 'status', 'payment_date',
            'jours_prestes', 'heures_prestees', 'jours_ouvrables', 'jours_absence_injustifiee',
            'retenue_absences', 'heures_cours', 'heures_complementaires', 'montant_heures_complementaires',
            'heures_supplementaires', 'montant_heures_supplementaires', 'indemnites', 'brut_imposable',
            'inss_salarie', 'ipr', 'inss_patronal', 'inpp', 'onem', 'cout_employeur', 'details',
            'computed_at', 'validated_at', 'created_at', 'updated_at',
        ]

    def validate(self, attrs):
        """Prevent duplicate payroll for same employee + period."""
        employee = attrs.get('employee', getattr(self.instance, 'employee', None))
        mois = attrs.get('mois', getattr(self.instance, 'mois', None))
        annee = attrs.get('annee', getattr(self.instance, 'annee', None))
        instance_pk = self.instance.pk if self.instance else None

        if employee and mois and annee:
            qs = Payroll.objects.filter(employee=employee, mois=mois, annee=annee)
            if instance_pk:
                qs = qs.exclude(pk=instance_pk)
            if qs.exists():
                existing = qs.first()
                month_name = dict(Payroll.MONTH_CHOICES).get(mois, mois)
                raise serializers.ValidationError(
                    f'Une fiche de paie existe déjà pour {employee.user.get_full_name()} '
                    f'en {month_name} {annee} (statut: {existing.get_status_display()}).'
                )
        return attrs


class LeaveSerializer(serializers.ModelSerializer):
    """Leave Serializer"""

    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    duration_days = serializers.IntegerField(read_only=True)

    class Meta:
        model = Leave
        fields = [
            'id', 'employee', 'employee_name', 'leave_type',
            'start_date', 'end_date', 'duration_days', 'reason',
            'status', 'approved_by', 'approved_by_name', 'approved_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'duration_days', 'approved_at', 'created_at', 'updated_at']



class PayrollSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayrollSettings
        exclude = ['id']
        read_only_fields = ['updated_at']

    def validate_ipr_brackets(self, value):
        if not isinstance(value, list) or not value:
            raise serializers.ValidationError("Barème attendu : [[plafond, taux], …, [null, taux]].")
        last = -1
        for i, row in enumerate(value):
            if not isinstance(row, (list, tuple)) or len(row) != 2:
                raise serializers.ValidationError("Chaque tranche = [plafond, taux].")
            upper, rate = row
            if upper is None and i != len(value) - 1:
                raise serializers.ValidationError("Seule la dernière tranche peut être sans plafond.")
            if upper is not None and float(upper) <= last:
                raise serializers.ValidationError("Les plafonds doivent être croissants.")
            if not 0 <= float(rate) <= 100:
                raise serializers.ValidationError("Taux entre 0 et 100.")
            last = float(upper) if upper is not None else last
        return value


class StaffAttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    employee_code = serializers.CharField(source='employee.employee_id', read_only=True)
    position_display = serializers.CharField(source='employee.get_position_display', read_only=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    recorded_by_name = serializers.CharField(source='recorded_by.name', read_only=True, default=None)

    class Meta:
        model = StaffAttendance
        fields = ['id', 'employee', 'employee_name', 'employee_code', 'position_display', 'date', 'status',
                  'status_label', 'check_in', 'check_out', 'hours_worked', 'overtime_hours', 'note',
                  'self_declared', 'recorded_by_name', 'updated_at']
        read_only_fields = ['hours_worked', 'overtime_hours', 'self_declared', 'updated_at']

    def validate(self, attrs):
        ci = attrs.get('check_in', getattr(self.instance, 'check_in', None))
        co = attrs.get('check_out', getattr(self.instance, 'check_out', None))
        if ci and co and co <= ci:
            raise serializers.ValidationError({'check_out': "L'heure de sortie doit suivre l'heure d'arrivée."})
        return attrs
