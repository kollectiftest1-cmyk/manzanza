"""
Auditoire views
"""
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Count, Q # Import Count and Q
from .models import Auditoire, Section, Filiere
from .serializers import (
    AuditoireSerializer, SectionSerializer, FiliereSerializer,
    SectionDetailSerializer, FiliereDetailSerializer
)
from apps.users.permissions import IsAdminUser, IsSGAOrAdmin, CanViewAcademicData # Import CanViewAcademicData

class SectionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Section model.
    Provides full CRUD functionality for Sections.
    """
    queryset = Section.objects.select_related('chef_section').prefetch_related('filieres').all()
    # permission_classes = [IsSGAOrAdmin] # Will be handled by get_permissions
    filter_backends = [SearchFilter]
    search_fields = ['nom']

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
        return [IsSGAOrAdmin()]


class FiliereViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Filiere (Option) model.
    - `list` action is public for pre-inscription form.
    - Other actions are restricted to SGA/Admin.
    """
    queryset = Filiere.objects.select_related('section', 'chef_filiere').all()
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['section']
    search_fields = ['nom']

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
        return [IsSGAOrAdmin()]


class AuditoireViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Auditoire model
    """
    queryset = Auditoire.objects.select_related('filiere__section', 'filiere').annotate(
        # Renamed annotations to avoid conflict with model properties
        etudiants_count=Count('students', filter=Q(students__status='actif')),
        cours_count=Count('courses', filter=Q(courses__is_active=True))
    ).all().order_by('-created_at') # Added ordering for consistency, can be adjusted
    serializer_class = AuditoireSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['niveau', 'is_active', 'annee_academique', 'filiere__section', 'filiere']
    search_fields = ['nom', 'description']
    ordering_fields = ['nom', 'niveau', 'created_at']

    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSGAOrAdmin()]
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
        students = auditoire.students.filter(status='actif')
        serializer = UserSerializer(students, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def courses(self, request, pk=None):
        """Get all courses for this auditoire"""
        auditoire = self.get_object()
        from apps.courses.serializers import CourseSerializer
        courses = auditoire.courses.filter(is_active=True)
        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data)
