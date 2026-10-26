from rest_framework import serializers

from .models import AcademicCalendarEvent, AuditLog, InstitutionSettings, SupportTicket, TrashItem


class AcademicCalendarEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicCalendarEvent
        fields = ['id', 'title', 'start_date', 'end_date', 'description']


class InstitutionSettingsSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.CharField(source='updated_by.name', read_only=True, default=None)

    class Meta:
        model = InstitutionSettings
        fields = ['trash_retention_days', 'exam_min_paid_percent', 'results_require_clearance',
                  'admission_requires_application_fee', 'institution_name', 'institution_city',
                  'rector_name', 'sga_name', 'updated_at', 'updated_by_name']
        read_only_fields = ['updated_at', 'updated_by_name']


class TrashItemSerializer(serializers.ModelSerializer):
    type_label = serializers.SerializerMethodField()
    module_label = serializers.SerializerMethodField()
    deleted_by_name = serializers.CharField(source='deleted_by.name', read_only=True, default=None)
    cascade_count = serializers.SerializerMethodField()
    expires_at = serializers.SerializerMethodField()
    days_left = serializers.SerializerMethodField()

    MODULE_LABELS = {
        'auditoires': 'Structure académique', 'courses': 'Cours', 'grades': 'Notes',
        'schedules': 'Horaires & calendrier', 'inscriptions': 'Inscriptions', 'quiz': 'Quiz',
        'assignments': 'TP / TD', 'payments': 'Finances', 'hr': 'Ressources humaines',
        'library': 'Bibliothèque', 'users': 'Utilisateurs', 'chat': 'Messagerie',
        'notifications': 'Notifications', 'core': 'Système', 'scolarite': 'Scolarité',
    }

    class Meta:
        model = TrashItem
        fields = [
            'id', 'batch', 'object_id', 'object_repr', 'type_label', 'module', 'module_label',
            'reason', 'deleted_at', 'deleted_by_name', 'cascade_count', 'expires_at', 'days_left',
        ]

    def _retention(self):
        return self.context.get('retention_days', 60)

    def get_type_label(self, obj):
        model = obj.content_type.model_class()
        return str(model._meta.verbose_name).capitalize() if model else obj.content_type.model

    def get_module_label(self, obj):
        return self.MODULE_LABELS.get(obj.module, obj.module)

    def get_cascade_count(self, obj):
        counts = self.context.get('batch_counts', {})
        return max(counts.get(obj.batch, 1) - 1, 0)

    def get_expires_at(self, obj):
        return obj.expires_at(self._retention())

    def get_days_left(self, obj):
        from django.utils import timezone
        remaining = obj.expires_at(self._retention()) - timezone.now()
        return max(remaining.days, 0)


class AuditLogSerializer(serializers.ModelSerializer):
    action_label = serializers.CharField(source='get_action_display', read_only=True)
    object_type = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = ['id', 'timestamp', 'actor_repr', 'action', 'action_label', 'object_type',
                  'object_id', 'object_repr', 'details', 'ip_address']

    def get_object_type(self, obj):
        if obj.content_type_id:
            model = obj.content_type.model_class()
            return str(model._meta.verbose_name) if model else obj.content_type.model
        return None


class SupportTicketSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    created_by_role = serializers.CharField(source='created_by.get_role_display', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.name', read_only=True, default=None)
    category_label = serializers.CharField(source='get_category_display', read_only=True)
    priority_label = serializers.CharField(source='get_priority_display', read_only=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = SupportTicket
        fields = ['id', 'title', 'description', 'category', 'category_label', 'priority', 'priority_label',
                  'status', 'status_label', 'location', 'created_by_name', 'created_by_role', 'assigned_to',
                  'assigned_to_name', 'resolution', 'created_at', 'updated_at', 'resolved_at']
        read_only_fields = ['status', 'assigned_to', 'resolution', 'created_at', 'updated_at', 'resolved_at']
