"""
Quiz serializers
"""
from rest_framework import serializers
from .models import Quiz, Question, QuestionOption, QuizAttempt, Answer


class QuestionOptionSerializer(serializers.ModelSerializer):
    """QuestionOption Serializer"""

    class Meta:
        model = QuestionOption
        fields = ['id', 'question', 'option_text', 'is_correct', 'order']
        read_only_fields = ['id']


class QuestionSerializer(serializers.ModelSerializer):
    """Question Serializer"""

    options = QuestionOptionSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = [
            'id', 'quiz', 'question_text', 'question_type',
            'points', 'order', 'correct_answer', 'options', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class QuizSerializer(serializers.ModelSerializer):
    """Quiz Serializer"""

    course_name = serializers.CharField(source='course.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    total_questions = serializers.IntegerField(read_only=True)

    class Meta:
        model = Quiz
        fields = [
            'id', 'title', 'description', 'course', 'course_name',
            'duration', 'max_attempts', 'passing_score',
            'shuffle_questions', 'show_correct_answers',
            'available_from', 'available_until', 'is_active',
            'total_questions', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'total_questions']


class QuizDetailSerializer(QuizSerializer):
    """Detailed Quiz Serializer with questions"""

    questions = QuestionSerializer(many=True, read_only=True)

    class Meta(QuizSerializer.Meta):
        fields = QuizSerializer.Meta.fields + ['questions']


class AnswerSerializer(serializers.ModelSerializer):
    """Answer Serializer"""

    question_text = serializers.CharField(source='question.question_text', read_only=True)

    class Meta:
        model = Answer
        fields = [
            'id', 'attempt', 'question', 'question_text',
            'selected_option', 'answer_text', 'is_correct', 'answered_at'
        ]
        read_only_fields = ['id', 'answered_at', 'is_correct']


class QuizAttemptSerializer(serializers.ModelSerializer):
    """QuizAttempt Serializer"""

    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    answers = AnswerSerializer(many=True, read_only=True)

    class Meta:
        model = QuizAttempt
        fields = [
            'id', 'quiz', 'quiz_title', 'student', 'student_name',
            'score', 'started_at', 'completed_at', 'is_completed',
            'answers'
        ]
        read_only_fields = ['id', 'started_at', 'score']


class QuizSubmissionSerializer(serializers.Serializer):
    """Serializer for quiz submission"""

    answers = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        )
    )
