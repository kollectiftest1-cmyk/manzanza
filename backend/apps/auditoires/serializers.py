"""
Auditoire serializers
"""
from rest_framework import serializers
from .models import Auditoire, Section, Filiere
from apps.courses.models import Course
from apps.users.models import User

class SimpleCourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['id', 'name', 'code', 'credits', 'titulaire_name']
    
    titulaire_name = serializers.CharField(source='titulaire.name', read_only=True)

class SimpleAuditoireSerializer(serializers.ModelSerializer):
    courses = SimpleCourseSerializer(many=True, read_only=True)
    etudiants_count = serializers.IntegerField(read_only=True)
    vacation_display = serializers.CharField(source='get_vacation_display', read_only=True)

    class Meta:
        model = Auditoire
        fields = ['id', 'nom', 'niveau', 'vacation_display', 'etudiants_count', 'courses']

class FiliereDetailSerializer(serializers.ModelSerializer):
    section_nom = serializers.CharField(source='section.nom', read_only=True)
    chef_filiere_name = serializers.SerializerMethodField()
    auditoires = SimpleAuditoireSerializer(many=True, read_only=True, source='auditoire_set')
    etudiants_count = serializers.SerializerMethodField()
    enseignants_count = serializers.SerializerMethodField()

    class Meta:
        model = Filiere
        fields = ['id', 'nom', 'section', 'section_nom', 'chef_filiere', 'chef_filiere_name', 'auditoires', 'etudiants_count', 'enseignants_count']

    def get_chef_filiere_name(self, obj):
        if obj.chef_filiere:
            return f"{obj.chef_filiere.first_name} {obj.chef_filiere.last_name}"
        return None

    def get_etudiants_count(self, obj):
        return User.objects.filter(auditoire__filiere=obj).count()

    def get_enseignants_count(self, obj):
        return User.objects.filter(courses_held__auditoire__filiere=obj).distinct().count()

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
        return User.objects.filter(courses_held__auditoire__filiere__section=obj).distinct().count()
        
    def get_auditoires_count(self, obj):
        return Auditoire.objects.filter(filiere__section=obj).count()

class FiliereSerializer(serializers.ModelSerializer):
    """Filiere (Option) Serializer"""
    section_nom = serializers.CharField(source='section.nom', read_only=True)
    chef_filiere_name = serializers.SerializerMethodField()

    class Meta:
        model = Filiere
        fields = ['id', 'nom', 'section', 'section_nom', 'chef_filiere', 'chef_filiere_name']
        
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
    etudiants_count = serializers.IntegerField(read_only=True, default=0)
    cours_count = serializers.IntegerField(read_only=True, default=0)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True, allow_null=True)
    section_name = serializers.CharField(source='filiere.section.nom', read_only=True, allow_null=True)
    filiere_name = serializers.CharField(source='filiere.nom', read_only=True, allow_null=True)
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
        # No extra_kwargs needed, DRF will infer from the model.
        # The model now correctly defines `filiere` as non-nullable.
