"""
User serializers
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, Sum
from django.core.exceptions import ObjectDoesNotExist
from apps.auditoires.models import Auditoire, Section, Filiere
from apps.quiz.models import QuizAttempt
from apps.assignments.models import Submission
from apps.courses.models import Course, CourseEnrollment

User = get_user_model()

class SimpleSectionSerializer(serializers.ModelSerializer):
    """Minimal serializer for Section."""
    class Meta:
        model = Section
        fields = ['id', 'nom']

class SimpleFiliereSerializer(serializers.ModelSerializer):
    """Minimal serializer for Filiere."""
    class Meta:
        model = Filiere
        fields = ['id', 'nom']


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for detailed user profile, acting as a dashboard.
    """
    auditoire_details = serializers.SerializerMethodField()
    courses = serializers.SerializerMethodField()
    sections = serializers.SerializerMethodField()
    filieres = serializers.SerializerMethodField()
    section = serializers.SerializerMethodField() # ID of managed section for chef_section
    filiere = serializers.SerializerMethodField() # ID of managed filiere for chef_filiere
    student_stats = serializers.SerializerMethodField()
    teacher_stats = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'name', 'phone', 'role', 'status', 
            'matricule', 'auditoire', 'auditoire_details', 
            'sections', 'filieres', 'section', 'filiere',
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
        if obj.role == 'etudiant':
            enrolled_courses_ids = CourseEnrollment.objects.filter(student=obj, is_active=True).values_list('course_id', flat=True)
            return CourseSerializer(Course.objects.filter(id__in=enrolled_courses_ids), many=True).data
        elif obj.role in ['enseignant', 'assistant']:
            courses = obj.courses_held.all() | obj.courses_assisted.all()
            return CourseSerializer(courses.distinct(), many=True).data
        return []

    def get_sections(self, obj):
        sections = set()
        if obj.role in ['enseignant', 'assistant', 'chef_departement', 'chef_section']:
            courses = obj.courses_held.all() | obj.courses_assisted.all()
            for course in courses.distinct():
                sections.update(course.sections.all())
        if obj.section:
            sections.add(obj.section)
        return SimpleSectionSerializer(list(sections), many=True).data

    def get_filieres(self, obj):
        filieres = set()
        if obj.role in ['enseignant', 'assistant', 'chef_departement', 'chef_section']:
            courses = obj.courses_held.all() | obj.courses_assisted.all()
            for course in courses.distinct():
                filieres.update(course.filieres.all())
        if obj.filiere:
            filieres.add(obj.filiere)
        return SimpleFiliereSerializer(list(filieres), many=True).data

    def get_section(self, obj):
        """Returns the ID of the section managed by a chef_section."""
        if obj.role == 'chef_section':
            try:
                return obj.managed_section.id
            except ObjectDoesNotExist:
                # Fallback to the direct foreign key if the one-to-one isn't set
                return obj.section.id if obj.section else None
        return None

    def get_filiere(self, obj):
        """Returns the ID of the filiere managed by a chef_departement."""
        if obj.role == 'chef_departement':
            try:
                return obj.managed_filiere.id
            except ObjectDoesNotExist:
                # Fallback to the direct foreign key if the one-to-one isn't set
                return obj.filiere.id if obj.filiere else None
        return None

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
        if obj.role not in ['enseignant', 'assistant']:
            return None
            
        courses_taught = (obj.courses_held.all() | obj.courses_assisted.all()).distinct()
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
    filiere = SimpleFiliereSerializer(source='auditoire.filiere', read_only=True)
    section = SimpleSectionSerializer(source='auditoire.filiere.section', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'name', 'phone', 'role', 'status', 
            'matricule', 'auditoire', 'auditoire_name',
            'filiere', 'section',
            'is_active', 'date_joined'
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
            if filiere_id is None and self.instance.filiere is None:
                raise serializers.ValidationError(
                    {"filiere_id": "Un chef de département doit être affecté à une filière."}
                )
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
