"""
Models for TP/TD (Travaux Pratiques/Dirigés) System
Professional and flexible assignment management
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.users.models import User
from apps.courses.models import Course


class Assignment(models.Model):
    """
    TP/TD Assignment Model
    Support both practical work (TP) and directed exercises (TD)
    """
    ASSIGNMENT_TYPE_CHOICES = [
        ('TP', 'Travaux Pratiques'),
        ('TD', 'Travaux Dirigés'),
    ]

    SUBMISSION_TYPE_CHOICES = [
        ('electronic', 'Électronique'),
        ('physical', 'Physique'),
        ('both', 'Les Deux'),
    ]

    STATUS_CHOICES = [
        ('draft', 'Brouillon'),
        ('published', 'Publié'),
        ('closed', 'Fermé'),
    ]

    # Basic Information
    title = models.CharField(max_length=255, verbose_name="Titre")
    description = models.TextField(verbose_name="Description", blank=True)
    assignment_type = models.CharField(max_length=2, choices=ASSIGNMENT_TYPE_CHOICES, default='TP')

    # Course relationship
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='assignments')

    # Submission details
    submission_type = models.CharField(
        max_length=20,
        choices=SUBMISSION_TYPE_CHOICES,
        default='electronic',
        verbose_name="Type de remise"
    )
    due_date = models.DateTimeField(null=True, blank=True, verbose_name="Date de remise")

    # Grading
    max_points = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=100,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name="Note maximale"
    )

    # Resources
    instructions = models.TextField(verbose_name="Instructions", blank=True, null=True)
    resources = models.FileField(
        upload_to='assignments/resources/%Y/%m/',
        blank=True,
        null=True,
        verbose_name="Ressources"
    )

    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')

    # Auto-grading option
    auto_grade = models.BooleanField(
        default=False,
        help_text="Si activé, les réponses prédéfinies seront utilisées pour la correction automatique"
    )

    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_assignments')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-due_date', '-created_at']
        verbose_name = "Devoir (TP/TD)"
        verbose_name_plural = "Devoirs (TP/TD)"

    def __str__(self):
        return f"{self.get_assignment_type_display()} - {self.title} ({self.course.name})"

    def get_total_points(self):
        """Calculate total points from all questions"""
        return self.questions.aggregate(total=models.Sum('points'))['total'] or self.max_points


class AssignmentQuestion(models.Model):
    """
    Questions for TP/TD
    Flexible question types
    """
    QUESTION_TYPE_CHOICES = [
        ('text', 'Réponse textuelle'),
        ('file', 'Upload de fichier'),
        ('multiple_choice', 'Choix multiple'),
        ('single_choice', 'Choix unique'),
        ('code', 'Code'),
    ]

    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='questions')
    order = models.PositiveIntegerField(default=0, verbose_name="Ordre")
    question_text = models.TextField(verbose_name="Question")
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPE_CHOICES, default='text')

    # Points allocation
    points = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        null=True,
        blank=True,
        help_text="Si vide, les points seront divisés équitablement"
    )

    # For auto-grading
    correct_answer = models.TextField(
        blank=True,
        help_text="Réponse correcte pour la correction automatique"
    )

    # Additional resources for this question
    attachment = models.FileField(
        upload_to='assignments/questions/%Y/%m/',
        blank=True,
        null=True
    )

    class Meta:
        ordering = ['order']
        verbose_name = "Question de devoir"
        verbose_name_plural = "Questions de devoir"

    def __str__(self):
        return f"Q{self.order}: {self.question_text[:50]}"


class AssignmentChoice(models.Model):
    """
    Choices for multiple choice questions
    """
    question = models.ForeignKey(
        AssignmentQuestion,
        on_delete=models.CASCADE,
        related_name='choices'
    )
    choice_text = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.choice_text


class AssignmentSubmission(models.Model):
    """
    Student submission for TP/TD
    """
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('submitted', 'Soumis'),
        ('graded', 'Noté'),
        ('late', 'En retard'),
    ]

    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assignment_submissions')

    # Submission
    submitted_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # Grading
    score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    graded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='graded_submissions'
    )
    graded_at = models.DateTimeField(null=True, blank=True)
    feedback = models.TextField(blank=True, verbose_name="Commentaire")

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['assignment', 'student']
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.assignment.title}"

    def is_late(self):
        """Check if submission is late"""
        if self.submitted_at and self.assignment.due_date:
            return self.submitted_at > self.assignment.due_date
        return False


class AssignmentAnswer(models.Model):
    """
    Student's answer to a specific question
    """
    submission = models.ForeignKey(
        AssignmentSubmission,
        on_delete=models.CASCADE,
        related_name='answers'
    )
    question = models.ForeignKey(
        AssignmentQuestion,
        on_delete=models.CASCADE
    )

    # Answer content
    answer_text = models.TextField(blank=True)
    answer_file = models.FileField(
        upload_to='assignments/submissions/%Y/%m/',
        blank=True,
        null=True
    )

    # Grading for this answer
    points_earned = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)]
    )
    comment = models.TextField(blank=True)

    # For multiple choice
    selected_choices = models.ManyToManyField(
        AssignmentChoice,
        blank=True,
        related_name='answers'
    )

    class Meta:
        unique_together = ['submission', 'question']

    def __str__(self):
        return f"{self.submission.student.get_full_name()} - Q{self.question.order}"
