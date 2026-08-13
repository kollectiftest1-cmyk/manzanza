"""
User serializers
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, Sum
from django.core.exceptions import ObjectDoesNotExist
from apps.auditoires.models import Auditoire, Section, Filiere
from apps.quiz.models import QuizAttempt
from apps.assignments.models import AssignmentSubmission
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
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'name', 'phone', 'role', 'status', 
            'role_display',
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
            courses = obj.courses_as_teacher.all() | obj.courses_as_assistant.all()
            return CourseSerializer(courses.distinct(), many=True).data
        return []

    def get_sections(self, obj):
        sections = set()
        if obj.role in ['enseignant', 'assistant', 'chef_departement', 'chef_section']:
            courses = obj.courses_as_teacher.all() | obj.courses_as_assistant.all()
            for course in courses.distinct():
                if course.auditoire and course.auditoire.filiere and course.auditoire.filiere.section:
                    sections.add(course.auditoire.filiere.section)
        if obj.section:
            sections.add(obj.section)
        return SimpleSectionSerializer(list(sections), many=True).data

    def get_filieres(self, obj):
        filieres = set()
        if obj.role in ['enseignant', 'assistant', 'chef_departement', 'chef_section']:
            courses = obj.courses_as_teacher.all() | obj.courses_as_assistant.all()
            for course in courses.distinct():
                if course.auditoire and course.auditoire.filiere:
                    filieres.add(course.auditoire.filiere)
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

        from apps.quiz.models import Quiz
        from django.utils import timezone
        from django.db.models import Q

        # QuizAttempt n'a pas de champ is_completed, utiliser status='submitted' ou 'graded'
        quizzes_completed = QuizAttempt.objects.filter(student=obj, status__in=['submitted', 'graded']).count()
        assignments_submitted = AssignmentSubmission.objects.filter(student=obj, status__in=['submitted', 'graded']).count()

        # Count pending quizzes (published, active, not yet attempted)
        # Get courses the student is enrolled in
        enrolled_course_ids = CourseEnrollment.objects.filter(
            student=obj,
            is_active=True
        ).values_list('course_id', flat=True)

        if enrolled_course_ids:
            # Get quizzes for student's enrolled courses that are published and currently active
            now = timezone.now()
            available_quizzes = Quiz.objects.filter(
                course_id__in=enrolled_course_ids,
                status='published',
                start_date__lte=now,
                end_date__gte=now
            )
            # Exclude quizzes already attempted by this student
            attempted_quiz_ids = QuizAttempt.objects.filter(student=obj).values_list('quiz_id', flat=True)
            pending_quizzes = available_quizzes.exclude(id__in=attempted_quiz_ids).count()
        else:
            pending_quizzes = 0

        enrollments = CourseEnrollment.objects.filter(student=obj)
        validated_enrollments = enrollments.filter(grade__gte=50)
        validated_courses_count = validated_enrollments.count()
        total_credits_obtained = validated_enrollments.aggregate(total=Sum('course__credits'))['total'] or 0
        quiz_avg = QuizAttempt.objects.filter(student=obj, status__in=['submitted', 'graded']).aggregate(avg=Avg('score'))['avg']
        assignment_avg = AssignmentSubmission.objects.filter(student=obj, status='graded').aggregate(avg=Avg('score'))['avg']

        all_grades = []
        if quiz_avg is not None: all_grades.append(quiz_avg)
        if assignment_avg is not None: all_grades.append(assignment_avg)
        average_grade = round(sum(all_grades) / len(all_grades), 2) if all_grades else 0

        return {
            'quizzes_completed': quizzes_completed,
            'pending_quizzes': pending_quizzes,
            'assignments_submitted': assignments_submitted,
            'validated_courses_count': validated_courses_count,
            'total_credits_obtained': total_credits_obtained,
            'average_grade': average_grade,
        }

    def get_teacher_stats(self, obj):
        if obj.role not in ['enseignant', 'assistant']:
            return None

        courses_taught = (obj.courses_as_teacher.all() | obj.courses_as_assistant.all()).distinct()
        courses_taught_count = courses_taught.count()

        # Count unique students across all auditoires where teacher teaches
        # Avoid counting same students multiple times when teaching multiple courses in same auditoire
        unique_auditoires = set()
        for course in courses_taught:
            if course.auditoire:
                unique_auditoires.add(course.auditoire.id)

        total_students = 0
        if unique_auditoires:
            from apps.auditoires.models import Auditoire
            for auditoire_id in unique_auditoires:
                try:
                    auditoire = Auditoire.objects.get(id=auditoire_id)
                    total_students += auditoire.students.filter(is_active=True).count()
                except Auditoire.DoesNotExist:
                    pass

        avg_student_performance = AssignmentSubmission.objects.filter(assignment__course__in=courses_taught).aggregate(avg=Avg('score'))['avg'] or 0

        return {
            'courses_taught_count': courses_taught_count,
            'total_students_managed': total_students,
            'average_student_performance': round(avg_student_performance, 2),
        }


class UserSerializer(serializers.ModelSerializer):
    auditoire_name = serializers.SerializerMethodField()
    filiere = SimpleFiliereSerializer(source='auditoire.filiere', read_only=True)
    section = SimpleSectionSerializer(source='auditoire.filiere.section', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'name', 'phone', 'role', 'status', 
            'role_display',
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
