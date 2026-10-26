"""
Course models
"""
from django.db import models

from apps.core.softdelete import SoftDeleteModel
from django.conf import settings
from django.utils.text import slugify
from django.utils import timezone
from apps.auditoires.models import Section, Filiere, Auditoire

class Course(SoftDeleteModel):
    """Course Model - Un cours est donné dans UN SEUL auditoire"""

    name = models.CharField(max_length=200, verbose_name='Nom du cours')
    code = models.CharField(max_length=20, unique=True, blank=True, editable=False, verbose_name='Code du cours')
    description = models.TextField(blank=True, null=True, verbose_name='Description')
    credits = models.IntegerField(default=3, verbose_name='Crédits')
    # Volume horaire présentiel (LMD : crédits × heures par crédit si non renseigné)
    volume_cm = models.PositiveSmallIntegerField(default=0, verbose_name='Cours magistral (h)')
    volume_td = models.PositiveSmallIntegerField(default=0, verbose_name='Travaux dirigés (h)')
    volume_tp = models.PositiveSmallIntegerField(default=0, verbose_name='Travaux pratiques (h)')

    # Relations - Hiérarchie universitaire correcte
    # Un cours appartient à UN auditoire (qui appartient à une filière, qui appartient à une section)
    auditoire = models.ForeignKey(
        Auditoire,
        on_delete=models.CASCADE,
        related_name='courses',
        verbose_name='Auditoire',
        help_text='Auditoire dans lequel ce cours est donné',
        null=False,
        blank=False
    )

    # Élément constitutif (EC) d'une unité d'enseignement du programme
    ue = models.ForeignKey(
        'scolarite.UniteEnseignement', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='cours', verbose_name="Unité d'enseignement"
    )

    # Un cours a UN enseignant titulaire
    titulaire = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='courses_as_teacher',
        verbose_name='Enseignant Titulaire',
        limit_choices_to={'role__in': ['enseignant', 'chef_section', 'chef_departement']}
    )

    # Un cours peut avoir plusieurs assistants
    assistants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='courses_as_assistant',
        blank=True,
        verbose_name='Assistants',
        limit_choices_to={'role': 'assistant'}
    )

    # Prerequisites: cours prérequis pour ce cours
    prerequisites = models.ManyToManyField(
        'self',
        symmetrical=False,
        blank=True,
        related_name='dependent_courses',
        verbose_name='Cours prérequis',
        help_text="Cours que l'étudiant doit avoir validé avant de suivre celui-ci"
    )

    # Durée en trimestres (un cours peut s'étaler sur 1, 2 ou 3 trimestres)
    duration_terms = models.PositiveSmallIntegerField(
        default=1,
        help_text="Nombre de trimestres sur lesquels le cours s'étale (1, 2 ou 3)",
        verbose_name='Durée (en trimestres)'
    )

    # Course content
    syllabus = models.FileField(upload_to='syllabi/', blank=True, null=True, verbose_name='Syllabus')
    resources = models.TextField(blank=True, null=True, verbose_name='Ressources')

    # Settings
    is_active = models.BooleanField(default=True, verbose_name='Actif')
    semester = models.CharField(max_length=200, default='Semestre 1', verbose_name='Semestre(s)',
                               help_text='Un ou plusieurs semestres/trimestres, séparés par des virgules')
    annee_academique = models.CharField(max_length=20, default='2024-2025', verbose_name='Année académique')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Cours'
        verbose_name_plural = 'Cours'
        ordering = ['name']

    @property
    def volume_horaire_total(self):
        return (self.volume_cm or 0) + (self.volume_td or 0) + (self.volume_tp or 0)

    def __str__(self):
        return f"{self.code} - {self.name}"

    def save(self, *args, **kwargs):
        """Generate a unique code before saving."""
        is_new = self._state.adding
        super().save(*args, **kwargs) # Save first to get an ID
        if is_new and not self.code:
            # Generate abbreviation from name
            abbreviation = "".join(word[0] for word in self.name.split()).upper()
            self.code = f"{abbreviation}-{self.id}"
            # Save again to store the code
            kwargs.pop('force_insert', None) # Avoid re-inserting
            super().save(force_update=True, update_fields=['code'])

    @property
    def section(self):
        """Section du cours (via auditoire → filière → section)"""
        return self.auditoire.filiere.section if self.auditoire else None

    @property
    def filiere(self):
        """Filière du cours (via auditoire → filière)"""
        return self.auditoire.filiere if self.auditoire else None

    @property
    def students_count(self):
        """Count of enrolled students"""
        return self.enrollments.filter(is_active=True).count()

    @property
    def progress_percentage(self):
        """Average progress of all students"""
        enrollments = self.enrollments.filter(is_active=True)
        if not enrollments:
            return 0
        total_progress = sum([e.progress for e in enrollments])
        return round(total_progress / enrollments.count(), 2)


class CourseEnrollment(models.Model):
    """Student enrollment in courses - Un étudiant ne peut s'inscrire qu'aux cours de son auditoire"""

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='enrollments',
        verbose_name='Étudiant',
        limit_choices_to={'role': 'etudiant'}
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='enrollments',
        verbose_name='Cours'
    )

    progress = models.IntegerField(default=0, verbose_name='Progression (%)')
    grade = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, verbose_name='Note')

    enrolled_at = models.DateTimeField(auto_now_add=True, verbose_name='Date d\'inscription')
    is_active = models.BooleanField(default=True, verbose_name='Actif')

    class Meta:
        verbose_name = 'Inscription au cours'
        verbose_name_plural = 'Inscriptions aux cours'
        unique_together = ['student', 'course']
        ordering = ['-enrolled_at']

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.course.name}"

    def clean(self):
        """Validation: un étudiant ne peut s'inscrire qu'aux cours de son auditoire"""
        from django.core.exceptions import ValidationError
        if self.student.auditoire and self.course.auditoire:
            if self.student.auditoire != self.course.auditoire:
                raise ValidationError(
                    f"L'étudiant {self.student.get_full_name()} (auditoire: {self.student.auditoire.nom}) "
                    f"ne peut pas s'inscrire au cours {self.course.name} (auditoire: {self.course.auditoire.nom})"
                )


class CourseMaterial(SoftDeleteModel):
    """Course materials (documents, videos, etc.)"""

    MATERIAL_TYPES = [
        ('document', 'Document'),
        ('video', 'Vidéo'),
        ('audio', 'Audio'),
        ('link', 'Lien'),
        ('presentation', 'Présentation'),
    ]

    course = models.ForeignKey(Course, on_delete=models.CASCADE,
                              related_name='materials', verbose_name='Cours')
    title = models.CharField(max_length=200, verbose_name='Titre')
    description = models.TextField(blank=True, null=True, verbose_name='Description')
    material_type = models.CharField(max_length=20, choices=MATERIAL_TYPES, verbose_name='Type')

    file = models.FileField(upload_to='course_materials/', blank=True, null=True, verbose_name='Fichier')
    link = models.URLField(blank=True, null=True, verbose_name='Lien')

    order = models.IntegerField(default=0, verbose_name='Ordre')
    is_public = models.BooleanField(default=True, verbose_name='Public')

    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                   null=True, verbose_name='Téléchargé par')
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name='Date de téléchargement')

    class Meta:
        verbose_name = 'Matériel de cours'
        verbose_name_plural = 'Matériels de cours'
        ordering = ['course', 'order', '-uploaded_at']

    def __str__(self):
        return f"{self.course.code} - {self.title}"


# Import attendance models to make them available
from .attendance_models import Attendance, AttendanceSession

# Import assistant models
from .assistant_models import TeacherAssistant
