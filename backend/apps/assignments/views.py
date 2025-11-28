"""
Assignment views
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from .models import Assignment, Submission, SubmissionComment
from .serializers import AssignmentSerializer, SubmissionSerializer, SubmissionCommentSerializer
from apps.users.permissions import IsTeacherOrAdmin


class AssignmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Assignment model
    """
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['course', 'assignment_type', 'status', 'is_active']
    search_fields = ['title', 'description']
    ordering_fields = ['due_date', 'created_at']

    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsTeacherOrAdmin()]
        return super().get_permissions()

    def perform_create(self, serializer):
        """Set created_by to current user"""
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Submit assignment"""
        assignment = self.get_object()
        student = request.user

        if student.role != 'etudiant':
            return Response(
                {'error': 'Seuls les étudiants peuvent soumettre des travaux.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if already submitted
        submission = Submission.objects.filter(assignment=assignment, student=student).first()

        # Check if late
        is_late = timezone.now() > assignment.due_date
        if is_late and not assignment.allow_late_submission:
            return Response(
                {'error': 'La date limite est dépassée et les soumissions tardives ne sont pas autorisées.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = request.data.copy()
        data['assignment'] = assignment.id
        data['student'] = student.id
        data['is_late'] = is_late
        data['status'] = 'soumis'
        data['submitted_at'] = timezone.now()

        if submission:
            # Update existing submission
            serializer = SubmissionSerializer(submission, data=data, partial=True)
        else:
            # Create new submission
            serializer = SubmissionSerializer(data=data)

        serializer.is_valid(raise_exception=True)
        serializer.save(student=student)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def submissions(self, request, pk=None):
        """Get all submissions for assignment"""
        assignment = self.get_object()

        # Only teachers and admins can see all submissions
        if request.user.role not in ['iadmin', 'sga', 'enseignant', 'assistant']:
            return Response(
                {'error': 'Vous n\'avez pas la permission de voir toutes les soumissions.'},
                status=status.HTTP_403_FORBIDDEN
            )

        submissions = assignment.submissions.all()
        serializer = SubmissionSerializer(submissions, many=True)
        return Response(serializer.data)


class SubmissionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Submission model
    """
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['assignment', 'student', 'status', 'is_late']
    search_fields = ['student__first_name', 'student__last_name']
    ordering_fields = ['submitted_at', 'score']

    def get_queryset(self):
        """Filter submissions based on user role"""
        user = self.request.user

        if user.role in ['iadmin', 'sga', 'enseignant', 'assistant']:
            return self.queryset
        elif user.role == 'etudiant':
            return self.queryset.filter(student=user)

        return self.queryset.none()

    @action(detail=True, methods=['post'])
    def grade(self, request, pk=None):
        """Grade a submission"""
        submission = self.get_object()

        # Only teachers and admins can grade
        if request.user.role not in ['iadmin', 'sga', 'enseignant', 'assistant']:
            return Response(
                {'error': 'Vous n\'avez pas la permission de noter.'},
                status=status.HTTP_403_FORBIDDEN
            )

        score = request.data.get('score')
        feedback = request.data.get('feedback', '')

        if score is None:
            return Response(
                {'error': 'Score requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Apply late penalty if applicable
        if submission.is_late and submission.assignment.late_penalty > 0:
            penalty = float(score) * (submission.assignment.late_penalty / 100)
            score = max(0, float(score) - penalty)

        submission.score = score
        submission.feedback = feedback
        submission.status = 'note'
        submission.graded_by = request.user
        submission.graded_at = timezone.now()
        submission.save()

        serializer = SubmissionSerializer(submission)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        """Add comment to submission"""
        submission = self.get_object()

        comment_text = request.data.get('comment')
        if not comment_text:
            return Response(
                {'error': 'Commentaire requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        comment = SubmissionComment.objects.create(
            submission=submission,
            author=request.user,
            comment=comment_text
        )

        serializer = SubmissionCommentSerializer(comment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SubmissionCommentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for SubmissionComment model
    """
    queryset = SubmissionComment.objects.all()
    serializer_class = SubmissionCommentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['submission']

    def perform_create(self, serializer):
        """Set author to current user"""
        serializer.save(author=self.request.user)
