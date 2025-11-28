from django.contrib import admin
from .models import Assignment, Submission, SubmissionComment


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    """Admin configuration for Assignment model"""

    list_display = ['title', 'course', 'assignment_type', 'due_date', 'status', 'submissions_count', 'is_active']
    list_filter = ['assignment_type', 'status', 'is_active', 'due_date']
    search_fields = ['title', 'description', 'course__name']

    fieldsets = (
        ('Informations principales', {
            'fields': ('title', 'description', 'instructions', 'course', 'assignment_type')
        }),
        ('Dates', {
            'fields': ('start_date', 'due_date')
        }),
        ('Configuration', {
            'fields': ('max_score', 'allow_late_submission', 'late_penalty')
        }),
        ('Ressources', {
            'fields': ('attachment',)
        }),
        ('Statut', {
            'fields': ('status', 'is_active')
        }),
    )


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    """Admin configuration for Submission model"""

    list_display = ['student', 'assignment', 'score', 'status', 'is_late', 'submitted_at', 'graded_at']
    list_filter = ['status', 'is_late', 'submitted_at', 'graded_at']
    search_fields = ['student__first_name', 'student__last_name', 'assignment__title']
    readonly_fields = ['submitted_at', 'graded_at']

    fieldsets = (
        ('Soumission', {
            'fields': ('assignment', 'student', 'content', 'attachment')
        }),
        ('Notation', {
            'fields': ('score', 'feedback', 'graded_by', 'graded_at')
        }),
        ('Statut', {
            'fields': ('status', 'is_late', 'submitted_at')
        }),
    )


@admin.register(SubmissionComment)
class SubmissionCommentAdmin(admin.ModelAdmin):
    """Admin configuration for SubmissionComment model"""

    list_display = ['author', 'submission', 'comment_preview', 'created_at']
    list_filter = ['created_at']
    search_fields = ['comment', 'author__first_name', 'author__last_name']

    def comment_preview(self, obj):
        """Show preview of comment"""
        return obj.comment[:50] + '...' if len(obj.comment) > 50 else obj.comment
    comment_preview.short_description = 'Commentaire'
