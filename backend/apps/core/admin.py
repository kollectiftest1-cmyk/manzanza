from django.contrib import admin

from .models import AuditLog, InstitutionSettings, TrashItem


@admin.register(InstitutionSettings)
class InstitutionSettingsAdmin(admin.ModelAdmin):
    list_display = ['trash_retention_days', 'updated_at', 'updated_by']

    def has_add_permission(self, request):
        return not InstitutionSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(TrashItem)
class TrashItemAdmin(admin.ModelAdmin):
    list_display = ['object_repr', 'content_type', 'module', 'is_root', 'deleted_at', 'deleted_by']
    list_filter = ['module', 'is_root']
    search_fields = ['object_repr']

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'action', 'actor_repr', 'object_repr', 'ip_address']
    list_filter = ['action']
    search_fields = ['actor_repr', 'object_repr']

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
