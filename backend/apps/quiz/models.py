"""
Models for Quiz System
Professional and flexible like Google Forms or better
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from apps.users.models import User
from apps.courses.models import Course


class Quiz(models.Model):
    """
    Quiz Model - Main quiz container
    """
    STATUS_CHOICES = [
        ('draft', 'Brouillon'),
        ('published', 'Publié'),
        ('closed', 'Fermé'),
    ]

    # Basic Information
    title = models.CharField(max_length=255, verbose_name="Titre du quiz")
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='quizzes')

    # Timing
    start_date = models.DateTimeField(null=True, blank=True, verbose_name="Date de début")
    end_date = models.DateTimeField(null=True, blank=True, verbose_name="Date de fin")
    duration_minutes = models.PositiveIntegerField(
        default=60,
        verbose_name="Durée (minutes)",
        help_text="Temps limite pour compléter le quiz"
    )

    # Grading
    max_points = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=100,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name="Note maximale"
    )

    # Settings
    shuffle_questions = models.BooleanField(
        default=False,
        verbose_name="Mélanger les questions"
    )
    shuffle_choices = models.BooleanField(
        default=False,
        verbose_name="Mélanger les choix"
    )
    show_correct_answers = models.BooleanField(
        default=True,
        verbose_name="Afficher les bonnes réponses après soumission"
    )
    allow_multiple_attempts = models.BooleanField(
        default=False,
        verbose_name="Autoriser plusieurs tentatives"
    )
    max_attempts = models.PositiveIntegerField(
        default=1,
        verbose_name="Nombre max de tentatives"
    )

    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')

    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_quizzes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_date', '-created_at']
        verbose_name = "Quiz"
        verbose_name_plural = "Quizzes"

    def __str__(self):
        return f"{self.title} - {self.course.name}"

    def is_active(self):
        """Check if quiz is currently active"""
        now = timezone.now()
        return self.status == 'published' and self.start_date <= now <= self.end_date

    def get_total_points(self):
        """Calculate total points from all questions"""
        return self.questions.aggregate(total=models.Sum('points'))['total'] or self.max_points


class QuizQuestion(models.Model):
    """
    Quiz Question Model
    Ultra flexible - supports multiple question types
    """
    QUESTION_TYPE_CHOICES = [
        ('single_choice', 'Choix unique (QCM)'),
        ('multiple_choice', 'Choix multiples'),
        ('true_false', 'Vrai/Faux'),
        ('short_answer', 'Réponse courte'),
        ('long_answer', 'Réponse longue'),
        ('file_upload', 'Upload de fichier'),
        ('matching', 'Appariement'),
        ('ordering', 'Mise en ordre'),
    ]

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    order = models.PositiveIntegerField(default=0, verbose_name="Ordre")
    question_type = models.CharField(
        max_length=20,
        choices=QUESTION_TYPE_CHOICES,
        default='single_choice'
    )

    # Question content
    question_text = models.TextField(verbose_name="Question")
    image = models.ImageField(
        upload_to='quiz/questions/%Y/%m/',
        blank=True,
        null=True,
        verbose_name="Image (optionnelle)"
    )
    explanation = models.TextField(
        blank=True,
        verbose_name="Explication",
        help_text="Explication affichée après la réponse"
    )

    # Points
    points = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=1,
        validators=[MinValueValidator(0)]
    )

    # Required
    is_required = models.BooleanField(default=True, verbose_name="Obligatoire")

    # For short answer auto-grading
    correct_answers = models.JSONField(
        default=list,
        blank=True,
        help_text="Liste des réponses correctes acceptées (pour réponse courte)"
    )
    case_sensitive = models.BooleanField(
        default=False,
        verbose_name="Sensible à la casse"
    )

    class Meta:
        ordering = ['order']
        verbose_name = "Question de quiz"
        verbose_name_plural = "Questions de quiz"

    def __str__(self):
        return f"Q{self.order}: {self.question_text[:50]}"


class QuizChoice(models.Model):
    """
    Choices for multiple choice questions
    """
    question = models.ForeignKey(
        QuizQuestion,
        on_delete=models.CASCADE,
        related_name='choices'
    )
    choice_text = models.CharField(max_length=500)
    image = models.ImageField(
        upload_to='quiz/choices/%Y/%m/',
        blank=True,
        null=True
    )
    is_correct = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    # For partial credit
    points_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=100,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Pourcentage des points si cette réponse est sélectionnée"
    )

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.choice_text


class QuizAttempt(models.Model):
    """
    Student's attempt at a quiz
    """
    STATUS_CHOICES = [
        ('in_progress', 'En cours'),
        ('submitted', 'Soumis'),
        ('graded', 'Noté'),
        ('expired', 'Expiré'),
    ]

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_attempts')

    attempt_number = models.PositiveIntegerField(default=1)

    # Timing
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    time_spent_seconds = models.PositiveIntegerField(default=0, verbose_name="Temps passé (secondes)")

    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')

    # Score
    score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    auto_graded_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True
    )

    # Manual grading
    graded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='graded_attempts'
    )
    graded_at = models.DateTimeField(null=True, blank=True)
    feedback = models.TextField(blank=True)

    class Meta:
        ordering = ['-started_at']
        unique_together = ['quiz', 'student', 'attempt_number']

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.quiz.title} (Tentative {self.attempt_number})"

    def is_expired(self):
        """Check if attempt has expired based on quiz duration"""
        if self.started_at and self.quiz.duration_minutes:
            expiry_time = self.started_at + timezone.timedelta(minutes=self.quiz.duration_minutes)
            return timezone.now() > expiry_time
        return False

    def calculate_auto_grade(self):
        """Calculate automatic grade based on answers"""
        total_points = 0
        earned_points = 0

        for answer in self.answers.all():
            question = answer.question
            total_points += question.points

            if question.question_type in ['single_choice', 'multiple_choice', 'true_false']:
                # Auto-gradable
                if answer.is_correct():
                    earned_points += answer.points_earned or question.points

        if total_points > 0:
            self.auto_graded_score = (earned_points / total_points) * self.quiz.max_points
            self.save()
        return self.auto_graded_score


class QuizAnswer(models.Model):
    """
    Student's answer to a quiz question
    """
    attempt = models.ForeignKey(
        QuizAttempt,
        on_delete=models.CASCADE,
        related_name='answers'
    )
    question = models.ForeignKey(QuizQuestion, on_delete=models.CASCADE)

    # Answer content (flexible for different question types)
    answer_text = models.TextField(blank=True)
    answer_file = models.FileField(
        upload_to='quiz/answers/%Y/%m/',
        blank=True,
        null=True
    )

    # Selected choices (for MCQ)
    selected_choices = models.ManyToManyField(
        QuizChoice,
        blank=True,
        related_name='quiz_answers'
    )

    # Grading
    points_earned = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)]
    )
    is_correct_auto = models.BooleanField(
        null=True,
        blank=True,
        help_text="Résultat de la correction automatique"
    )
    comment = models.TextField(blank=True, verbose_name="Commentaire du correcteur")

    # Timestamp
    answered_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['attempt', 'question']

    def __str__(self):
        return f"{self.attempt.student.get_full_name()} - Q{self.question.order}"

    def is_correct(self):
        """Check if answer is correct (auto-gradable questions only)"""
        question = self.question

        if question.question_type == 'single_choice':
            selected = self.selected_choices.first()
            return selected and selected.is_correct if selected else False

        elif question.question_type == 'multiple_choice':
            correct_choices = set(question.choices.filter(is_correct=True).values_list('id', flat=True))
            selected = set(self.selected_choices.values_list('id', flat=True))
            return correct_choices == selected

        elif question.question_type == 'true_false':
            selected = self.selected_choices.first()
            return selected and selected.is_correct if selected else False

        elif question.question_type == 'short_answer':
            if question.correct_answers:
                answer = self.answer_text.strip()
                if not question.case_sensitive:
                    answer = answer.lower()
                    correct_answers = [a.lower() for a in question.correct_answers]
                else:
                    correct_answers = question.correct_answers
                return answer in correct_answers

        return None  # Cannot auto-grade
