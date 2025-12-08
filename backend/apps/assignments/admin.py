"""
Admin interface for TP/TD Assignment System
"""
from django.contrib import admin
from .models import (
    Assignment, AssignmentQuestion, AssignmentChoice,
    AssignmentSubmission, AssignmentAnswer
)


class AssignmentQuestionInline(admin.TabularInline):
    model = AssignmentQuestion
    extra = 1
    fields = ['order', 'question_text', 'question_type', 'points']


class AssignmentChoiceInline(admin.TabularInline):
    model = AssignmentChoice
    extra = 2
    fields = ['order', 'choice_text', 'is_correct']


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'assignment_type', 'course', 'due_date',
        'max_points', 'status', 'created_by'
    ]
    list_filter = ['assignment_type', 'submission_type', 'status', 'course']
    search_fields = ['title', 'description', 'course__name']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [AssignmentQuestionInline]

    fieldsets = (
        ('Informations de base', {
            'fields': ('title', 'description', 'assignment_type', 'course')
        }),
        ('Remise', {
            'fields': ('submission_type', 'due_date', 'max_points')
        }),
        ('Ressources', {
            'fields': ('instructions', 'resources')
        }),
        ('Paramètres', {
            'fields': ('status', 'auto_grade')
        }),
        ('Métadonnées', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(AssignmentQuestion)
class AssignmentQuestionAdmin(admin.ModelAdmin):
    list_display = ['assignment', 'order', 'question_type', 'points']
    list_filter = ['question_type', 'assignment']
    search_fields = ['question_text']
    inlines = [AssignmentChoiceInline]


@admin.register(AssignmentSubmission)
class AssignmentSubmissionAdmin(admin.ModelAdmin):
    list_display = [
        'student', 'assignment', 'status', 'score',
        'submitted_at', 'graded_by'
    ]
    list_filter = ['status', 'assignment', 'submitted_at']
    search_fields = ['student__first_name', 'student__last_name', 'assignment__title']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Soumission', {
            'fields': ('assignment', 'student', 'submitted_at', 'status')
        }),
        ('Notation', {
            'fields': ('score', 'graded_by', 'graded_at', 'feedback')
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(AssignmentAnswer)
class AssignmentAnswerAdmin(admin.ModelAdmin):
    list_display = ['submission', 'question', 'points_earned']
    list_filter = ['submission__assignment']
    search_fields = ['submission__student__first_name', 'submission__student__last_name']
