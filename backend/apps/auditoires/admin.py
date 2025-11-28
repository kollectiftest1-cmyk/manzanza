from django.contrib import admin
from .models import Auditoire


@admin.register(Auditoire)
class AuditoireAdmin(admin.ModelAdmin):
    """Admin configuration for Auditoire model"""

    list_display = ['nom', 'niveau', 'filiere', 'etudiants_count', 'cours_count', 'is_active', 'created_at']
    list_filter = ['niveau', 'filiere', 'is_active', 'annee_academique']
    search_fields = ['nom', 'description']
    readonly_fields = ['created_at', 'updated_at', 'etudiants_count', 'cours_count']

    fieldsets = (
        ('Informations principales', {
            'fields': ('nom', 'niveau', 'filiere', 'description')
        }),
        ('Configuration', {
            'fields': ('annee_academique', 'capacite_max', 'is_active')
        }),
        ('Statistiques', {
            'fields': ('etudiants_count', 'cours_count')
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at')
        }),
    )
