"""
Serializers for grades, averages, bulletins, academic configuration
"""
from rest_framework import serializers
from .models import (
    AcademicConfig, GradeCategory, CourseGradeWeight, Grade, ExamSession, Transcript,
    GradeSheet, GradeCorrectionRequest,
)


class AcademicConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicConfig
        fields = [
            'id', 'hours_per_credit', 'max_grade', 'passing_grade', 'passing_percentage',
            'allow_compensation', 'compensation_threshold', 'min_credits_ratio_passage',
            'current_academic_year', 'current_semester',
            'include_retard_in_presence', 'credits_per_year', 'min_attendance_percent',
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
            'label', 'session_number', 'exam_session',
            'value', 'max_value', 'percentage', 'status',
            'date', 'comment', 'quiz_attempt',
        ]
        # Le statut suit la feuille de notes (workflow), il ne se saisit pas.
        read_only_fields = ['date', 'percentage', 'status']

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


class GradeSheetSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    auditoire_name = serializers.CharField(source='course.auditoire.nom', read_only=True)
    titulaire_name = serializers.CharField(source='course.titulaire.name', read_only=True, default=None)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    submitted_by_name = serializers.CharField(source='submitted_by.name', read_only=True, default=None)
    approved_by_name = serializers.CharField(source='approved_by.name', read_only=True, default=None)
    grades_count = serializers.SerializerMethodField()

    class Meta:
        model = GradeSheet
        fields = ['id', 'course', 'course_name', 'course_code', 'auditoire_name', 'titulaire_name', 'session',
                  'status', 'status_display', 'submitted_by_name', 'submitted_at', 'approved_by_name',
                  'approved_at', 'locked_at', 'return_reason', 'grades_count', 'updated_at']
        read_only_fields = fields

    def get_grades_count(self, obj):
        return Grade.objects.filter(course=obj.course, exam_session=obj.session).count()


class GradeCorrectionRequestSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='grade.student.name', read_only=True)
    course_name = serializers.CharField(source='grade.course.name', read_only=True)
    label = serializers.CharField(source='grade.label', read_only=True)
    requested_by_name = serializers.CharField(source='requested_by.name', read_only=True, default=None)
    decided_by_name = serializers.CharField(source='decided_by.name', read_only=True, default=None)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = GradeCorrectionRequest
        fields = ['id', 'grade', 'student_name', 'course_name', 'label', 'old_value', 'new_value', 'reason',
                  'status', 'status_display', 'requested_by_name', 'requested_at', 'decided_by_name',
                  'decided_at', 'decision_note']
        read_only_fields = ['old_value', 'status', 'requested_at', 'decided_at', 'decision_note']
