"""
Course views
"""
from django.db import models
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Course, CourseEnrollment, CourseMaterial
from .serializers import (
    CourseSerializer, CourseDetailSerializer,
    CourseEnrollmentSerializer, CourseMaterialSerializer
)
from apps.users.permissions import CanManageCourses, IsTeacherOrAdmin, IsAdminUser
from apps.core.pagination import CustomPageNumberPagination # Import custom pagination

class CourseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Course model
    """
    queryset = Course.objects.select_related('titulaire', 'auditoire', 'auditoire__filiere', 'auditoire__filiere__section').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'is_active', 
        'semester', 
        'auditoire', 
        'titulaire',
        'auditoire__filiere__section', # Filter by section
        'auditoire__filiere',         # Filter by filiere
        'auditoire__vacation',        # Filter by vacation
        'auditoire__niveau',          # Filter by niveau
    ]
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['name', 'created_at']
    pagination_class = CustomPageNumberPagination # Add custom pagination class

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CourseDetailSerializer
        return CourseSerializer

    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [CanManageCourses()]
        return super().get_permissions()

    def get_queryset(self):
        """Filter courses based on user role and apply additional filters."""
        user = self.request.user
        queryset = self.queryset

        if user.is_staff or user.role in ['sga', 'sgad', 'iadmin']: # Added iadmin for full access
            # Admins see all courses, filters applied by DjangoFilterBackend
            pass
        elif user.role == 'chef_departement':
            # Chef de département sees courses in their filiere
            if user.filiere:
                queryset = queryset.filter(auditoire__filiere=user.filiere)
            else:
                queryset = queryset.none() # No filiere managed, no courses
        elif user.role in ['enseignant', 'assistant']:
            # Teachers/Assistants see courses they are titular or assistant of
            queryset = queryset.filter(models.Q(titulaire=user) | models.Q(assistants=user)).distinct()
        elif user.role == 'chef_section':
            # Chef de section sees courses in their section
            if user.section:
                queryset = queryset.filter(auditoire__filiere__section=user.section)
            else:
                queryset = queryset.none() # No section managed, no courses
        elif user.role == 'etudiant':
            # Students see courses they are enrolled in
            enrolled_courses_ids = CourseEnrollment.objects.filter(student=user, is_active=True).values_list('course_id', flat=True)
            queryset = queryset.filter(id__in=enrolled_courses_ids)
        else:
            queryset = queryset.none() # Other roles see no courses by default

        return queryset

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def enroll(self, request, pk=None):
        """Enroll current student in a course."""
        course = self.get_object()
        if request.user.role != 'etudiant':
            return Response({'error': 'Seuls les étudiants peuvent s\'inscrire.'}, status=status.HTTP_403_FORBIDDEN)
        
        enrollment, created = CourseEnrollment.objects.get_or_create(student=request.user, course=course)
        if not created and not enrollment.is_active:
            enrollment.is_active = True
            enrollment.save()
        
        return Response(CourseEnrollmentSerializer(enrollment).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def my_courses(self, request):
        """Get courses relevant to the current user."""
        # The get_queryset method already handles filtering for 'etudiant' role
        # We need to apply pagination here as well
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class CourseEnrollmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for CourseEnrollment model
    """
    queryset = CourseEnrollment.objects.all()
    serializer_class = CourseEnrollmentSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        """Filter enrollments based on user role"""
        user = self.request.user
        if user.is_staff or user.role == 'sga':
            return self.queryset
        elif user.role in ['enseignant', 'assistant', 'chef_departement', 'chef_section']:
            return self.queryset.filter(course__titulaire=user)
        elif user.role == 'etudiant':
            return self.queryset.filter(student=user)
        return self.queryset.none()


class CourseMaterialViewSet(viewsets.ModelViewSet):
    """
    ViewSet for CourseMaterial model
    """
    queryset = CourseMaterial.objects.all()
    serializer_class = CourseMaterialSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsTeacherOrAdmin()]
        return super().get_permissions()

    def perform_create(self, serializer):
        """Set uploaded_by to current user"""
        serializer.save(uploaded_by=self.request.user)
