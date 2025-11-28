from django.contrib import admin
from .models import FeeType, StudentFee, Payment


@admin.register(FeeType)
class FeeTypeAdmin(admin.ModelAdmin):
    """Admin configuration for FeeType model"""

    list_display = ['name', 'category', 'amount', 'is_mandatory', 'is_active', 'academic_year']
    list_filter = ['category', 'is_mandatory', 'is_active', 'academic_year']
    search_fields = ['name', 'description']


@admin.register(StudentFee)
class StudentFeeAdmin(admin.ModelAdmin):
    """Admin configuration for StudentFee model"""

    list_display = ['student', 'fee_type', 'total_amount', 'amount_paid', 'amount_remaining',
                   'payment_percentage', 'status', 'due_date']
    list_filter = ['status', 'due_date', 'fee_type']
    search_fields = ['student__first_name', 'student__last_name', 'fee_type__name']
    readonly_fields = ['amount_remaining', 'payment_percentage']

    fieldsets = (
        ('Étudiant et frais', {
            'fields': ('student', 'fee_type')
        }),
        ('Montants', {
            'fields': ('total_amount', 'amount_paid', 'amount_remaining', 'payment_percentage')
        }),
        ('Statut', {
            'fields': ('status', 'due_date', 'notes')
        }),
    )


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """Admin configuration for Payment model"""

    list_display = ['reference', 'student_fee', 'amount', 'payment_method', 'status',
                   'payment_date', 'processed_by']
    list_filter = ['status', 'payment_method', 'payment_date']
    search_fields = ['reference', 'transaction_id', 'student_fee__student__first_name',
                    'student_fee__student__last_name']
    readonly_fields = ['reference']

    fieldsets = (
        ('Paiement', {
            'fields': ('student_fee', 'amount', 'payment_method', 'reference')
        }),
        ('Transaction', {
            'fields': ('transaction_id', 'receipt', 'status')
        }),
        ('Traitement', {
            'fields': ('processed_by', 'payment_date', 'notes')
        }),
    )
