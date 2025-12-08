"""
Chat views
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import ChatChannel, Message, MessageReaction
from .serializers import ChatChannelSerializer, MessageSerializer, MessageReactionSerializer
from apps.users.permissions import IsTeacherOrAdmin


class ChatChannelViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ChatChannel model
    """
    queryset = ChatChannel.objects.all()
    serializer_class = ChatChannelSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['course', 'section', 'filiere', 'channel_type', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at', 'updated_at']

    def get_queryset(self):
        """
        Return channels based on user role and permissions
        - SGA/Admin: ALL channels
        - Chef Section: Channels of their section + courses of their section
        - Chef Département: Channels of their filiere + courses of their filiere
        - Enseignant/Assistant: Channels where they are members
        - Étudiant: Channels of their auditoire's courses
        """
        user = self.request.user
        if not user.is_authenticated:
            return ChatChannel.objects.none()

        # SGA and admins see ALL channels
        if user.role in ['sga', 'admin', 'iadmin']:
            return ChatChannel.objects.filter(is_active=True).distinct()

        # Chef de section sees: their section chat + all filieres of their section + all courses of their section
        if user.role == 'chef_section':
            from django.db.models import Q
            section = user.managed_section
            if section:
                return ChatChannel.objects.filter(
                    Q(section=section) |  # Section chat
                    Q(filiere__section=section) |  # Filieres of this section
                    Q(course__auditoire__filiere__section=section),  # Courses of this section
                    is_active=True
                ).distinct()

        # Chef de département sees: their filiere chat + all courses of their filiere
        if user.role == 'chef_departement':
            from django.db.models import Q
            filiere = user.managed_filiere
            if filiere:
                return ChatChannel.objects.filter(
                    Q(filiere=filiere) |  # Filiere chat
                    Q(section=filiere.section) |  # Section chat
                    Q(course__auditoire__filiere=filiere),  # Courses of this filiere
                    is_active=True
                ).distinct()

        # Enseignants, assistants, and students see only channels where they are members
        return ChatChannel.objects.filter(members=user, is_active=True).distinct()

    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsTeacherOrAdmin()]
        return super().get_permissions()

    def perform_create(self, serializer):
        """Set created_by to current user"""
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get all messages for this channel"""
        channel = self.get_object()
        messages = channel.messages.filter(is_deleted=False).order_by('created_at')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_channels(self, request):
        """Get all channels for current user"""
        channels = self.get_queryset().order_by('-updated_at')
        serializer = self.get_serializer(channels, many=True)
        return Response(serializer.data)


class MessageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Message model
    """
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['channel', 'sender', 'is_ai_response']
    search_fields = ['content']
    ordering_fields = ['created_at']

    def get_queryset(self):
        """Filter out deleted messages by default"""
        return self.queryset.filter(is_deleted=False)

    def perform_create(self, serializer):
        """Set sender to current user"""
        serializer.save(sender=self.request.user)

    def perform_update(self, serializer):
        """Mark message as edited"""
        serializer.save(is_edited=True)

    @action(detail=True, methods=['post'])
    def delete_message(self, request, pk=None):
        """Soft delete a message"""
        message = self.get_object()

        # Only sender or admins can delete
        if message.sender != request.user and request.user.role not in ['iadmin', 'sga']:
            return Response(
                {'error': 'Vous ne pouvez supprimer que vos propres messages.'},
                status=status.HTTP_403_FORBIDDEN
            )

        message.is_deleted = True
        message.save()
        return Response({'detail': 'Message supprimé.'})

    @action(detail=True, methods=['post'])
    def react(self, request, pk=None):
        """Add or remove reaction to message"""
        message = self.get_object()
        reaction_type = request.data.get('reaction_type')

        if not reaction_type:
            return Response(
                {'error': 'reaction_type requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user already reacted with this type
        existing_reaction = MessageReaction.objects.filter(
            message=message,
            user=request.user,
            reaction_type=reaction_type
        ).first()

        if existing_reaction:
            # Remove reaction
            existing_reaction.delete()
            return Response({'detail': 'Réaction supprimée.'})
        else:
            # Add reaction
            reaction = MessageReaction.objects.create(
                message=message,
                user=request.user,
                reaction_type=reaction_type
            )
            serializer = MessageReactionSerializer(reaction)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def replies(self, request, pk=None):
        """Get all replies to this message"""
        message = self.get_object()
        replies = message.replies.filter(is_deleted=False).order_by('created_at')
        serializer = MessageSerializer(replies, many=True)
        return Response(serializer.data)


class MessageReactionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for MessageReaction model (read-only)
    """
    queryset = MessageReaction.objects.all()
    serializer_class = MessageReactionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['message', 'user', 'reaction_type']
