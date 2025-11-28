"""
Assignment serializers
"""
from rest_framework import serializers
from .models import Assignment, Submission, SubmissionComment


class SubmissionCommentSerializer(serializers.ModelSerializer):
    """SubmissionComment Serializer"""

    author_name = serializers.CharField(source='author.get_full_name', read_only=True)

    class Meta:
        model = SubmissionComment
        fields = ['id', 'submission', 'author', 'author_name', 'comment', 'created_at']
        read_only_fields = ['id', 'created_at', 'author']


class SubmissionSerializer(serializers.ModelSerializer):
    """Submission Serializer"""

    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    assignment_title = serializers.CharField(source='assignment.title', read_only=True)
    graded_by_name = serializers.CharField(source='graded_by.get_full_name', read_only=True)
    comments = SubmissionCommentSerializer(many=True, read_only=True)

    class Meta:
        model = Submission
        fields = [
            'id', 'assignment', 'assignment_title', 'student', 'student_name',
            'content', 'attachment', 'score', 'feedback',
            'graded_by', 'graded_by_name', 'graded_at',
            'status', 'is_late', 'submitted_at',
            'comments', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'student', 'is_late', 'graded_at']


class AssignmentSerializer(serializers.ModelSerializer):
    """Assignment Serializer"""

    course_name = serializers.CharField(source='course.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    submissions_count = serializers.IntegerField(read_only=True)
    my_submission = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = [
            'id', 'title', 'description', 'instructions',
            'course', 'course_name', 'assignment_type',
            'start_date', 'due_date', 'max_score',
            'allow_late_submission', 'late_penalty',
            'attachment', 'status', 'is_active',
            'submissions_count', 'my_submission',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'submissions_count', 'created_by']

    def get_my_submission(self, obj):
        """Get current user's submission if exists"""
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.role == 'etudiant':
            submission = obj.submissions.filter(student=request.user).first()
            if submission:
                return {
                    'id': submission.id,
                    'status': submission.status,
                    'score': submission.score,
                    'submitted_at': submission.submitted_at
                }
        return None
