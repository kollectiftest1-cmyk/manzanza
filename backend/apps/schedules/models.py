"""
Models for academic schedules (emplois du temps) and academic calendar

Architecture:
- AcademicYear: année académique (ex: 2024-2025) avec dates de début/fin.
- Term: trimestre ou semestre au sein d'une année académique, avec dates d'examens et rattrapages.
- AcademicEvent: événement (vacances, férié, examen, rattrapage) au sein d'un trimestre ou année.
- TimeSlot: represents a **period** (e.g. "1ère heure 8h30-12h00"), independent of day.
  Linked to a vacation type (jour/soir) so the right periods appear for each auditoire.
- Schedule: for **normal** schedules, has day_of_week + timeslot (period).
  For **module** schedules, has date range + optional start/end times.
  Optionally linked to a Term for term-aware scheduling.
"""
from django.db import models
from django.conf import settings
from apps.courses.models import Course
from apps.auditoires.models import Auditoire


# ═══════════════════════════════════════════════════════════════════════════
# ACADEMIC CALENDAR MODELS
# ═══════════════════════════════════════════════════════════════════════════

class AcademicYear(models.Model):
    """
    Année académique (ex: 2024-2025).
    Contient des Terms (trimestres/semestres) et des événements.
    """
    name = models.CharField(
        max_length=30, unique=True,
        help_text="Ex: '2024-2025', '2025-2026'"
    )
    start_date = models.DateField(help_text="Date de début de l'année académique")
    end_date = models.DateField(help_text="Date de fin de l'année académique")
    is_current = models.BooleanField(
        default=False,
        help_text="Indique si c'est l'année académique en cours"
    )
    is_published = models.BooleanField(
        default=False,
        help_text="Indique si le calendrier a été publié (notifications envoyées)"
    )
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_date']
        verbose_name = 'Année académique'
        verbose_name_plural = 'Années académiques'

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Ensure only one year is marked as current
        if self.is_current:
            AcademicYear.objects.filter(is_current=True).exclude(pk=self.pk).update(is_current=False)
        super().save(*args, **kwargs)


class Term(models.Model):
    """
    Trimestre ou semestre au sein d'une année académique.
    Chaque Term a ses propres dates, périodes d'examen et de rattrapage.
    """
    TERM_TYPE_CHOICES = [
        ('trimestre', 'Trimestre'),
        ('semestre', 'Semestre'),
    ]

    academic_year = models.ForeignKey(
        AcademicYear, on_delete=models.CASCADE, related_name='terms',
        help_text="Année académique à laquelle appartient ce trimestre/semestre"
    )
    name = models.CharField(
        max_length=50,
        help_text="Ex: 'Trimestre 1', 'Semestre 1', 'Premier trimestre'"
    )
    term_type = models.CharField(
        max_length=15, choices=TERM_TYPE_CHOICES, default='trimestre'
    )
    order = models.PositiveSmallIntegerField(
        default=1,
        help_text="Ordre du trimestre/semestre dans l'année (1, 2, 3...)"
    )

    # Dates du trimestre/semestre
    start_date = models.DateField(help_text="Date de début des cours")
    end_date = models.DateField(help_text="Date de fin de la période (fin rattrapage ou fin examen)")
    end_courses_date = models.DateField(
        null=True, blank=True,
        help_text="Date de fin des cours (avant le blocus/examens). Si vide, = end_date."
    )

    # Auto-generate events
    auto_generate_events = models.BooleanField(
        default=True,
        help_text="Générer automatiquement les événements (rentrée, blocus, examens, rattrapage, fin de cours)"
    )

    # Périodes d'examen
    exam_start_date = models.DateField(
        null=True, blank=True,
        help_text="Date de début de la session d'examen"
    )
    exam_end_date = models.DateField(
        null=True, blank=True,
        help_text="Date de fin de la session d'examen"
    )

    # Périodes de rattrapage
    rattrapage_start_date = models.DateField(
        null=True, blank=True,
        help_text="Date de début de la session de rattrapage"
    )
    rattrapage_end_date = models.DateField(
        null=True, blank=True,
        help_text="Date de fin de la session de rattrapage"
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['academic_year', 'order']
        unique_together = ['academic_year', 'order']
        verbose_name = 'Trimestre/Semestre'
        verbose_name_plural = 'Trimestres/Semestres'

    def __str__(self):
        return f"{self.name} ({self.academic_year.name})"

    def generate_events(self):
        """
        Auto-generate academic events based on term dates.
        - Rentrée (start_date)
        - Fin des cours (end_courses_date or end_date if no exams)
        - Blocus (gap between end_courses_date and exam_start_date)
        - Examens (exam_start_date → exam_end_date)
        - Rattrapage (rattrapage_start_date → rattrapage_end_date)
        """
        from datetime import timedelta
        # Delete previous auto-generated events for this term
        AcademicEvent.objects.filter(term=self, is_auto_generated=True).delete()

        events_to_create = []
        year = self.academic_year
        type_label = self.get_term_type_display()  # 'Trimestre' or 'Semestre'

        # 1) Rentrée
        events_to_create.append(AcademicEvent(
            name=f"Rentrée — {self.name}",
            event_type='rentree',
            academic_year=year,
            term=self,
            start_date=self.start_date,
            end_date=self.start_date,
            description=f"Début des cours du {self.name}",
            color='#007bff',
            is_auto_generated=True,
        ))

        # 2) Fin des cours
        fin_cours = self.end_courses_date or self.end_date
        if self.exam_start_date:
            # fin_cours is the day before blocus/exams start
            fin_cours = self.end_courses_date or (self.exam_start_date - timedelta(days=1))

        events_to_create.append(AcademicEvent(
            name=f"Fin des cours — {self.name}",
            event_type='autre',
            academic_year=year,
            term=self,
            start_date=fin_cours,
            end_date=fin_cours,
            description=f"Dernier jour de cours du {self.name}",
            color='#6c757d',
            is_auto_generated=True,
        ))

        # 3) Blocus (between end of courses and start of exams)
        if self.exam_start_date and fin_cours:
            blocus_start = fin_cours + timedelta(days=1)
            blocus_end = self.exam_start_date - timedelta(days=1)
            if blocus_end >= blocus_start:
                events_to_create.append(AcademicEvent(
                    name=f"Blocus — {self.name}",
                    event_type='autre',
                    academic_year=year,
                    term=self,
                    start_date=blocus_start,
                    end_date=blocus_end,
                    description=f"Période de révision avant les examens du {self.name}",
                    color='#17a2b8',
                    is_auto_generated=True,
                ))

        # 4) Examens
        if self.exam_start_date and self.exam_end_date:
            events_to_create.append(AcademicEvent(
                name=f"Examens — {self.name}",
                event_type='examen',
                academic_year=year,
                term=self,
                start_date=self.exam_start_date,
                end_date=self.exam_end_date,
                description=f"Session d'examens du {self.name}",
                color='#fd7e14',
                is_auto_generated=True,
            ))

        # 5) Rattrapage
        if self.rattrapage_start_date and self.rattrapage_end_date:
            events_to_create.append(AcademicEvent(
                name=f"Rattrapage — {self.name}",
                event_type='rattrapage',
                academic_year=year,
                term=self,
                start_date=self.rattrapage_start_date,
                end_date=self.rattrapage_end_date,
                description=f"Session de rattrapage du {self.name}",
                color='#6f42c1',
                is_auto_generated=True,
            ))

        # Bulk create
        if events_to_create:
            AcademicEvent.objects.bulk_create(events_to_create)

        return len(events_to_create)


class AcademicEvent(models.Model):
    """
    Événement académique: vacances, jours fériés, examens, rattrapages, etc.
    Peut être lié à un Term spécifique ou à l'année entière.
    """
    EVENT_TYPE_CHOICES = [
        ('vacance', 'Vacances'),
        ('ferie', 'Jour férié'),
        ('examen', 'Examen'),
        ('rattrapage', 'Rattrapage'),
        ('rentree', 'Rentrée'),
        ('ceremonie', 'Cérémonie'),
        ('autre', 'Autre'),
    ]

    name = models.CharField(max_length=200, help_text="Nom de l'événement")
    event_type = models.CharField(max_length=15, choices=EVENT_TYPE_CHOICES)
    academic_year = models.ForeignKey(
        AcademicYear, on_delete=models.CASCADE, related_name='events',
        help_text="Année académique"
    )
    term = models.ForeignKey(
        Term, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='events',
        help_text="Trimestre/semestre concerné (optionnel)"
    )
    start_date = models.DateField()
    end_date = models.DateField()
    description = models.TextField(blank=True, null=True)
    color = models.CharField(
        max_length=20, blank=True, null=True,
        help_text="Couleur CSS pour l'affichage (ex: '#FF5733', 'red')"
    )
    is_auto_generated = models.BooleanField(
        default=False,
        help_text="Événement généré automatiquement à partir des dates du trimestre"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_date']
        verbose_name = 'Événement académique'
        verbose_name_plural = 'Événements académiques'

    def __str__(self):
        return f"{self.name} ({self.start_date} → {self.end_date})"


class Room(models.Model):
    ROOM_TYPE_CHOICES = [
        ('salle', 'Salle de cours'),
        ('amphitheatre', 'Amphitheatre'),
        ('laboratoire', 'Laboratoire'),
        ('bureau', 'Bureau'),
        ('autre', 'Autre'),
    ]

    name = models.CharField(max_length=100, unique=True)
    building = models.CharField(max_length=100, blank=True, null=True)
    capacity = models.PositiveIntegerField(default=30)
    equipment = models.TextField(blank=True, null=True)
    room_type = models.CharField(max_length=20, choices=ROOM_TYPE_CHOICES, default='salle')

    def __str__(self):
        return f"{self.name} ({self.building})"


class RoomReservation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('confirmed', 'Confirmee'),
        ('rejected', 'Refusee'),
        ('archived', 'Archivee'),
    ]

    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='reservations')
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='room_reservations',
    )
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    purpose = models.TextField()
    equipment_needs = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', 'start_time']
        verbose_name = 'Reservation de salle'
        verbose_name_plural = 'Reservations de salles'

    def __str__(self):
        return f"{self.room} - {self.date} {self.start_time}-{self.end_time}"


class TimeSlot(models.Model):
    """
    A time period (e.g. "1ère heure: 8h30-12h00"), independent of day.
    Linked to vacation_type so the correct periods appear for jour vs soir auditoires.
    """
    VACATION_CHOICES = [
        ('jour', 'Jour'),
        ('soir', 'Soir'),
    ]
    label = models.CharField(
        max_length=50, default='Période',
        help_text="Nom de la période, ex: '1ère heure', '2ème heure'"
    )
    start_time = models.TimeField()
    end_time = models.TimeField()
    vacation_type = models.CharField(
        max_length=10, choices=VACATION_CHOICES, default='jour',
        help_text="Type de vacation auquel cette période s'applique"
    )
    order = models.PositiveSmallIntegerField(
        default=0,
        help_text="Ordre d'affichage (1=1ère heure, 2=2ème heure...)"
    )

    class Meta:
        ordering = ['vacation_type', 'order', 'start_time']
        unique_together = ['vacation_type', 'start_time', 'end_time']

    def __str__(self):
        return f"{self.label} ({self.start_time.strftime('%H:%M')}-{self.end_time.strftime('%H:%M')}) [{self.get_vacation_type_display()}]"


class Schedule(models.Model):
    """
    Represents one recurring (normal) or intensive (module) schedule slot.

    normal : cours hebdomadaire recurrent (tout le semestre)
             -> requires day_of_week + timeslot (period)
    module : cours intensif sur une periode definie (module_start_date -> module_end_date)
             -> toute la journee, no day/period needed
    """
    SCHEDULE_TYPE_CHOICES = [
        ('normal', 'Normal (hebdomadaire)'),
        ('module', 'Module (intensif)'),
        ('examen', 'Examen'),
        ('rattrapage', 'Rattrapage'),
    ]
    DAY_CHOICES = [
        ('lundi', 'Lundi'), ('mardi', 'Mardi'), ('mercredi', 'Mercredi'),
        ('jeudi', 'Jeudi'), ('vendredi', 'Vendredi'), ('samedi', 'Samedi'),
    ]

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='schedules')
    auditoire = models.ForeignKey(Auditoire, on_delete=models.CASCADE, related_name='schedules')
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True, related_name='schedules')
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='scheduled_courses'
    )
    schedule_type = models.CharField(max_length=10, choices=SCHEDULE_TYPE_CHOICES, default='normal')
    description = models.TextField(blank=True, null=True)

    # Link to academic calendar
    term = models.ForeignKey(
        Term, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='schedules',
        help_text="Trimestre/semestre pour ce cours (optionnel)"
    )

    # Normal schedule fields: day + time
    day_of_week = models.CharField(
        max_length=10, choices=DAY_CHOICES, null=True, blank=True,
        help_text="Jour de la semaine (pour horaire normal/examen/rattrapage)"
    )
    timeslot = models.ForeignKey(
        TimeSlot, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='schedules',
        help_text="Période horaire (legacy, optionnel)"
    )
    # Custom start/end time (replaces fixed timeslot)
    start_time = models.TimeField(
        null=True, blank=True,
        help_text="Heure de début du cours (ex: 08:30)"
    )
    end_time = models.TimeField(
        null=True, blank=True,
        help_text="Heure de fin du cours (ex: 12:00)"
    )

    # Module-specific fields (used only when schedule_type == 'module')
    module_start_date = models.DateField(null=True, blank=True)
    module_end_date = models.DateField(null=True, blank=True)
    module_start_time = models.TimeField(
        null=True, blank=True,
        help_text="Heure de début du module (optionnel)"
    )
    module_end_time = models.TimeField(
        null=True, blank=True,
        help_text="Heure de fin du module (optionnel)"
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Emploi du temps'
        verbose_name_plural = 'Emplois du temps'

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.schedule_type == 'normal':
            if not self.day_of_week:
                raise ValidationError("Le jour est obligatoire pour un horaire normal.")
            if not self.timeslot:
                raise ValidationError("La période horaire est obligatoire pour un horaire normal.")
        elif self.schedule_type == 'module':
            if not self.module_start_date or not self.module_end_date:
                raise ValidationError("Les dates de début et fin sont obligatoires pour un module.")

    def __str__(self):
        if self.schedule_type == 'module':
            time_str = ''
            if self.module_start_time and self.module_end_time:
                time_str = f" {self.module_start_time.strftime('%H:%M')}-{self.module_end_time.strftime('%H:%M')}"
            return f"{self.course} - {self.auditoire} (Module: {self.module_start_date} → {self.module_end_date}{time_str})"
        day_label = dict(self.DAY_CHOICES).get(self.day_of_week, self.day_of_week or '?')
        period = self.timeslot.label if self.timeslot else '?'
        return f"{self.course} - {self.auditoire} - {day_label} {period}"


class ScheduleException(models.Model):
    """Annulation, remplacement ou changement de salle pour une seance donnee."""
    schedule = models.ForeignKey(Schedule, on_delete=models.CASCADE, related_name='exceptions')
    date = models.DateField()
    reason = models.CharField(max_length=200)
    replacement_teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='replacement_schedules'
    )
    replacement_room = models.ForeignKey(
        Room, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='replacement_exceptions'
    )
    is_cancelled = models.BooleanField(default=False)

    def __str__(self):
        return f"Exception {self.date} for {self.schedule}"


class TeacherAvailability(models.Model):
    """
    Declare la disponibilite ou indisponibilite d'un enseignant pour une période.
    Utilise pour detecter les conflits d'horaire et aider la planification.
    """
    AVAILABILITY_TYPE_CHOICES = [
        ('disponible', 'Disponible'),
        ('indisponible', 'Indisponible'),
        ('prefere', 'Prefere'),
    ]
    DAY_CHOICES = [
        ('lundi', 'Lundi'), ('mardi', 'Mardi'), ('mercredi', 'Mercredi'),
        ('jeudi', 'Jeudi'), ('vendredi', 'Vendredi'), ('samedi', 'Samedi'),
    ]

    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='availability_slots',
        limit_choices_to={'role__in': ['enseignant', 'assistant']}
    )
    day_of_week = models.CharField(max_length=10, choices=DAY_CHOICES, default='lundi')
    timeslot = models.ForeignKey(TimeSlot, on_delete=models.CASCADE, related_name='teacher_availabilities')
    availability_type = models.CharField(max_length=15, choices=AVAILABILITY_TYPE_CHOICES, default='disponible')
    start_date = models.DateField(null=True, blank=True,
                                  help_text="Debut de la periode (null = permanent)")
    end_date = models.DateField(null=True, blank=True,
                                help_text="Fin de la periode (null = permanent)")
    reason = models.CharField(max_length=200, blank=True, null=True)

    class Meta:
        unique_together = ['teacher', 'day_of_week', 'timeslot', 'start_date']
        verbose_name = "Disponibilite enseignant"
        verbose_name_plural = "Disponibilites enseignants"

    def __str__(self):
        return f"{self.teacher} - {self.get_day_of_week_display()} {self.timeslot.label} - {self.availability_type}"
