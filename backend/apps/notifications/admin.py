from django.contrib import admin
from .models import Notification, Announcement


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Admin configuration for Notification model"""

    list_display = ['recipient', 'title', 'notification_type', 'priority', 'is_read', 'created_at']
    list_filter = ['notification_type', 'priority', 'is_read', 'created_at']
    search_fields = ['title', 'message', 'recipient__first_name', 'recipient__last_name']
    readonly_fields = ['read_at', 'created_at']

    actions = ['mark_as_read', 'mark_as_unread']

    def mark_as_read(self, request, queryset):
        """Mark selected notifications as read"""
        from django.utils import timezone
        queryset.update(is_read=True, read_at=timezone.now())
    mark_as_read.short_description = "Marquer comme lu"

    def mark_as_unread(self, request, queryset):
        """Mark selected notifications as unread"""
        queryset.update(is_read=False, read_at=None)
    mark_as_unread.short_description = "Marquer comme non lu"


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    """Admin configuration for Announcement model"""

    list_display = ['title', 'audience', 'is_active', 'is_pinned', 'publish_date', 'created_by']
    list_filter = ['audience', 'is_active', 'is_pinned', 'publish_date']
    search_fields = ['title', 'content']

    fieldsets = (
        ('Contenu', {
            'fields': ('title', 'content', 'audience', 'attachment')
        }),
        ('Paramètres', {
            'fields': ('is_active', 'is_pinned')
        }),
        ('Dates', {
            'fields': ('publish_date', 'expire_date')
        }),
    )
