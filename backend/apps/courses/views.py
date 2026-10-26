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
from apps.users.permissions import (
    CanManageCourses, IsTeacherOrAdmin, IsAdminUser, IsTeachingStaff, manages_course, teaches_course,
)
from rest_framework.exceptions import PermissionDenied
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

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CourseDetailSerializer
        return CourseSerializer

    # Champs qu'un enseignant titulaire peut modifier sur son propre cours.
    TEACHER_EDITABLE_FIELDS = {'description', 'resources', 'syllabus'}

    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['create', 'destroy']:
            return [CanManageCourses()]
        if self.action in ['update', 'partial_update']:
            return [IsTeachingStaff()]
        return super().get_permissions()

    def _assert_scope(self, auditoire):
        """Un chef ne crée/modifie des cours que dans son périmètre."""
        user = self.request.user
        if user.is_staff or user.role in ['sga', 'pdg']:
            return
        filiere = getattr(auditoire, 'filiere', None)
        if user.role == 'chef_departement':
            managed = getattr(user, 'managed_filiere', None) if hasattr(user, 'managed_filiere') else None
            if filiere and filiere.id in {getattr(managed, 'id', None), user.filiere_id}:
                return
        if user.role == 'chef_section':
            managed = getattr(user, 'managed_section', None) if hasattr(user, 'managed_section') else None
            if filiere and filiere.section_id in {getattr(managed, 'id', None), user.section_id}:
                return
        raise PermissionDenied("Cet auditoire n'appartient pas à votre périmètre.")

    def perform_create(self, serializer):
        self._assert_scope(serializer.validated_data.get('auditoire'))
        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        course = serializer.instance
        is_manager = user.is_staff or user.role in ['sga', 'pdg', 'chef_section', 'chef_departement']
        if is_manager:
            self._assert_scope(serializer.validated_data.get('auditoire', course.auditoire))
        else:
            if not teaches_course(user, course):
                raise PermissionDenied("Vous n'enseignez pas ce cours.")
            forbidden = set(serializer.validated_data) - self.TEACHER_EDITABLE_FIELDS
            if forbidden:
                raise PermissionDenied(
                    "Un enseignant ne peut modifier que la description, les ressources et le syllabus de son cours."
                )
        serializer.save()

    def perform_destroy(self, instance):
        self._assert_scope(instance.auditoire)
        instance.delete(user=self.request.user)

    def get_queryset(self):
        """Filter courses based on user role and apply additional filters."""
        user = self.request.user
        queryset = self.queryset
        
        logger.debug(f"Filtering courses for user: {user.email} with role: {user.role}")

        if user.is_superuser or user.role in ['sga', 'sgad', 'pdg', 'directeur_general']:
            logger.debug("User is admin/SGA, returning all courses.")
            return queryset

        elif user.role == 'chef_departement':
            filieres_to_check = []
            try:
                if hasattr(user, 'managed_filiere') and user.managed_filiere:
                    filieres_to_check.append(user.managed_filiere.id)
                    logger.debug(f"Found managed filiere: {user.managed_filiere.id}")
            except ObjectDoesNotExist:
                logger.warning("Managed filiere does not exist for user.")

            if hasattr(user, 'filiere') and user.filiere:
                filieres_to_check.append(user.filiere.id)
                logger.debug(f"Found user filiere: {user.filiere.id}")

            if filieres_to_check:
                unique_filiere_ids = list(set(filieres_to_check))
                logger.debug(f"Filtering courses by filiere IDs: {unique_filiere_ids}")
                # Cours filtrés via auditoire.filiere
                filtered_queryset = queryset.filter(auditoire__filiere__id__in=unique_filiere_ids).distinct()
                logger.debug(f"Found {filtered_queryset.count()} courses for chef_departement.")
                return filtered_queryset

            logger.warning("No filieres found for chef_departement, returning empty queryset.")
            return queryset.none()

        elif user.role == 'chef_section':
            sections_to_check = []
            try:
                if hasattr(user, 'managed_section') and user.managed_section:
                    sections_to_check.append(user.managed_section.id)
                    logger.debug(f"Found managed section: {user.managed_section.id}")
            except ObjectDoesNotExist:
                logger.warning("Managed section does not exist for user.")

            if hasattr(user, 'section') and user.section:
                sections_to_check.append(user.section.id)
                logger.debug(f"Found user section: {user.section.id}")

            if sections_to_check:
                unique_section_ids = list(set(sections_to_check))
                logger.debug(f"Filtering courses by section IDs (via auditoire.filiere.section): {unique_section_ids}")
                # Cours filtrés via auditoire.filiere.section
                filtered_queryset = queryset.filter(auditoire__filiere__section__id__in=unique_section_ids).distinct()
                logger.debug(f"Found {filtered_queryset.count()} courses for chef_section.")
                return filtered_queryset

            logger.warning("No sections found for chef_section, returning empty queryset.")
            return queryset.none()

        elif user.role in ['enseignant', 'assistant']:
            logger.debug("Filtering for enseignant/assistant.")
            return queryset.filter(models.Q(titulaire=user) | models.Q(assistants=user)).distinct()

        elif user.role == 'etudiant':
            logger.debug("Filtering for etudiant.")
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

    def perform_destroy(self, instance):
        # Une inscription n'est jamais effacée : elle est désactivée (historique conservé).
        instance.is_active = False
        instance.save(update_fields=['is_active'])


class CourseMaterialViewSet(viewsets.ModelViewSet):
    """
    ViewSet for CourseMaterial model
    """
    queryset = CourseMaterial.objects.all()
    serializer_class = CourseMaterialSerializer
    permission_classes = [IsAuthenticated]

    filterset_fields = ['course', 'material_type']

    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsTeacherOrAdmin()]
        return super().get_permissions()

    def get_queryset(self):
        """Uniquement les supports des cours accessibles ; les supports privés restent invisibles aux étudiants."""
        user = self.request.user
        qs = CourseMaterial.objects.select_related('course', 'uploaded_by')
        accessible = CourseViewSet(request=self.request, action='list', format_kwarg=None).get_queryset()
        qs = qs.filter(course__in=accessible.values('id'))
        if user.role == 'etudiant':
            qs = qs.filter(is_public=True)
        return qs

    def _assert_can_edit(self, course):
        if not manages_course(self.request.user, course):
            raise PermissionDenied("Vous ne pouvez gérer que les supports de vos propres cours.")

    def perform_create(self, serializer):
        """Set uploaded_by to current user"""
        self._assert_can_edit(serializer.validated_data.get('course'))
        serializer.save(uploaded_by=self.request.user)

    def perform_update(self, serializer):
        self._assert_can_edit(serializer.validated_data.get('course', serializer.instance.course))
        serializer.save()

    def perform_destroy(self, instance):
        self._assert_can_edit(instance.course)
        instance.delete(user=self.request.user)
