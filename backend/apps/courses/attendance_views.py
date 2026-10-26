"""
Views for attendance tracking
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Count, Q, Avg
from django.utils import timezone
from datetime import datetime, timedelta

from .attendance_models import Attendance, AttendanceSession
from .attendance_serializers import (
    AttendanceSerializer, AttendanceSessionSerializer,
    BulkAttendanceSerializer, StudentAttendanceReportSerializer,
    CourseAttendanceReportSerializer
)
from .models import Course
from apps.users.models import User
from apps.users.permissions import IsTeacherOrAdmin, IsTeachingStaff, manages_course, teaches_course
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db.models import Q as _Q


class AttendanceViewSet(viewsets.ModelViewSet):
    """ViewSet for managing attendance records"""
    queryset = Attendance.objects.select_related(
        'student', 'course', 'recorded_by'
    ).all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['course', 'student', 'date', 'status', 'session']
    search_fields = ['student__first_name', 'student__last_name', 'student__matricule']
    ordering_fields = ['date', 'student__last_name']

    def get_permissions(self):
        if self.action in ['my_attendances', 'statistics']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsTeacherOrAdmin()]

    def get_queryset(self):
        """Uniquement les présences des cours que l'utilisateur gère."""
        user = self.request.user
        qs = Attendance.objects.select_related('student', 'course', 'recorded_by')
        if user.is_superuser or user.role in ['pdg', 'sga', 'directeur_general']:
            return qs
        if user.role == 'chef_departement' and user.filiere_id:
            return qs.filter(course__auditoire__filiere_id=user.filiere_id)
        if user.role == 'chef_section' and user.section_id:
            return qs.filter(course__auditoire__filiere__section_id=user.section_id)
        return qs.filter(_Q(course__titulaire=user) | _Q(course__assistants=user)).distinct()

    def _check(self, course, student=None):
        if not manages_course(self.request.user, course):
            raise PermissionDenied("Vous ne pouvez saisir les présences que de vos propres cours.")
        if student is not None and student.auditoire_id != course.auditoire_id:
            raise ValidationError({'student': "Cet étudiant n'appartient pas à l'auditoire du cours."})

    def perform_create(self, serializer):
        """Set recorded_by to current user"""
        self._check(serializer.validated_data.get('course'), serializer.validated_data.get('student'))
        serializer.save(recorded_by=self.request.user)

    def perform_update(self, serializer):
        inst = serializer.instance
        self._check(serializer.validated_data.get('course', inst.course),
                    serializer.validated_data.get('student', inst.student))
        if inst.session_id and inst.session.is_finalized:
            raise ValidationError("Cette séance est clôturée.")
        serializer.save()

    def perform_destroy(self, instance):
        # Une présence ne disparaît jamais : on corrige son statut (présent, absent, excusé…).
        raise ValidationError("Une présence ne se supprime pas : modifiez son statut.")

    @action(detail=False, methods=['get'], url_path='my_attendances')
    def my_attendances(self, request):
        """Get attendance records for the current student"""
        if request.user.role != 'etudiant':
            return Response({'error': 'Réservé aux étudiants.'}, status=status.HTTP_403_FORBIDDEN)
        qs = Attendance.objects.filter(student=request.user).select_related('course', 'recorded_by')
        serializer = AttendanceSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='statistics')
    def statistics(self, request):
        """Get attendance statistics for the current user's courses"""
        user = request.user
        if user.role == 'etudiant':
            attendances = Attendance.objects.filter(student=user)
        elif user.role in ['enseignant', 'assistant']:
            attendances = Attendance.objects.filter(
                Q(course__titulaire=user) | Q(course__assistants=user)
            )
        else:
            attendances = self.get_queryset()

        total = attendances.count()
        present = attendances.filter(status='present').count()
        absent = attendances.filter(status='absent').count()
        late = attendances.filter(status='retard').count()
        excused = attendances.filter(status='excuse').count()
        rate = round((present / total * 100), 2) if total > 0 else 0

        return Response({
            'total_sessions': total,
            'present_count': present,
            'absent_count': absent,
            'late_count': late,
            'excused_count': excused,
            'attendance_rate': rate,
        })

    @action(detail=False, methods=['get'], url_path='course_statistics')
    def course_statistics(self, request):
        """Get attendance statistics for a specific course — alias for course-report"""
        course_id = request.query_params.get('course_id')
        if not course_id:
            return Response({'error': 'course_id est requis.'}, status=status.HTTP_400_BAD_REQUEST)
        # Delegate to course_report
        return self.course_report(request)

    @action(detail=False, methods=['post'], url_path='bulk_create')
    def bulk_create(self, request):
        """
        Bulk create attendance records for a course session.
        Expected data:
        {
            "course": 1,
            "date": "2024-01-15",
            "attendances": [
                {"student_id": 1, "status": "present", "comments": ""},
                {"student_id": 2, "status": "absent", "comments": "Malade"}
            ]
        }
        """
        serializer = BulkAttendanceSerializer(data=request.data)
        if not serializer.is_valid():
            # Log validation errors for debugging
            print(f"Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Continue with validated data

        course_id = serializer.validated_data['course']
        date = serializer.validated_data['date']
        attendances_data = serializer.validated_data['attendances']
        session_id = serializer.validated_data.get('session_id')

        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response({'error': 'Cours non trouvé.'}, status=status.HTTP_404_NOT_FOUND)
        if not manages_course(request.user, course):
            return Response({'error': 'Permission refusée.'}, status=status.HTTP_403_FORBIDDEN)
        if not manages_course(request.user, course):
            return Response({'error': 'Vous ne pouvez saisir les présences que de vos propres cours.'},
                            status=status.HTTP_403_FORBIDDEN)

        # Resolve session if provided
        session_obj = None
        if session_id:
            try:
                session_obj = AttendanceSession.objects.get(id=session_id)
                # Block edits on finalized sessions
                if session_obj.is_finalized:
                    return Response(
                        {'error': 'Cette séance est clôturée. Impossible de modifier les présences.'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except AttendanceSession.DoesNotExist:
                pass

        created_count = 0
        updated_count = 0
        errors = []

        for att_data in attendances_data:
            try:
                student = User.objects.get(id=att_data['student_id'], role='etudiant')

                # Create or update attendance
                attendance, created = Attendance.objects.update_or_create(
                    student=student,
                    course=course,
                    date=date,
                    defaults={
                        'status': att_data['status'],
                        'comments': att_data.get('comments', ''),
                        'recorded_by': request.user,
                        'session': session_obj,
                    }
                )

                if created:
                    created_count += 1
                else:
                    updated_count += 1

            except User.DoesNotExist:
                errors.append(f"Étudiant avec ID {att_data['student_id']} non trouvé.")
            except Exception as e:
                errors.append(f"Erreur pour étudiant {att_data.get('student_id')}: {str(e)}")

        return Response({
            'message': f'{created_count} présence(s) créée(s), {updated_count} mise(s) à jour.',
            'created': created_count,
            'updated': updated_count,
            'errors': errors
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='student-report')
    def student_report(self, request):
        """
        Get attendance report for a specific student.
        Query params: student_id, course_id (optional), start_date, end_date
        """
        student_id = request.query_params.get('student_id')
        course_id = request.query_params.get('course_id')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        if not student_id:
            return Response({'error': 'student_id est requis.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student = User.objects.get(id=student_id, role='etudiant')
        except User.DoesNotExist:
            return Response({'error': 'Étudiant non trouvé.'}, status=status.HTTP_404_NOT_FOUND)

        # Build query
        query = Q(student=student)
        if course_id:
            query &= Q(course_id=course_id)
        if start_date:
            query &= Q(date__gte=start_date)
        if end_date:
            query &= Q(date__lte=end_date)

        attendances = self.get_queryset().filter(query)

        # Calculate statistics
        total = attendances.count()
        present = attendances.filter(status='present').count()
        absent = attendances.filter(status='absent').count()
        late = attendances.filter(status='retard').count()
        excused = attendances.filter(status='excuse').count()

        attendance_rate = (present / total * 100) if total > 0 else 0

        report = {
            'student_id': student.id,
            'student_name': student.get_full_name(),
            'student_matricule': student.matricule,
            'total_sessions': total,
            'present_count': present,
            'absent_count': absent,
            'late_count': late,
            'excused_count': excused,
            'attendance_rate': round(attendance_rate, 2)
        }

        return Response(report)

    @action(detail=False, methods=['get'], url_path='course-report')
    def course_report(self, request):
        """
        Get attendance report for a course.
        Query params: course_id, start_date, end_date
        """
        course_id = request.query_params.get('course_id')

        if not course_id:
            return Response({'error': 'course_id est requis.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response({'error': 'Cours non trouvé.'}, status=status.HTTP_404_NOT_FOUND)
        if not manages_course(request.user, course):
            return Response({'error': 'Permission refusée.'}, status=status.HTTP_403_FORBIDDEN)

        # Get all students enrolled in the course
        enrolled_students = course.enrollments.filter(is_active=True).values_list('student_id', flat=True)

        # Get attendance data
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        query = Q(course=course)
        if start_date:
            query &= Q(date__gte=start_date)
        if end_date:
            query &= Q(date__lte=end_date)

        attendances = self.get_queryset().filter(query)

        # Get unique dates (sessions)
        total_sessions = attendances.values('date').distinct().count()

        # Calculate per-student statistics
        students_report = []
        for student_id in enrolled_students:
            student = User.objects.get(id=student_id)
            student_attendances = attendances.filter(student_id=student_id)

            total = student_attendances.count()
            present = student_attendances.filter(status='present').count()
            absent = student_attendances.filter(status='absent').count()
            late = student_attendances.filter(status='retard').count()
            excused = student_attendances.filter(status='excuse').count()

            attendance_rate = (present / total * 100) if total > 0 else 0

            students_report.append({
                'student_id': student.id,
                'student_name': student.get_full_name(),
                'student_matricule': student.matricule,
                'total_sessions': total,
                'present_count': present,
                'absent_count': absent,
                'late_count': late,
                'excused_count': excused,
                'attendance_rate': round(attendance_rate, 2)
            })

        # Calculate average attendance rate
        avg_rate = sum([s['attendance_rate'] for s in students_report]) / len(students_report) if students_report else 0

        report = {
            'course_id': course.id,
            'course_name': course.name,
            'course_code': course.code,
            'total_sessions': total_sessions,
            'total_students': len(enrolled_students),
            'average_attendance_rate': round(avg_rate, 2),
            'students': students_report
        }

        return Response(report)


class AttendanceSessionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing attendance sessions"""
    queryset = AttendanceSession.objects.select_related('course', 'created_by').all()
    serializer_class = AttendanceSessionSerializer
    permission_classes = [IsAuthenticated]  # Changed from IsTeacherOrAdmin to allow all authenticated users (will check role in queryset)
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['course', 'date', 'is_finalized']
    ordering_fields = ['date', 'start_time']

    def get_queryset(self):
        """Filter sessions based on user role"""
        user = self.request.user
        queryset = AttendanceSession.objects.select_related('course', 'created_by').all()

        # Filter based on user role
        if user.role == 'etudiant':
            # Students see sessions from their courses
            queryset = queryset.filter(course__auditoire=user.auditoire)
        elif user.role in ['enseignant', 'assistant']:
            # Teachers see sessions from their courses
            from django.db.models import Q
            queryset = queryset.filter(
                Q(course__titulaire=user) | Q(course__assistants=user)
            )
        elif user.role == 'chef_departement' and user.filiere_id:
            queryset = queryset.filter(course__auditoire__filiere_id=user.filiere_id)
        elif user.role == 'chef_section' and user.section_id:
            queryset = queryset.filter(course__auditoire__filiere__section_id=user.section_id)
        elif not (user.is_superuser or user.role in ['pdg', 'sga', 'sgad', 'directeur_general']):
            queryset = queryset.none()

        return queryset.distinct()

    def get_permissions(self):
        # Les séances alimentent la paie des enseignants : seuls les enseignants du cours
        # (ou leurs chefs / le SGA) les créent, modifient et clôturent.
        if self.action in ['list', 'retrieve', 'my_sessions']:
            return [IsAuthenticated()]
        return [IsTeachingStaff()]

    def _check(self, course):
        if not manages_course(self.request.user, course):
            raise PermissionDenied("Vous ne pouvez gérer que les séances de vos propres cours.")

    def perform_create(self, serializer):
        """Set created_by to current user"""
        self._check(serializer.validated_data.get('course'))
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        if serializer.instance.is_finalized:
            raise ValidationError("Une séance clôturée ne peut plus être modifiée.")
        self._check(serializer.validated_data.get('course', serializer.instance.course))
        serializer.save()

    def perform_destroy(self, instance):
        self._check(instance.course)
        if instance.is_finalized:
            raise ValidationError("Une séance clôturée ne peut pas être supprimée.")
        instance.delete(user=self.request.user)

    @action(detail=False, methods=['get'], url_path='my_sessions')
    def my_sessions(self, request):
        """Get sessions relevant to the current user (alias — uses role-filtered queryset)"""
        qs = self.get_queryset().order_by('-date', '-start_time')
        serializer = AttendanceSessionSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='finalize')
    def finalize(self, request, pk=None):
        """Finalize an attendance session (make it read-only)"""
        session = self.get_object()
        self._check(session.course)

        if session.is_finalized:
            return Response({'error': 'Cette séance est déjà finalisée.'}, status=status.HTTP_400_BAD_REQUEST)

        session.is_finalized = True
        session.save()

        return Response({
            'message': 'Séance finalisée avec succès.',
            'session': AttendanceSessionSerializer(session).data
        })
