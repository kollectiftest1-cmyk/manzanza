"""
Serializers for academic schedules and calendar
"""
from rest_framework import serializers

from apps.core.validation import check
from .models import (
    AcademicYear, Term, AcademicEvent,
    Room, RoomReservation, TimeSlot, Schedule, ScheduleException, TeacherAvailability
)


# ═══════════════════════════════════════════════════════════════════════════
# ACADEMIC CALENDAR SERIALIZERS
# ═══════════════════════════════════════════════════════════════════════════

def _inclusive_days(start, end):
    if not start or not end:
        return None
    days = (end - start).days + 1
    return days if days >= 0 else None


def _attr_or_instance(attrs, instance, field_name):
    if field_name in attrs:
        return attrs[field_name]
    return getattr(instance, field_name, None) if instance else None


class AcademicEventSerializer(serializers.ModelSerializer):
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True, allow_null=True)
    duration_days = serializers.SerializerMethodField()

    class Meta:
        model = AcademicEvent
        fields = [
            'id', 'name', 'event_type', 'event_type_display',
            'academic_year', 'term', 'term_name',
            'start_date', 'end_date', 'duration_days', 'description', 'color',
            'is_auto_generated',
            'created_at', 'updated_at',
        ]

    def get_duration_days(self, obj):
        return _inclusive_days(obj.start_date, obj.end_date)

    def validate(self, attrs):
        term = _attr_or_instance(attrs, self.instance, 'term')
        academic_year = _attr_or_instance(attrs, self.instance, 'academic_year')

        check(self, attrs, order=[('start_date', 'end_date')])
        if academic_year:
            check(self, attrs, within=(academic_year.start_date, academic_year.end_date,
                                       f"l'année académique {academic_year.name}", ['start_date', 'end_date']))
        if term and academic_year and term.academic_year_id != academic_year.id:
            raise serializers.ValidationError("Le trimestre sélectionné n'appartient pas à cette année académique.")
        return attrs


class TermSerializer(serializers.ModelSerializer):
    term_type_display = serializers.CharField(source='get_term_type_display', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    events = AcademicEventSerializer(many=True, read_only=True)
    duration_days = serializers.SerializerMethodField()
    courses_duration_days = serializers.SerializerMethodField()
    exam_duration_days = serializers.SerializerMethodField()
    rattrapage_duration_days = serializers.SerializerMethodField()

    class Meta:
        model = Term
        fields = [
            'id', 'academic_year', 'academic_year_name',
            'name', 'term_type', 'term_type_display', 'order',
            'start_date', 'end_date', 'duration_days', 'end_courses_date',
            'courses_duration_days',
            'exam_start_date', 'exam_end_date',
            'exam_duration_days',
            'rattrapage_start_date', 'rattrapage_end_date',
            'rattrapage_duration_days',
            'auto_generate_events',
            'is_active', 'events',
            'created_at', 'updated_at',
        ]

    def get_duration_days(self, obj):
        return _inclusive_days(obj.start_date, obj.end_date)

    def get_courses_duration_days(self, obj):
        return _inclusive_days(obj.start_date, obj.end_courses_date or obj.end_date)

    def get_exam_duration_days(self, obj):
        return _inclusive_days(obj.exam_start_date, obj.exam_end_date)

    def get_rattrapage_duration_days(self, obj):
        return _inclusive_days(obj.rattrapage_start_date, obj.rattrapage_end_date)

    def validate(self, attrs):
        g = lambda f: _attr_or_instance(attrs, self.instance, f)  # noqa: E731
        errors = {}
        for a, b in (('exam_start_date', 'exam_end_date'), ('rattrapage_start_date', 'rattrapage_end_date')):
            if bool(g(a)) != bool(g(b)):
                errors[b if g(a) else a] = ["Renseignez à la fois le début et la fin de cette période."]
        year = g('academic_year')
        rules = [dict(order=[('start_date', 'end_date'), ('exam_start_date', 'exam_end_date'),
                             ('rattrapage_start_date', 'rattrapage_end_date'), ('end_courses_date', 'exam_start_date'),
                             ('exam_end_date', 'rattrapage_start_date')],
                      within=(g('start_date'), g('end_date'), "la période (semestre ou trimestre)",
                              ['end_courses_date', 'exam_start_date', 'exam_end_date', 'rattrapage_start_date',
                               'rattrapage_end_date']))]
        if year:
            rules.append(dict(within=(year.start_date, year.end_date, f"l'année académique {year.name}",
                                      ['start_date', 'end_date'])))
        for rule in rules:
            try:
                check(self, attrs, **rule)
            except serializers.ValidationError as exc:
                for k, v in exc.detail.items():
                    errors.setdefault(k, []).extend(v)
        if errors:
            raise serializers.ValidationError(errors)
        return attrs


class TermListSerializer(serializers.ModelSerializer):
    """Light serializer for term lists (no nested events)."""
    term_type_display = serializers.CharField(source='get_term_type_display', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    duration_days = serializers.SerializerMethodField()
    courses_duration_days = serializers.SerializerMethodField()
    exam_duration_days = serializers.SerializerMethodField()
    rattrapage_duration_days = serializers.SerializerMethodField()

    class Meta:
        model = Term
        fields = [
            'id', 'academic_year', 'academic_year_name',
            'name', 'term_type', 'term_type_display', 'order',
            'start_date', 'end_date', 'duration_days', 'end_courses_date',
            'courses_duration_days',
            'exam_start_date', 'exam_end_date',
            'exam_duration_days',
            'rattrapage_start_date', 'rattrapage_end_date',
            'rattrapage_duration_days',
            'auto_generate_events',
            'is_active',
        ]

    def get_duration_days(self, obj):
        return _inclusive_days(obj.start_date, obj.end_date)

    def get_courses_duration_days(self, obj):
        return _inclusive_days(obj.start_date, obj.end_courses_date or obj.end_date)

    def get_exam_duration_days(self, obj):
        return _inclusive_days(obj.exam_start_date, obj.exam_end_date)

    def get_rattrapage_duration_days(self, obj):
        return _inclusive_days(obj.rattrapage_start_date, obj.rattrapage_end_date)


class AcademicYearSerializer(serializers.ModelSerializer):
    terms = TermListSerializer(many=True, read_only=True)
    events = AcademicEventSerializer(many=True, read_only=True)
    duration_days = serializers.SerializerMethodField()

    class Meta:
        model = AcademicYear
        fields = [
            'id', 'name', 'start_date', 'end_date', 'duration_days',
            'is_current', 'is_published', 'description',
            'terms', 'events',
            'created_at', 'updated_at',
        ]

    def get_duration_days(self, obj):
        return _inclusive_days(obj.start_date, obj.end_date)

    def validate(self, attrs):
        import re
        start = _attr_or_instance(attrs, self.instance, 'start_date')
        end = _attr_or_instance(attrs, self.instance, 'end_date')
        name = (_attr_or_instance(attrs, self.instance, 'name') or '').strip()
        check(self, attrs, strict=[('start_date', 'end_date')])
        m = re.fullmatch(r'(\d{4})\s*[-/]\s*(\d{4})', name)
        errors = {}
        if name and not m and 'name' in attrs:
            errors['name'] = ["Utilisez le format AAAA-AAAA, par exemple 2026-2027."]
        elif m:
            y1, y2 = int(m[1]), int(m[2])
            if y2 != y1 + 1:
                errors['name'] = [f"Une année académique couvre deux années civiles qui se suivent : {y1}-{y1 + 1}."]
            elif start and start.year != y1:
                errors['start_date'] = [f"L'année « {name} » doit commencer en {y1} (date de début saisie : "
                                        f"{start:%d/%m/%Y})."]
            elif end and end.year not in (y1, y2):
                errors['end_date'] = [f"L'année « {name} » doit se terminer en {y2} (date de fin saisie : {end:%d/%m/%Y})."]
        if start and end and (end - start).days > 550:
            errors.setdefault('end_date', []).append(
                f"Une année académique ne dépasse pas 18 mois (du {start:%d/%m/%Y} au {end:%d/%m/%Y}, c'est trop long).")
        if errors:
            raise serializers.ValidationError(errors)
        return attrs


class AcademicYearListSerializer(serializers.ModelSerializer):
    """Light serializer for year lists (no nested data)."""
    duration_days = serializers.SerializerMethodField()

    class Meta:
        model = AcademicYear
        fields = ['id', 'name', 'start_date', 'end_date', 'duration_days', 'is_current', 'is_published']

    def get_duration_days(self, obj):
        return _inclusive_days(obj.start_date, obj.end_date)


def _split_text_list(value):
    if not value:
        return []
    if isinstance(value, list):
        return value
    return [item.strip() for item in str(value).replace('\n', ',').split(',') if item.strip()]


def _join_text_list(value):
    if value is None:
        return ''
    if isinstance(value, list):
        return '\n'.join(str(item).strip() for item in value if str(item).strip())
    return str(value)


class RoomSerializer(serializers.ModelSerializer):
    equipment = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True,
    )

    class Meta:
        model = Room
        fields = '__all__'

    def to_internal_value(self, data):
        if isinstance(data, dict) and isinstance(data.get('equipment'), str):
            data = data.copy()
            data['equipment'] = _split_text_list(data['equipment'])
        return super().to_internal_value(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['equipment'] = _split_text_list(instance.equipment)
        return data

    def create(self, validated_data):
        validated_data['equipment'] = _join_text_list(validated_data.get('equipment'))
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'equipment' in validated_data:
            validated_data['equipment'] = _join_text_list(validated_data.get('equipment'))
        return super().update(instance, validated_data)


class RoomReservationSerializer(serializers.ModelSerializer):
    startTime = serializers.TimeField(source='start_time')
    endTime = serializers.TimeField(source='end_time')
    requested_by_name = serializers.CharField(source='requested_by.name', read_only=True)
    room_name = serializers.CharField(source='room.name', read_only=True)
    equipment_needs = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True,
    )

    class Meta:
        model = RoomReservation
        fields = [
            'id', 'room', 'room_name', 'date', 'startTime', 'endTime',
            'purpose', 'equipment_needs', 'status',
            'requested_by', 'requested_by_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['requested_by_name', 'room_name', 'created_at', 'updated_at']
        extra_kwargs = {'requested_by': {'required': False}}

    def to_internal_value(self, data):
        if isinstance(data, dict) and isinstance(data.get('equipment_needs'), str):
            data = data.copy()
            data['equipment_needs'] = _split_text_list(data['equipment_needs'])
        return super().to_internal_value(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['equipment_needs'] = _split_text_list(instance.equipment_needs)
        return data

    def validate(self, data):
        start_time = data.get('start_time', getattr(self.instance, 'start_time', None))
        end_time = data.get('end_time', getattr(self.instance, 'end_time', None))
        room = data.get('room', getattr(self.instance, 'room', None))
        date = data.get('date', getattr(self.instance, 'date', None))
        status = data.get('status', getattr(self.instance, 'status', 'pending'))

        check(self, data, strict=[('start_time', 'end_time')], not_past=['date'], labels={'date': "la date de réservation"})

        if status == 'confirmed' and room and date and start_time and end_time:
            conflicts = RoomReservation.objects.filter(
                room=room,
                date=date,
                status='confirmed',
                start_time__lt=end_time,
                end_time__gt=start_time,
            )
            if self.instance:
                conflicts = conflicts.exclude(pk=self.instance.pk)
            if conflicts.exists():
                c = conflicts.first()
                raise serializers.ValidationError(
                    f"La salle {room} est déjà réservée le {date:%d/%m/%Y} de {c.start_time:%H:%M} à {c.end_time:%H:%M}"
                    f" ({c.purpose or 'réservation confirmée'}). Choisissez un autre créneau ou une autre salle."
                )

        return data

    def create(self, validated_data):
        validated_data['equipment_needs'] = _join_text_list(validated_data.get('equipment_needs'))
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'equipment_needs' in validated_data:
            validated_data['equipment_needs'] = _join_text_list(validated_data.get('equipment_needs'))
        return super().update(instance, validated_data)


class TimeSlotSerializer(serializers.ModelSerializer):
    display = serializers.SerializerMethodField()

    class Meta:
        model = TimeSlot
        fields = ['id', 'label', 'start_time', 'end_time', 'vacation_type', 'order', 'display']

    def get_display(self, obj):
        return f"{obj.label} ({obj.start_time.strftime('%H:%M')}-{obj.end_time.strftime('%H:%M')})"

    def validate(self, attrs):
        check(self, attrs, strict=[('start_time', 'end_time')])
        return attrs


class ScheduleSerializer(serializers.ModelSerializer):
    # Read-only enriched fields
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    auditoire_name = serializers.CharField(source='auditoire.nom', read_only=True)
    auditoire_vacation = serializers.CharField(source='auditoire.vacation', read_only=True)
    room_name = serializers.CharField(source='room.name', read_only=True, allow_null=True)
    teacher_name = serializers.SerializerMethodField()
    timeslot_detail = TimeSlotSerializer(source='timeslot', read_only=True)
    day_display = serializers.SerializerMethodField()
    term_name = serializers.CharField(source='term.name', read_only=True, allow_null=True)

    class Meta:
        model = Schedule
        fields = [
            'id', 'course', 'course_name', 'course_code',
            'auditoire', 'auditoire_name', 'auditoire_vacation',
            'room', 'room_name',
            'teacher', 'teacher_name',
            'schedule_type',
            'term', 'term_name',
            'day_of_week', 'day_display',
            'timeslot', 'timeslot_detail',
            'start_time', 'end_time',
            'module_start_date', 'module_end_date',
            'module_start_time', 'module_end_time',
            'description', 'is_active',
            'created_at', 'updated_at',
        ]

    def get_teacher_name(self, obj):
        if obj.teacher:
            return obj.teacher.name
        return None

    def get_day_display(self, obj):
        if obj.day_of_week:
            return dict(Schedule.DAY_CHOICES).get(obj.day_of_week, obj.day_of_week)
        return None

    def validate(self, data):
        schedule_type = data.get('schedule_type', 'normal')
        if schedule_type in ('normal', 'examen', 'rattrapage'):
            if not data.get('day_of_week'):
                raise serializers.ValidationError(
                    "Le jour de la semaine est obligatoire pour ce type d'horaire."
                )
            if not data.get('start_time') or not data.get('end_time'):
                raise serializers.ValidationError(
                    "L'heure de début et l'heure de fin sont obligatoires."
                )
            check(self, data, strict=[('start_time', 'end_time')])
        elif schedule_type == 'module':
            if not data.get('module_start_date') or not data.get('module_end_date'):
                raise serializers.ValidationError(
                    "Les dates de début et fin sont obligatoires pour un horaire de type module."
                )
            check(self, data, order=[('module_start_date', 'module_end_date')],
                  strict=[('module_start_time', 'module_end_time')])
        return data


class ScheduleExceptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduleException
        fields = '__all__'


class TeacherAvailabilitySerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()
    timeslot_display = serializers.SerializerMethodField()
    day_display = serializers.SerializerMethodField()

    class Meta:
        model = TeacherAvailability
        fields = '__all__'
        extra_kwargs = {
            'teacher': {'required': False},
        }
        validators = []

    def get_teacher_name(self, obj):
        return obj.teacher.name if obj.teacher else None

    def validate(self, attrs):
        attrs = super().validate(attrs)
        check(self, attrs, order=[('start_date', 'end_date')])
        return attrs

    def get_timeslot_display(self, obj):
        if obj.timeslot:
            return f"{obj.timeslot.label} ({obj.timeslot.start_time.strftime('%H:%M')}-{obj.timeslot.end_time.strftime('%H:%M')})"
        return None

    def get_day_display(self, obj):
        if obj.day_of_week:
            return dict(TeacherAvailability.DAY_CHOICES).get(obj.day_of_week, obj.day_of_week)
        return None
