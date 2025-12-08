"""
Admin interface for Quiz System
"""
from django.contrib import admin
from .models import (
    Quiz, QuizQuestion, QuizChoice,
    QuizAttempt, QuizAnswer
)


class QuizQuestionInline(admin.TabularInline):
    model = QuizQuestion
    extra = 1
    fields = ['order', 'question_text', 'question_type', 'points']


class QuizChoiceInline(admin.TabularInline):
    model = QuizChoice
    extra = 3
    fields = ['order', 'choice_text', 'is_correct', 'points_percentage']


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'course', 'start_date', 'end_date',
        'duration_minutes', 'max_points', 'status'
    ]
    list_filter = ['status', 'course', 'start_date']
    search_fields = ['title', 'description', 'course__name']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [QuizQuestionInline]

    fieldsets = (
        ('Informations de base', {
            'fields': ('title', 'description', 'course')
        }),
        ('Timing', {
            'fields': ('start_date', 'end_date', 'duration_minutes')
        }),
        ('Notation', {
            'fields': ('max_points',)
        }),
        ('Paramètres', {
            'fields': (
                'shuffle_questions', 'shuffle_choices',
                'show_correct_answers', 'allow_multiple_attempts', 'max_attempts'
            )
        }),
        ('Statut', {
            'fields': ('status',)
        }),
        ('Métadonnées', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(QuizQuestion)
class QuizQuestionAdmin(admin.ModelAdmin):
    list_display = ['quiz', 'order', 'question_type', 'points', 'is_required']
    list_filter = ['question_type', 'is_required', 'quiz']
    search_fields = ['question_text']
    inlines = [QuizChoiceInline]

    fieldsets = (
        ('Question', {
            'fields': ('quiz', 'order', 'question_text', 'question_type', 'image')
        }),
        ('Points et paramètres', {
            'fields': ('points', 'is_required')
        }),
        ('Correction automatique', {
            'fields': ('correct_answers', 'case_sensitive', 'explanation')
        }),
    )


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = [
        'student', 'quiz', 'attempt_number', 'status',
        'score', 'started_at', 'submitted_at'
    ]
    list_filter = ['status', 'quiz', 'started_at']
    search_fields = ['student__first_name', 'student__last_name', 'quiz__title']
    readonly_fields = ['started_at']

    fieldsets = (
        ('Tentative', {
            'fields': ('quiz', 'student', 'attempt_number', 'status')
        }),
        ('Timing', {
            'fields': ('started_at', 'submitted_at', 'time_spent_seconds')
        }),
        ('Scores', {
            'fields': ('score', 'auto_graded_score')
        }),
        ('Notation manuelle', {
            'fields': ('graded_by', 'graded_at', 'feedback')
        }),
    )


@admin.register(QuizAnswer)
class QuizAnswerAdmin(admin.ModelAdmin):
    list_display = ['attempt', 'question', 'points_earned', 'is_correct_auto']
    list_filter = ['attempt__quiz', 'is_correct_auto']
    search_fields = ['attempt__student__first_name', 'attempt__student__last_name']
