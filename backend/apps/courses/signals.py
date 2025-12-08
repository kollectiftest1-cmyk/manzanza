"""
Signals for automatic enrollment and other course-related automation
"""
from django.db.models.signals import post_save, m2m_changed
from django.dispatch import receiver
from apps.users.models import User
from .models import Course, CourseEnrollment


@receiver(post_save, sender=User)
def auto_enroll_student_to_auditoire_courses(sender, instance, created, **kwargs):
    """
    Inscrire automatiquement un étudiant à tous les cours de son auditoire
    quand il est créé ou quand son auditoire change.
    """
    if instance.role == 'etudiant' and instance.auditoire:
        # Récupérer tous les cours actifs de l'auditoire de l'étudiant
        courses = instance.auditoire.courses.filter(is_active=True)

        for course in courses:
            # Créer l'inscription si elle n'existe pas
            enrollment, created = CourseEnrollment.objects.get_or_create(
                student=instance,
                course=course,
                defaults={'is_active': True}
            )

            if created:
                print(f"✅ Étudiant {instance.get_full_name()} auto-inscrit au cours {course.name}")


@receiver(post_save, sender=Course)
def auto_enroll_auditoire_students_to_new_course(sender, instance, created, **kwargs):
    """
    Quand un nouveau cours est créé, inscrire automatiquement
    tous les étudiants de l'auditoire à ce cours.
    """
    if created and instance.auditoire and instance.is_active:
        # Récupérer tous les étudiants actifs de l'auditoire
        students = instance.auditoire.students.filter(
            role='etudiant',
            status='actif'
        )

        enrollments_created = 0
        for student in students:
            enrollment, enrolled = CourseEnrollment.objects.get_or_create(
                student=student,
                course=instance,
                defaults={'is_active': True}
            )

            if enrolled:
                enrollments_created += 1

        if enrollments_created > 0:
            print(f"✅ {enrollments_created} étudiant(s) auto-inscrit(s) au nouveau cours {instance.name}")
