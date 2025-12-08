"""
Auditoire serializers
"""
from rest_framework import serializers
from .models import Auditoire, Section, Filiere
from apps.courses.models import Course
from apps.users.models import User

class SimpleCourseSerializer(serializers.ModelSerializer):
    titulaire_name = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ['id', 'name', 'code', 'credits', 'titulaire_name']

    def get_titulaire_name(self, obj):
        """Get titulaire name, handling None gracefully"""
        return obj.titulaire.name if obj.titulaire else None

class SimpleAuditoireSerializer(serializers.ModelSerializer):
    courses = SimpleCourseSerializer(many=True, read_only=True)
    # Use the annotated field from the viewset directly
    etudiants_count = serializers.IntegerField(read_only=True)
    vacation_display = serializers.CharField(source='get_vacation_display', read_only=True)

    class Meta:
        model = Auditoire
        fields = ['id', 'nom', 'niveau', 'vacation_display', 'etudiants_count', 'courses']

class FiliereDetailSerializer(serializers.ModelSerializer):
    section_nom = serializers.SerializerMethodField()
    chef_filiere_name = serializers.SerializerMethodField()
    auditoires = SimpleAuditoireSerializer(many=True, read_only=True, source='auditoire_set')
    etudiants_count = serializers.SerializerMethodField()
    enseignants_count = serializers.SerializerMethodField()

    class Meta:
        model = Filiere
        fields = ['id', 'nom', 'section', 'section_nom', 'chef_filiere', 'chef_filiere_name', 'auditoires', 'etudiants_count', 'enseignants_count']

    def get_section_nom(self, obj):
        """Get section nom, handling None gracefully"""
        return obj.section.nom if obj.section else None

    def get_chef_filiere_name(self, obj):
        if obj.chef_filiere:
            return f"{obj.chef_filiere.first_name} {obj.chef_filiere.last_name}"
        return None

    def get_etudiants_count(self, obj):
        return User.objects.filter(auditoire__filiere=obj).count()

    def get_enseignants_count(self, obj):
        """
        Compter TOUS les enseignants et assistants qui donnent des cours dans cette filière
        Un enseignant fait partie de la filière s'il y enseigne (titulaire OU assistant)
        """
        from django.db.models import Q

        return User.objects.filter(
            Q(courses_as_teacher__auditoire__filiere=obj) |
            Q(courses_as_assistant__auditoire__filiere=obj),
            role__in=['enseignant', 'assistant']
        ).distinct().count()

class SectionDetailSerializer(serializers.ModelSerializer):
    chef_section_name = serializers.SerializerMethodField()
    filieres = FiliereDetailSerializer(many=True, read_only=True)
    etudiants_count = serializers.SerializerMethodField()
    enseignants_count = serializers.SerializerMethodField()
    auditoires_count = serializers.SerializerMethodField()

    class Meta:
        model = Section
        fields = ['id', 'nom', 'chef_section', 'chef_section_name', 'filieres', 'etudiants_count', 'enseignants_count', 'auditoires_count']

    def get_chef_section_name(self, obj):
        if obj.chef_section:
            return f"{obj.chef_section.first_name} {obj.chef_section.last_name}"
        return None

    def get_etudiants_count(self, obj):
        return User.objects.filter(auditoire__filiere__section=obj).count()

    def get_enseignants_count(self, obj):
        """
        Compter TOUS les enseignants et assistants qui donnent des cours dans cette section
        Un enseignant fait partie de la section s'il y enseigne (titulaire OU assistant)
        """
        from django.db.models import Q

        return User.objects.filter(
            Q(courses_as_teacher__auditoire__filiere__section=obj) |
            Q(courses_as_assistant__auditoire__filiere__section=obj),
            role__in=['enseignant', 'assistant']
        ).distinct().count()
        
    def get_auditoires_count(self, obj):
        return Auditoire.objects.filter(filiere__section=obj).count()

class FiliereSerializer(serializers.ModelSerializer):
    """Filiere (Option) Serializer"""
    section_nom = serializers.SerializerMethodField()
    chef_filiere_name = serializers.SerializerMethodField()

    class Meta:
        model = Filiere
        fields = ['id', 'nom', 'section', 'section_nom', 'chef_filiere', 'chef_filiere_name']

    def get_section_nom(self, obj):
        """Get section nom, handling None gracefully"""
        return obj.section.nom if obj.section else None

    def get_chef_filiere_name(self, obj):
        if obj.chef_filiere:
            return f"{obj.chef_filiere.first_name} {obj.chef_filiere.last_name}"
        return None

class SectionSerializer(serializers.ModelSerializer):
    """Section Serializer"""
    chef_section_name = serializers.SerializerMethodField()
    filieres = FiliereSerializer(many=True, read_only=True)
    auditoires_count = serializers.SerializerMethodField()

    class Meta:
        model = Section
        fields = ['id', 'nom', 'chef_section', 'chef_section_name', 'auditoires_count', 'filieres']

    def get_chef_section_name(self, obj):
        if obj.chef_section:
            return f"{obj.chef_section.first_name} {obj.chef_section.last_name}"
        return None

    def get_auditoires_count(self, obj):
        return Auditoire.objects.filter(filiere__section=obj).count()

class AuditoireSerializer(serializers.ModelSerializer):
    """Auditoire Serializer"""
    # Utiliser SerializerMethodField pour un comptage fiable
    etudiants_count = serializers.SerializerMethodField()
    cours_count = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    section_name = serializers.SerializerMethodField()
    filiere_name = serializers.SerializerMethodField()
    vacation_display = serializers.CharField(source='get_vacation_display', read_only=True)

    # Helper field for the form. It will be accepted on input but not used for saving.
    section = serializers.PrimaryKeyRelatedField(queryset=Section.objects.all(), write_only=True, required=False)

    class Meta:
        model = Auditoire
        fields = [
            'id', 'nom', 'niveau', 'vacation', 'vacation_display', 'description',
            'annee_academique', 'capacite_max', 'is_active',
            'etudiants_count', 'cours_count',
            'section_name',
            'filiere', 'filiere_name',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
            'section' # Include the helper field
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'etudiants_count', 'cours_count',
            'created_by_name', 'section_name', 'filiere_name', 'vacation_display'
        ]
        extra_kwargs = {
            'nom': {'required': False}  # Allow nom to be optional, will be auto-generated if not provided
        }

    def get_created_by_name(self, obj):
        """Get created by name, handling None gracefully"""
        return obj.created_by.get_full_name() if obj.created_by else None

    def get_section_name(self, obj):
        """Get section name through filiere, handling None gracefully"""
        return obj.filiere.section.nom if obj.filiere and obj.filiere.section else None

    def get_filiere_name(self, obj):
        """Get filiere name, handling None gracefully"""
        return obj.filiere.nom if obj.filiere else None

    def get_etudiants_count(self, obj):
        """Compter les étudiants actifs de cet auditoire"""
        return obj.students.filter(is_active=True).count()

    def get_cours_count(self, obj):
        """Compter les cours actifs de cet auditoire"""
        return obj.courses.filter(is_active=True).count()

    def create(self, validated_data):
        """
        Override create to auto-generate nom if not provided
        """
        from apps.auditoires.utils import generate_auditoire_name

        # If nom is not provided, generate it
        if not validated_data.get('nom'):
            validated_data['nom'] = generate_auditoire_name(
                niveau=validated_data.get('niveau'),
                filiere=validated_data.get('filiere'),
                vacation=validated_data.get('vacation', 'jour')
            )

        return super().create(validated_data)
