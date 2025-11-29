"""
User serializers
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, Sum
from apps.auditoires.models import Auditoire, Section, Filiere
from apps.quiz.models import QuizAttempt
from apps.assignments.models import Submission
from apps.courses.models import CourseEnrollment

User = get_user_model()

class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for detailed user profile, acting as a dashboard.
    """
    # Common Info
    auditoire_details = serializers.SerializerMethodField()
    courses = serializers.SerializerMethodField()
    
    # Explicitly add section_id and section_name
    section_id = serializers.PrimaryKeyRelatedField(source='section', read_only=True)
    section_name = serializers.CharField(source='section.nom', read_only=True, allow_null=True)
    filiere_name = serializers.CharField(source='filiere.nom', read_only=True, allow_null=True) # Add filiere_name

    # --- Student Stats ---
    student_stats = serializers.SerializerMethodField()

    # --- Teacher Stats ---
    teacher_stats = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'name', 'phone', 'role', 'status', 
            'matricule', 'auditoire', 'auditoire_details', 
            'section', 'section_id', 'section_name', # Include both the object and the ID/name
            'filiere', 'filiere_name', # Include filiere object and name
            'is_active', 'date_joined', 'courses',
            'student_stats', 'teacher_stats'
        ]

    def get_auditoire_details(self, obj):
        if obj.auditoire:
            from apps.auditoires.serializers import AuditoireSerializer
            return AuditoireSerializer(obj.auditoire).data
        return None

    def get_courses(self, obj):
        from apps.courses.serializers import CourseSerializer
        if obj.role == 'etudiant' and obj.auditoire:
            return CourseSerializer(obj.auditoire.courses.all(), many=True).data
        elif obj.role == 'enseignant':
            return CourseSerializer(obj.courses_taught.all(), many=True).data
        return []

    def get_student_stats(self, obj):
        if obj.role != 'etudiant':
            return None
        
        quizzes_completed = QuizAttempt.objects.filter(student=obj, is_completed=True).count()
        assignments_submitted = Submission.objects.filter(student=obj, status__in=['soumis', 'note']).count()
        enrollments = CourseEnrollment.objects.filter(student=obj)
        validated_enrollments = enrollments.filter(grade__gte=50)
        validated_courses_count = validated_enrollments.count()
        total_credits_obtained = validated_enrollments.aggregate(total=Sum('course__credits'))['total'] or 0
        quiz_avg = QuizAttempt.objects.filter(student=obj, is_completed=True).aggregate(avg=Avg('score'))['avg']
        assignment_avg = Submission.objects.filter(student=obj, status='note').aggregate(avg=Avg('score'))['avg']
        
        all_grades = []
        if quiz_avg is not None: all_grades.append(quiz_avg)
        if assignment_avg is not None: all_grades.append(assignment_avg)
        average_grade = round(sum(all_grades) / len(all_grades), 2) if all_grades else 0

        return {
            'quizzes_completed': quizzes_completed,
            'assignments_submitted': assignments_submitted,
            'validated_courses_count': validated_courses_count,
            'total_credits_obtained': total_credits_obtained,
            'average_grade': average_grade,
        }

    def get_teacher_stats(self, obj):
        if obj.role != 'enseignant':
            return None
            
        courses_taught = obj.courses_taught.all()
        courses_taught_count = courses_taught.count()
        students_in_taught_courses_count = CourseEnrollment.objects.filter(course__in=courses_taught).values('student').distinct().count()
        avg_student_performance = Submission.objects.filter(assignment__course__in=courses_taught).aggregate(avg=Avg('score'))['avg'] or 0

        return {
            'courses_taught_count': courses_taught_count,
            'total_students_managed': students_in_taught_courses_count,
            'average_student_performance': round(avg_student_performance, 2),
        }


class UserSerializer(serializers.ModelSerializer):
    auditoire_name = serializers.SerializerMethodField()
    section_name = serializers.CharField(source='section.nom', read_only=True, allow_null=True)
    filiere_name = serializers.CharField(source='filiere.nom', read_only=True, allow_null=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'name', 'phone', 'role', 'status', 
            'matricule', 'auditoire', 'auditoire_name', 'section', 'section_name', 
            'filiere', 'filiere_name', 'is_active', 'date_joined'
        ]
    
    def get_auditoire_name(self, obj):
        if obj.auditoire:
            return f"{obj.auditoire.nom} ({obj.auditoire.get_vacation_display()})"
        return None

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    auditoire_id = serializers.IntegerField(write_only=True, required=False)
    section_id = serializers.IntegerField(write_only=True, required=False)
    filiere_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            'email', 'password', 'first_name', 'last_name', 'phone', 'role',
            'auditoire_id', 'section_id', 'filiere_id'
        ]

    def validate(self, data):
        role = data.get('role')
        filiere_id = data.get('filiere_id')

        if role == 'chef_departement' and not filiere_id:
            raise serializers.ValidationError(
                {"filiere_id": "Un chef de département doit être affecté à une filière."}
            )
        if filiere_id:
            try:
                Filiere.objects.get(id=filiere_id)
            except Filiere.DoesNotExist:
                raise serializers.ValidationError(
                    {"filiere_id": "La filière spécifiée n'existe pas."}
                )
        return data

    def create(self, validated_data):
        auditoire_id = validated_data.pop('auditoire_id', None)
        section_id = validated_data.pop('section_id', None)
        filiere_id = validated_data.pop('filiere_id', None)
        
        user = User.objects.create_user(**validated_data)

        if user.role == 'etudiant' and auditoire_id:
            user.auditoire_id = auditoire_id
        elif user.role == 'chef_section' and section_id:
            user.section_id = section_id
            Section.objects.filter(id=section_id).update(chef_section=user)
        elif user.role == 'chef_departement' and filiere_id:
            user.filiere_id = filiere_id
            Filiere.objects.filter(id=filiere_id).update(chef_filiere=user)
        elif user.role in ['enseignant', 'assistant']:
            if section_id: user.section_id = section_id
            if filiere_id: user.filiere_id = filiere_id
        
        user.save()
        return user

class UserUpdateSerializer(serializers.ModelSerializer):
    auditoire_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    section_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    filiere_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'phone', 'role', 'status',
            'matricule', 'auditoire_id', 'section_id', 'filiere_id'
        ]
        read_only_fields = ['email', 'role']

    def validate(self, data):
        role = data.get('role', self.instance.role) # Use existing role if not provided
        filiere_id = data.get('filiere_id')

        if role == 'chef_departement':
            # If filiere_id is explicitly set to null, or not provided and was null before
            if filiere_id is None and self.instance.filiere is None:
                raise serializers.ValidationError(
                    {"filiere_id": "Un chef de département doit être affecté à une filière."}
                )
            # If filiere_id is provided, validate it
            if filiere_id is not None:
                try:
                    Filiere.objects.get(id=filiere_id)
                except Filiere.DoesNotExist:
                    raise serializers.ValidationError(
                        {"filiere_id": "La filière spécifiée n'existe pas."}
                    )
        return data

    def update(self, instance, validated_data):
        auditoire_id = validated_data.pop('auditoire_id', None)
        section_id = validated_data.pop('section_id', None)
        filiere_id = validated_data.pop('filiere_id', None)

        instance = super().update(instance, validated_data)

        if auditoire_id is not None:
            instance.auditoire = Auditoire.objects.get(id=auditoire_id) if auditoire_id else None
        if section_id is not None:
            instance.section = Section.objects.get(id=section_id) if section_id else None
            if instance.role == 'chef_section':
                Section.objects.filter(id=section_id).update(chef_section=instance)
        if filiere_id is not None:
            instance.filiere = Filiere.objects.get(id=filiere_id) if filiere_id else None
            if instance.role == 'chef_departement':
                Filiere.objects.filter(id=filiere_id).update(chef_filiere=instance)

        instance.save()
        return instance

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)
