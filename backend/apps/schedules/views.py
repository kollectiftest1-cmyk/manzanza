"""
ViewSets for academic schedules and calendar with role-based access and conflict detection.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.db import models as db_models
from datetime import timedelta

from .models import (
    AcademicYear, Term, AcademicEvent,
    Room, RoomReservation, TimeSlot, Schedule, ScheduleException, TeacherAvailability
)
from .serializers import (
    AcademicYearSerializer, AcademicYearListSerializer,
    TermSerializer, TermListSerializer,
    AcademicEventSerializer,
    RoomSerializer, RoomReservationSerializer, TimeSlotSerializer, ScheduleSerializer,
    ScheduleExceptionSerializer, TeacherAvailabilitySerializer
)
from apps.users.permissions import IsSGAOrAdmin, IsTeacherOrAdmin


def _is_admin_or_sga(user):
    return user.is_staff or user.role in ['pdg', 'directeur_general', 'sga', 'sgad']


def _is_teacher(user):
    return user.role in ['enseignant', 'assistant', 'chef_section', 'chef_departement']


def _can_manage_apparitorat(user):
    return user.is_staff or user.role in [
        'pdg', 'directeur_general', 'sga', 'sgad', 'apparitorat'
    ]


# ═══════════════════════════════════════════════════════════════════════════
# ACADEMIC CALENDAR VIEWSETS
# ═══════════════════════════════════════════════════════════════════════════

class AcademicYearViewSet(viewsets.ModelViewSet):
    """
    CRUD pour les années académiques.
    Lecture: tous les utilisateurs authentifiés.
    Écriture: SGA/Admin uniquement.
    """
    def get_permissions(self):
        if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return [IsAuthenticated()]
        return [IsSGAOrAdmin()]

    def get_queryset(self):
        qs = AcademicYear.objects.prefetch_related('terms', 'events').all()
        # Filter by is_current
        is_current = self.request.query_params.get('is_current')
        if is_current is not None:
            qs = qs.filter(is_current=is_current.lower() in ('true', '1'))
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return AcademicYearListSerializer
        return AcademicYearSerializer

    @action(detail=True, methods=['post'], url_path='set-current')
    def set_current(self, request, pk=None):
        """Mark this academic year as current."""
        if not _is_admin_or_sga(request.user):
            return Response({'error': 'Permission refusée.'}, status=403)
        year = self.get_object()
        AcademicYear.objects.filter(is_current=True).update(is_current=False)
        year.is_current = True
        year.save()
        return Response(AcademicYearSerializer(year).data)

    @action(detail=True, methods=['post'], url_path='publish')
    def publish(self, request, pk=None):
        """
        Publish this academic year's calendar and notify ALL active users.
        Sets is_published=True and creates a notification for everyone.
        """
        if not _is_admin_or_sga(request.user):
            return Response({'error': 'Permission refusée.'}, status=403)
        year = self.get_object()
        year.is_published = True
        year.save()

        from apps.notifications.helpers import notify_all_active_users
        count = notify_all_active_users(
            title=f"📅 Calendrier Académique {year.name} publié",
            message=(
                f"Le calendrier académique pour l'année {year.name} "
                f"({year.start_date.strftime('%d/%m/%Y')} - {year.end_date.strftime('%d/%m/%Y')}) "
                f"a été publié. Consultez-le pour voir les dates importantes."
            ),
            notification_type='calendrier',
            priority='high',
            link='/calendrier-academique',
            related_object_id=str(year.id),
        )
        return Response({
            'message': f"Calendrier {year.name} publié avec succès.",
            'notifications_sent': count,
            'year': AcademicYearSerializer(year).data,
        })


class TermViewSet(viewsets.ModelViewSet):
    """
    CRUD pour les trimestres/semestres.
    Auto-génère les événements académiques (rentrée, blocus, examens, rattrapage)
    lorsque auto_generate_events=True.
    """
    def get_permissions(self):
        if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return [IsAuthenticated()]
        return [IsSGAOrAdmin()]

    def get_queryset(self):
        qs = Term.objects.select_related('academic_year').prefetch_related('events').all()
        year_id = self.request.query_params.get('academic_year')
        if year_id:
            qs = qs.filter(academic_year_id=year_id)
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() in ('true', '1'))
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return TermListSerializer
        return TermSerializer

    def perform_create(self, serializer):
        term = serializer.save()
        if term.auto_generate_events:
            term.generate_events()

    def perform_update(self, serializer):
        term = serializer.save()
        if term.auto_generate_events:
            term.generate_events()


class AcademicEventViewSet(viewsets.ModelViewSet):
    """
    CRUD pour les événements académiques (vacances, fériés, examens...).
    """
    serializer_class = AcademicEventSerializer

    def get_permissions(self):
        if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return [IsAuthenticated()]
        return [IsSGAOrAdmin()]

    def get_queryset(self):
        qs = AcademicEvent.objects.select_related('academic_year', 'term').all()
        year_id = self.request.query_params.get('academic_year')
        if year_id:
            qs = qs.filter(academic_year_id=year_id)
        term_id = self.request.query_params.get('term')
        if term_id:
            qs = qs.filter(term_id=term_id)
        event_type = self.request.query_params.get('event_type')
        if event_type:
            qs = qs.filter(event_type=event_type)
        return qs


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer

    def get_permissions(self):
        return [IsAuthenticated()]

    def _assert_can_manage(self):
        if not _can_manage_apparitorat(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Permission refusee pour gerer les salles.")

    def perform_create(self, serializer):
        self._assert_can_manage()
        serializer.save()

    def perform_update(self, serializer):
        self._assert_can_manage()
        serializer.save()

    def perform_destroy(self, instance):
        self._assert_can_manage()
        instance.delete()


class RoomReservationViewSet(viewsets.ModelViewSet):
    serializer_class = RoomReservationSerializer

    def get_permissions(self):
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = RoomReservation.objects.select_related('room', 'requested_by').all()

        if not _can_manage_apparitorat(user):
            qs = qs.filter(requested_by=user)

        status_filter = self.request.query_params.get('status')
        if status_filter == 'active':
            qs = qs.exclude(status='archived')
        elif status_filter == 'archived':
            qs = qs.filter(status='archived')
        elif status_filter:
            qs = qs.filter(status=status_filter)

        room_id = self.request.query_params.get('room')
        if room_id:
            qs = qs.filter(room_id=room_id)

        date = self.request.query_params.get('date')
        if date:
            qs = qs.filter(date=date)

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        requested_by = serializer.validated_data.get('requested_by')
        if requested_by and requested_by != user and not _can_manage_apparitorat(user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Vous ne pouvez pas reserver pour un autre utilisateur.")
        serializer.save(requested_by=requested_by or user)

    def perform_update(self, serializer):
        user = self.request.user
        instance = serializer.instance
        status_changes = (
            'status' in serializer.validated_data
            and serializer.validated_data['status'] != instance.status
        )

        if _can_manage_apparitorat(user):
            serializer.save()
            return

        if instance.requested_by != user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Vous ne pouvez modifier que vos propres reservations.")

        if instance.status != 'pending' or status_changes:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Seul l'apparitorat peut changer le statut d'une reservation.")

        serializer.save(requested_by=user)

    def perform_destroy(self, instance):
        user = self.request.user
        if _can_manage_apparitorat(user) or (instance.requested_by == user and instance.status == 'pending'):
            instance.delete()
            return
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("Permission refusee pour supprimer cette reservation.")


class TimeSlotViewSet(viewsets.ModelViewSet):
    serializer_class = TimeSlotSerializer

    def get_permissions(self):
        if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return [IsAuthenticated()]
        return [IsSGAOrAdmin()]

    def get_queryset(self):
        qs = TimeSlot.objects.all()
        # Allow filtering by vacation_type
        vacation = self.request.query_params.get('vacation_type')
        if vacation:
            qs = qs.filter(vacation_type=vacation)
        return qs

    @action(detail=False, methods=['post'], url_path='seed-defaults')
    def seed_defaults(self, request):
        """Create default time periods for jour and soir vacations if none exist."""
        if not _is_admin_or_sga(request.user):
            return Response({'error': 'Permission refusée.'}, status=403)

        created = []
        defaults = [
            # Vacation Jour
            {'label': '1ère heure', 'start_time': '08:30', 'end_time': '12:00', 'vacation_type': 'jour', 'order': 1},
            {'label': '2ème heure', 'start_time': '13:00', 'end_time': '15:00', 'vacation_type': 'jour', 'order': 2},
            {'label': '3ème heure', 'start_time': '15:00', 'end_time': '17:00', 'vacation_type': 'jour', 'order': 3},
            # Vacation Soir
            {'label': '1ère heure', 'start_time': '16:30', 'end_time': '18:30', 'vacation_type': 'soir', 'order': 1},
            {'label': '2ème heure', 'start_time': '18:30', 'end_time': '20:30', 'vacation_type': 'soir', 'order': 2},
        ]
        for d in defaults:
            obj, was_created = TimeSlot.objects.get_or_create(
                vacation_type=d['vacation_type'],
                start_time=d['start_time'],
                end_time=d['end_time'],
                defaults={'label': d['label'], 'order': d['order']}
            )
            if was_created:
                created.append(str(obj))

        return Response({
            'message': f'{len(created)} période(s) créée(s).',
            'created': created,
            'total': TimeSlot.objects.count()
        })


class ScheduleViewSet(viewsets.ModelViewSet):
    serializer_class = ScheduleSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsTeacherOrAdmin()]
        return [IsAuthenticated()]

    def _assert_can_plan(self, course):
        """L'horaire est établi par le SGA ou le chef du périmètre, pas par l'enseignant."""
        from apps.users.permissions import manages_course
        from rest_framework.exceptions import PermissionDenied
        user = self.request.user
        if not (user.is_staff or user.role in ['sga', 'pdg', 'chef_section', 'chef_departement']):
            raise PermissionDenied("L'horaire est établi par le SGA ou le chef de section/filière.")
        if course is not None and not manages_course(user, course):
            raise PermissionDenied("Ce cours n'appartient pas à votre périmètre.")

    def perform_destroy(self, instance):
        self._assert_can_plan(instance.course)
        instance.delete(user=self.request.user)

    def get_queryset(self):
        user = self.request.user
        qs = Schedule.objects.select_related(
            'course', 'auditoire', 'room', 'timeslot', 'teacher', 'term'
        ).filter(is_active=True)

        # Term filtering
        term_id = self.request.query_params.get('term')
        if term_id:
            qs = qs.filter(term_id=term_id)

        # Academic year filtering
        year_id = self.request.query_params.get('academic_year')
        if year_id:
            qs = qs.filter(term__academic_year_id=year_id)

        if _is_admin_or_sga(user):
            return qs.all()

        if _is_teacher(user):
            if user.role in ['enseignant', 'assistant']:
                return qs.filter(
                    Q(teacher=user) | Q(course__titulaire=user) | Q(course__assistants=user)
                ).distinct()
            elif user.role == 'chef_section' and user.section:
                return qs.filter(auditoire__filiere__section=user.section)
            elif user.role == 'chef_departement' and user.filiere:
                return qs.filter(auditoire__filiere=user.filiere)

        if user.role == 'etudiant' and user.auditoire:
            return qs.filter(auditoire=user.auditoire)

        return qs.none()

    def _detect_conflicts(self, data, exclude_id=None):
        """
        Detect scheduling conflicts for both normal and module schedules.
        Also checks against academic calendar (vacations, holidays, course periods).
        Returns (hard_conflicts, warnings).
        """
        from datetime import date as date_type
        hard_conflicts = []
        warnings = []

        schedule_type = data.get('schedule_type', 'normal')
        room = data.get('room')
        teacher = data.get('teacher')
        auditoire = data.get('auditoire')
        term = data.get('term')

        # ── Calendar validation ──────────────────────────────────────────────
        if term and hasattr(term, 'start_date'):
            term_obj = term
        elif term and not hasattr(term, 'start_date'):
            try:
                term_obj = Term.objects.get(id=term) if isinstance(term, (int, str)) else term
            except (Term.DoesNotExist, ValueError):
                term_obj = None
        else:
            term_obj = None

        if schedule_type == 'module':
            # Module conflict detection: overlapping date ranges
            start = data.get('module_start_date')
            end = data.get('module_end_date')
            if not start or not end:
                return hard_conflicts, warnings

            # Check if module dates fall within the term's course period
            if term_obj:
                course_end = term_obj.end_courses_date or term_obj.end_date
                if start < term_obj.start_date or end > course_end:
                    warnings.append(
                        f"⚠️ Ce module ({start} → {end}) dépasse la période de cours "
                        f"du {term_obj.name} ({term_obj.start_date} → {course_end})."
                    )

            # Check if module overlaps with vacations or holidays
            if term_obj:
                overlapping_events = AcademicEvent.objects.filter(
                    academic_year=term_obj.academic_year,
                    event_type__in=['vacance', 'ferie'],
                    start_date__lte=end,
                    end_date__gte=start,
                )
                for ev in overlapping_events:
                    warnings.append(
                        f"📅 Ce module chevauche '{ev.name}' ({ev.start_date} → {ev.end_date})."
                    )

            module_qs = Schedule.objects.filter(
                schedule_type='module',
                is_active=True,
                module_start_date__lte=end,
                module_end_date__gte=start,
            )
            if exclude_id:
                module_qs = module_qs.exclude(id=exclude_id)

            if room and module_qs.filter(room=room).exists():
                existing = module_qs.filter(room=room).select_related('course', 'room').first()
                hard_conflicts.append(
                    f"La salle '{existing.room.name}' est déjà réservée pendant cette période "
                    f"(cours: {existing.course.name}, {existing.module_start_date} → {existing.module_end_date})."
                )

            if auditoire and module_qs.filter(auditoire=auditoire).exists():
                existing = module_qs.filter(auditoire=auditoire).select_related('course', 'auditoire').first()
                hard_conflicts.append(
                    f"L'auditoire '{existing.auditoire.nom}' a déjà un module pendant cette période "
                    f"(cours: {existing.course.name}, {existing.module_start_date} → {existing.module_end_date})."
                )

            if teacher and module_qs.filter(teacher=teacher).exists():
                existing = module_qs.filter(teacher=teacher).select_related('course').first()
                warnings.append(
                    f"L'enseignant a déjà un module pendant cette période: {existing.course.name} "
                    f"({existing.module_start_date} → {existing.module_end_date})."
                )

            return hard_conflicts, warnings

        # ── Normal/Examen/Rattrapage schedule conflict detection ─────────────
        day_of_week = data.get('day_of_week')
        start_time = data.get('start_time')
        end_time = data.get('end_time')

        if not day_of_week or not start_time or not end_time:
            return hard_conflicts, warnings

        # Check if the schedule's term has valid course period
        if term_obj:
            course_end = term_obj.end_courses_date or term_obj.end_date
            today = date_type.today()
            if today > course_end:
                warnings.append(
                    f"⚠️ La période de cours du {term_obj.name} est terminée "
                    f"(fin: {course_end}). Ce cours ne sera plus actif."
                )

            # Check for ongoing vacations/holidays in this term
            ongoing_events = AcademicEvent.objects.filter(
                academic_year=term_obj.academic_year,
                event_type__in=['vacance', 'ferie'],
                start_date__lte=today,
                end_date__gte=today,
            )
            for ev in ongoing_events:
                warnings.append(
                    f"📅 Période en cours: '{ev.name}' ({ev.start_date} → {ev.end_date}). "
                    f"Les cours sont probablement suspendus."
                )

        # Find other schedules on the same day with overlapping time
        # Time overlap: existing.start_time < new.end_time AND existing.end_time > new.start_time
        qs = Schedule.objects.filter(
            day_of_week=day_of_week,
            schedule_type__in=['normal', 'examen', 'rattrapage'],
            is_active=True,
            start_time__lt=end_time,
            end_time__gt=start_time,
        )
        if term:
            qs = qs.filter(term=term)
        if exclude_id:
            qs = qs.exclude(id=exclude_id)

        # Hard block: same room at overlapping time
        if room and qs.filter(room=room).exists():
            existing = qs.filter(room=room).select_related('course', 'room').first()
            hard_conflicts.append(
                f"La salle '{existing.room.name}' est déjà réservée "
                f"({existing.start_time.strftime('%H:%M')}-{existing.end_time.strftime('%H:%M')}) "
                f"(cours: {existing.course.name})."
            )

        # Hard block: same auditoire at overlapping time
        if auditoire and qs.filter(auditoire=auditoire).exists():
            existing = qs.filter(auditoire=auditoire).select_related('course', 'auditoire').first()
            hard_conflicts.append(
                f"L'auditoire '{existing.auditoire.nom}' a déjà un cours "
                f"({existing.start_time.strftime('%H:%M')}-{existing.end_time.strftime('%H:%M')}) "
                f"(cours: {existing.course.name})."
            )

        if teacher:
            # Soft warning: teacher already has a course at overlapping time
            teacher_existing = qs.filter(teacher=teacher).select_related('course', 'auditoire')
            if teacher_existing.exists():
                courses_str = ", ".join(
                    f"{s.course.name} ({s.auditoire.nom})" for s in teacher_existing[:3]
                )
                warnings.append(
                    f"L'enseignant a déjà un cours sur ce créneau: {courses_str}. "
                    f"(Chevauchement autorisé pour tronc commun)"
                )

        return hard_conflicts, warnings

    def _auto_resolve_term(self, validated_data):
        """
        Auto-resolve term from the course's semester field if no term is provided.
        Matches course.semester (e.g. 'Semestre 1', 'Trimestre 1,Trimestre 2')
        to an existing Term object by name.
        """
        if validated_data.get('term'):
            return  # Already provided

        course = validated_data.get('course')
        if not course:
            return

        semester_str = getattr(course, 'semester', '') or ''
        if not semester_str:
            return

        # Course.semester can be comma-separated: "Trimestre 1,Trimestre 2"
        semester_names = [s.strip() for s in semester_str.split(',') if s.strip()]
        if not semester_names:
            return

        # Try to find a matching Term (from the current academic year)
        current_year = AcademicYear.objects.filter(is_current=True).first()
        if not current_year:
            return

        # If only one semester, use it directly
        if len(semester_names) == 1:
            term = Term.objects.filter(
                academic_year=current_year,
                name__iexact=semester_names[0]
            ).first()
            if term:
                validated_data['term'] = term
                return

        # Multiple semesters: prefer the currently active term
        active_term = Term.objects.filter(
            academic_year=current_year,
            is_active=True,
            name__in=semester_names
        ).first()
        if active_term:
            validated_data['term'] = active_term
            return

        # Fallback: first matching term
        first_term = Term.objects.filter(
            academic_year=current_year,
            name__in=semester_names
        ).order_by('order').first()
        if first_term:
            validated_data['term'] = first_term

    def perform_create(self, serializer):
        self._assert_can_plan(serializer.validated_data.get('course'))
        self._auto_resolve_term(serializer.validated_data)
        hard_conflicts, warnings = self._detect_conflicts(serializer.validated_data)
        if hard_conflicts:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'conflicts': hard_conflicts})
        serializer.save()

    def perform_update(self, serializer):
        self._assert_can_plan(serializer.validated_data.get('course', serializer.instance.course))
        self._auto_resolve_term(serializer.validated_data)
        hard_conflicts, warnings = self._detect_conflicts(
            serializer.validated_data,
            exclude_id=self.get_object().id
        )
        if hard_conflicts:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'conflicts': hard_conflicts})
        serializer.save()

    @action(detail=False, methods=['post'], url_path='check-conflicts')
    def check_conflicts(self, request):
        """Pre-check conflicts before saving."""
        data = request.data
        resolved = {}

        if data.get('day_of_week'):
            resolved['day_of_week'] = data['day_of_week']
        resolved['schedule_type'] = data.get('schedule_type', 'normal')

        # Custom time fields
        if data.get('start_time'):
            from datetime import time as time_type
            parts = data['start_time'].split(':')
            resolved['start_time'] = time_type(int(parts[0]), int(parts[1]))
        if data.get('end_time'):
            from datetime import time as time_type
            parts = data['end_time'].split(':')
            resolved['end_time'] = time_type(int(parts[0]), int(parts[1]))

        if data.get('timeslot'):
            try:
                resolved['timeslot'] = TimeSlot.objects.get(id=data['timeslot'])
            except TimeSlot.DoesNotExist:
                pass
        if data.get('room'):
            try:
                resolved['room'] = Room.objects.get(id=data['room'])
            except Room.DoesNotExist:
                pass
        if data.get('teacher'):
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                resolved['teacher'] = User.objects.get(id=data['teacher'])
            except User.DoesNotExist:
                pass
        if data.get('auditoire'):
            from apps.auditoires.models import Auditoire as AudModel
            try:
                resolved['auditoire'] = AudModel.objects.get(id=data['auditoire'])
            except AudModel.DoesNotExist:
                pass

        # Auto-resolve term from course if not provided
        if data.get('course') and not data.get('term'):
            from apps.courses.models import Course
            try:
                resolved['course'] = Course.objects.get(id=data['course'])
                self._auto_resolve_term(resolved)
            except Course.DoesNotExist:
                pass
        elif data.get('term'):
            try:
                resolved['term'] = Term.objects.get(id=data['term'])
            except Term.DoesNotExist:
                pass

        exclude_id = data.get('exclude_id')
        hard_conflicts, warnings = self._detect_conflicts(resolved, exclude_id=exclude_id)
        return Response({
            'hard_conflicts': hard_conflicts,
            'warnings': warnings,
            'has_conflicts': len(hard_conflicts) > 0,
        })

    @action(detail=False, methods=['get'], url_path='my-schedule')
    def my_schedule(self, request):
        """Returns the schedule for the current user."""
        user = request.user
        if user.role == 'etudiant' and user.auditoire:
            qs = Schedule.objects.filter(
                auditoire=user.auditoire, is_active=True
            ).select_related('course', 'room', 'timeslot', 'teacher')
        elif _is_teacher(user):
            qs = Schedule.objects.filter(
                Q(teacher=user) | Q(course__titulaire=user) | Q(course__assistants=user),
                is_active=True
            ).distinct().select_related('course', 'auditoire', 'room', 'timeslot')
        elif user.role in ('pdg', 'sga', 'sgad', 'directeur_general'):
            qs = Schedule.objects.filter(
                is_active=True
            ).select_related('course', 'auditoire', 'room', 'timeslot', 'teacher')
        elif user.role == 'etudiant' and not user.auditoire:
            qs = Schedule.objects.none()
        else:
            # Personnel administratif (apparitorat, caisse, jury…) : horaire général en lecture.
            qs = Schedule.objects.filter(
                is_active=True
            ).select_related('course', 'auditoire', 'room', 'timeslot', 'teacher')

        # Filter by term if provided
        term_id = request.query_params.get('term')
        if term_id:
            qs = qs.filter(term_id=term_id)

        serializer = ScheduleSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='auditoire_schedule')
    def auditoire_schedule(self, request):
        """Full timetable for a specific auditoire."""
        auditoire_id = request.query_params.get('auditoire_id')
        if not auditoire_id:
            return Response({'error': 'auditoire_id est requis.'}, status=status.HTTP_400_BAD_REQUEST)
        qs = Schedule.objects.filter(
            auditoire_id=auditoire_id, is_active=True
        ).select_related('course', 'room', 'timeslot', 'teacher')

        # Filter by term if provided
        term_id = request.query_params.get('term')
        if term_id:
            qs = qs.filter(term_id=term_id)

        serializer = ScheduleSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='calendar-context')
    def calendar_context(self, request):
        """
        Return calendar context for the current academic year:
        - current term with its date ranges
        - all events (vacations, holidays, exams…)
        - all terms with their course period boundaries
        Used by the Horaire page to show warnings and validate schedule dates.
        """
        from datetime import date as date_type
        today = date_type.today()

        # Find current academic year
        current_year = AcademicYear.objects.filter(is_current=True).first()
        if not current_year:
            # Fallback: find year containing today
            current_year = AcademicYear.objects.filter(
                start_date__lte=today, end_date__gte=today
            ).first()

        if not current_year:
            return Response({
                'has_calendar': False,
                'message': "Aucune année académique configurée. Créez d'abord un calendrier académique."
            })

        # Get all terms for this year
        terms = Term.objects.filter(academic_year=current_year).order_by('order')
        terms_data = TermListSerializer(terms, many=True).data

        # Get all events for this year
        events = AcademicEvent.objects.filter(academic_year=current_year).order_by('start_date')
        events_data = AcademicEventSerializer(events, many=True).data

        # Find current/active term
        active_term = terms.filter(
            start_date__lte=today, is_active=True
        ).order_by('-start_date').first()

        # If no active term found by course dates, check if we're in exam/rattrapage period
        if not active_term:
            active_term = terms.filter(
                start_date__lte=today, is_active=True
            ).filter(
                db_models.Q(exam_end_date__gte=today) |
                db_models.Q(rattrapage_end_date__gte=today) |
                db_models.Q(end_date__gte=today)
            ).order_by('-start_date').first()

        active_term_data = TermListSerializer(active_term).data if active_term else None

        # Build date flags for today
        today_flags = []
        for ev in events:
            if ev.start_date <= today <= ev.end_date:
                today_flags.append({
                    'type': ev.event_type,
                    'name': ev.name,
                    'color': ev.color,
                })

        return Response({
            'has_calendar': True,
            'academic_year': {
                'id': current_year.id,
                'name': current_year.name,
                'start_date': current_year.start_date,
                'end_date': current_year.end_date,
            },
            'terms': terms_data,
            'events': events_data,
            'active_term': active_term_data,
            'today_flags': today_flags,
        })

    @action(detail=False, methods=['get'], url_path='teacher_schedule')
    def teacher_schedule(self, request):
        """Full timetable for a specific teacher."""
        teacher_id = request.query_params.get('teacher_id')
        if not teacher_id:
            return Response({'error': 'teacher_id est requis.'}, status=status.HTTP_400_BAD_REQUEST)

        qs = Schedule.objects.filter(
            Q(teacher_id=teacher_id) | Q(course__titulaire_id=teacher_id) | Q(course__assistants__id=teacher_id),
            is_active=True
        ).distinct().select_related('course', 'auditoire', 'room', 'timeslot')

        if not _is_admin_or_sga(request.user) and str(request.user.id) != str(teacher_id):
            if request.user.role == 'chef_section' and request.user.section:
                qs = qs.filter(auditoire__filiere__section=request.user.section)
            elif request.user.role == 'chef_departement' and request.user.filiere:
                qs = qs.filter(auditoire__filiere=request.user.filiere)
            else:
                return Response({'error': 'Permission refusee.'}, status=status.HTTP_403_FORBIDDEN)

        # Filter by term if provided
        term_id = request.query_params.get('term')
        if term_id:
            qs = qs.filter(term_id=term_id)

        serializer = ScheduleSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='duplicate-planning')
    def duplicate_planning(self, request):
        """
        Dupliquer le planning d'un trimestre vers un autre.
        Payload: { source_term_id, target_term_id, auditoire_id? }
        Copie tous les horaires du source_term vers le target_term.
        Pour les modules, les dates sont décalées proportionnellement.
        """
        if not _is_admin_or_sga(request.user):
            return Response({'error': 'Permission refusée.'}, status=status.HTTP_403_FORBIDDEN)

        source_id = request.data.get('source_term_id')
        target_id = request.data.get('target_term_id')
        auditoire_id = request.data.get('auditoire_id')

        if not source_id or not target_id:
            return Response(
                {'error': 'source_term_id et target_term_id sont requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            source_term = Term.objects.get(id=source_id)
            target_term = Term.objects.get(id=target_id)
        except Term.DoesNotExist:
            return Response({'error': 'Trimestre introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        # Get source schedules
        source_qs = Schedule.objects.filter(term=source_term, is_active=True)
        if auditoire_id:
            source_qs = source_qs.filter(auditoire_id=auditoire_id)

        if not source_qs.exists():
            return Response(
                {'message': 'Aucun horaire à dupliquer dans le trimestre source.'},
                status=status.HTTP_200_OK
            )

        # Calculate date offset for module schedules
        date_offset = target_term.start_date - source_term.start_date

        created_count = 0
        skipped_count = 0

        for schedule in source_qs:
            # Check if similar schedule already exists in target term
            duplicate_check = Schedule.objects.filter(
                course=schedule.course,
                auditoire=schedule.auditoire,
                schedule_type=schedule.schedule_type,
                term=target_term,
                day_of_week=schedule.day_of_week,
                timeslot=schedule.timeslot,
                is_active=True,
            )
            if duplicate_check.exists():
                skipped_count += 1
                continue

            # Create the new schedule
            new_schedule = Schedule(
                course=schedule.course,
                auditoire=schedule.auditoire,
                room=schedule.room,
                teacher=schedule.teacher,
                schedule_type=schedule.schedule_type,
                description=schedule.description,
                term=target_term,
                day_of_week=schedule.day_of_week,
                timeslot=schedule.timeslot,
                is_active=True,
            )

            # For module schedules, shift dates
            if schedule.schedule_type == 'module' and schedule.module_start_date and schedule.module_end_date:
                new_schedule.module_start_date = schedule.module_start_date + date_offset
                new_schedule.module_end_date = schedule.module_end_date + date_offset
                new_schedule.module_start_time = schedule.module_start_time
                new_schedule.module_end_time = schedule.module_end_time

            new_schedule.save()
            created_count += 1

        return Response({
            'message': f'{created_count} horaire(s) dupliqué(s) avec succès.',
            'created': created_count,
            'skipped': skipped_count,
            'source_term': source_term.name,
            'target_term': target_term.name,
        })

    @action(detail=False, methods=['post'], url_path='publish-schedule')
    def publish_schedule(self, request):
        """
        Publish the schedule for a specific auditoire and notify all stakeholders:
        - Students in the auditoire
        - Teachers/assistants of courses in that auditoire
        - Chef de filière (département) and chef de section
        - SGA/Admin users
        Payload: { auditoire_id, term_id? }
        """
        if not _is_admin_or_sga(request.user):
            return Response({'error': 'Permission refusée.'}, status=status.HTTP_403_FORBIDDEN)

        auditoire_id = request.data.get('auditoire_id')
        if not auditoire_id:
            return Response(
                {'error': 'auditoire_id est requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from apps.auditoires.models import Auditoire as AudModel
        try:
            auditoire = AudModel.objects.select_related(
                'filiere', 'filiere__section'
            ).get(id=auditoire_id)
        except AudModel.DoesNotExist:
            return Response(
                {'error': 'Auditoire introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Optional: include term info in message
        term_id = request.data.get('term_id')
        term_info = ''
        if term_id:
            try:
                term = Term.objects.get(id=term_id)
                term_info = f" pour le {term.name}"
            except Term.DoesNotExist:
                pass

        from apps.notifications.helpers import notify_auditoire_stakeholders
        count = notify_auditoire_stakeholders(
            auditoire=auditoire,
            title=f"📋 Horaire publié — {auditoire.nom}",
            message=(
                f"L'horaire de {auditoire.nom}{term_info} a été publié. "
                f"Consultez votre emploi du temps pour voir les cours programmés."
            ),
            notification_type='horaire',
            priority='high',
            link='/horaire',
            related_object_id=str(auditoire.id),
        )
        return Response({
            'message': f"Horaire de {auditoire.nom} publié avec succès.",
            'notifications_sent': count,
            'auditoire': auditoire.nom,
        })


class ScheduleExceptionViewSet(viewsets.ModelViewSet):
    serializer_class = ScheduleExceptionSerializer

    def get_permissions(self):
        if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return [IsAuthenticated()]
        return [IsTeacherOrAdmin()]

    def get_queryset(self):
        return ScheduleException.objects.select_related(
            'schedule', 'replacement_teacher', 'replacement_room'
        ).all()

    def _check(self, schedule):
        from apps.users.permissions import manages_course
        from rest_framework.exceptions import PermissionDenied
        if schedule is None or not manages_course(self.request.user, schedule.course):
            raise PermissionDenied("Vous ne pouvez modifier que les séances de vos propres cours.")

    def perform_create(self, serializer):
        self._check(serializer.validated_data.get('schedule'))
        serializer.save()

    def perform_update(self, serializer):
        self._check(serializer.validated_data.get('schedule', serializer.instance.schedule))
        serializer.save()

    def perform_destroy(self, instance):
        self._check(instance.schedule)
        instance.delete(user=self.request.user)


class TeacherAvailabilityViewSet(viewsets.ModelViewSet):
    serializer_class = TeacherAvailabilitySerializer

    def get_permissions(self):
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if _is_admin_or_sga(user):
            return TeacherAvailability.objects.select_related('teacher', 'timeslot').all()
        return TeacherAvailability.objects.filter(teacher=user).select_related('timeslot')

    def perform_create(self, serializer):
        user = self.request.user
        teacher = serializer.validated_data.get('teacher')

        if _is_admin_or_sga(user):
            if teacher is None:
                if _is_teacher(user):
                    teacher = user
                else:
                    from rest_framework.exceptions import ValidationError
                    raise ValidationError({'teacher': "L'enseignant est requis."})
        elif _is_teacher(user):
            if teacher is not None and teacher != user:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Vous ne pouvez gerer que votre propre disponibilite.")
            teacher = user
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Vous ne pouvez gerer que votre propre disponibilite.")

        serializer.save(teacher=teacher)

    def perform_update(self, serializer):
        user = self.request.user
        current = serializer.instance

        if _is_admin_or_sga(user):
            serializer.save()
            return

        if not _is_teacher(user) or current.teacher != user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Vous ne pouvez gerer que votre propre disponibilite.")

        serializer.save(teacher=user)

    @action(detail=False, methods=['get'], url_path='my-availability')
    def my_availability(self, request):
        if not _is_teacher(request.user):
            return Response({'error': 'Reserve aux enseignants.'}, status=status.HTTP_403_FORBIDDEN)
        qs = TeacherAvailability.objects.filter(
            teacher=request.user
        ).select_related('timeslot')
        serializer = TeacherAvailabilitySerializer(qs, many=True)
        return Response(serializer.data)
