"""
Assignment models (TP/TD)
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Assignment(models.Model):
    """Assignment Model (TP/TD)"""

    ASSIGNMENT_TYPES = [
        ('TP', 'Travaux Pratiques'),
        ('TD', 'Travaux Dirigés'),
        ('projet', 'Projet'),
        ('devoir', 'Devoir'),
    ]

    STATUS_CHOICES = [
        ('a_venir', 'À venir'),
        ('en_cours', 'En cours'),
        ('termine', 'Terminé'),
        ('annule', 'Annulé'),
    ]

    title = models.CharField(max_length=200, verbose_name='Titre')
    description = models.TextField(verbose_name='Description')
    instructions = models.TextField(verbose_name='Consignes')

    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE,
                              related_name='assignments', verbose_name='Cours')
    assignment_type = models.CharField(max_length=20, choices=ASSIGNMENT_TYPES,
                                      default='TP', verbose_name='Type')

    # Dates
    start_date = models.DateTimeField(verbose_name='Date de début')
    due_date = models.DateTimeField(verbose_name='Date limite')

    # Settings
    max_score = models.IntegerField(default=20, verbose_name='Note maximale')
    allow_late_submission = models.BooleanField(default=False, verbose_name='Autoriser les soumissions tardives')
    late_penalty = models.IntegerField(default=10, validators=[MinValueValidator(0), MaxValueValidator(100)],
                                      verbose_name='Pénalité de retard (%)')

    # Resources
    attachment = models.FileField(upload_to='assignments/', blank=True, null=True,
                                 verbose_name='Fichier joint')

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='a_venir', verbose_name='Statut')
    is_active = models.BooleanField(default=True, verbose_name='Actif')

    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                  null=True, related_name='assignments_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Travail (TP/TD)'
        verbose_name_plural = 'Travaux (TP/TD)'
        ordering = ['-due_date']

    def __str__(self):
        return f"{self.get_assignment_type_display()} - {self.title}"

    @property
    def submissions_count(self):
        """Count of submissions"""
        return self.submissions.count()


class Submission(models.Model):
    """Student submission for an assignment"""

    STATUS_CHOICES = [
        ('brouillon', 'Brouillon'),
        ('soumis', 'Soumis'),
        ('en_correction', 'En correction'),
        ('note', 'Noté'),
    ]

    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE,
                                  related_name='submissions', verbose_name='Travail')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                               related_name='submissions', verbose_name='Étudiant')

    content = models.TextField(blank=True, null=True, verbose_name='Contenu')
    attachment = models.FileField(upload_to='submissions/', blank=True, null=True,
                                 verbose_name='Fichier joint')

    # Grading
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True,
                               verbose_name='Note')
    feedback = models.TextField(blank=True, null=True, verbose_name='Commentaires')
    graded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                 null=True, blank=True, related_name='graded_submissions',
                                 verbose_name='Noté par')
    graded_at = models.DateTimeField(null=True, blank=True, verbose_name='Noté le')

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='brouillon',
                            verbose_name='Statut')
    is_late = models.BooleanField(default=False, verbose_name='En retard')

    submitted_at = models.DateTimeField(null=True, blank=True, verbose_name='Soumis le')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Soumission'
        verbose_name_plural = 'Soumissions'
        unique_together = ['assignment', 'student']
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.assignment.title}"


class SubmissionComment(models.Model):
    """Comments on submissions"""

    submission = models.ForeignKey(Submission, on_delete=models.CASCADE,
                                  related_name='comments', verbose_name='Soumission')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                              related_name='submission_comments', verbose_name='Auteur')
    comment = models.TextField(verbose_name='Commentaire')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Commentaire de soumission'
        verbose_name_plural = 'Commentaires de soumissions'
        ordering = ['created_at']

    def __str__(self):
        return f"Commentaire de {self.author.get_full_name()}"
