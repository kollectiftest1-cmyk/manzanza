"""
Serializers for grades, averages, bulletins, academic configuration
"""
from rest_framework import serializers
from .models import AcademicConfig, GradeCategory, CourseGradeWeight, Grade, ExamSession, Transcript


class AcademicConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicConfig
        fields = [
            'id', 'hours_per_credit', 'max_grade', 'passing_grade', 'passing_percentage',
            'allow_compensation', 'compensation_threshold',
            'current_academic_year', 'current_semester',
            'include_retard_in_presence',
            'updated_at', 'updated_by',
        ]
        read_only_fields = ['id', 'updated_at', 'updated_by']


class GradeCategorySerializer(serializers.ModelSerializer):
    category_type_display = serializers.CharField(source='get_category_type_display', read_only=True)

    class Meta:
        model = GradeCategory
        fields = ['id', 'name', 'category_type', 'category_type_display', 'weight', 'description']


class CourseGradeWeightSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_type = serializers.CharField(source='category.category_type', read_only=True)
    course_name   = serializers.CharField(source='course.name', read_only=True)

    class Meta:
        model  = CourseGradeWeight
        fields = ['id', 'course', 'course_name', 'category', 'category_name', 'category_type', 'weight']


class GradeSerializer(serializers.ModelSerializer):
    # Read-only enrichment
    student_name  = serializers.SerializerMethodField(read_only=True)
    course_name   = serializers.CharField(source='course.name',    read_only=True)
    category_name = serializers.CharField(source='category.name',  read_only=True)
    category_type = serializers.CharField(source='category.category_type', read_only=True)
    percentage    = serializers.FloatField(read_only=True)

    class Meta:
        model  = Grade
        fields = [
            'id', 'student', 'student_name',
            'course', 'course_name',
            'category', 'category_name', 'category_type',
            'label', 'session_number',
            'value', 'max_value', 'percentage', 'status',
            'date', 'comment', 'quiz_attempt',
        ]
        read_only_fields = ['date', 'percentage']

    def get_student_name(self, obj):
        s = obj.student
        return f"{s.first_name} {s.last_name}".strip() or s.username


class ExamSessionSerializer(serializers.ModelSerializer):
    course_name     = serializers.CharField(source='course.name',    read_only=True)
    auditoire_name  = serializers.CharField(source='auditoire.nom',  read_only=True)

    class Meta:
        model  = ExamSession
        fields = [
            'id', 'course', 'course_name',
            'auditoire', 'auditoire_name',
            'session_type', 'date', 'description',
        ]


class TranscriptSerializer(serializers.ModelSerializer):
    student_name   = serializers.SerializerMethodField(read_only=True)
    auditoire_name = serializers.CharField(source='auditoire.nom', read_only=True)

    class Meta:
        model  = Transcript
        fields = [
            'id', 'student', 'student_name',
            'auditoire', 'auditoire_name',
            'semester', 'year', 'average',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_student_name(self, obj):
        s = obj.student
        return f"{s.first_name} {s.last_name}".strip() or s.username
