from django.contrib import admin
from .models import Quiz, Question, QuestionOption, QuizAttempt, Answer


class QuestionOptionInline(admin.TabularInline):
    """Inline admin for question options"""
    model = QuestionOption
    extra = 4


class QuestionInline(admin.StackedInline):
    """Inline admin for questions"""
    model = Question
    extra = 1
    show_change_link = True


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    """Admin configuration for Quiz model"""

    list_display = ['title', 'course', 'duration', 'max_attempts', 'passing_score', 'is_active', 'created_at']
    list_filter = ['is_active', 'course', 'created_at']
    search_fields = ['title', 'course__name']
    inlines = [QuestionInline]

    fieldsets = (
        ('Informations principales', {
            'fields': ('title', 'description', 'course')
        }),
        ('Configuration', {
            'fields': ('duration', 'max_attempts', 'passing_score', 'shuffle_questions', 'show_correct_answers')
        }),
        ('Disponibilité', {
            'fields': ('available_from', 'available_until', 'is_active')
        }),
    )


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    """Admin configuration for Question model"""

    list_display = ['question_text', 'quiz', 'question_type', 'points', 'order']
    list_filter = ['question_type', 'quiz']
    search_fields = ['question_text', 'quiz__title']
    inlines = [QuestionOptionInline]


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    """Admin configuration for QuizAttempt model"""

    list_display = ['student', 'quiz', 'score', 'is_completed', 'started_at', 'completed_at']
    list_filter = ['is_completed', 'quiz', 'started_at']
    search_fields = ['student__first_name', 'student__last_name', 'quiz__title']
