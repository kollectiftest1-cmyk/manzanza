from django.contrib import admin
from .models import Course, CourseEnrollment, CourseMaterial


class CourseMaterialInline(admin.TabularInline):
    """Inline admin for course materials"""
    model = CourseMaterial
    extra = 1


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    """Admin configuration for Course model"""

    list_display = ['code', 'name', 'titulaire', 'auditoire', 'credits', 'students_count', 'is_active']
    list_filter = ['is_active', 'semester', 'annee_academique', 'credits']
    search_fields = ['name', 'code', 'titulaire__first_name', 'titulaire__last_name']
    inlines = [CourseMaterialInline]

    fieldsets = (
        ('Informations principales', {
            'fields': ('name', 'code', 'description', 'credits')
        }),
        ('Personnel enseignant', {
            'fields': ('titulaire', 'assistants')
        }),
        ('Configuration', {
            'fields': ('auditoire', 'semester', 'annee_academique', 'is_active')
        }),
        ('Contenu', {
            'fields': ('syllabus', 'resources')
        }),
    )


@admin.register(CourseEnrollment)
class CourseEnrollmentAdmin(admin.ModelAdmin):
    """Admin configuration for CourseEnrollment model"""

    list_display = ['student', 'course', 'progress', 'grade', 'enrolled_at', 'is_active']
    list_filter = ['is_active', 'enrolled_at', 'course']
    search_fields = ['student__first_name', 'student__last_name', 'course__name']


@admin.register(CourseMaterial)
class CourseMaterialAdmin(admin.ModelAdmin):
    """Admin configuration for CourseMaterial model"""

    list_display = ['title', 'course', 'material_type', 'is_public', 'uploaded_by', 'uploaded_at']
    list_filter = ['material_type', 'is_public', 'uploaded_at']
    search_fields = ['title', 'course__name']
