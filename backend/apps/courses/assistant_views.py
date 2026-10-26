"""
Views for Teacher-Assistant management
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db import transaction

from .assistant_models import TeacherAssistant
from .assistant_serializers import (
    TeacherAssistantSerializer,
    AssignAssistantSerializer,
    AssistantPermissionsSerializer
)
from apps.users.models import User
from apps.users.permissions import IsTeacherOrAdmin


class TeacherAssistantViewSet(viewsets.ModelViewSet):
    """ViewSet for managing teacher-assistant relationships"""
    queryset = TeacherAssistant.objects.select_related(
        'assistant', 'teacher', 'course'
    ).all()
    serializer_class = TeacherAssistantSerializer
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['assistant', 'teacher', 'course', 'is_active']
    search_fields = [
        'assistant__first_name', 'assistant__last_name',
        'teacher__first_name', 'teacher__last_name',
        'course__name'
    ]
    ordering_fields = ['assigned_date']

    def get_queryset(self):
        """Filter based on user role"""
        user = self.request.user

        # Enseignants voient leurs propres assistants
        if user.role in ['enseignant', 'chef_section', 'chef_departement']:
            return self.queryset.filter(teacher=user)

        # Assistants voient leurs assignations
        if user.role == 'assistant':
            return self.queryset.filter(assistant=user)

        # Admin/SGA voient tout
        return self.queryset

    @action(detail=False, methods=['post'], url_path='assign')
    @transaction.atomic
    def assign_assistant(self, request):
        """
        Assigner un assistant à un enseignant pour un cours.
        """
        serializer = AssignAssistantSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        assistant = User.objects.get(id=serializer.validated_data['assistant_id'])
        teacher = User.objects.get(id=serializer.validated_data['teacher_id'])
        course_id = serializer.validated_data.get('course_id')
        course = None

        if course_id:
            from .models import Course
            try:
                course = Course.objects.get(id=course_id)
                # Vérifier que l'enseignant est le titulaire
                if course.titulaire != teacher:
                    return Response({
                        'error': f"{teacher.get_full_name()} n'est pas le titulaire du cours {course.name}."
                    }, status=status.HTTP_400_BAD_REQUEST)
            except Course.DoesNotExist:
                return Response({'error': 'Cours non trouvé.'}, status=status.HTTP_404_NOT_FOUND)

        # Vérifier si l'assignation existe déjà
        existing = TeacherAssistant.objects.filter(
            assistant=assistant,
            teacher=teacher,
            course=course
        ).first()

        if existing:
            if existing.is_active:
                return Response({
                    'error': 'Cette assignation existe déjà et est active.',
                    'assignment': TeacherAssistantSerializer(existing).data
                }, status=status.HTTP_400_BAD_REQUEST)
            else:
                # Réactiver l'assignation existante
                existing.is_active = True
                existing.save()
                return Response({
                    'message': 'Assignation réactivée.',
                    'assignment': TeacherAssistantSerializer(existing).data
                }, status=status.HTTP_200_OK)

        # Créer nouvelle assignation
        assignment = TeacherAssistant.objects.create(
            assistant=assistant,
            teacher=teacher,
            course=course,
            can_edit_materials=serializer.validated_data.get('can_edit_materials', True),
            can_grade=serializer.validated_data.get('can_grade', False),
            can_take_attendance=serializer.validated_data.get('can_take_attendance', True),
            can_manage_assignments=serializer.validated_data.get('can_manage_assignments', True),
            notes=serializer.validated_data.get('notes', '')
        )

        # Ajouter l'assistant au cours si spécifié
        if course:
            course.assistants.add(assistant)

        return Response({
            'message': f"{assistant.get_full_name()} assigné à {teacher.get_full_name()}.",
            'assignment': TeacherAssistantSerializer(assignment).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='detach')
    def detach_assistant(self, request, pk=None):
        """
        Détacher un assistant d'un enseignant.
        """
        assignment = self.get_object()

        # Vérifier que l'utilisateur a le droit de détacher
        if request.user.role not in ['pdg', 'sga', 'sgad']:
            if request.user != assignment.teacher:
                return Response({
                    'error': 'Seul l\'enseignant ou un administrateur peut détacher un assistant.'
                }, status=status.HTTP_403_FORBIDDEN)

        # Désactiver l'assignation
        assignment.is_active = False
        assignment.save()

        # Retirer l'assistant du cours si applicable
        if assignment.course:
            assignment.course.assistants.remove(assignment.assistant)

        return Response({
            'message': f"{assignment.assistant.get_full_name()} détaché de {assignment.teacher.get_full_name()}.",
            'assignment': TeacherAssistantSerializer(assignment).data
        })

    @action(detail=True, methods=['patch'], url_path='update-permissions')
    def update_permissions(self, request, pk=None):
        """
        Mettre à jour les permissions d'un assistant.
        """
        assignment = self.get_object()

        # Vérifier que l'utilisateur a le droit de modifier
        if request.user.role not in ['pdg', 'sga', 'sgad']:
            if request.user != assignment.teacher:
                return Response({
                    'error': 'Seul l\'enseignant ou un administrateur peut modifier les permissions.'
                }, status=status.HTTP_403_FORBIDDEN)

        serializer = AssistantPermissionsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Mettre à jour les permissions
        for field, value in serializer.validated_data.items():
            setattr(assignment, field, value)

        assignment.save()

        return Response({
            'message': 'Permissions mises à jour.',
            'assignment': TeacherAssistantSerializer(assignment).data
        })

    @action(detail=False, methods=['get'], url_path='my-assignments')
    def my_assignments(self, request):
        """
        Récupérer les assignations de l'utilisateur connecté.
        """
        user = request.user

        if user.role == 'assistant':
            assignments = self.queryset.filter(assistant=user, is_active=True)
        elif user.role in ['enseignant', 'chef_section', 'chef_departement']:
            assignments = self.queryset.filter(teacher=user, is_active=True)
        else:
            return Response({
                'error': 'Endpoint réservé aux enseignants et assistants.'
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = TeacherAssistantSerializer(assignments, many=True)
        return Response({
            'count': assignments.count(),
            'assignments': serializer.data
        })
