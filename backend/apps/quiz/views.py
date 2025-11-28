"""
Quiz views
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from .models import Quiz, Question, QuestionOption, QuizAttempt, Answer
from .serializers import (
    QuizSerializer, QuizDetailSerializer, QuestionSerializer,
    QuestionOptionSerializer, QuizAttemptSerializer, AnswerSerializer,
    QuizSubmissionSerializer
)
from apps.users.permissions import IsTeacherOrAdmin


class QuizViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Quiz model
    """
    queryset = Quiz.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['course', 'is_active']
    search_fields = ['title', 'description']
    ordering_fields = ['title', 'available_from', 'created_at']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return QuizDetailSerializer
        return QuizSerializer

    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsTeacherOrAdmin()]
        return super().get_permissions()

    def perform_create(self, serializer):
        """Set created_by to current user"""
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def start_attempt(self, request, pk=None):
        """Start a new quiz attempt"""
        quiz = self.get_object()
        student = request.user

        if student.role != 'etudiant':
            return Response(
                {'error': 'Seuls les étudiants peuvent passer des quiz.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if quiz is available
        now = timezone.now()
        if now < quiz.available_from or now > quiz.available_until:
            return Response(
                {'error': 'Ce quiz n\'est pas disponible actuellement.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check attempts limit
        attempts_count = QuizAttempt.objects.filter(quiz=quiz, student=student).count()
        if attempts_count >= quiz.max_attempts:
            return Response(
                {'error': f'Vous avez atteint le nombre maximum de tentatives ({quiz.max_attempts}).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create new attempt
        attempt = QuizAttempt.objects.create(quiz=quiz, student=student)
        serializer = QuizAttemptSerializer(attempt)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def submit_attempt(self, request, pk=None):
        """Submit quiz answers"""
        quiz = self.get_object()
        student = request.user

        serializer = QuizSubmissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Get the latest uncompleted attempt
        try:
            attempt = QuizAttempt.objects.get(
                quiz=quiz,
                student=student,
                is_completed=False
            )
        except QuizAttempt.DoesNotExist:
            return Response(
                {'error': 'Aucune tentative en cours trouvée.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Process answers
        answers_data = serializer.validated_data['answers']
        total_points = 0
        earned_points = 0

        for answer_data in answers_data:
            question_id = answer_data.get('question_id')
            selected_option_id = answer_data.get('selected_option_id')
            answer_text = answer_data.get('answer_text')

            try:
                question = Question.objects.get(id=question_id, quiz=quiz)
                total_points += question.points

                is_correct = False
                selected_option = None

                if question.question_type in ['multiple_choice', 'true_false']:
                    if selected_option_id:
                        selected_option = QuestionOption.objects.get(id=selected_option_id)
                        is_correct = selected_option.is_correct
                elif question.question_type == 'short_answer':
                    # Simple text comparison (case-insensitive)
                    if answer_text and question.correct_answer:
                        is_correct = answer_text.strip().lower() == question.correct_answer.strip().lower()

                if is_correct:
                    earned_points += question.points

                # Save answer
                Answer.objects.create(
                    attempt=attempt,
                    question=question,
                    selected_option=selected_option,
                    answer_text=answer_text,
                    is_correct=is_correct
                )

            except (Question.DoesNotExist, QuestionOption.DoesNotExist):
                continue

        # Calculate score
        score = (earned_points / total_points * 100) if total_points > 0 else 0

        # Update attempt
        attempt.score = round(score, 2)
        attempt.is_completed = True
        attempt.completed_at = timezone.now()
        attempt.save()

        return Response({
            'score': attempt.score,
            'passed': attempt.score >= quiz.passing_score,
            'attempt': QuizAttemptSerializer(attempt).data
        })

    @action(detail=False, methods=['get'])
    def my_quizzes(self, request):
        """Get quizzes for current user"""
        user = request.user

        if user.role in ['enseignant', 'assistant']:
            # Teachers see quizzes for their courses
            from apps.courses.models import Course
            courses = Course.objects.filter(teacher=user) | Course.objects.filter(assistants=user)
            quizzes = self.queryset.filter(course__in=courses)
        elif user.role == 'etudiant':
            # Students see quizzes for enrolled courses
            from apps.courses.models import CourseEnrollment
            enrolled_courses = CourseEnrollment.objects.filter(
                student=user, is_active=True
            ).values_list('course_id', flat=True)
            quizzes = self.queryset.filter(course_id__in=enrolled_courses, is_active=True)
        else:
            quizzes = self.queryset.filter(is_active=True)

        serializer = self.get_serializer(quizzes, many=True)
        return Response(serializer.data)


class QuestionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Question model
    """
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [IsTeacherOrAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['quiz', 'question_type']


class QuestionOptionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for QuestionOption model
    """
    queryset = QuestionOption.objects.all()
    serializer_class = QuestionOptionSerializer
    permission_classes = [IsTeacherOrAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['question']


class QuizAttemptViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for QuizAttempt model (read-only)
    """
    queryset = QuizAttempt.objects.all()
    serializer_class = QuizAttemptSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['quiz', 'student', 'is_completed']
    ordering_fields = ['started_at', 'score']

    def get_queryset(self):
        """Filter attempts based on user role"""
        user = self.request.user

        if user.role in ['iadmin', 'sga', 'enseignant', 'assistant']:
            return self.queryset
        elif user.role == 'etudiant':
            return self.queryset.filter(student=user)

        return self.queryset.none()
