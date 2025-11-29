from django.contrib import admin
from django.db.models import Count, Q # Import Count and Q
from .models import Auditoire


@admin.register(Auditoire)
class AuditoireAdmin(admin.ModelAdmin):
    """Admin configuration for Auditoire model"""

    list_display = ['nom', 'niveau', 'filiere', 'display_etudiants_count', 'display_cours_count', 'is_active', 'created_at']
    list_filter = ['niveau', 'filiere', 'is_active', 'annee_academique']
    search_fields = ['nom', 'description']
    readonly_fields = ['created_at', 'updated_at', 'display_etudiants_count', 'display_cours_count']

    fieldsets = (
        ('Informations principales', {
            'fields': ('nom', 'niveau', 'filiere', 'description')
        }),
        ('Configuration', {
            'fields': ('annee_academique', 'capacite_max', 'is_active')
        }),
        ('Statistiques', {
            'fields': ('display_etudiants_count', 'display_cours_count')
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at')
        }),
    )

    def get_queryset(self, request):
        """Annotate queryset with etudiants_count and cours_count for admin display"""
        queryset = super().get_queryset(request).select_related('filiere') # Select related filiere for display
        queryset = queryset.annotate(
            etudiants_count=Count('students', filter=Q(students__status='actif')),
            cours_count=Count('courses', filter=Q(courses__is_active=True))
        )
        return queryset

    def display_etudiants_count(self, obj):
        """Method to display etudiants_count in admin"""
        # Access the annotated count directly
        return obj.etudiants_count
    display_etudiants_count.short_description = 'Nombre d\'étudiants' # Column header in admin
    display_etudiants_count.admin_order_field = 'etudiants_count' # Allow sorting by this field

    def display_cours_count(self, obj):
        """Method to display cours_count in admin"""
        # Access the annotated count directly
        return obj.cours_count
    display_cours_count.short_description = 'Nombre de cours' # Column header in admin
    display_cours_count.admin_order_field = 'cours_count' # Allow sorting by this field
