"""
ViewSets for grades, averages, bulletins, academic configuration — with role-based access control.
"""
from collections import defaultdict
from decimal import Decimal
from django.db.models import Avg, Sum, Q, Count, Max
from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import AcademicConfig, GradeCategory, CourseGradeWeight, Grade, ExamSession, Transcript
from .serializers import (
    AcademicConfigSerializer, GradeCategorySerializer, CourseGradeWeightSerializer,
    GradeSerializer, ExamSessionSerializer, TranscriptSerializer
)
from apps.users.permissions import IsTeacherOrAdmin, IsSGAOrAdmin, IsAdminUser


def _is_admin(user):
    return user.is_staff or user.role in ['iadmin', 'pdg', 'directeur_general', 'sga', 'sgad']


def _is_teacher(user):
    return user.role in ['enseignant', 'assistant', 'chef_section', 'chef_departement']


def _can_access_course(user, course):
    if _is_admin(user):
        return True
    if user.role == 'etudiant':
        return user.auditoire_id == course.auditoire_id
    if user.role in ['enseignant', 'assistant']:
        return course.titulaire_id == user.id or course.assistants.filter(id=user.id).exists()
    if user.role == 'chef_section':
        section_id = getattr(user, 'section_id', None) or getattr(getattr(user, 'managed_section', None), 'id', None)
        return bool(section_id and course.auditoire.filiere.section_id == section_id)
    if user.role == 'chef_departement':
        filiere_id = getattr(user, 'filiere_id', None) or getattr(getattr(user, 'managed_filiere', None), 'id', None)
        return bool(filiere_id and course.auditoire.filiere_id == filiere_id)
    return False


def _course_students(course):
    from apps.users.models import User
    return User.objects.filter(
        role='etudiant',
        auditoire=course.auditoire,
        is_active=True,
    ).order_by('last_name', 'first_name', 'id')


def _current_semester_year(auditoire):
    config = AcademicConfig.load()
    return (
        config.current_semester or 'courant',
        auditoire.annee_academique or config.current_academic_year,
    )


def _accessible_transcript_auditoires(user):
    from apps.auditoires.models import Auditoire
    from apps.courses.models import Course

    if _is_admin(user):
        return Auditoire.objects.filter(courses__is_active=True).distinct()

    if user.role in ['enseignant', 'assistant']:
        ids = Course.objects.filter(
            Q(titulaire=user) | Q(assistants=user),
            is_active=True,
        ).values_list('auditoire_id', flat=True)
        return Auditoire.objects.filter(id__in=ids).distinct()

    if user.role == 'chef_section':
        section_id = getattr(user, 'section_id', None) or getattr(getattr(user, 'managed_section', None), 'id', None)
        return Auditoire.objects.filter(filiere__section_id=section_id, courses__is_active=True).distinct()

    if user.role == 'chef_departement':
        filiere_id = getattr(user, 'filiere_id', None) or getattr(getattr(user, 'managed_filiere', None), 'id', None)
        return Auditoire.objects.filter(filiere_id=filiere_id, courses__is_active=True).distinct()

    if user.role == 'etudiant' and getattr(user, 'auditoire_id', None):
        return Auditoire.objects.filter(id=user.auditoire_id, courses__is_active=True).distinct()

    return Auditoire.objects.none()


def _ensure_transcripts_for_auditoires(auditoires):
    from apps.courses.models import Course

    for auditoire in auditoires.distinct():
        if not Course.objects.filter(auditoire=auditoire, is_active=True).exists():
            continue
        for student in _course_students(auditoire.courses.first()):
            _recompute_transcript(student, auditoire)


# ═══════════════════════════════════════════════════════════════════════════
# Academic Config (singleton) + Calculation Endpoints
# ═══════════════════════════════════════════════════════════════════════════

class AcademicConfigViewSet(viewsets.ViewSet):
    """
    Singleton academic configuration + calculation endpoints.
    GET  /grades/config/         → current config
    PUT  /grades/config/1/       → update config
    GET  /grades/config/course_hours/?course_id=X   → hours for a course
    GET  /grades/config/teacher_hours/?user_id=X&mois=M&annee=Y  → teacher prestation
    GET  /grades/config/course_averages/?course_id=X  → average per student for a course
    GET  /grades/config/auditoire_averages/?auditoire_id=X  → averages for all students in auditoire
    GET  /grades/config/auditoire_ranking/?auditoire_id=X  → ranking
    """
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """GET /grades/config/ → return the singleton config."""
        config = AcademicConfig.load()
        return Response(AcademicConfigSerializer(config).data)

    def retrieve(self, request, pk=None):
        """GET /grades/config/1/ → same as list."""
        config = AcademicConfig.load()
        return Response(AcademicConfigSerializer(config).data)

    def update(self, request, pk=None):
        """PUT /grades/config/1/ → update config. SGA/Admin only."""
        if not _is_admin(request.user):
            return Response({'error': 'Permission refusée.'}, status=status.HTTP_403_FORBIDDEN)
        config = AcademicConfig.load()
        serializer = AcademicConfigSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        return Response(serializer.data)

    def partial_update(self, request, pk=None):
        """PATCH /grades/config/1/ → partial update."""
        return self.update(request, pk)

    # ── Course Hours ──────────────────────────────────────────────────────
    @action(detail=False, methods=['get'], url_path='course_hours')
    def course_hours(self, request):
        """Calculate total planned hours for a course based on credits × hours_per_credit."""
        from apps.courses.models import Course as CourseModel
        course_id = request.query_params.get('course_id')
        if not course_id:
            return Response({'error': 'course_id requis.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            course = CourseModel.objects.get(pk=course_id)
        except CourseModel.DoesNotExist:
            return Response({'error': 'Cours non trouvé.'}, status=status.HTTP_404_NOT_FOUND)

        config = AcademicConfig.load()
        total_hours = config.get_course_total_hours(course)

        # Get taught hours from attendance sessions
        from apps.courses.attendance_models import AttendanceSession
        sessions = AttendanceSession.objects.filter(course=course, is_finalized=True)
        taught = 0
        for s in sessions:
            if s.start_time and s.end_time:
                from datetime import timedelta
                start_dt = timedelta(hours=s.start_time.hour, minutes=s.start_time.minute)
                end_dt = timedelta(hours=s.end_time.hour, minutes=s.end_time.minute)
                diff = (end_dt - start_dt).total_seconds() / 3600
                taught += max(diff, 0)

        return Response({
            'course_id': course.id,
            'course_name': course.name,
            'course_code': course.code,
            'credits': course.credits,
            'hours_per_credit': config.hours_per_credit,
            'total_planned_hours': total_hours,
            'total_taught_hours': round(taught, 2),
            'completion_percentage': round((taught / total_hours * 100), 2) if total_hours > 0 else 0,
            'remaining_hours': round(max(total_hours - taught, 0), 2),
        })

    # ── Teacher Hours / Prestation ────────────────────────────────────────
    @action(detail=False, methods=['get'], url_path='teacher_hours')
    def teacher_hours(self, request):
        """
        Calculate teacher prestation: planned hours vs taught hours.
        Query params: user_id (required), mois, annee (optional filters).
        Returns per-course breakdown + totals.
        """
        from apps.courses.models import Course as CourseModel
        from apps.courses.attendance_models import AttendanceSession
        from apps.users.models import User
        from datetime import timedelta

        user_id = request.query_params.get('user_id')
        mois = request.query_params.get('mois')
        annee = request.query_params.get('annee')

        if not user_id:
            return Response({'error': 'user_id requis.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            teacher = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'error': 'Utilisateur non trouvé.'}, status=status.HTTP_404_NOT_FOUND)

        config = AcademicConfig.load()

        courses = CourseModel.objects.filter(
            Q(titulaire=teacher) | Q(assistants=teacher),
            is_active=True
        ).distinct()

        course_details = []
        total_planned = 0
        total_taught = 0

        for course in courses:
            planned = course.credits * config.hours_per_credit
            total_planned += planned

            sessions = AttendanceSession.objects.filter(course=course, is_finalized=True)
            if mois and annee:
                sessions = sessions.filter(date__month=int(mois), date__year=int(annee))
            elif annee:
                sessions = sessions.filter(date__year=int(annee))

            taught = 0
            session_count = sessions.count()
            for s in sessions:
                if s.start_time and s.end_time:
                    start_dt = timedelta(hours=s.start_time.hour, minutes=s.start_time.minute)
                    end_dt = timedelta(hours=s.end_time.hour, minutes=s.end_time.minute)
                    diff = (end_dt - start_dt).total_seconds() / 3600
                    taught += max(diff, 0)

            total_taught += taught

            course_details.append({
                'course_id': course.id,
                'course_name': course.name,
                'course_code': course.code,
                'credits': course.credits,
                'planned_hours': planned,
                'taught_hours': round(taught, 2),
                'sessions_count': session_count,
                'completion': round((taught / planned * 100), 2) if planned > 0 else 0,
            })

        return Response({
            'teacher_id': teacher.id,
            'teacher_name': teacher.get_full_name(),
            'hours_per_credit': config.hours_per_credit,
            'total_planned_hours': total_planned,
            'total_taught_hours': round(total_taught, 2),
            'overall_completion': round((total_taught / total_planned * 100), 2) if total_planned > 0 else 0,
            'courses': course_details,
            'filters': {'mois': mois, 'annee': annee},
        })

    # ── Course Averages ───────────────────────────────────────────────────
    @action(detail=False, methods=['get'], url_path='course_averages')
    def course_averages(self, request):
        """
        Calculate weighted averages for all students in a course.
        Uses CourseGradeWeight overrides, falls back to GradeCategory.weight.
        """
        course_id = request.query_params.get('course_id')
        if not course_id:
            return Response({'error': 'course_id requis.'}, status=status.HTTP_400_BAD_REQUEST)

        config = AcademicConfig.load()
        grades = Grade.objects.filter(
            course_id=course_id,
            status='validated',
        ).select_related('student', 'category')

        # Build weight map: category_id → weight
        overrides = {
            cw.category_id: float(cw.weight)
            for cw in CourseGradeWeight.objects.filter(course_id=course_id)
        }

        # Group by student → category → grades
        student_data = defaultdict(lambda: defaultdict(list))
        for g in grades:
            student_data[g.student_id][g.category_id].append(g)

        results = []
        for student_id, cat_groups in student_data.items():
            student = None
            weighted_sum = 0
            total_weight = 0

            for cat_id, grds in cat_groups.items():
                student = grds[0].student
                weight = overrides.get(cat_id, float(grds[0].category.weight))
                cat_avg = sum(g.percentage for g in grds) / len(grds)
                weighted_sum += cat_avg * weight
                total_weight += weight

            average = round(weighted_sum / total_weight, 2) if total_weight > 0 else 0
            # Convert percentage to grade scale
            grade_value = round(average * float(config.max_grade) / 100, 2)
            passed = grade_value >= float(config.passing_grade)

            results.append({
                'student_id': student_id,
                'student_name': student.get_full_name() if student else '',
                'student_matricule': getattr(student, 'matricule', '') if student else '',
                'average_percentage': average,
                'average_grade': grade_value,
                'max_grade': float(config.max_grade),
                'passed': passed,
                'grade_count': sum(len(g) for g in cat_groups.values()),
            })

        # Sort by average descending (ranking)
        results.sort(key=lambda x: x['average_percentage'], reverse=True)
        for i, r in enumerate(results):
            r['rank'] = i + 1

        # Course-level stats
        all_avgs = [r['average_percentage'] for r in results]
        course_avg = round(sum(all_avgs) / len(all_avgs), 2) if all_avgs else 0
        pass_count = sum(1 for r in results if r['passed'])

        return Response({
            'course_id': int(course_id),
            'config': {
                'max_grade': float(config.max_grade),
                'passing_grade': float(config.passing_grade),
                'passing_percentage': float(config.passing_percentage),
            },
            'course_average': course_avg,
            'total_students': len(results),
            'passed_count': pass_count,
            'failed_count': len(results) - pass_count,
            'success_rate': round((pass_count / len(results) * 100), 2) if results else 0,
            'students': results,
        })

    # ── Auditoire Averages & Ranking ──────────────────────────────────────
    @action(detail=False, methods=['get'], url_path='auditoire_averages')
    def auditoire_averages(self, request):
        """
        Calculate overall averages for all students in an auditoire.
        Groups by course, computes weighted average per course, then overall average.
        """
        from apps.auditoires.models import Auditoire
        from apps.courses.models import Course as CourseModel

        auditoire_id = request.query_params.get('auditoire_id')
        if not auditoire_id:
            return Response({'error': 'auditoire_id requis.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            auditoire = Auditoire.objects.get(pk=auditoire_id)
        except Auditoire.DoesNotExist:
            return Response({'error': 'Auditoire non trouvé.'}, status=status.HTTP_404_NOT_FOUND)

        config = AcademicConfig.load()
        courses = CourseModel.objects.filter(auditoire=auditoire, is_active=True)

        # Get all grades for courses in this auditoire
        grades = Grade.objects.filter(
            course__in=courses,
            status='validated',
        ).select_related('student', 'course', 'category')

        # Build weight overrides for all courses
        all_overrides = {}
        for cw in CourseGradeWeight.objects.filter(course__in=courses):
            all_overrides.setdefault(cw.course_id, {})[cw.category_id] = float(cw.weight)

        # Group: student → course → category → grades
        student_courses = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
        for g in grades:
            student_courses[g.student_id][g.course_id][g.category_id].append(g)

        students_results = []
        for student_id, courses_data in student_courses.items():
            student_obj = None
            course_averages = []
            total_credits = 0
            credit_weighted_sum = 0

            for course_id, cat_groups in courses_data.items():
                course_obj = None
                weighted_sum = 0
                total_weight = 0
                course_overrides = all_overrides.get(course_id, {})

                for cat_id, grds in cat_groups.items():
                    student_obj = grds[0].student
                    course_obj = grds[0].course
                    weight = course_overrides.get(cat_id, float(grds[0].category.weight))
                    cat_avg = sum(g.percentage for g in grds) / len(grds)
                    weighted_sum += cat_avg * weight
                    total_weight += weight

                avg_pct = round(weighted_sum / total_weight, 2) if total_weight > 0 else 0
                avg_grade = round(avg_pct * float(config.max_grade) / 100, 2)
                passed = avg_grade >= float(config.passing_grade)
                credits = course_obj.credits if course_obj else 0

                course_averages.append({
                    'course_id': course_id,
                    'course_name': course_obj.name if course_obj else '',
                    'credits': credits,
                    'average_percentage': avg_pct,
                    'average_grade': avg_grade,
                    'passed': passed,
                })

                total_credits += credits
                credit_weighted_sum += avg_pct * credits

            overall_avg = round(credit_weighted_sum / total_credits, 2) if total_credits > 0 else 0
            overall_grade = round(overall_avg * float(config.max_grade) / 100, 2)
            validated_credits = sum(c['credits'] for c in course_averages if c['passed'])

            students_results.append({
                'student_id': student_id,
                'student_name': student_obj.get_full_name() if student_obj else '',
                'student_matricule': getattr(student_obj, 'matricule', '') if student_obj else '',
                'overall_average_percentage': overall_avg,
                'overall_average_grade': overall_grade,
                'total_credits': total_credits,
                'validated_credits': validated_credits,
                'courses': course_averages,
            })

        # Ranking by overall average
        students_results.sort(key=lambda x: x['overall_average_percentage'], reverse=True)
        for i, s in enumerate(students_results):
            s['rank'] = i + 1

        all_avgs = [s['overall_average_percentage'] for s in students_results]
        auditoire_avg = round(sum(all_avgs) / len(all_avgs), 2) if all_avgs else 0

        return Response({
            'auditoire_id': int(auditoire_id),
            'auditoire_name': auditoire.nom,
            'config': {
                'max_grade': float(config.max_grade),
                'passing_grade': float(config.passing_grade),
                'hours_per_credit': config.hours_per_credit,
            },
            'auditoire_average': auditoire_avg,
            'total_students': len(students_results),
            'students': students_results,
        })


class GradeCategoryViewSet(viewsets.ModelViewSet):
    queryset = GradeCategory.objects.all()
    serializer_class = GradeCategorySerializer

    def get_permissions(self):
        if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return [IsAuthenticated()]
        # SGA and teachers can create/update categories
        return [IsTeacherOrAdmin()]


class CourseGradeWeightViewSet(viewsets.ModelViewSet):
    """Per-course weight overrides (SGA / teacher)."""
    serializer_class = CourseGradeWeightSerializer

    def get_permissions(self):
        if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return [IsAuthenticated()]
        return [IsTeacherOrAdmin()]

    def get_queryset(self):
        user = self.request.user
        qs = CourseGradeWeight.objects.select_related('course', 'category')
        course_id = self.request.query_params.get('course')
        if course_id:
            qs = qs.filter(course_id=course_id)
        if _is_admin(user):
            return qs
        if _is_teacher(user):
            from apps.courses.models import Course as CourseModel
            teacher_courses = CourseModel.objects.filter(
                Q(titulaire=user) | Q(assistants=user)
            ).values_list('id', flat=True)
            return qs.filter(course__in=teacher_courses)
        return qs.none()


class GradeViewSet(viewsets.ModelViewSet):
    serializer_class = GradeSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'bulk_assessment']:
            return [IsTeacherOrAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = Grade.objects.select_related('student', 'course', 'category')

        if _is_admin(user):
            return qs.all()

        if _is_teacher(user):
            # Teachers see grades only for courses they own or assist
            from apps.courses.models import Course
            from django.db.models import Q
            teacher_courses = Course.objects.filter(
                Q(titulaire=user) | Q(assistants=user)
            ).values_list('id', flat=True)
            # Also include courses in the teacher's section/filiere
            if user.role == 'chef_section' and user.section:
                section_courses = Course.objects.filter(
                    auditoire__filiere__section=user.section
                ).values_list('id', flat=True)
                teacher_courses = list(teacher_courses) + list(section_courses)
            elif user.role == 'chef_departement' and user.filiere:
                dept_courses = Course.objects.filter(
                    auditoire__filiere=user.filiere
                ).values_list('id', flat=True)
                teacher_courses = list(teacher_courses) + list(dept_courses)
            return qs.filter(course__in=teacher_courses)

        # Students see only their own validated grades
        if user.role == 'etudiant':
            return qs.filter(student=user, status='validated')

        return qs.none()

    def perform_create(self, serializer):
        """When a grade is saved, auto-update the transcript."""
        grade = serializer.save()
        _recompute_transcript(grade.student, grade.course.auditoire)

    def perform_update(self, serializer):
        grade = serializer.save()
        _recompute_transcript(grade.student, grade.course.auditoire)

    @action(detail=False, methods=['get'], url_path='my-grades')
    def my_grades(self, request):
        """Shortcut for students to fetch only their grades, grouped by course."""
        if request.user.role != 'etudiant':
            return Response({'error': 'Réservé aux étudiants.'}, status=status.HTTP_403_FORBIDDEN)

        grades = Grade.objects.filter(
            student=request.user,
            status='validated',
        ).select_related('course', 'category')
        result = {}
        for g in grades:
            course_key = str(g.course_id)
            if course_key not in result:
                result[course_key] = {
                    'course_id': g.course_id,
                    'course_name': g.course.name,
                    'course_code': g.course.code,
                    'grades': [],
                    'average': None,
                }
            result[course_key]['grades'].append({
                'id':           g.id,
                'category_id':  g.category_id,
                'category':     g.category.name,
                'category_type': g.category.category_type,
                'label':        g.label or f"#{g.session_number}",
                'session_number': g.session_number,
                'weight':       float(g.category.weight),   # overridden below
                'value':        float(g.value),
                'max_value':    float(g.max_value),
                'percentage':   g.percentage,
                'status':       g.status,
            })

        # Apply per-course weight overrides and compute weighted average
        for course_key, course_data in result.items():
            course_id = course_data['course_id']
            # Build category-id → override weight map
            overrides = {
                str(cw.category_id): float(cw.weight)
                for cw in CourseGradeWeight.objects.filter(course_id=course_id)
            }
            # Override weights where available
            for g in course_data['grades']:
                if str(g['category_id']) in overrides:
                    g['weight'] = overrides[str(g['category_id'])]

            # Group by category to average multiple grades of same type (e.g. two interros)
            # Then compute weighted average across categories
            from collections import defaultdict
            category_groups = defaultdict(list)
            for g in course_data['grades']:
                category_groups[g['category_id']].append(g)

            total_weight = 0
            weighted_sum = 0
            for cat_id, grds in category_groups.items():
                cat_weight = grds[0]['weight']
                total_weight += cat_weight
                # Average the percentages within this category
                cat_avg = sum(g['percentage'] for g in grds) / len(grds)
                weighted_sum += cat_avg * cat_weight

            if total_weight > 0:
                course_data['average'] = round(weighted_sum / total_weight, 2)

        return Response(list(result.values()))

    @action(detail=False, methods=['get'], url_path='student/(?P<student_id>[0-9]+)')
    def student_grades(self, request, student_id=None):
        """Admin/teacher endpoint to get all grades for a specific student."""
        user = request.user
        if not (_is_admin(user) or _is_teacher(user)):
            return Response({'error': 'Permission refusée.'}, status=status.HTTP_403_FORBIDDEN)

        grades = Grade.objects.filter(student_id=student_id, status='validated').select_related('course', 'category')
        if _is_teacher(user):
            from apps.courses.models import Course
            from django.db.models import Q
            teacher_courses = Course.objects.filter(
                Q(titulaire=user) | Q(assistants=user)
            ).values_list('id', flat=True)
            grades = grades.filter(course__in=teacher_courses)

        serializer = GradeSerializer(grades, many=True)
        return Response(serializer.data)

    def _get_accessible_course(self, request):
        from apps.courses.models import Course

        course_id = request.query_params.get('course') or request.data.get('course')
        if not course_id:
            return None, Response({'error': 'course requis.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            course = Course.objects.select_related(
                'auditoire', 'auditoire__filiere', 'auditoire__filiere__section', 'titulaire'
            ).prefetch_related('assistants').get(pk=course_id)
        except Course.DoesNotExist:
            return None, Response({'error': 'Cours non trouve.'}, status=status.HTTP_404_NOT_FOUND)

        if not _can_access_course(request.user, course):
            return None, Response({'error': 'Permission refusee.'}, status=status.HTTP_403_FORBIDDEN)

        return course, None

    def _students_for_assessment_view(self, request, course):
        students = _course_students(course)
        if request.user.role == 'etudiant':
            students = students.filter(pk=request.user.pk)
        return students

    @action(detail=False, methods=['get'], url_path='course-assessments')
    def course_assessments(self, request):
        """List all assessments/results connected to a course."""
        course, error_response = self._get_accessible_course(request)
        if error_response:
            return error_response

        students_count = _course_students(course).count()
        assessments = []

        try:
            from apps.assignments.models import Assignment
            assignments = Assignment.objects.filter(course=course).prefetch_related('submissions')
            assignment_ids = list(assignments.values_list('id', flat=True))
        except Exception:
            assignments = []
            assignment_ids = []

        try:
            from apps.quiz.models import Quiz
            quizzes = Quiz.objects.filter(course=course).prefetch_related('attempts')
            quiz_ids = list(quizzes.values_list('id', flat=True))
        except Exception:
            quizzes = []
            quiz_ids = []

        manual_qs = Grade.objects.filter(course=course).select_related('category')
        if assignment_ids:
            manual_qs = manual_qs.exclude(category__category_type='tp_td', session_number__in=assignment_ids)
        if quiz_ids:
            manual_qs = manual_qs.exclude(category__category_type='quiz', session_number__in=quiz_ids)

        manual_groups = {}
        for grade in manual_qs:
            key = (grade.category_id, grade.session_number, grade.label or '')
            group = manual_groups.setdefault(key, {
                'source': 'manual',
                'id': f'manual-{grade.category_id}-{grade.session_number}-{grade.label or ""}',
                'course': course.id,
                'category': grade.category_id,
                'category_name': grade.category.name,
                'category_type': grade.category.category_type,
                'title': grade.label or grade.category.name,
                'label': grade.label,
                'session_number': grade.session_number,
                'max_value': float(grade.max_value),
                'students_count': students_count,
                'graded_count': 0,
                'validated_count': 0,
                'draft_count': 0,
                'values': [],
                'date': grade.date,
                'online': False,
            })
            group['graded_count'] += 1
            group['validated_count'] += 1 if grade.status == 'validated' else 0
            group['draft_count'] += 1 if grade.status == 'draft' else 0
            group['values'].append(grade.percentage)
            if grade.date and (not group['date'] or grade.date > group['date']):
                group['date'] = grade.date

        for group in manual_groups.values():
            values = group.pop('values')
            group['average_percentage'] = round(sum(values) / len(values), 2) if values else 0
            group['status'] = 'draft' if group['draft_count'] else 'validated'
            group['date'] = group['date'].isoformat() if group['date'] else None
            assessments.append(group)

        for assignment in assignments:
            max_points = float(assignment.max_points or 0)
            values = [
                (float(submission.score) / max_points) * 100
                for submission in assignment.submissions.all()
                if submission.score is not None and max_points > 0
            ]
            assessments.append({
                'source': 'assignment',
                'id': assignment.id,
                'course': course.id,
                'category': None,
                'category_name': assignment.assignment_type,
                'category_type': 'tp_td',
                'title': assignment.title,
                'label': assignment.title,
                'session_number': assignment.id,
                'max_value': max_points,
                'students_count': students_count,
                'graded_count': len(values),
                'validated_count': len(values),
                'draft_count': 0,
                'average_percentage': round(sum(values) / len(values), 2) if values else 0,
                'date': assignment.due_date.isoformat() if assignment.due_date else None,
                'status': assignment.status,
                'online': assignment.submission_type in ['electronic', 'both'],
            })

        for quiz in quizzes:
            max_points = float(quiz.max_points or 0)
            values = [
                (float(attempt.score) / max_points) * 100
                for attempt in quiz.attempts.all()
                if attempt.score is not None and max_points > 0
            ]
            assessments.append({
                'source': 'quiz',
                'id': quiz.id,
                'course': course.id,
                'category': None,
                'category_name': quiz.get_quiz_type_display(),
                'category_type': 'quiz',
                'title': quiz.title,
                'label': quiz.title,
                'session_number': quiz.id,
                'max_value': max_points,
                'students_count': students_count,
                'graded_count': len(values),
                'validated_count': len(values),
                'draft_count': 0,
                'average_percentage': round(sum(values) / len(values), 2) if values else 0,
                'date': quiz.end_date.isoformat() if quiz.end_date else None,
                'status': quiz.status,
                'online': True,
            })

        assessments.sort(key=lambda item: (item.get('date') or '', str(item.get('title') or '')), reverse=True)
        return Response({'course': course.id, 'students_count': students_count, 'assessments': assessments})

    @action(detail=False, methods=['get'], url_path='assessment-detail')
    def assessment_detail(self, request):
        """Return students and marks for one assessment."""
        course, error_response = self._get_accessible_course(request)
        if error_response:
            return error_response

        source = request.query_params.get('source', 'manual')
        assessment_id = request.query_params.get('id')
        students = self._students_for_assessment_view(request, course)

        def student_base(student):
            return {
                'student': student.id,
                'student_name': student.get_full_name() or student.email,
                'student_email': student.email,
                'matricule': getattr(student, 'matricule', '') or '',
            }

        if source == 'assignment':
            from apps.assignments.models import Assignment
            try:
                assignment = Assignment.objects.get(pk=assessment_id, course=course)
            except Assignment.DoesNotExist:
                return Response({'error': 'TP/TD non trouve.'}, status=status.HTTP_404_NOT_FOUND)

            submissions = {
                submission.student_id: submission
                for submission in assignment.submissions.select_related('student').all()
            }
            max_points = float(assignment.max_points or 0)
            rows = []
            for student in students:
                submission = submissions.get(student.id)
                pct = round(float(submission.score) / max_points * 100, 2) if submission and submission.score is not None and max_points > 0 else None
                row = student_base(student)
                row.update({
                    'value': float(submission.score) if submission and submission.score is not None else None,
                    'max_value': max_points,
                    'percentage': pct,
                    'status': submission.status if submission else 'missing',
                    'comment': submission.feedback if submission else '',
                    'grade_id': None,
                })
                rows.append(row)
            return Response({'source': source, 'assessment': assessment_id, 'course': course.id, 'students': rows})

        if source == 'quiz':
            from apps.quiz.models import Quiz
            try:
                quiz = Quiz.objects.get(pk=assessment_id, course=course)
            except Quiz.DoesNotExist:
                return Response({'error': 'Quiz non trouve.'}, status=status.HTTP_404_NOT_FOUND)

            latest_attempts = {}
            attempts = quiz.attempts.select_related('student').order_by('student_id', '-attempt_number', '-started_at')
            for attempt in attempts:
                latest_attempts.setdefault(attempt.student_id, attempt)

            max_points = float(quiz.max_points or 0)
            rows = []
            for student in students:
                attempt = latest_attempts.get(student.id)
                pct = round(float(attempt.score) / max_points * 100, 2) if attempt and attempt.score is not None and max_points > 0 else None
                row = student_base(student)
                row.update({
                    'value': float(attempt.score) if attempt and attempt.score is not None else None,
                    'max_value': max_points,
                    'percentage': pct,
                    'status': attempt.status if attempt else 'missing',
                    'comment': attempt.feedback if attempt else '',
                    'grade_id': None,
                })
                rows.append(row)
            return Response({'source': source, 'assessment': assessment_id, 'course': course.id, 'students': rows})

        category_id = request.query_params.get('category')
        session_number = request.query_params.get('session_number')
        if not category_id or not session_number:
            return Response({'error': 'category et session_number requis.'}, status=status.HTTP_400_BAD_REQUEST)

        grades = Grade.objects.filter(
            course=course,
            category_id=category_id,
            session_number=session_number,
        ).select_related('student', 'category')
        grades_list = list(grades)
        grades_by_student = {grade.student_id: grade for grade in grades_list}

        rows = []
        for student in students:
            grade = grades_by_student.get(student.id)
            row = student_base(student)
            row.update({
                'grade_id': grade.id if grade else None,
                'value': float(grade.value) if grade else None,
                'max_value': float(grade.max_value) if grade else None,
                'percentage': grade.percentage if grade else None,
                'status': grade.status if grade else 'missing',
                'comment': grade.comment if grade else '',
            })
            rows.append(row)

        first_grade = grades_list[0] if grades_list else None
        return Response({
            'source': source,
            'assessment': {
                'category': int(category_id),
                'session_number': int(session_number),
                'label': first_grade.label if first_grade else request.query_params.get('label', ''),
                'category_name': first_grade.category.name if first_grade else '',
                'category_type': first_grade.category.category_type if first_grade else '',
            },
            'course': course.id,
            'students': rows,
        })

    @action(detail=False, methods=['post'], url_path='bulk-assessment')
    def bulk_assessment(self, request):
        """Create/update a whole offline assessment for all students in a course."""
        course, error_response = self._get_accessible_course(request)
        if error_response:
            return error_response

        if request.user.role == 'etudiant':
            return Response({'error': 'Permission refusee.'}, status=status.HTTP_403_FORBIDDEN)

        category_id = request.data.get('category')
        if not category_id:
            return Response({'error': 'category requis.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            category = GradeCategory.objects.get(pk=category_id)
        except GradeCategory.DoesNotExist:
            return Response({'error': 'Categorie non trouvee.'}, status=status.HTTP_404_NOT_FOUND)

        if category.category_type == 'quiz':
            return Response(
                {'error': 'Les quiz en ligne doivent etre crees depuis le module Quiz.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            max_value = Decimal(str(request.data.get('max_value') or 20))
        except Exception:
            return Response({'error': 'max_value invalide.'}, status=status.HTTP_400_BAD_REQUEST)
        if max_value <= 0:
            return Response({'error': 'max_value doit etre positif.'}, status=status.HTTP_400_BAD_REQUEST)

        requested_status = request.data.get('status') or 'draft'
        if requested_status not in ['draft', 'validated']:
            return Response({'error': 'status invalide.'}, status=status.HTTP_400_BAD_REQUEST)

        entries = request.data.get('entries') or []
        if not isinstance(entries, list):
            return Response({'error': 'entries doit etre une liste.'}, status=status.HTTP_400_BAD_REQUEST)

        session_number = request.data.get('session_number')
        if session_number in [None, '']:
            current_max = Grade.objects.filter(course=course, category=category).aggregate(value=Max('session_number'))['value'] or 0
            session_number = current_max + 1
        else:
            try:
                session_number = int(session_number)
            except (TypeError, ValueError):
                return Response({'error': 'session_number invalide.'}, status=status.HTTP_400_BAD_REQUEST)

        label = (request.data.get('label') or category.name).strip()
        valid_student_ids = set(_course_students(course).values_list('id', flat=True))
        touched_students = set()
        saved_count = 0
        deleted_count = 0

        with transaction.atomic():
            for entry in entries:
                student_id = entry.get('student') or entry.get('student_id')
                if student_id is None:
                    continue
                try:
                    student_id = int(student_id)
                except (TypeError, ValueError):
                    return Response({'error': 'student invalide.'}, status=status.HTTP_400_BAD_REQUEST)
                if student_id not in valid_student_ids:
                    return Response({'error': f'Etudiant {student_id} hors auditoire du cours.'}, status=status.HTTP_400_BAD_REQUEST)

                raw_value = entry.get('value')
                if raw_value in [None, '']:
                    deleted, _ = Grade.objects.filter(
                        student_id=student_id,
                        course=course,
                        category=category,
                        session_number=session_number,
                    ).delete()
                    deleted_count += deleted
                    touched_students.add(student_id)
                    continue

                try:
                    value = Decimal(str(raw_value))
                except Exception:
                    return Response({'error': f'Note invalide pour etudiant {student_id}.'}, status=status.HTTP_400_BAD_REQUEST)
                if value < 0 or value > max_value:
                    return Response({'error': f'Note hors intervalle pour etudiant {student_id}.'}, status=status.HTTP_400_BAD_REQUEST)

                Grade.objects.update_or_create(
                    student_id=student_id,
                    course=course,
                    category=category,
                    session_number=session_number,
                    defaults={
                        'label': label,
                        'value': value,
                        'max_value': max_value,
                        'status': requested_status,
                        'comment': entry.get('comment') or '',
                    }
                )
                touched_students.add(student_id)
                saved_count += 1

            from apps.users.models import User
            for student in User.objects.filter(id__in=touched_students):
                _recompute_transcript(student, course.auditoire)
            _ensure_transcripts_for_auditoires(course.auditoire.__class__.objects.filter(pk=course.auditoire_id))

        return Response({
            'course': course.id,
            'category': category.id,
            'session_number': session_number,
            'label': label,
            'status': requested_status,
            'saved_count': saved_count,
            'deleted_count': deleted_count,
        })


def _recompute_transcript(student, auditoire):
    """
    Auto-recompute transcript average for a student in an auditoire.
    Uses CourseGradeWeight overrides where available, then falls back
    to GradeCategory.weight globals.
    Multiple grades of the same category (e.g. two interros) are averaged
    before applying the category weight.
    """
    if not student or not auditoire:
        return

    from collections import defaultdict
    from apps.courses.models import Course

    courses = Course.objects.filter(auditoire=auditoire, is_active=True)
    if not courses.exists():
        return

    grades = Grade.objects.filter(
        student=student,
        course__in=courses,
        status='validated',
    ).select_related('category', 'course')

    bucket = defaultdict(list)
    for grade in grades:
        bucket[(grade.course_id, grade.category_id)].append(grade)

    overrides = {
        (weight.course_id, weight.category_id): float(weight.weight)
        for weight in CourseGradeWeight.objects.filter(course__in=courses)
    }

    numerator = 0
    denominator = 0
    for course in courses:
        course_groups = {
            category_id: values
            for (course_id, category_id), values in bucket.items()
            if course_id == course.id
        }
        weighted_sum = 0
        total_weight = 0
        for category_id, values in course_groups.items():
            weight = overrides.get((course.id, category_id), float(values[0].category.weight))
            category_average = sum(value.percentage for value in values) / len(values)
            weighted_sum += category_average * weight
            total_weight += weight

        course_average = weighted_sum / total_weight if total_weight > 0 else 0
        credits = course.credits or 0
        numerator += course_average * credits
        denominator += credits

    average = round(numerator / denominator, 2) if denominator > 0 else 0
    semester, year = _current_semester_year(auditoire)

    Transcript.objects.update_or_create(
        student=student,
        auditoire=auditoire,
        semester=semester,
        year=year,
        defaults={'average': average}
    )


class ExamSessionViewSet(viewsets.ModelViewSet):
    serializer_class = ExamSessionSerializer

    def get_permissions(self):
        if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return [IsAuthenticated()]
        return [IsTeacherOrAdmin()]

    def get_queryset(self):
        user = self.request.user
        qs = ExamSession.objects.select_related('course', 'auditoire')

        if _is_admin(user):
            return qs.all()

        if _is_teacher(user):
            from django.db.models import Q
            from apps.courses.models import Course
            teacher_courses = Course.objects.filter(
                Q(titulaire=user) | Q(assistants=user)
            ).values_list('id', flat=True)
            return qs.filter(course__in=teacher_courses)

        # Students see exam sessions for their auditoire
        if user.role == 'etudiant' and user.auditoire:
            return qs.filter(auditoire=user.auditoire)

        return qs.none()


class TranscriptViewSet(viewsets.ModelViewSet):
    serializer_class = TranscriptSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['student', 'auditoire', 'semester', 'year']
    search_fields = [
        'student__first_name', 'student__last_name', 'student__email',
        'auditoire__nom', 'semester', 'year',
    ]
    ordering_fields = ['year', 'semester', 'average', 'created_at', 'updated_at']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSGAOrAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = Transcript.objects.select_related('student', 'auditoire').order_by(
            '-year', 'semester', 'student__last_name', 'student__first_name'
        )
        auditoires = _accessible_transcript_auditoires(user)
        auditoire_param = self.request.query_params.get('auditoire')
        if auditoire_param:
            auditoires = auditoires.filter(pk=auditoire_param)
        _ensure_transcripts_for_auditoires(auditoires)

        if _is_admin(user):
            return qs.all()

        if _is_teacher(user):
            return qs.filter(auditoire__in=auditoires)

        if user.role == 'etudiant':
            return qs.filter(student=user)

        return qs.none()

    @action(detail=False, methods=['get'], url_path='my-transcript')
    def my_transcript(self, request):
        """Student shortcut to fetch their own transcripts."""
        if request.user.role != 'etudiant':
            return Response({'error': 'Réservé aux étudiants.'}, status=status.HTTP_403_FORBIDDEN)
        if request.user.auditoire_id:
            _ensure_transcripts_for_auditoires(_accessible_transcript_auditoires(request.user))
        transcripts = Transcript.objects.filter(student=request.user).select_related('auditoire')
        serializer = TranscriptSerializer(transcripts, many=True)
        return Response(serializer.data)
