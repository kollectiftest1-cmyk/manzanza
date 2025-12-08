"""
Chat serializers
"""
from rest_framework import serializers
from .models import ChatChannel, Message, MessageReaction


class MessageReactionSerializer(serializers.ModelSerializer):
    """MessageReaction Serializer"""

    user_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = MessageReaction
        fields = ['id', 'message', 'user', 'user_name', 'reaction_type', 'created_at']
        read_only_fields = ['id', 'created_at']


class MessageSerializer(serializers.ModelSerializer):
    """Message Serializer"""

    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    sender_role = serializers.CharField(source='sender.role', read_only=True)
    sender_avatar = serializers.SerializerMethodField()
    reactions = MessageReactionSerializer(many=True, read_only=True)
    replies_count = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'id', 'channel', 'sender', 'sender_name', 'sender_role', 'sender_avatar',
            'content', 'is_ai_response', 'parent_message',
            'attachment', 'is_edited', 'is_deleted',
            'reactions', 'replies_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'sender']

    def get_sender_avatar(self, obj):
        """Get sender avatar URL"""
        if hasattr(obj.sender, 'avatar') and obj.sender.avatar:
            return obj.sender.avatar.url
        return None

    def get_replies_count(self, obj):
        """Get count of replies to this message"""
        return obj.replies.filter(is_deleted=False).count()


class ChatChannelSerializer(serializers.ModelSerializer):
    """ChatChannel Serializer"""

    course_name = serializers.SerializerMethodField()
    section_name = serializers.SerializerMethodField()
    filiere_name = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    participants_count = serializers.IntegerField(read_only=True)
    latest_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatChannel
        fields = [
            'id', 'name', 'description', 'channel_type',
            'course', 'course_name', 'section', 'section_name',
            'filiere', 'filiere_name', 'is_active', 'participants_count',
            'latest_message', 'unread_count', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'participants_count']

    def get_course_name(self, obj):
        return obj.course.name if obj.course else None

    def get_section_name(self, obj):
        return obj.section.nom if obj.section else None

    def get_filiere_name(self, obj):
        return obj.filiere.nom if obj.filiere else None

    def get_latest_message(self, obj):
        """Get the latest message in channel"""
        latest = obj.messages.filter(is_deleted=False).order_by('-created_at').first()
        if latest:
            return {
                'id': latest.id,
                'sender_name': latest.sender.get_full_name(),
                'content': latest.content[:50] + '...' if len(latest.content) > 50 else latest.content,
                'created_at': latest.created_at
            }
        return None

    def get_unread_count(self, obj):
        """Get unread message count for current user"""
        request = self.context.get('request')
        if request and request.user:
            # TODO: Implement read status tracking
            return 0
        return 0
