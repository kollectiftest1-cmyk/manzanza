"""
Course views
"""
import logging
from django.db import models
from django.core.exceptions import ObjectDoesNotExist
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
from .filters import CourseFilter
from apps.users.permissions import CanManageCourses, IsTeacherOrAdmin, IsAdminUser
from apps.users.mixins import RoleBasedFilterMixin
from apps.core.pagination import CustomPageNumberPagination

# Get an instance of a logger
logger = logging.getLogger(__name__)

class CourseViewSet(RoleBasedFilterMixin, viewsets.ModelViewSet):
    """
    ViewSet for Course model with intelligent role-based filtering
    """
    queryset = Course.objects.select_related(
        'titulaire',
        'auditoire',
        'auditoire__filiere',
        'auditoire__filiere__section'
    ).prefetch_related('assistants').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = CourseFilter
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['name', 'created_at']
    pagination_class = CustomPageNumberPagination

    def get_queryset(self):
        """Apply intelligent role-based filtering"""
        queryset = super().get_queryset()
        return self.filter_queryset_by_role(queryset, self.request.user, 'course')

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
        
        logger.info(f"Filtering courses for user: {user.email} with role: {user.role}")

        if user.is_superuser or user.role in ['sga', 'sgad', 'iadmin']:
            logger.info("User is admin/SGA, returning all courses.")
            return queryset

        elif user.role == 'chef_departement':
            filieres_to_check = []
            try:
                if hasattr(user, 'managed_filiere') and user.managed_filiere:
                    filieres_to_check.append(user.managed_filiere.id)
                    logger.info(f"Found managed filiere: {user.managed_filiere.id}")
            except ObjectDoesNotExist:
                logger.warning("Managed filiere does not exist for user.")

            if hasattr(user, 'filiere') and user.filiere:
                filieres_to_check.append(user.filiere.id)
                logger.info(f"Found user filiere: {user.filiere.id}")

            if filieres_to_check:
                unique_filiere_ids = list(set(filieres_to_check))
                logger.info(f"Filtering courses by filiere IDs: {unique_filiere_ids}")
                # Cours filtrés via auditoire.filiere
                filtered_queryset = queryset.filter(auditoire__filiere__id__in=unique_filiere_ids).distinct()
                logger.info(f"Found {filtered_queryset.count()} courses for chef_departement.")
                return filtered_queryset

            logger.warning("No filieres found for chef_departement, returning empty queryset.")
            return queryset.none()

        elif user.role == 'chef_section':
            sections_to_check = []
            try:
                if hasattr(user, 'managed_section') and user.managed_section:
                    sections_to_check.append(user.managed_section.id)
                    logger.info(f"Found managed section: {user.managed_section.id}")
            except ObjectDoesNotExist:
                logger.warning("Managed section does not exist for user.")

            if hasattr(user, 'section') and user.section:
                sections_to_check.append(user.section.id)
                logger.info(f"Found user section: {user.section.id}")

            if sections_to_check:
                unique_section_ids = list(set(sections_to_check))
                logger.info(f"Filtering courses by section IDs (via auditoire.filiere.section): {unique_section_ids}")
                # Cours filtrés via auditoire.filiere.section
                filtered_queryset = queryset.filter(auditoire__filiere__section__id__in=unique_section_ids).distinct()
                logger.info(f"Found {filtered_queryset.count()} courses for chef_section.")
                return filtered_queryset

            logger.warning("No sections found for chef_section, returning empty queryset.")
            return queryset.none()

        elif user.role in ['enseignant', 'assistant']:
            logger.info("Filtering for enseignant/assistant.")
            return queryset.filter(models.Q(titulaire=user) | models.Q(assistants=user)).distinct()

        elif user.role == 'etudiant':
            logger.info("Filtering for etudiant.")
            if user.auditoire:
                # Les cours de l'étudiant sont ceux de son auditoire
                return queryset.filter(auditoire=user.auditoire)
            return queryset.none()

        logger.warning(f"No matching role filter for user {user.email}, returning empty queryset.")
        return queryset.none()

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
