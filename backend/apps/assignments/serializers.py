"""
Serializers for TP/TD Assignment System
"""
from rest_framework import serializers

from apps.core.validation import check
from .models import (
    Assignment, AssignmentQuestion, AssignmentChoice,
    AssignmentSubmission, AssignmentAnswer
)
from apps.users.models import User
from apps.courses.models import Course


class AssignmentChoiceSerializer(serializers.ModelSerializer):
    """Serializer for assignment choices"""
    class Meta:
        model = AssignmentChoice
        fields = ['id', 'choice_text', 'is_correct', 'order']
        read_only_fields = ['id']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if self.context.get('hide_answers'):
            data.pop('is_correct', None)
        return data


class AssignmentQuestionSerializer(serializers.ModelSerializer):
    """Serializer for assignment questions"""
    choices = serializers.SerializerMethodField()

    def get_choices(self, obj):
        return AssignmentChoiceSerializer(obj.choices.all(), many=True, context=self.context).data

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if self.context.get('hide_answers'):
            data.pop('correct_answer', None)
        return data

    class Meta:
        model = AssignmentQuestion
        fields = [
            'id', 'order', 'question_text', 'question_type',
            'points', 'correct_answer', 'attachment', 'choices'
        ]
        read_only_fields = ['id']


class AssignmentSerializer(serializers.ModelSerializer):
    """Serializer for assignments"""
    questions = serializers.SerializerMethodField()
    course_name = serializers.CharField(source='course.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    submission_count = serializers.SerializerMethodField()
    graded_count = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = [
            'id', 'title', 'description', 'assignment_type',
            'course', 'course_name', 'submission_type', 'due_date',
            'max_points', 'instructions', 'resources', 'status',
            'auto_grade', 'questions', 'created_by', 'created_by_name',
            'created_at', 'updated_at', 'submission_count', 'graded_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        check(self, attrs, not_past=['due_date'], labels={'due_date': "la date limite de remise"})
        return attrs

    def get_questions(self, obj):
        """Get questions for the assignment"""
        questions = obj.questions.all()
        return AssignmentQuestionSerializer(questions, many=True, context=self.context).data

    def get_submission_count(self, obj):
        """Count of student submissions"""
        return obj.submissions.filter(status='submitted').count()

    def get_graded_count(self, obj):
        """Count of graded submissions"""
        return obj.submissions.filter(status='graded').count()


class AssignmentAnswerSerializer(serializers.ModelSerializer):
    """Serializer for assignment answers"""
    question_text = serializers.CharField(source='question.question_text', read_only=True)
    question_type = serializers.CharField(source='question.question_type', read_only=True)
    max_points = serializers.DecimalField(
        source='question.points',
        max_digits=5,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = AssignmentAnswer
        fields = [
            'id', 'question', 'question_text', 'question_type',
            'answer_text', 'answer_file', 'selected_choices',
            'points_earned', 'comment', 'max_points'
        ]
        read_only_fields = ['id']


class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    """Serializer for assignment submissions"""
    answers = AssignmentAnswerSerializer(many=True, read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    assignment_title = serializers.CharField(source='assignment.title', read_only=True)
    max_points = serializers.DecimalField(source='assignment.max_points', max_digits=5, decimal_places=2, read_only=True)
    graded_by_name = serializers.CharField(source='graded_by.get_full_name', read_only=True, allow_null=True)

    class Meta:
        model = AssignmentSubmission
        fields = [
            'id', 'assignment', 'assignment_title', 'student', 'student_name',
            'submitted_at', 'status', 'score', 'max_points', 'graded_by',
            'graded_by_name', 'graded_at', 'feedback', 'answers',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AssignmentCreateSerializer(serializers.Serializer):
    """Serializer for creating assignment with questions"""
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(allow_blank=True, required=False)
    assignment_type = serializers.ChoiceField(choices=['TP', 'TD'])
    course = serializers.PrimaryKeyRelatedField(queryset=Course.objects.all())
    submission_type = serializers.ChoiceField(choices=['electronic', 'physical', 'both'])
    due_date = serializers.DateTimeField()
    max_points = serializers.DecimalField(max_digits=5, decimal_places=2)
    instructions = serializers.CharField(allow_blank=True, required=False)
    resources = serializers.FileField(required=False, allow_null=True)
    auto_grade = serializers.BooleanField(default=False)
    questions = serializers.ListField(child=serializers.DictField(), required=False, write_only=True)

    def create(self, validated_data):
        questions_data = validated_data.pop('questions', [])
        assignment = Assignment.objects.create(**validated_data)

        # Create questions
        for idx, q_data in enumerate(questions_data):
            choices_data = q_data.pop('choices', [])
            question = AssignmentQuestion.objects.create(
                assignment=assignment,
                order=idx + 1,
                **q_data
            )

            # Create choices for multiple choice questions
            for c_idx, c_data in enumerate(choices_data):
                AssignmentChoice.objects.create(
                    question=question,
                    order=c_idx + 1,
                    **c_data
                )

        return assignment
    
    def to_representation(self, instance):
        """Use AssignmentSerializer for the response"""
        return AssignmentSerializer(instance, context=self.context).data
