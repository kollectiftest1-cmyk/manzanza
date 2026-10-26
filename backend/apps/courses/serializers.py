"""
Course serializers
"""
from rest_framework import serializers
from .models import Course, CourseEnrollment, CourseMaterial
from apps.auditoires.models import Section, Filiere, Auditoire

# Custom Serializers for simplified representation
class SimpleFiliereSerializer(serializers.ModelSerializer):
    chef_filiere = serializers.SerializerMethodField()

    class Meta:
        model = Filiere
        fields = ['id', 'nom', 'chef_filiere']

    def get_chef_filiere(self, obj):
        """Get chef filiere name, handling None gracefully"""
        return obj.chef_filiere.get_full_name() if obj.chef_filiere else None

class SimpleSectionSerializer(serializers.ModelSerializer):
    chef_section = serializers.SerializerMethodField()

    class Meta:
        model = Section
        fields = ['id', 'nom', 'chef_section']

    def get_chef_section(self, obj):
        """Get chef section name, handling None gracefully"""
        return obj.chef_section.get_full_name() if obj.chef_section else None

class SimpleAuditoireSerializer(serializers.ModelSerializer):
    class Meta:
        model = Auditoire
        fields = ['id', 'nom', 'niveau', 'vacation']

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


class SimpleUserSerializer(serializers.Serializer):
    """Serializer simple pour les utilisateurs (titulaire et assistants)"""
    id = serializers.IntegerField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.CharField()
    role = serializers.CharField()

    def to_representation(self, instance):
        return {
            'id': instance.id,
            'first_name': instance.first_name,
            'last_name': instance.last_name,
            'email': instance.email,
            'role': instance.role,
            'name': instance.get_full_name() if hasattr(instance, 'get_full_name') else f"{instance.first_name} {instance.last_name}"
        }

class CourseSerializer(serializers.ModelSerializer):
    """Course Serializer"""

    titulaire_name = serializers.CharField(source='titulaire.name', read_only=True, allow_null=True)

    # Champs en lecture (avec détails complets)
    titulaire_detail = SimpleUserSerializer(source='titulaire', read_only=True)
    assistants_detail = SimpleUserSerializer(source='assistants', many=True, read_only=True)

    students_count = serializers.IntegerField(read_only=True, default=0)
    progress_percentage = serializers.FloatField(read_only=True, default=0)
    materials = CourseMaterialSerializer(many=True, read_only=True)

    # Use SerializerMethodField to handle None values gracefully
    filiere = serializers.SerializerMethodField()
    section = serializers.SerializerMethodField()
    auditoire_detail = serializers.SerializerMethodField()

    # Prerequisites info
    prerequisites_detail = serializers.SerializerMethodField()
    ue_code = serializers.CharField(source='ue.code', read_only=True, default=None)
    volume_horaire_total = serializers.IntegerField(read_only=True)

    class Meta:
        model = Course
        fields = [
            'id', 'name', 'code', 'description', 'credits',
            'titulaire', 'titulaire_name', 'titulaire_detail',
            'assistants', 'assistants_detail',
            'section', 'filiere', 'auditoire', 'auditoire_detail',
            'syllabus', 'resources', 'is_active',
            'semester', 'annee_academique', 'ue', 'ue_code',
            'volume_cm', 'volume_td', 'volume_tp', 'volume_horaire_total',
            'prerequisites', 'prerequisites_detail', 'duration_terms',
            'students_count', 'progress_percentage',
            'materials', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'code', 'created_at', 'updated_at', 'students_count',
            'progress_percentage', 'titulaire_name', 'section', 'filiere', 'auditoire_detail',
            'titulaire_detail', 'assistants_detail', 'prerequisites_detail'
        ]
        extra_kwargs = {
            'titulaire': {'required': True, 'allow_null': False, 'write_only': False},
            'assistants': {'required': False, 'write_only': False},
            'auditoire': {'required': False, 'allow_null': True},
            'prerequisites': {'required': False},
            'ue': {'required': False, 'allow_null': True},
        }

    def validate(self, attrs):
        attrs = super().validate(attrs)
        ue = attrs.get('ue', getattr(self.instance, 'ue', None))
        auditoire = attrs.get('auditoire', getattr(self.instance, 'auditoire', None))
        if ue and auditoire and (ue.filiere_id != auditoire.filiere_id or ue.niveau != auditoire.niveau):
            raise serializers.ValidationError({'ue': (
                f"L'UE « {ue} » n'appartient pas à la même filière/niveau que le groupe « {auditoire} ». "
                "Choisissez une UE de la filière et du niveau de ce groupe, ou changez de groupe.")})
        credits = attrs.get('credits')
        if credits is not None and credits < 1:
            raise serializers.ValidationError({'credits': f"Un cours vaut au moins 1 crédit (saisi : {credits})."})
        return attrs

    def get_filiere(self, obj):
        """Get filiere through auditoire, handling None gracefully"""
        if obj.auditoire and obj.auditoire.filiere:
            return SimpleFiliereSerializer(obj.auditoire.filiere).data
        return None

    def get_section(self, obj):
        """Get section through auditoire.filiere, handling None gracefully"""
        if obj.auditoire and obj.auditoire.filiere and obj.auditoire.filiere.section:
            return SimpleSectionSerializer(obj.auditoire.filiere.section).data
        return None

    def get_auditoire_detail(self, obj):
        """Get auditoire details, handling None gracefully"""
        if obj.auditoire:
            return SimpleAuditoireSerializer(obj.auditoire).data
        return None

    def get_prerequisites_detail(self, obj):
        """Get prerequisites as [{ id, code, name }]"""
        return [
            {'id': c.id, 'code': c.code, 'name': c.name}
            for c in obj.prerequisites.all()
        ]


class CourseDetailSerializer(CourseSerializer):
    """Detailed Course Serializer with enrollments"""
    enrollments = CourseEnrollmentSerializer(many=True, read_only=True)
    titulaire = serializers.SerializerMethodField()
    students = serializers.SerializerMethodField()

    class Meta(CourseSerializer.Meta):
        fields = CourseSerializer.Meta.fields + ['enrollments', 'students']

    def get_titulaire(self, obj):
        from apps.users.serializers import UserSerializer
        return UserSerializer(obj.titulaire).data

    def get_students(self, obj):
        """Get list of enrolled students"""
        from apps.users.serializers import UserSerializer
        enrolled_students = obj.enrollments.filter(is_active=True).select_related('student')
        students = [enrollment.student for enrollment in enrolled_students]
        return UserSerializer(students, many=True).data
