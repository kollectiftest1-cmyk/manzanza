"""
Serializers for Quiz System
"""
from rest_framework import serializers
from .models import (
    Quiz, QuizQuestion, QuizChoice,
    QuizAttempt, QuizAnswer
)
from apps.users.models import User
from apps.courses.models import Course


class QuizChoiceSerializer(serializers.ModelSerializer):
    """Serializer for quiz choices"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Hide is_correct from students during quiz taking
        context = kwargs.get('context', {})
        if context.get('hide_answers', False):
            self.fields.pop('is_correct', None)

    class Meta:
        model = QuizChoice
        fields = ['id', 'choice_text', 'image', 'is_correct', 'order', 'points_percentage']
        read_only_fields = ['id']


class QuizQuestionSerializer(serializers.ModelSerializer):
    """Serializer for quiz questions"""
    choices = serializers.SerializerMethodField()

    class Meta:
        model = QuizQuestion
        fields = [
            'id', 'order', 'question_type', 'question_text',
            'image', 'explanation', 'points', 'is_required',
            'correct_answers', 'case_sensitive', 'choices'
        ]
        read_only_fields = ['id']

    def get_choices(self, obj):
        """Get choices with proper context"""
        context = self.context
        choices = obj.choices.all().order_by('order')
        return QuizChoiceSerializer(choices, many=True, context=context).data

    def to_representation(self, instance):
        """Customize representation based on context"""
        data = super().to_representation(instance)
        context = self.context

        # Hide sensitive fields from students during quiz
        if context.get('hide_answers', False):
            data.pop('correct_answers', None)
            data.pop('explanation', None)

        return data


class QuizSerializer(serializers.ModelSerializer):
    """Serializer for quizzes"""
    questions = serializers.SerializerMethodField()
    course_name = serializers.CharField(source='course.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    attempts_count = serializers.SerializerMethodField()
    completed_count = serializers.SerializerMethodField()
    is_active = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = [
            'id', 'title', 'description', 'course', 'course_name',
            'quiz_type',
            'start_date', 'end_date', 'duration_minutes', 'max_points',
            'shuffle_questions', 'shuffle_choices', 'show_correct_answers',
            'allow_multiple_attempts', 'max_attempts', 'status',
            'questions', 'created_by', 'created_by_name',
            'created_at', 'updated_at', 'attempts_count',
            'completed_count', 'is_active'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_questions(self, obj):
        """Get questions for the quiz"""
        questions = obj.questions.all()
        # Pass context to include choices and hide answers for students
        context = self.context.copy() if self.context else {}
        # For students taking quiz, hide correct answers
        request = context.get('request')
        if request and hasattr(request, 'user'):
            user = request.user
            if hasattr(user, 'role') and user.role == 'etudiant':
                context['hide_answers'] = True
        return QuizQuestionSerializer(questions, many=True, context=context).data

    def get_attempts_count(self, obj):
        """Count of all attempts"""
        return obj.attempts.count()

    def get_completed_count(self, obj):
        """Count of completed attempts"""
        return obj.attempts.filter(status='submitted').count()

    def get_is_active(self, obj):
        """Check if quiz is currently active"""
        return obj.is_active()


class QuizAnswerSerializer(serializers.ModelSerializer):
    """Serializer for quiz answers"""
    question = QuizQuestionSerializer(read_only=True)
    selected_choices = QuizChoiceSerializer(many=True, read_only=True)
    is_correct = serializers.SerializerMethodField()

    class Meta:
        model = QuizAnswer
        fields = [
            'id', 'question', 'answer_text', 'answer_file',
            'selected_choices', 'points_earned', 'is_correct_auto',
            'comment', 'answered_at', 'is_correct'
        ]
        read_only_fields = ['id', 'answered_at']

    def get_is_correct(self, obj):
        """Get if answer is correct"""
        return obj.is_correct()


class QuizAttemptSerializer(serializers.ModelSerializer):
    """Serializer for quiz attempts"""
    answers = QuizAnswerSerializer(many=True, read_only=True)
    student = serializers.SerializerMethodField()
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    max_points = serializers.DecimalField(source='quiz.max_points', max_digits=5, decimal_places=2, read_only=True)
    graded_by_name = serializers.CharField(source='graded_by.get_full_name', read_only=True, allow_null=True)
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = QuizAttempt
        fields = [
            'id', 'quiz', 'quiz_title', 'student', 'student_name',
            'attempt_number', 'started_at', 'submitted_at',
            'time_spent_seconds', 'status', 'score', 'auto_graded_score',
            'max_points', 'graded_by', 'graded_by_name', 'graded_at',
            'feedback', 'answers', 'is_expired'
        ]
        read_only_fields = ['id', 'started_at']

    def get_student(self, obj):
        """Get student details"""
        if obj.student:
            return {
                'id': obj.student.id,
                'first_name': obj.student.first_name,
                'last_name': obj.student.last_name,
                'email': obj.student.email,
            }
        return None

    def get_is_expired(self, obj):
        """Check if attempt has expired"""
        return obj.is_expired()


class QuizCreateSerializer(serializers.Serializer):
    """Serializer for creating quiz with questions"""
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(allow_blank=True, required=False)
    course = serializers.PrimaryKeyRelatedField(queryset=Course.objects.all())
    start_date = serializers.DateTimeField()
    end_date = serializers.DateTimeField()
    duration_minutes = serializers.IntegerField(min_value=1)
    max_points = serializers.DecimalField(max_digits=5, decimal_places=2)
    shuffle_questions = serializers.BooleanField(default=False)
    shuffle_choices = serializers.BooleanField(default=False)
    show_correct_answers = serializers.BooleanField(default=True)
    allow_multiple_attempts = serializers.BooleanField(default=False)
    max_attempts = serializers.IntegerField(default=1, min_value=1)
    questions = serializers.ListField(child=serializers.DictField(), required=False, write_only=True)

    def create(self, validated_data):
        questions_data = validated_data.pop('questions', [])
        quiz = Quiz.objects.create(**validated_data)

        # Create questions
        for idx, q_data in enumerate(questions_data):
            choices_data = q_data.pop('choices', [])
            question = QuizQuestion.objects.create(
                quiz=quiz,
                order=idx + 1,
                **q_data
            )

            # Create choices for choice-based questions
            for c_idx, c_data in enumerate(choices_data):
                QuizChoice.objects.create(
                    question=question,
                    order=c_idx + 1,
                    **c_data
                )

        return quiz
    
    def to_representation(self, instance):
        """Use QuizSerializer for the response"""
        return QuizSerializer(instance, context=self.context).data


class QuizSubmitAnswerSerializer(serializers.Serializer):
    """Serializer for submitting quiz answers"""
    question_id = serializers.IntegerField()
    answer_text = serializers.CharField(allow_blank=True, required=False)
    answer_file = serializers.FileField(required=False, allow_null=True)
    selected_choice_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True
    )
