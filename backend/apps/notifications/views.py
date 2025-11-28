"""
Notification views
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from .models import Notification, Announcement
from .serializers import NotificationSerializer, AnnouncementSerializer
from apps.users.permissions import IsAdminUser


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Notification model
    """
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['notification_type', 'priority', 'is_read']
    search_fields = ['title', 'message']
    ordering_fields = ['created_at', 'priority']

    def get_queryset(self):
        """Users see only their own notifications"""
        if self.request.user.role in ['iadmin']:
            return self.queryset
        return self.queryset.filter(recipient=self.request.user)

    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Get unread notifications"""
        notifications = self.queryset.filter(recipient=request.user, is_read=False)
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications"""
        count = self.queryset.filter(recipient=request.user, is_read=False).count()
        return Response({'count': count})

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        notification.mark_as_read()
        return Response({'detail': 'Notification marquée comme lue.'})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        self.queryset.filter(recipient=request.user, is_read=False).update(
            is_read=True,
            read_at=timezone.now()
        )
        return Response({'detail': 'Toutes les notifications ont été marquées comme lues.'})

    @action(detail=False, methods=['delete'])
    def clear_all(self, request):
        """Clear all notifications"""
        self.queryset.filter(recipient=request.user).delete()
        return Response({'detail': 'Toutes les notifications ont été supprimées.'})


class AnnouncementViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Announcement model
    """
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['audience', 'is_active', 'is_pinned']
    search_fields = ['title', 'content']
    ordering_fields = ['publish_date', 'created_at']

    def get_queryset(self):
        """Filter announcements based on user role"""
        user = self.request.user

        # Admins see all
        if user.role in ['iadmin', 'pdg', 'directeur_general', 'sga', 'sgad']:
            return self.queryset

        # Filter by audience
        queryset = self.queryset.filter(is_active=True)

        # Students
        if user.role == 'etudiant':
            queryset = queryset.filter(audience__in=['tous', 'etudiants'])
        # Teachers
        elif user.role in ['enseignant', 'assistant']:
            queryset = queryset.filter(audience__in=['tous', 'enseignants'])
        # Staff
        else:
            queryset = queryset.filter(audience__in=['tous', 'personnel'])

        # Only show current and future announcements
        now = timezone.now()
        queryset = queryset.filter(publish_date__lte=now)
        queryset = queryset.exclude(expire_date__lt=now)

        return queryset

    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return super().get_permissions()

    def perform_create(self, serializer):
        """Set created_by to current user"""
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def pinned(self, request):
        """Get pinned announcements"""
        announcements = self.get_queryset().filter(is_pinned=True)
        serializer = self.get_serializer(announcements, many=True)
        return Response(serializer.data)
