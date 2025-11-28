"""
Course models
"""
from django.db import models
from django.conf import settings
from django.utils.text import slugify

class Course(models.Model):
    """Course Model"""

    name = models.CharField(max_length=200, verbose_name='Nom du cours')
    code = models.CharField(max_length=20, unique=True, blank=True, editable=False, verbose_name='Code du cours')
    description = models.TextField(blank=True, null=True, verbose_name='Description')
    credits = models.IntegerField(default=3, verbose_name='Crédits')

    # Relations
    titulaire = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                               null=True, related_name='courses_held', verbose_name='Enseignant Titulaire')
    assistants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='courses_assisted',
                                       blank=True, verbose_name='Assistants')
    auditoire = models.ForeignKey('auditoires.Auditoire', on_delete=models.SET_NULL,
                                  null=True, blank=True, related_name='courses', verbose_name='Auditoire')

    # Course content
    syllabus = models.FileField(upload_to='syllabi/', blank=True, null=True, verbose_name='Syllabus')
    resources = models.TextField(blank=True, null=True, verbose_name='Ressources')

    # Settings
    is_active = models.BooleanField(default=True, verbose_name='Actif')
    semester = models.CharField(max_length=20, default='Semestre 1', verbose_name='Semestre')
    annee_academique = models.CharField(max_length=20, default='2024-2025', verbose_name='Année académique')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Cours'
        verbose_name_plural = 'Cours'
        ordering = ['name']

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
    """Student enrollment in courses"""

    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                               related_name='enrollments', verbose_name='Étudiant')
    course = models.ForeignKey(Course, on_delete=models.CASCADE,
                              related_name='enrollments', verbose_name='Cours')

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


class CourseMaterial(models.Model):
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
