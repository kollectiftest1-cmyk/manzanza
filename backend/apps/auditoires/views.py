"""
Auditoire views
"""
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Count, Q # Import Count and Q
from .models import Auditoire, Section, Filiere
from .serializers import (
    AuditoireSerializer, SectionSerializer, FiliereSerializer,
    SectionDetailSerializer, FiliereDetailSerializer
)
from .filters import AuditoireFilter, FiliereFilter, SectionFilter
from apps.users.permissions import IsAdminUser, IsSGAOrAdmin, IsAcademicAdmin, CanViewAcademicData
from apps.users.mixins import RoleBasedFilterMixin


def _is_sga_or_admin_user(user):
    # Structure académique : SGA et PDG uniquement (ni la caisse, ni les finances).
    return user.is_staff or user.role in ['sga', 'pdg']


def _managed_section_for(user):
    return getattr(user, 'managed_section', None) or getattr(user, 'section', None)

class SectionViewSet(RoleBasedFilterMixin, viewsets.ModelViewSet):
    """
    ViewSet for Section model with intelligent role-based filtering
    """
    queryset = Section.objects.select_related('chef_section').prefetch_related('filieres').all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = SectionFilter
    search_fields = ['nom']
    ordering_fields = ['nom']

    def get_queryset(self):
        """Apply intelligent role-based filtering"""
        queryset = super().get_queryset()
        return self.filter_queryset_by_role(queryset, self.request.user, 'section')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return SectionDetailSerializer
        return SectionSerializer

    def get_permissions(self):
        """
        Allow specific roles to view sections, restrict others to SGA/Admin.
        """
        if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return [CanViewAcademicData()]
        return [IsAcademicAdmin()]


class FiliereViewSet(RoleBasedFilterMixin, viewsets.ModelViewSet):
    """
    ViewSet for Filiere with intelligent role-based filtering
    """
    queryset = Filiere.objects.select_related('section', 'chef_filiere').all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = FiliereFilter
    search_fields = ['nom']
    ordering_fields = ['nom']

    def get_queryset(self):
        """Apply intelligent role-based filtering"""
        queryset = super().get_queryset()
        # Public access for inscription - no filtering
        if self.action == 'list' and not self.request.user.is_authenticated:
            return queryset
        # Authenticated users - apply role-based filtering
        if self.request.user.is_authenticated:
            return self.filter_queryset_by_role(queryset, self.request.user, 'filiere')
        return queryset

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return FiliereDetailSerializer
        return FiliereSerializer

    def get_permissions(self):
        """
        Allow public access for listing filieres, and specific roles to view/retrieve, restrict otherwise.
        """
        if self.action == 'list':
            return [AllowAny()]
        elif self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return [CanViewAcademicData()]
        return [IsAuthenticated()]

    def _assert_can_manage_filiere(self, target_section=None):
        user = self.request.user
        if _is_sga_or_admin_user(user):
            return None

        if user.role == 'chef_section':
            section = _managed_section_for(user)
            if not section:
                raise PermissionDenied("Aucune section n'est affectée à ce chef de section.")
            if target_section and target_section != section:
                raise PermissionDenied("Vous ne pouvez gérer que les filières de votre section.")
            return section

        raise PermissionDenied("Permission refusée pour gérer les filières.")

    def perform_create(self, serializer):
        target_section = serializer.validated_data.get('section')
        forced_section = self._assert_can_manage_filiere(target_section)
        if forced_section:
            serializer.save(section=forced_section)
        else:
            serializer.save()

    def perform_update(self, serializer):
        current = self.get_object()
        target_section = serializer.validated_data.get('section', current.section)
        forced_section = self._assert_can_manage_filiere(target_section)
        if forced_section:
            serializer.save(section=forced_section)
        else:
            serializer.save()

    def perform_destroy(self, instance):
        self._assert_can_manage_filiere(instance.section)
        instance.delete()


class AuditoireViewSet(RoleBasedFilterMixin, viewsets.ModelViewSet):
    """
    ViewSet for Auditoire model with intelligent role-based filtering
    """
    queryset = Auditoire.objects.select_related(
        'filiere__section',
        'filiere'
    ).prefetch_related(
        'students',
        'courses'
    ).all().order_by('-created_at')
    serializer_class = AuditoireSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = AuditoireFilter
    search_fields = ['nom', 'description']
    ordering_fields = ['nom', 'niveau', 'created_at']

    def get_queryset(self):
        """Apply intelligent role-based filtering"""
        queryset = super().get_queryset()
        return self.filter_queryset_by_role(queryset, self.request.user, 'auditoire')

    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAcademicAdmin()]
        # Allow chef_section to view auditoires
        if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return [CanViewAcademicData()]
        return super().get_permissions()

    def perform_create(self, serializer):
        """Set created_by to current user"""
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['get'])
    def students(self, request, pk=None):
        """Get all students in this auditoire"""
        auditoire = self.get_object()
        from apps.users.serializers import UserSerializer
        students = auditoire.students.filter(is_active=True)
        serializer = UserSerializer(students, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def courses(self, request, pk=None):
        """Get all courses for this auditoire"""
        auditoire = self.get_object()
        from apps.courses.serializers import CourseSerializer
        # Les cours appartiennent à l'auditoire, pas à la filière !
        courses = auditoire.courses.filter(is_active=True)
        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data)
