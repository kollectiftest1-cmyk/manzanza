"""
Notification serializers
"""
from rest_framework import serializers

from apps.core.validation import check
from .models import Notification, Announcement


class NotificationSerializer(serializers.ModelSerializer):
    """Notification Serializer"""

    recipient_name = serializers.CharField(source='recipient.get_full_name', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'recipient_name', 'title', 'message',
            'notification_type', 'priority', 'link', 'related_object_id',
            'is_read', 'read_at', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'read_at']


class AnnouncementSerializer(serializers.ModelSerializer):
    """Announcement Serializer"""

    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = Announcement
        fields = [
            'id', 'title', 'content', 'audience', 'attachment',
            'is_active', 'is_pinned', 'publish_date', 'expire_date',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        check(self, attrs, order=[('publish_date', 'expire_date')])
        return attrs
