"""
Serializers for Teacher-Assistant management
"""
from rest_framework import serializers
from .assistant_models import TeacherAssistant
from apps.users.models import User


class TeacherAssistantSerializer(serializers.ModelSerializer):
    """Serializer for TeacherAssistant model"""
    assistant_name = serializers.CharField(source='assistant.get_full_name', read_only=True)
    assistant_email = serializers.CharField(source='assistant.email', read_only=True)
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    teacher_email = serializers.CharField(source='teacher.email', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True, allow_null=True)
    course_code = serializers.CharField(source='course.code', read_only=True, allow_null=True)
    permissions_summary = serializers.CharField(read_only=True)

    class Meta:
        model = TeacherAssistant
        fields = [
            'id', 'assistant', 'assistant_name', 'assistant_email',
            'teacher', 'teacher_name', 'teacher_email',
            'course', 'course_name', 'course_code',
            'can_edit_materials', 'can_grade', 'can_take_attendance', 'can_manage_assignments',
            'permissions_summary',
            'assigned_date', 'is_active', 'notes'
        ]
        read_only_fields = ['id', 'assigned_date']

    def validate(self, data):
        """Validation personnalisée"""
        assistant = data.get('assistant')
        teacher = data.get('teacher')
        course = data.get('course')

        # Vérifier que l'assistant n'est pas le même que l'enseignant
        if assistant == teacher:
            raise serializers.ValidationError("Un enseignant ne peut pas être son propre assistant.")

        # Vérifier les rôles
        if assistant.role != 'assistant':
            raise serializers.ValidationError(
                f"{assistant.get_full_name()} doit avoir le rôle 'assistant'."
            )

        if teacher.role not in ['enseignant', 'chef_section', 'chef_departement']:
            raise serializers.ValidationError(
                f"{teacher.get_full_name()} doit avoir le rôle 'enseignant', 'chef_section' ou 'chef_departement'."
            )

        # Si un cours est spécifié, vérifier que l'enseignant est le titulaire
        if course and course.titulaire != teacher:
            raise serializers.ValidationError(
                f"{teacher.get_full_name()} n'est pas le titulaire du cours {course.name}."
            )

        return data


class AssignAssistantSerializer(serializers.Serializer):
    """Serializer pour assigner un assistant à un enseignant"""
    assistant_id = serializers.IntegerField()
    teacher_id = serializers.IntegerField()
    course_id = serializers.IntegerField(required=False, allow_null=True)
    can_edit_materials = serializers.BooleanField(default=True)
    can_grade = serializers.BooleanField(default=False)
    can_take_attendance = serializers.BooleanField(default=True)
    can_manage_assignments = serializers.BooleanField(default=True)
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate_assistant_id(self, value):
        """Valider que l'assistant existe"""
        try:
            assistant = User.objects.get(id=value)
            if assistant.role != 'assistant':
                raise serializers.ValidationError(f"L'utilisateur doit avoir le rôle 'assistant'.")
        except User.DoesNotExist:
            raise serializers.ValidationError("Assistant non trouvé.")
        return value

    def validate_teacher_id(self, value):
        """Valider que l'enseignant existe"""
        try:
            teacher = User.objects.get(id=value)
            if teacher.role not in ['enseignant', 'chef_section', 'chef_departement']:
                raise serializers.ValidationError(
                    "L'utilisateur doit avoir le rôle 'enseignant', 'chef_section' ou 'chef_departement'."
                )
        except User.DoesNotExist:
            raise serializers.ValidationError("Enseignant non trouvé.")
        return value


class AssistantPermissionsSerializer(serializers.Serializer):
    """Serializer pour modifier les permissions d'un assistant"""
    can_edit_materials = serializers.BooleanField(required=False)
    can_grade = serializers.BooleanField(required=False)
    can_take_attendance = serializers.BooleanField(required=False)
    can_manage_assignments = serializers.BooleanField(required=False)
