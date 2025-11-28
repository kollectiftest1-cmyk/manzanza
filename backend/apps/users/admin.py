from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin configuration for User model"""

    list_display = ['email', 'first_name', 'last_name', 'role', 'status', 'is_active', 'date_joined']
    list_filter = ['role', 'status', 'is_active', 'is_staff', 'date_joined']
    search_fields = ['email', 'first_name', 'last_name', 'matricule']
    ordering = ['-date_joined']

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informations personnelles', {'fields': ('first_name', 'last_name', 'phone', 'address',
                                                   'date_of_birth', 'profile_picture')}),
        ('Rôle et Statut', {'fields': ('role', 'status')}),
        ('Étudiant', {'fields': ('matricule', 'promotion', 'auditoire')}),
        ('Personnel', {'fields': ('department', 'section', 'specialty')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Dates importantes', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'role', 'password1', 'password2'),
        }),
    )
