"""
Models for grades, averages, bulletins, academic configuration
"""
from django.db import models

from apps.core.softdelete import SoftDeleteModel
from django.conf import settings
from apps.courses.models import Course
from apps.auditoires.models import Auditoire, default_academic_year_label


# ═══════════════════════════════════════════════════════════════════════════
# Academic Configuration — Singleton
# ═══════════════════════════════════════════════════════════════════════════

class AcademicConfig(models.Model):
    """
    Singleton — one row in the table, holds institution-wide academic settings.
    Controls:  credit↔hour ratio, passing grade, grading scale, deliberation rules.
    """
    # Credit ↔ Hours ratio
    hours_per_credit = models.PositiveSmallIntegerField(
        default=15,
        verbose_name='Heures par crédit',
        help_text="Ex: 1 credit = 15 heures academiques. Utilise pour calculer le volume horaire total d un cours et les prestations enseignants."
    )

    # Grading scale
    max_grade = models.DecimalField(
        max_digits=5, decimal_places=2, default=20,
        verbose_name='Note maximale',
        help_text='Échelle de notation (ex: 20, 100)'
    )
    passing_grade = models.DecimalField(
        max_digits=5, decimal_places=2, default=10,
        verbose_name='Note de passage',
        help_text="Note minimale pour valider un cours (sur l echelle ci-dessus)"
    )
    passing_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=50,
        verbose_name='Pourcentage de réussite (%)',
        help_text='Pourcentage minimum pour réussir (ex: 50%)'
    )

    # Deliberation
    allow_compensation = models.BooleanField(
        default=False,
        verbose_name='Permettre la compensation',
        help_text="Permet de compenser un cours echoue par un autre dans le meme auditoire"
    )
    min_credits_ratio_passage = models.DecimalField(
        max_digits=5, decimal_places=2, default=75,
        verbose_name='Crédits minimum pour passer avec dette (%)',
        help_text="Après la 2e session : pourcentage minimum de crédits capitalisés pour passer en année supérieure avec des dettes"
    )
    compensation_threshold = models.DecimalField(
        max_digits=5, decimal_places=2, default=8,
        verbose_name='Seuil de compensation',
        help_text="Note minimale dans un cours pour pouvoir le compenser"
    )

    # Academic year info
    current_academic_year = models.CharField(
        max_length=20, default=default_academic_year_label,
        verbose_name='Année académique en cours'
    )
    current_semester = models.CharField(
        max_length=50, default='Semestre 1',
        verbose_name='Semestre/Trimestre en cours'
    )

    # LMD : volume annuel et assiduité
    credits_per_year = models.PositiveSmallIntegerField(
        default=60, verbose_name="Crédits par année d'études",
        help_text="LMD : 60 crédits par an (30 par semestre)")
    min_attendance_percent = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        verbose_name="Assiduité minimale pour l'examen (%)",
        help_text="0 = règle désactivée. Ex. 66,67 : présence aux deux tiers des séances exigée")

    # Teacher hours tracking
    include_retard_in_presence = models.BooleanField(
        default=True,
        verbose_name='Retard = Présent pour le calcul',
        help_text="Les etudiants en retard comptent comme presents pour le taux de presence"
    )

    # Metadata
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='config_updates'
    )

    class Meta:
        verbose_name = 'Configuration académique'
        verbose_name_plural = 'Configuration académique'

    def __str__(self):
        return f"Config. académique — {self.current_academic_year}"

    def save(self, *args, **kwargs):
        """Enforce singleton: always use pk=1."""
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        """Get or create the singleton config row."""
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def get_course_total_hours(self, course):
        """Calculate total academic hours for a course based on its credits."""
        return course.credits * self.hours_per_credit

    def get_teacher_planned_hours(self, teacher):
        """Get total planned hours for a teacher across all their courses."""
        from apps.courses.models import Course as CourseModel
        from django.db.models import Q, Sum
        courses = CourseModel.objects.filter(
            Q(titulaire=teacher) | Q(assistants=teacher),
            is_active=True
        ).distinct()
        total = 0
        for c in courses:
            total += c.credits * self.hours_per_credit
        return total

    def get_teacher_taught_hours(self, teacher, mois=None, annee=None):
        """Get actual hours taught by a teacher from AttendanceSession records."""
        from apps.courses.attendance_models import AttendanceSession
        from apps.courses.models import Course as CourseModel
        from django.db.models import Q
        from datetime import timedelta

        courses = CourseModel.objects.filter(
            Q(titulaire=teacher) | Q(assistants=teacher),
            is_active=True
        ).distinct()

        sessions = AttendanceSession.objects.filter(
            course__in=courses,
            is_finalized=True
        )

        if mois and annee:
            sessions = sessions.filter(date__month=mois, date__year=annee)
        elif annee:
            sessions = sessions.filter(date__year=annee)

        total_hours = 0
        for s in sessions:
            if s.start_time and s.end_time:
                start_dt = timedelta(hours=s.start_time.hour, minutes=s.start_time.minute)
                end_dt = timedelta(hours=s.end_time.hour, minutes=s.end_time.minute)
                diff = (end_dt - start_dt).total_seconds() / 3600
                total_hours += max(diff, 0)
        return round(total_hours, 2)


# ═══════════════════════════════════════════════════════════════════════════
# Grade Categories & Weights
# ═══════════════════════════════════════════════════════════════════════════


class GradeCategory(SoftDeleteModel):
    """
    Defines a type of evaluation (Interro, Quiz, TP/TD, Examen, …).
    IMPORTANT: 'Interro' and 'Quiz' are different categories:
      - Interro  = oral/written interrogation done in class (not online)
      - Quiz     = online quiz via the quiz module
      - TP/TD    = practical/tutorial work
      - Examen   = final written exam
    """
    CATEGORY_TYPE_CHOICES = [
        ('interro', 'Interrogation'),
        ('quiz',    'Quiz (en ligne)'),
        ('tp_td',   'TP / TD'),
        ('examen',  'Examen'),
        ('bonus',   'Bonus'),
    ]

    name = models.CharField(max_length=80, unique=True)
    category_type = models.CharField(
        max_length=20,
        choices=CATEGORY_TYPE_CHOICES,
        default='examen',
        verbose_name="Type d'évaluation"
    )
    # Global default weight (%).  Per-course overrides live in CourseGradeWeight.
    weight = models.DecimalField(max_digits=5, decimal_places=2, default=0,
                                 help_text="Poids global par défaut (%)")
    description = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['name']
        verbose_name = "Catégorie de note"
        verbose_name_plural = "Catégories de notes"

    def __str__(self):
        return f"{self.name} ({self.weight}%)"


class CourseGradeWeight(SoftDeleteModel):
    """
    Per-course override of category weight.
    Allows SGA / teacher to set: for THIS course, interro counts 20 %, examen 50 %, etc.
    """
    course    = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='grade_weights')
    category  = models.ForeignKey(GradeCategory, on_delete=models.CASCADE, related_name='course_weights')
    weight    = models.DecimalField(max_digits=5, decimal_places=2,
                                    help_text="Poids pour ce cours (%)")

    class Meta:
        unique_together = ['course', 'category']
        ordering = ['course', 'category']
        verbose_name = "Pondération par cours"
        verbose_name_plural = "Pondérations par cours"

    def __str__(self):
        return f"{self.course} — {self.category}: {self.weight}%"


class Grade(SoftDeleteModel):
    STATUS_CHOICES = [
        ('draft', 'Brouillon'),
        ('validated', 'Validée'),
    ]

    student  = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                  related_name='grades')
    course   = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='grades')
    category = models.ForeignKey(GradeCategory, on_delete=models.CASCADE, related_name='grades')

    # Label lets you distinguish multiple grades of the same type
    # e.g. label="Interro 1", "Interro 2", "TP Semaine 4"
    label    = models.CharField(max_length=120, blank=True, default='',
                                help_text='Ex: "Interro 1", "TP Semaine 4"')
    # 1-based sequence number within (student, course, category)
    session_number = models.PositiveSmallIntegerField(default=1)
    # Session d'examen : 1 = première session, 2 = rattrapage (seconde session)
    exam_session = models.PositiveSmallIntegerField(default=1, choices=[(1, '1re session'), (2, '2e session')])

    value    = models.DecimalField(max_digits=5, decimal_places=2)
    max_value = models.DecimalField(max_digits=5, decimal_places=2, default=20,
                                    help_text="Note maximale (ex: 20 ou 100)")
    # 'validated' = publiée à l'étudiant (feuille approuvée). Le statut suit la feuille de notes.
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='draft')
    date     = models.DateField(auto_now_add=True)
    comment  = models.TextField(blank=True, null=True)

    # Link to a quiz attempt if this grade comes from the quiz module
    quiz_attempt = models.OneToOneField(
        'quiz.QuizAttempt', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='grade'
    )

    class Meta:
        # Removed the old unique_together so multiple interros/TPs are possible.
        # Uniqueness is (student, course, category, session_number).
        unique_together = ['student', 'course', 'category', 'session_number', 'exam_session']
        ordering = ['student', 'course', 'category', 'session_number']

    def __str__(self):
        label = self.label or f"#{self.session_number}"
        return f"{self.student} — {self.course} — {self.category} ({label}): {self.value}/{self.max_value}"

    @property
    def percentage(self):
        if self.max_value and self.max_value > 0:
            return round(float(self.value) / float(self.max_value) * 100, 2)
        return 0


class ExamSession(SoftDeleteModel):
    SESSION_TYPE_CHOICES = [
        ('partiel',    'Partiel'),
        ('final',      'Final'),
        ('rattrapage', 'Rattrapage'),
    ]
    course      = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='exam_sessions')
    auditoire   = models.ForeignKey(Auditoire, on_delete=models.CASCADE, related_name='exam_sessions')
    session_type = models.CharField(max_length=20, choices=SESSION_TYPE_CHOICES)
    date        = models.DateField()
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.course} — {self.session_type} — {self.date}"


class Transcript(models.Model):
    student   = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                   related_name='transcripts')
    auditoire = models.ForeignKey(Auditoire, on_delete=models.CASCADE,
                                   related_name='transcripts')
    semester  = models.CharField(max_length=20)
    year      = models.CharField(max_length=10)
    average   = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Bulletin {self.student} {self.semester} {self.year}"


# ═══════════════════════════════════════════════════════════════════════════
# Workflow de validation des notes (cahier des charges v2, phase 2)
# ═══════════════════════════════════════════════════════════════════════════

class GradeSheet(models.Model):
    """
    Feuille de notes d'un cours pour une session d'examen.
    brouillon → soumise (titulaire) → approuvée (chef de filière / section / SGA)
    → verrouillée (ouverture de la délibération). Une note ne se modifie que si la
    feuille est en brouillon ; ensuite, toute correction passe par une requête tracée.
    """
    STATUS_CHOICES = [
        ('draft', 'Brouillon'),
        ('submitted', 'Soumise'),
        ('approved', 'Approuvée'),
        ('locked', 'Verrouillée'),
    ]
    SESSION_CHOICES = [(1, '1re session'), (2, '2e session')]

    course = models.ForeignKey(Course, on_delete=models.PROTECT, related_name='grade_sheets')
    session = models.PositiveSmallIntegerField(choices=SESSION_CHOICES, default=1)
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default='draft')
    submitted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
                                     blank=True, related_name='+')
    submitted_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
                                    blank=True, related_name='+')
    approved_at = models.DateTimeField(null=True, blank=True)
    locked_at = models.DateTimeField(null=True, blank=True)
    return_reason = models.TextField(blank=True, default='')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['course', 'session']
        ordering = ['course__name', 'session']
        verbose_name = 'Feuille de notes'
        verbose_name_plural = 'Feuilles de notes'

    def __str__(self):
        return f"{self.course} — session {self.session} ({self.get_status_display()})"

    @property
    def is_editable(self):
        return self.status == 'draft'


class GradeCorrectionRequest(models.Model):
    """Correction d'une note après soumission : demandée, puis tranchée par le jury / SGA."""
    STATUS_CHOICES = [('pending', 'En attente'), ('approved', 'Acceptée'), ('rejected', 'Refusée')]

    grade = models.ForeignKey(Grade, on_delete=models.PROTECT, related_name='correction_requests')
    old_value = models.DecimalField(max_digits=5, decimal_places=2)
    new_value = models.DecimalField(max_digits=5, decimal_places=2)
    reason = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
                                     related_name='+')
    requested_at = models.DateTimeField(auto_now_add=True)
    decided_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
                                   blank=True, related_name='+')
    decided_at = models.DateTimeField(null=True, blank=True)
    decision_note = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-requested_at']
        verbose_name = 'Demande de correction de note'
        verbose_name_plural = 'Demandes de correction de note'

    def __str__(self):
        return f"Correction {self.grade} : {self.old_value} → {self.new_value} ({self.get_status_display()})"
