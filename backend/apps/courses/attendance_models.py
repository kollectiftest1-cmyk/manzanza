"""
Attendance tracking models
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from .models import Course


class Attendance(models.Model):
    """
    Attendance tracking for students in courses
    """
    STATUS_CHOICES = [
        ('present', 'Présent'),
        ('absent', 'Absent'),
        ('retard', 'Retard'),
        ('excuse', 'Excusé'),
    ]

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='attendances',
        limit_choices_to={'role': 'etudiant'},
        verbose_name='Étudiant'
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='attendances',
        verbose_name='Cours'
    )
    date = models.DateField(default=timezone.now, verbose_name='Date')
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='present',
        verbose_name='Statut'
    )
    comments = models.TextField(
        blank=True,
        null=True,
        verbose_name='Commentaire'
    )

    # Metadata
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='attendances_recorded',
        verbose_name='Enregistré par'
    )
    recorded_at = models.DateTimeField(auto_now_add=True, verbose_name='Enregistré le')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Modifié le')

    class Meta:
        verbose_name = 'Présence'
        verbose_name_plural = 'Présences'
        ordering = ['-date', 'course', 'student']
        unique_together = ['student', 'course', 'date']
        indexes = [
            models.Index(fields=['course', 'date']),
            models.Index(fields=['student', 'course']),
            models.Index(fields=['date']),
        ]

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.course.name} - {self.date} ({self.get_status_display()})"


class AttendanceSession(models.Model):
    """
    Attendance session for a specific course class/lecture
    Groups multiple attendance records together
    """
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='attendance_sessions',
        verbose_name='Cours'
    )
    date = models.DateField(default=timezone.now, verbose_name='Date')
    start_time = models.TimeField(verbose_name='Heure de début')
    end_time = models.TimeField(verbose_name='Heure de fin')

    title = models.CharField(max_length=200, blank=True, verbose_name='Titre de la séance')
    description = models.TextField(blank=True, null=True, verbose_name='Description')

    is_finalized = models.BooleanField(
        default=False,
        verbose_name='Finalisée',
        help_text='Une fois finalisée, la session ne peut plus être modifiée'
    )

    # Metadata
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='sessions_created',
        verbose_name='Créé par'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Séance de présence'
        verbose_name_plural = 'Séances de présence'
        ordering = ['-date', '-start_time']
        unique_together = ['course', 'date', 'start_time']

    def __str__(self):
        return f"{self.course.name} - {self.date} {self.start_time}"

    @property
    def total_students(self):
        """Total number of students enrolled in the course"""
        return self.course.enrollments.filter(is_active=True).count()

    @property
    def present_count(self):
        """Count of students marked as present"""
        return Attendance.objects.filter(
            course=self.course,
            date=self.date,
            status='present'
        ).count()

    @property
    def absent_count(self):
        """Count of students marked as absent"""
        return Attendance.objects.filter(
            course=self.course,
            date=self.date,
            status='absent'
        ).count()

    @property
    def late_count(self):
        """Count of students marked as late"""
        return Attendance.objects.filter(
            course=self.course,
            date=self.date,
            status='retard'
        ).count()

    @property
    def attendance_rate(self):
        """Calculate attendance rate as percentage"""
        if self.total_students == 0:
            return 0
        return round((self.present_count / self.total_students) * 100, 2)
