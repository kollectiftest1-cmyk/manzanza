"""
Views for Quiz System
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import models
from django.db.models import Q
from datetime import timedelta

from .models import (
    Quiz, QuizQuestion, QuizAttempt,
    QuizAnswer, QuizChoice
)
from .serializers import (
    QuizSerializer, QuizQuestionSerializer,
    QuizAttemptSerializer, QuizAnswerSerializer,
    QuizCreateSerializer, QuizSubmitAnswerSerializer
)
from apps.grades.models import GradeCategory, Grade


class QuizViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing quizzes
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Quiz.objects.select_related('course', 'created_by').prefetch_related('questions')

        # Filter based on user role
        if user.role == 'etudiant':
            # Students see published quizzes from their courses
            queryset = queryset.filter(
                course__auditoire=user.auditoire,
                status='published'
            )
        elif user.role in ['enseignant', 'assistant']:
            # Teachers see quizzes from their courses
            queryset = queryset.filter(
                Q(course__titulaire=user) | Q(course__assistants=user)
            )
        elif user.role in ['chef_section', 'chef_departement']:
            # Section/Department chiefs see quizzes from their area
            if user.role == 'chef_section' and user.section:
                queryset = queryset.filter(course__auditoire__filiere__section=user.section)
            elif user.role == 'chef_departement' and user.filiere:
                queryset = queryset.filter(course__auditoire__filiere=user.filiere)
        # SGA/Admin see all

        return queryset.distinct().order_by('-start_date')

    def get_serializer_class(self):
        if self.action == 'create':
            return QuizCreateSerializer
        return QuizSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['get'])
    def questions(self, request, pk=None):
        """Get all questions for a quiz"""
        quiz = self.get_object()
        questions = quiz.questions.all()

        # For students, hide correct answers unless quiz is completed
        if request.user.role == 'etudiant':
            serializer = QuizQuestionSerializer(questions, many=True, context={'hide_answers': True})
        else:
            serializer = QuizQuestionSerializer(questions, many=True)

        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish a quiz"""
        quiz = self.get_object()
        quiz.status = 'published'
        quiz.save()
        return Response({'status': 'Quiz published'})

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """Close a quiz"""
        quiz = self.get_object()
        quiz.status = 'closed'
        quiz.save()
        return Response({'status': 'Quiz closed'})

    @action(detail=True, methods=['get'])
    def attempts(self, request, pk=None):
        """Get all attempts for a quiz"""
        quiz = self.get_object()
        attempts = quiz.attempts.select_related(
            'student', 'graded_by'
        ).prefetch_related(
            'answers__question__choices',
            'answers__selected_choices'
        ).all()
        serializer = QuizAttemptSerializer(attempts, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def my_attempts(self, request, pk=None):
        """Get current user's attempts for this quiz"""
        quiz = self.get_object()
        attempts = QuizAttempt.objects.filter(
            quiz=quiz,
            student=request.user
        )
        serializer = QuizAttemptSerializer(attempts, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def submit_attempt(self, request, pk=None):
        """Submit the student's active attempt for this quiz.
        Convenience endpoint that finds the in-progress attempt and submits it.
        """
        quiz = self.get_object()
        user = request.user

        # Find the user's in-progress attempt
        attempt = QuizAttempt.objects.filter(
            quiz=quiz,
            student=user,
            status='in_progress'
        ).first()

        if not attempt:
            return Response(
                {'error': 'Aucune tentative en cours trouvée.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Process and save answers
        answers_data = request.data.get('answers', [])

        for answer_data in answers_data:
            question_id = answer_data.get('question_id')
            if not question_id:
                continue

            try:
                question = QuizQuestion.objects.get(id=question_id, quiz=quiz)

                answer, created = QuizAnswer.objects.update_or_create(
                    attempt=attempt,
                    question=question,
                    defaults={
                        'answer_text': answer_data.get('answer_text', ''),
                    }
                )

                selected_choice_ids = answer_data.get('selected_choices', [])
                if selected_choice_ids:
                    choices = QuizChoice.objects.filter(id__in=selected_choice_ids)
                    answer.selected_choices.set(choices)

                    is_correct = answer.is_correct()
                    if is_correct is not None:
                        answer.is_correct_auto = is_correct
                        answer.points_earned = question.points if is_correct else 0
                        answer.save()

            except QuizQuestion.DoesNotExist:
                continue

        # Mark as submitted
        attempt.submitted_at = timezone.now()
        attempt.status = 'submitted'
        attempt.time_spent_seconds = int((attempt.submitted_at - attempt.started_at).total_seconds())
        attempt.calculate_auto_grade()
        attempt.save()

        serializer = QuizAttemptSerializer(attempt, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_question(self, request, pk=None):
        """Add a question to a quiz"""
        quiz = self.get_object()

        # Helper function to convert string booleans to actual booleans
        def str_to_bool(value, default=False):
            if isinstance(value, bool):
                return value
            if isinstance(value, str):
                return value.lower() in ('true', '1', 'yes')
            return default

        # Helper function to safely convert to float
        def safe_float(value, default=1.0):
            if value is None or value == '' or value == 'null':
                return default
            try:
                return float(value)
            except (ValueError, TypeError):
                return default

        # Extract question data
        question_data = {
            'quiz': quiz,
            'question_text': request.data.get('question_text'),
            'question_type': request.data.get('question_type'),
            'points': safe_float(request.data.get('points'), 1.0),
            'is_required': str_to_bool(request.data.get('is_required'), True),
            'explanation': request.data.get('explanation', ''),
            'correct_answers': request.data.get('correct_answers', []),
            'case_sensitive': str_to_bool(request.data.get('case_sensitive'), False),
        }

        # Get the next order number
        max_order = quiz.questions.aggregate(models.Max('order'))['order__max'] or 0
        question_data['order'] = max_order + 1

        # Handle image upload
        if 'image' in request.FILES:
            question_data['image'] = request.FILES['image']

        # Create the question
        question = QuizQuestion.objects.create(**question_data)

        # Handle choices for choice-based questions
        choices_data = request.data.get('choices', [])
        if isinstance(choices_data, str):
            import json
            choices_data = json.loads(choices_data)

        for idx, choice_data in enumerate(choices_data):
            QuizChoice.objects.create(
                question=question,
                choice_text=choice_data.get('choice_text'),
                is_correct=str_to_bool(choice_data.get('is_correct'), False),
                order=idx + 1,
                points_percentage=safe_float(choice_data.get('points_percentage'), 100.0)
            )

        serializer = QuizQuestionSerializer(question)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def start_attempt(self, request, pk=None):
        """Start a new quiz attempt"""
        quiz = self.get_object()
        user = request.user

        # Check if quiz is active
        if not quiz.is_active():
            return Response(
                {'error': 'Quiz is not currently active'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Use select_for_update to prevent race conditions
        from django.db import transaction, IntegrityError, OperationalError
        import time

        max_retries = 3
        retry_count = 0

        while retry_count < max_retries:
            try:
                with transaction.atomic():
                    # Check for existing in-progress attempt with lock
                    existing_in_progress = QuizAttempt.objects.select_for_update().filter(
                        quiz=quiz,
                        student=user,
                        status='in_progress'
                    ).first()

                    if existing_in_progress:
                        # Return existing in-progress attempt
                        serializer = QuizAttemptSerializer(existing_in_progress)
                        return Response(serializer.data, status=status.HTTP_200_OK)

                    # Check number of attempts
                    existing_count = QuizAttempt.objects.filter(quiz=quiz, student=user).count()
                    if not quiz.allow_multiple_attempts and existing_count >= quiz.max_attempts:
                        return Response(
                            {'error': f'Maximum attempts ({quiz.max_attempts}) reached'},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    # Get the highest existing attempt number and add 1
                    max_attempt = QuizAttempt.objects.filter(
                        quiz=quiz,
                        student=user
                    ).aggregate(models.Max('attempt_number'))['attempt_number__max']

                    attempt_number = (max_attempt or 0) + 1

                    attempt = QuizAttempt.objects.create(
                        quiz=quiz,
                        student=user,
                        attempt_number=attempt_number,
                        status='in_progress'
                    )

                    serializer = QuizAttemptSerializer(attempt)
                    return Response(serializer.data, status=status.HTTP_201_CREATED)

            except OperationalError as e:
                # Database locked - retry after short delay
                retry_count += 1
                if retry_count >= max_retries:
                    # Max retries reached, check for existing attempt one more time
                    existing = QuizAttempt.objects.filter(
                        quiz=quiz,
                        student=user,
                        status='in_progress'
                    ).first()

                    if existing:
                        serializer = QuizAttemptSerializer(existing)
                        return Response(serializer.data, status=status.HTTP_200_OK)

                    return Response(
                        {'error': 'Server is busy. Please try again in a moment.'},
                        status=status.HTTP_503_SERVICE_UNAVAILABLE
                    )
                time.sleep(0.1 * retry_count)  # Exponential backoff

            except IntegrityError:
                # Constraint violation - attempt already exists
                existing = QuizAttempt.objects.filter(
                    quiz=quiz,
                    student=user
                ).order_by('-attempt_number').first()

                if existing and existing.status == 'in_progress':
                    serializer = QuizAttemptSerializer(existing)
                    return Response(serializer.data, status=status.HTTP_200_OK)

                return Response(
                    {'error': 'Unable to create attempt. Please try again.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )


class QuizAttemptViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing quiz attempts
    """
    serializer_class = QuizAttemptSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = QuizAttempt.objects.select_related(
            'quiz', 'student', 'graded_by'
        ).prefetch_related('answers')

        if user.role == 'etudiant':
            # Students see only their attempts
            queryset = queryset.filter(student=user)
        elif user.role in ['enseignant', 'assistant']:
            # Teachers see attempts from their courses
            queryset = queryset.filter(
                Q(quiz__course__titulaire=user) |
                Q(quiz__course__assistants=user)
            )

        return queryset.distinct()

    @action(detail=True, methods=['post'], url_path='save_answers')
    def save_answers(self, request, pk=None):
        """Save multiple answers at once"""
        attempt = self.get_object()

        # Check if attempt is still in progress
        if attempt.status != 'in_progress':
            return Response(
                {'error': 'Attempt is already submitted'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if expired
        if attempt.is_expired():
            attempt.status = 'expired'
            attempt.save()
            return Response(
                {'error': 'Attempt has expired'},
                status=status.HTTP_400_BAD_REQUEST
            )

        answers_data = request.data.get('answers', [])
        saved_count = 0
        errors = []

        for answer_item in answers_data:
            try:
                question_id = answer_item.get('question_id')
                answer_text = answer_item.get('answer_text', '')
                selected_choice_ids = answer_item.get('selected_choice_ids', [])

                question = QuizQuestion.objects.get(id=question_id, quiz=attempt.quiz)

                # Create or update answer
                answer, created = QuizAnswer.objects.update_or_create(
                    attempt=attempt,
                    question=question,
                    defaults={'answer_text': answer_text}
                )

                # Handle choice selections
                if selected_choice_ids:
                    choices = QuizChoice.objects.filter(id__in=selected_choice_ids)
                    answer.selected_choices.set(choices)

                saved_count += 1

            except QuizQuestion.DoesNotExist:
                errors.append(f"Question {question_id} not found")
            except Exception as e:
                errors.append(f"Error saving answer for question {question_id}: {str(e)}")

        return Response({
            'message': f'{saved_count} answer(s) saved',
            'saved_count': saved_count,
            'errors': errors
        })

    @action(detail=True, methods=['post'])
    def submit_answer(self, request, pk=None):
        """Submit answer to a specific question"""
        attempt = self.get_object()

        # Check if attempt is still in progress
        if attempt.status != 'in_progress':
            return Response(
                {'error': 'Attempt is already submitted'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if expired
        if attempt.is_expired():
            attempt.status = 'expired'
            attempt.save()
            return Response(
                {'error': 'Attempt has expired'},
                status=status.HTTP_400_BAD_REQUEST
            )

        question_id = request.data.get('question_id')
        answer_text = request.data.get('answer_text', '')
        answer_file = request.FILES.get('answer_file')
        selected_choice_ids = request.data.get('selected_choice_ids', [])

        try:
            question = QuizQuestion.objects.get(id=question_id, quiz=attempt.quiz)

            # Create or update answer
            answer, created = QuizAnswer.objects.update_or_create(
                attempt=attempt,
                question=question,
                defaults={
                    'answer_text': answer_text,
                    'answer_file': answer_file
                }
            )

            # Handle choice selections
            if selected_choice_ids:
                choices = QuizChoice.objects.filter(id__in=selected_choice_ids)
                answer.selected_choices.set(choices)

                # Auto-grade if possible
                is_correct = answer.is_correct()
                if is_correct is not None:
                    answer.is_correct_auto = is_correct
                    if is_correct:
                        answer.points_earned = question.points
                    else:
                        answer.points_earned = 0
                    answer.save()

            serializer = QuizAnswerSerializer(answer)
            return Response(serializer.data)

        except QuizQuestion.DoesNotExist:
            return Response(
                {'error': 'Question not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Submit the entire quiz attempt"""
        attempt = self.get_object()

        if attempt.status != 'in_progress':
            return Response(
                {'error': 'Attempt is already submitted'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Process and save answers before submitting
        answers_data = request.data.get('answers', [])

        for answer_data in answers_data:
            question_id = answer_data.get('question_id')
            if not question_id:
                continue

            try:
                question = QuizQuestion.objects.get(id=question_id, quiz=attempt.quiz)

                # Create or update answer
                answer, created = QuizAnswer.objects.update_or_create(
                    attempt=attempt,
                    question=question,
                    defaults={
                        'answer_text': answer_data.get('answer_text', ''),
                    }
                )

                # Handle file upload if present
                if 'answer_file' in request.FILES:
                    answer.answer_file = request.FILES.get('answer_file')
                    answer.save()

                # Handle choice selections
                selected_choice_ids = answer_data.get('selected_choices', [])
                if selected_choice_ids:
                    choices = QuizChoice.objects.filter(id__in=selected_choice_ids)
                    answer.selected_choices.set(choices)

                    # Auto-grade if possible
                    is_correct = answer.is_correct()
                    if is_correct is not None:
                        answer.is_correct_auto = is_correct
                        if is_correct:
                            answer.points_earned = question.points
                        else:
                            answer.points_earned = 0
                        answer.save()

            except QuizQuestion.DoesNotExist:
                continue

        # Mark as submitted
        attempt.submitted_at = timezone.now()
        attempt.status = 'submitted'

        # Calculate time spent
        time_spent = (attempt.submitted_at - attempt.started_at).total_seconds()
        attempt.time_spent_seconds = int(time_spent)

        # Auto-grade
        attempt.calculate_auto_grade()
        attempt.save()

        serializer = QuizAttemptSerializer(attempt, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def grade(self, request, pk=None):
        """Manually grade a quiz attempt"""
        attempt = self.get_object()

        if attempt.status not in ['submitted', 'graded']:
            return Response(
                {'error': 'Attempt must be submitted before grading'},
                status=status.HTTP_400_BAD_REQUEST
            )

        score = request.data.get('score')
        feedback = request.data.get('feedback', '')
        answers = request.data.get('answers', [])

        # Grade individual answers if provided
        if answers:
            for answer_data in answers:
                question_id = answer_data.get('question_id')
                points_earned = answer_data.get('points_earned', 0)
                comment = answer_data.get('comment', '')

                try:
                    # Find the answer for this question
                    answer = QuizAnswer.objects.get(
                        attempt=attempt,
                        question_id=question_id
                    )
                    answer.points_earned = points_earned
                    answer.comment = comment
                    answer.save()
                except QuizAnswer.DoesNotExist:
                    pass  # Skip if answer not found

        # Update attempt with final score and feedback
        if score is not None:
            attempt.score = score
        attempt.graded_by = request.user
        attempt.graded_at = timezone.now()
        attempt.status = 'graded'
        attempt.feedback = feedback
        attempt.save()

        # ── Propagate to grades app ────────────────────────────────────────
        quiz = attempt.quiz
        course = quiz.course if hasattr(quiz, 'course') else None
        if course and attempt.student:
            quiz_cat, _ = GradeCategory.objects.get_or_create(
                name='Quiz / Interro',
                defaults={
                    'description': 'Quiz et interrogations',
                    'weight': 20,
                    'category_type': 'quiz',
                }
            )
            if not quiz_cat.category_type:
                quiz_cat.category_type = 'quiz'
                quiz_cat.save(update_fields=['category_type'])

            max_pts = quiz.max_points or 20
            final_score = attempt.score if attempt.score is not None else 0
            normalized = round((float(final_score) / float(max_pts)) * 20, 2)

            Grade.objects.update_or_create(
                student=attempt.student,
                course=course,
                category=quiz_cat,
                session_number=quiz.id,
                defaults={
                    'value': normalized,
                    'max_value': 20,
                    'label': quiz.title or 'Quiz',
                }
            )
        # ─────────────────────────────────────────────────────────────────

        serializer = QuizAttemptSerializer(attempt)
        return Response({
            'status': 'Attempt graded successfully',
            'attempt': serializer.data
        })


    @action(detail=True, methods=['post'])
    def grade_answer(self, request, pk=None):
        """Grade a specific answer in an attempt"""
        attempt = self.get_object()
        answer_id = request.data.get('answer_id')
        points_earned = request.data.get('points_earned')
        comment = request.data.get('comment', '')

        try:
            answer = QuizAnswer.objects.get(id=answer_id, attempt=attempt)
            answer.points_earned = points_earned
            answer.comment = comment
            answer.save()

            return Response({
                'status': 'Answer graded',
                'points_earned': points_earned
            })

        except QuizAnswer.DoesNotExist:
            return Response(
                {'error': 'Answer not found'},
                status=status.HTTP_404_NOT_FOUND
            )
