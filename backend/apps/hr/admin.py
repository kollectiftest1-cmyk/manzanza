from django.contrib import admin
from .models import Employee, Contract, Payroll, Leave


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    """Admin configuration for Employee model"""

    list_display = ['user', 'employee_id', 'position', 'department', 'hire_date',
                   'base_salary', 'status']
    list_filter = ['position', 'status', 'department', 'hire_date']
    search_fields = ['user__first_name', 'user__last_name', 'employee_id']

    fieldsets = (
        ('Utilisateur', {
            'fields': ('user',)
        }),
        ('Détails de l\'emploi', {
            'fields': ('employee_id', 'position', 'department', 'hire_date', 'end_date')
        }),
        ('Salaire', {
            'fields': ('base_salary', 'currency')
        }),
        ('Statut', {
            'fields': ('status',)
        }),
        ('Contacts d\'urgence', {
            'fields': ('emergency_contact', 'emergency_phone')
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
    )


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    """Admin configuration for Contract model"""

    list_display = ['employee', 'contract_type', 'start_date', 'end_date', 'salary', 'status']
    list_filter = ['contract_type', 'status', 'start_date']
    search_fields = ['employee__user__first_name', 'employee__user__last_name']


@admin.register(Payroll)
class PayrollAdmin(admin.ModelAdmin):
    """Admin configuration for Payroll model"""

    list_display = ['employee', 'period_start', 'period_end', 'base_salary', 'bonuses',
                   'deductions', 'net_salary', 'status', 'payment_date']
    list_filter = ['status', 'payment_date', 'period_end']
    search_fields = ['employee__user__first_name', 'employee__user__last_name']
    readonly_fields = ['net_salary']


@admin.register(Leave)
class LeaveAdmin(admin.ModelAdmin):
    """Admin configuration for Leave model"""

    list_display = ['employee', 'leave_type', 'start_date', 'end_date', 'duration_days',
                   'status', 'approved_by']
    list_filter = ['leave_type', 'status', 'start_date']
    search_fields = ['employee__user__first_name', 'employee__user__last_name']
    readonly_fields = ['duration_days', 'approved_at']
