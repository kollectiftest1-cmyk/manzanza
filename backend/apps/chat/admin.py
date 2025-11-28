from django.contrib import admin
from .models import ChatChannel, Message, MessageReaction


@admin.register(ChatChannel)
class ChatChannelAdmin(admin.ModelAdmin):
    """Admin configuration for ChatChannel model"""

    list_display = ['name', 'course', 'is_general', 'participants_count', 'is_active', 'created_at']
    list_filter = ['is_general', 'is_active', 'created_at']
    search_fields = ['name', 'description', 'course__name']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    """Admin configuration for Message model"""

    list_display = ['sender', 'channel', 'content_preview', 'is_ai_response', 'created_at']
    list_filter = ['is_ai_response', 'is_edited', 'is_deleted', 'created_at']
    search_fields = ['content', 'sender__first_name', 'sender__last_name']

    def content_preview(self, obj):
        """Show preview of message content"""
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Contenu'


@admin.register(MessageReaction)
class MessageReactionAdmin(admin.ModelAdmin):
    """Admin configuration for MessageReaction model"""

    list_display = ['user', 'message', 'reaction_type', 'created_at']
    list_filter = ['reaction_type', 'created_at']
