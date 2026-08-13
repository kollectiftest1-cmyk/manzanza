"""
Views for TP/TD Assignment System
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q

from .models import (
    Assignment, AssignmentQuestion, AssignmentSubmission,
    AssignmentAnswer, AssignmentChoice
)
from apps.grades.models import Grade, GradeCategory
from .serializers import (
    AssignmentSerializer, AssignmentQuestionSerializer,
    AssignmentSubmissionSerializer, AssignmentAnswerSerializer,
    AssignmentCreateSerializer, AssignmentChoiceSerializer
)


class AssignmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing assignments (TP/TD)
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Assignment.objects.select_related('course', 'created_by').prefetch_related('questions')

        # Filter based on user role
        if user.role == 'etudiant':
            # Students see published assignments from their courses
            queryset = queryset.filter(
                course__auditoire=user.auditoire,
                status='published'
            )
        elif user.role in ['enseignant', 'assistant']:
            # Teachers see assignments from their courses
            queryset = queryset.filter(
                Q(course__titulaire=user) | Q(course__assistants=user)
            )
        elif user.role in ['chef_section', 'chef_departement']:
            # Section/Department chiefs see assignments from their area
            if user.role == 'chef_section' and user.section:
                queryset = queryset.filter(course__auditoire__filiere__section=user.section)
            elif user.role == 'chef_departement' and user.filiere:
                queryset = queryset.filter(course__auditoire__filiere=user.filiere)
        # SGA/Admin see all

        return queryset.distinct().order_by('-due_date')

    def get_serializer_class(self):
        if self.action == 'create':
            return AssignmentCreateSerializer
        return AssignmentSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['get'])
    def questions(self, request, pk=None):
        """Get all questions for an assignment"""
        assignment = self.get_object()
        questions = assignment.questions.all()
        serializer = AssignmentQuestionSerializer(questions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_question(self, request, pk=None):
        """Add a question to an assignment"""
        from django.db import models
        assignment = self.get_object()

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

        # Extract question data (AssignmentQuestion has different fields than QuizQuestion)
        question_data = {
            'assignment': assignment,
            'question_text': request.data.get('question_text'),
            'question_type': request.data.get('question_type', 'text'),
            'points': safe_float(request.data.get('points'), None),  # Can be null
            'correct_answer': request.data.get('correct_answer', ''),  # Note: singular, not plural
        }

        # Get the next order number
        max_order = assignment.questions.aggregate(models.Max('order'))['order__max'] or 0
        question_data['order'] = max_order + 1

        # Handle attachment upload (AssignmentQuestion uses 'attachment', not 'image')
        if 'image' in request.FILES:
            question_data['attachment'] = request.FILES['image']
        elif 'attachment' in request.FILES:
            question_data['attachment'] = request.FILES['attachment']

        # Create the question
        question = AssignmentQuestion.objects.create(**question_data)

        # Handle choices for choice-based questions
        choices_data = request.data.get('choices', [])
        if isinstance(choices_data, str):
            import json
            choices_data = json.loads(choices_data)

        for idx, choice_data in enumerate(choices_data):
            # AssignmentChoice doesn't have points_percentage field
            AssignmentChoice.objects.create(
                question=question,
                choice_text=choice_data.get('choice_text'),
                is_correct=str_to_bool(choice_data.get('is_correct'), False),
                order=idx + 1
            )

        serializer = AssignmentQuestionSerializer(question)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish an assignment"""
        assignment = self.get_object()
        assignment.status = 'published'
        assignment.save()
        return Response({'status': 'Assignment published'})

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """Close an assignment"""
        assignment = self.get_object()
        assignment.status = 'closed'
        assignment.save()
        return Response({'status': 'Assignment closed'})

    @action(detail=True, methods=['get'])
    def submissions(self, request, pk=None):
        """Get all submissions for an assignment"""
        assignment = self.get_object()
        submissions = assignment.submissions.all()
        serializer = AssignmentSubmissionSerializer(submissions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def my_submission(self, request, pk=None):
        """Get current user's submission for this assignment"""
        assignment = self.get_object()
        try:
            submission = AssignmentSubmission.objects.get(
                assignment=assignment,
                student=request.user
            )
            serializer = AssignmentSubmissionSerializer(submission)
            return Response(serializer.data)
        except AssignmentSubmission.DoesNotExist:
            return Response({'status': 'No submission found'}, status=status.HTTP_404_NOT_FOUND)


class AssignmentSubmissionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing assignment submissions
    """
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = AssignmentSubmission.objects.select_related(
            'assignment', 'student', 'graded_by'
        ).prefetch_related('answers')

        if user.role == 'etudiant':
            # Students see only their submissions
            queryset = queryset.filter(student=user)
        elif user.role in ['enseignant', 'assistant']:
            # Teachers see submissions from their courses
            queryset = queryset.filter(
                Q(assignment__course__titulaire=user) |
                Q(assignment__course__assistants=user)
            )

        return queryset.distinct()

    def create(self, request, *args, **kwargs):
        """Create submission with answers"""
        # Extract assignment ID
        assignment_id = request.data.get('assignment')

        if not assignment_id:
            return Response(
                {'error': 'assignment field is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            assignment = Assignment.objects.get(id=assignment_id)
        except Assignment.DoesNotExist:
            return Response(
                {'error': 'Assignment not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if student already submitted
        existing = AssignmentSubmission.objects.filter(
            assignment=assignment,
            student=request.user
        ).first()

        if existing:
            return Response(
                {'error': 'You have already submitted this assignment'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create submission
        submission = AssignmentSubmission.objects.create(
            assignment=assignment,
            student=request.user,
            submitted_at=timezone.now(),
            status='submitted'
        )

        # Process answers from FormData
        answers_created = 0
        errors = []

        # Parse answers from request.data or request.POST
        answers_data = {}
        for key, value in request.data.items():
            if key.startswith('answers['):
                # Extract index and field name
                # e.g., "answers[0][question_id]" -> index=0, field=question_id
                parts = key.split('[')
                if len(parts) >= 3:
                    index = parts[1].rstrip(']')
                    field = parts[2].rstrip(']')

                    if index not in answers_data:
                        answers_data[index] = {}

                    if field == 'selected_choices':
                        if 'selected_choices' not in answers_data[index]:
                            answers_data[index]['selected_choices'] = []
                        answers_data[index]['selected_choices'].append(value)
                    else:
                        answers_data[index][field] = value

        # Create answers
        for index, answer_data in answers_data.items():
            try:
                question_id = answer_data.get('question_id')
                if not question_id:
                    continue

                question = AssignmentQuestion.objects.get(
                    id=question_id,
                    assignment=assignment
                )

                # Get file if present
                answer_file = request.FILES.get(f'answers[{index}][answer_file]')

                answer = AssignmentAnswer.objects.create(
                    submission=submission,
                    question=question,
                    answer_text=answer_data.get('answer_text', ''),
                    answer_file=answer_file
                )

                # Handle selected choices
                selected_choices = answer_data.get('selected_choices', [])
                if selected_choices:
                    choices = AssignmentChoice.objects.filter(id__in=selected_choices)
                    answer.selected_choices.set(choices)

                answers_created += 1

            except AssignmentQuestion.DoesNotExist:
                errors.append(f"Question {question_id} not found")
            except Exception as e:
                errors.append(f"Error creating answer: {str(e)}")

        serializer = self.get_serializer(submission)
        return Response({
            'submission': serializer.data,
            'answers_created': answers_created,
            'errors': errors
        }, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        """Create submission with student info"""
        serializer.save(
            student=self.request.user,
            submitted_at=timezone.now(),
            status='submitted'
        )

    @action(detail=True, methods=['post'])
    def grade(self, request, pk=None):
        """Grade a submission and sync to Grade model (tp_td category)"""
        submission = self.get_object()
        score = request.data.get('score')
        feedback = request.data.get('feedback', '')

        if score is None:
            return Response(
                {'error': 'Score is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        submission.score = score
        submission.graded_by = request.user
        submission.graded_at = timezone.now()
        submission.status = 'graded'
        submission.feedback = feedback
        submission.save()

        # ── Propagate to grades app ────────────────────────────────────────
        course = submission.assignment.course if hasattr(submission.assignment, 'course') else None
        if course and submission.student:
            # Get or create the TP/TD grade category
            tp_td_cat, _ = GradeCategory.objects.get_or_create(
                name='TP / TD',
                defaults={
                    'description': 'Travaux pratiques et dirigés',
                    'weight': 30,
                    'category_type': 'tp_td',
                }
            )
            if not tp_td_cat.category_type:
                tp_td_cat.category_type = 'tp_td'
                tp_td_cat.save(update_fields=['category_type'])

            # Normalize score out of 20
            max_pts = submission.assignment.max_points or 20
            normalized = round((float(score) / float(max_pts)) * 20, 2)

            Grade.objects.update_or_create(
                student=submission.student,
                course=course,
                category=tp_td_cat,
                session_number=submission.assignment.id,  # use assignment id as session
                defaults={
                    'value': normalized,
                    'max_value': 20,
                    'label': submission.assignment.title or 'TP',
                }
            )
        # ─────────────────────────────────────────────────────────────────

        return Response({
            'status': 'Submission graded',
            'score': score
        })

    @action(detail=True, methods=['post'])
    def submit_answer(self, request, pk=None):
        """Submit answer to a specific question"""
        submission = self.get_object()
        question_id = request.data.get('question_id')
        answer_text = request.data.get('answer_text', '')
        answer_file = request.FILES.get('answer_file')
        selected_choice_ids = request.data.get('selected_choice_ids', [])

        try:
            question = AssignmentQuestion.objects.get(id=question_id)

            # Create or update answer
            answer, created = AssignmentAnswer.objects.update_or_create(
                submission=submission,
                question=question,
                defaults={
                    'answer_text': answer_text,
                    'answer_file': answer_file
                }
            )

            # Handle multiple choice selections
            if selected_choice_ids:
                choices = AssignmentChoice.objects.filter(id__in=selected_choice_ids)
                answer.selected_choices.set(choices)

            serializer = AssignmentAnswerSerializer(answer)
            return Response(serializer.data)

        except AssignmentQuestion.DoesNotExist:
            return Response(
                {'error': 'Question not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def auto_grade(self, request, pk=None):
        """Automatically grade submission based on predefined answers"""
        submission = self.get_object()

        if not submission.assignment.auto_grade:
            return Response(
                {'error': 'Auto-grading not enabled for this assignment'},
                status=status.HTTP_400_BAD_REQUEST
            )

        total_points = 0
        earned_points = 0

        for answer in submission.answers.all():
            question = answer.question
            total_points += question.points or 0

            # Auto-grade based on question type
            if question.question_type == 'single_choice':
                selected = answer.selected_choices.first()
                if selected and selected.is_correct:
                    answer.points_earned = question.points
                    earned_points += question.points
                else:
                    answer.points_earned = 0

            elif question.question_type == 'multiple_choice':
                correct_choices = set(question.choices.filter(is_correct=True).values_list('id', flat=True))
                selected = set(answer.selected_choices.values_list('id', flat=True))
                if correct_choices == selected:
                    answer.points_earned = question.points
                    earned_points += question.points
                else:
                    answer.points_earned = 0

            answer.save()

        # Calculate final score
        if total_points > 0:
            submission.score = (earned_points / total_points) * submission.assignment.max_points
            submission.graded_by = request.user
            submission.graded_at = timezone.now()
            submission.status = 'graded'
            submission.save()

        return Response({
            'status': 'Auto-grading completed',
            'score': submission.score,
            'total_points': total_points,
            'earned_points': earned_points
        })
