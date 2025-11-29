"""
Course serializers
"""
from rest_framework import serializers
from .models import Course, CourseEnrollment, CourseMaterial


class CourseMaterialSerializer(serializers.ModelSerializer):
    """CourseMaterial Serializer"""

    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)

    class Meta:
        model = CourseMaterial
        fields = [
            'id', 'course', 'title', 'description', 'material_type',
            'file', 'link', 'order', 'is_public',
            'uploaded_by', 'uploaded_by_name', 'uploaded_at'
        ]
        read_only_fields = ['id', 'uploaded_at', 'uploaded_by', 'uploaded_by_name']


class CourseEnrollmentSerializer(serializers.ModelSerializer):
    """CourseEnrollment Serializer"""

    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)

    class Meta:
        model = CourseEnrollment
        fields = [
            'id', 'student', 'student_name', 'course', 'course_name',
            'progress', 'grade', 'enrolled_at', 'is_active'
        ]
        read_only_fields = ['id', 'enrolled_at']


class CourseSerializer(serializers.ModelSerializer):
    """Course Serializer"""

    titulaire_name = serializers.CharField(source='titulaire.name', read_only=True, allow_null=True)
    auditoire_name = serializers.CharField(source='auditoire.nom', read_only=True, allow_null=True)
    students_count = serializers.IntegerField(read_only=True, default=0)
    progress_percentage = serializers.FloatField(read_only=True, default=0)
    materials = CourseMaterialSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = [
            'id', 'name', 'code', 'description', 'credits',
            'titulaire', 'titulaire_name', 'assistants',
            'auditoire', 'auditoire_name',
            'syllabus', 'resources', 'is_active',
            'semester', 'annee_academique',
            'students_count', 'progress_percentage',
            'materials', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'code', 'created_at', 'updated_at', 'students_count', 
            'progress_percentage', 'titulaire_name', 'auditoire_name'
        ]
        extra_kwargs = {
            'titulaire': {'required': True, 'allow_null': False},
            'auditoire': {'required': True, 'allow_null': False},
        }


class CourseDetailSerializer(CourseSerializer):
    """Detailed Course Serializer with enrollments"""
    # Removed the problematic module-level import: from apps.users.serializers import UserSerializer

    enrollments = CourseEnrollmentSerializer(many=True, read_only=True)
    # Use SerializerMethodField for titulaire to handle circular import
    titulaire = serializers.SerializerMethodField()

    class Meta(CourseSerializer.Meta):
        fields = CourseSerializer.Meta.fields + ['enrollments']

    def get_titulaire(self, obj):
        # Import UserSerializer locally within the method to break the circular dependency
        from apps.users.serializers import UserSerializer
        return UserSerializer(obj.titulaire).data
