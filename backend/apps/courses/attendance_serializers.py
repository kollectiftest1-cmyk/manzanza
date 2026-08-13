"""
Serializers for attendance tracking
"""
from rest_framework import serializers
from .attendance_models import Attendance, AttendanceSession
from apps.users.models import User


class AttendanceSerializer(serializers.ModelSerializer):
    """Serializer for Attendance model"""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_matricule = serializers.CharField(source='student.matricule', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    recorded_by_name = serializers.CharField(source='recorded_by.get_full_name', read_only=True, allow_null=True)

    class Meta:
        model = Attendance
        fields = [
            'id', 'student', 'student_name', 'student_matricule',
            'course', 'course_name', 'course_code',
            'date', 'status', 'status_display', 'comments',
            'session',
            'recorded_by', 'recorded_by_name',
            'recorded_at', 'updated_at'
        ]
        read_only_fields = ['id', 'recorded_at', 'updated_at', 'recorded_by']

    def validate(self, data):
        """Validate that student is enrolled in the course"""
        student = data.get('student')
        course = data.get('course')

        if student.role != 'etudiant':
            raise serializers.ValidationError("Seuls les étudiants peuvent avoir des présences enregistrées.")

        # Check if student is enrolled in the course
        if not course.enrollments.filter(student=student, is_active=True).exists():
            raise serializers.ValidationError(
                f"L'étudiant {student.get_full_name()} n'est pas inscrit au cours {course.name}."
            )

        return data


class AttendanceItemSerializer(serializers.Serializer):
    """Serializer for individual attendance item in bulk create"""
    student_id = serializers.IntegerField()
    status = serializers.ChoiceField(choices=['present', 'absent', 'retard', 'excuse'])
    comments = serializers.CharField(required=False, allow_blank=True, default='')


class BulkAttendanceSerializer(serializers.Serializer):
    """Serializer for bulk attendance creation"""
    course = serializers.IntegerField(help_text="ID du cours")
    date = serializers.DateField()
    session_id = serializers.IntegerField(required=False, allow_null=True, help_text="ID de la séance (optionnel)")
    attendances = AttendanceItemSerializer(many=True, help_text="List of {student_id, status, comments}")

    def validate_course(self, value):
        """Validate that course exists"""
        from .models import Course
        if not Course.objects.filter(id=value).exists():
            raise serializers.ValidationError(f"Le cours avec l'ID {value} n'existe pas.")
        return value

    def validate_attendances(self, value):
        """Validate attendance data"""
        if not value:
            raise serializers.ValidationError("La liste des présences ne peut pas être vide.")

        # Check for duplicate student_ids
        student_ids = [item['student_id'] for item in value]
        if len(student_ids) != len(set(student_ids)):
            raise serializers.ValidationError("Chaque étudiant ne peut apparaître qu'une seule fois.")

        return value


class AttendanceSessionSerializer(serializers.ModelSerializer):
    """Serializer for AttendanceSession model"""
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True, allow_null=True)

    # Statistics
    total_students = serializers.IntegerField(read_only=True)
    present_count = serializers.IntegerField(read_only=True)
    absent_count = serializers.IntegerField(read_only=True)
    late_count = serializers.IntegerField(read_only=True)
    attendance_rate = serializers.FloatField(read_only=True)

    class Meta:
        model = AttendanceSession
        fields = [
            'id', 'course', 'course_name', 'course_code',
            'date', 'start_time', 'end_time',
            'title', 'description', 'is_finalized',
            'total_students', 'present_count', 'absent_count', 'late_count', 'attendance_rate',
            'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

    def validate(self, data):
        """Validate session times"""
        start_time = data.get('start_time')
        end_time = data.get('end_time')

        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError("L'heure de fin doit être après l'heure de début.")

        return data


class StudentAttendanceReportSerializer(serializers.Serializer):
    """Serializer for student attendance report"""
    student_id = serializers.IntegerField()
    student_name = serializers.CharField()
    student_matricule = serializers.CharField()
    total_sessions = serializers.IntegerField()
    present_count = serializers.IntegerField()
    absent_count = serializers.IntegerField()
    late_count = serializers.IntegerField()
    excused_count = serializers.IntegerField()
    attendance_rate = serializers.FloatField()


class CourseAttendanceReportSerializer(serializers.Serializer):
    """Serializer for course attendance report"""
    course_id = serializers.IntegerField()
    course_name = serializers.CharField()
    course_code = serializers.CharField()
    total_sessions = serializers.IntegerField()
    total_students = serializers.IntegerField()
    average_attendance_rate = serializers.FloatField()
    students = StudentAttendanceReportSerializer(many=True)
