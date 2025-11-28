"""
Quiz models
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Quiz(models.Model):
    """Quiz Model"""

    title = models.CharField(max_length=200, verbose_name='Titre')
    description = models.TextField(blank=True, null=True, verbose_name='Description')
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE,
                              related_name='quizzes', verbose_name='Cours')

    # Settings
    duration = models.IntegerField(default=30, verbose_name='Durée (minutes)')
    max_attempts = models.IntegerField(default=3, verbose_name='Tentatives maximales')
    passing_score = models.IntegerField(default=60, validators=[MinValueValidator(0), MaxValueValidator(100)],
                                       verbose_name='Score de passage (%)')
    shuffle_questions = models.BooleanField(default=True, verbose_name='Mélanger les questions')
    show_correct_answers = models.BooleanField(default=True, verbose_name='Afficher les bonnes réponses')

    # Availability
    available_from = models.DateTimeField(verbose_name='Disponible à partir de')
    available_until = models.DateTimeField(verbose_name='Disponible jusqu\'à')
    is_active = models.BooleanField(default=True, verbose_name='Actif')

    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                  null=True, related_name='quizzes_created', verbose_name='Créé par')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Quiz'
        verbose_name_plural = 'Quiz'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.course.name}"

    @property
    def total_questions(self):
        """Total number of questions"""
        return self.questions.count()


class Question(models.Model):
    """Question Model"""

    QUESTION_TYPES = [
        ('multiple_choice', 'Choix multiple'),
        ('true_false', 'Vrai/Faux'),
        ('short_answer', 'Réponse courte'),
    ]

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE,
                           related_name='questions', verbose_name='Quiz')
    question_text = models.TextField(verbose_name='Question')
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES,
                                    default='multiple_choice', verbose_name='Type de question')
    points = models.IntegerField(default=1, verbose_name='Points')
    order = models.IntegerField(default=0, verbose_name='Ordre')

    # For short answer questions
    correct_answer = models.TextField(blank=True, null=True, verbose_name='Réponse correcte')

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Question'
        verbose_name_plural = 'Questions'
        ordering = ['quiz', 'order']

    def __str__(self):
        return f"{self.quiz.title} - Q{self.order}"


class QuestionOption(models.Model):
    """Question options for multiple choice questions"""

    question = models.ForeignKey(Question, on_delete=models.CASCADE,
                                related_name='options', verbose_name='Question')
    option_text = models.CharField(max_length=500, verbose_name='Texte de l\'option')
    is_correct = models.BooleanField(default=False, verbose_name='Est correct')
    order = models.IntegerField(default=0, verbose_name='Ordre')

    class Meta:
        verbose_name = 'Option de question'
        verbose_name_plural = 'Options de questions'
        ordering = ['question', 'order']

    def __str__(self):
        return f"{self.question} - Option {self.order}"


class QuizAttempt(models.Model):
    """Quiz attempt by a student"""

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE,
                           related_name='attempts', verbose_name='Quiz')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                               related_name='quiz_attempts', verbose_name='Étudiant')

    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, verbose_name='Score (%)')
    started_at = models.DateTimeField(auto_now_add=True, verbose_name='Commencé à')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='Terminé à')
    is_completed = models.BooleanField(default=False, verbose_name='Terminé')

    class Meta:
        verbose_name = 'Tentative de quiz'
        verbose_name_plural = 'Tentatives de quiz'
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.quiz.title} - {self.score}%"


class Answer(models.Model):
    """Student answer to a question"""

    attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE,
                               related_name='answers', verbose_name='Tentative')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, verbose_name='Question')
    selected_option = models.ForeignKey(QuestionOption, on_delete=models.CASCADE,
                                       null=True, blank=True, verbose_name='Option sélectionnée')
    answer_text = models.TextField(blank=True, null=True, verbose_name='Texte de la réponse')
    is_correct = models.BooleanField(default=False, verbose_name='Est correct')

    answered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Réponse'
        verbose_name_plural = 'Réponses'

    def __str__(self):
        return f"{self.attempt.student.get_full_name()} - Q{self.question.order}"
