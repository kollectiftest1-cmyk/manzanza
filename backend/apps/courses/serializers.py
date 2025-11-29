"""
Course serializers
"""
from rest_framework import serializers
from .models import Course, CourseEnrollment, CourseMaterial
from apps.auditoires.models import Section, Filiere, Auditoire

# Custom Serializers for simplified representation
class SimpleFiliereSerializer(serializers.ModelSerializer):
    chef_filiere = serializers.CharField(source='chef_filiere.get_full_name', read_only=True)

    class Meta:
        model = Filiere
        fields = ['id', 'nom', 'chef_filiere']

class SimpleSectionSerializer(serializers.ModelSerializer):
    chef_section = serializers.CharField(source='chef_section.get_full_name', read_only=True)

    class Meta:
        model = Section
        fields = ['id', 'nom', 'chef_section']

class SimpleAuditoireSerializer(serializers.ModelSerializer):
    titulaire = serializers.CharField(source='titulaire.get_full_name', read_only=True)

    class Meta:
        model = Auditoire
        fields = ['id', 'nom', 'titulaire']

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
    students_count = serializers.IntegerField(read_only=True, default=0)
    progress_percentage = serializers.FloatField(read_only=True, default=0)
    materials = CourseMaterialSerializer(many=True, read_only=True)
    
    # Use the custom simple serializers for read-only representation
    filiere = SimpleFiliereSerializer(source='filieres', many=True, read_only=True)
    section = SimpleSectionSerializer(source='sections', many=True, read_only=True)
    auditoire = SimpleAuditoireSerializer(source='auditoires', many=True, read_only=True)

    # Field for write operations
    auditoire_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Auditoire.objects.all(), source='auditoires', write_only=True
    )

    class Meta:
        model = Course
        fields = [
            'id', 'name', 'code', 'description', 'credits',
            'titulaire', 'titulaire_name', 'assistants',
            'section', 'filiere', 'auditoire', 'auditoire_ids',
            'syllabus', 'resources', 'is_active',
            'semester', 'annee_academique',
            'students_count', 'progress_percentage',
            'materials', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'code', 'created_at', 'updated_at', 'students_count', 
            'progress_percentage', 'titulaire_name', 'section', 'filiere', 'auditoire'
        ]
        extra_kwargs = {
            'titulaire': {'required': True, 'allow_null': False},
        }

    def create(self, validated_data):
        auditoires = validated_data.pop('auditoires', [])
        course = Course.objects.create(**validated_data)
        self._process_auditoires(course, auditoires)
        return course

    def update(self, instance, validated_data):
        auditoires = validated_data.pop('auditoires', [])
        instance = super().update(instance, validated_data)
        self._process_auditoires(instance, auditoires)
        return instance

    def _process_auditoires(self, course, auditoires):
        course.auditoires.set(auditoires)
        
        filieres = set()
        sections = set()
        
        for auditoire in auditoires:
            if auditoire.filiere:
                filieres.add(auditoire.filiere)
                if auditoire.filiere.section:
                    sections.add(auditoire.filiere.section)
        
        course.filieres.set(list(filieres))
        course.sections.set(list(sections))


class CourseDetailSerializer(CourseSerializer):
    """Detailed Course Serializer with enrollments"""
    enrollments = CourseEnrollmentSerializer(many=True, read_only=True)
    titulaire = serializers.SerializerMethodField()

    class Meta(CourseSerializer.Meta):
        fields = CourseSerializer.Meta.fields + ['enrollments']

    def get_titulaire(self, obj):
        from apps.users.serializers import UserSerializer
        return UserSerializer(obj.titulaire).data
