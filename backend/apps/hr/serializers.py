"""
HR serializers
"""
from rest_framework import serializers
from .models import Employee, Contract, Payroll, Leave


class EmployeeSerializer(serializers.ModelSerializer):
    """Employee Serializer"""

    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'user', 'user_name', 'user_email',
            'employee_id', 'position', 'department',
            'hire_date', 'end_date', 'base_salary', 'currency',
            'status', 'emergency_contact', 'emergency_phone',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


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
    """Payroll Serializer"""

    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)

    class Meta:
        model = Payroll
        fields = [
            'id', 'employee', 'employee_name', 'employee_id',
            'period_start', 'period_end', 'base_salary',
            'bonuses', 'deductions', 'net_salary', 'status',
            'payment_date', 'payment_method', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'net_salary', 'created_at', 'updated_at']


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
