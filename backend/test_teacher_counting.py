"""
Test du comptage des enseignants par filière et section
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User
from apps.auditoires.models import Filiere, Section
from apps.courses.models import Course
from django.db.models import Q

def test_teacher_counting():
    """
    Tester le comptage des enseignants et assistants par filière et section
    """
    print("\n" + "="*70)
    print("TEST: Comptage des Enseignants et Assistants")
    print("="*70 + "\n")

    # Test par Filière
    print("📚 COMPTAGE PAR FILIÈRE")
    print("="*70 + "\n")

    filieres = Filiere.objects.all()
    for filiere in filieres:
        print(f"📖 Filière: {filiere.nom}")
        if filiere.section:
            print(f"   🎓 Section: {filiere.section.nom}")

        # Méthode 1: Via titulaires seulement (ANCIENNE)
        teachers_only = User.objects.filter(
            courses_as_teacher__auditoire__filiere=filiere
        ).distinct()

        # Méthode 2: Via titulaires ET assistants (NOUVELLE)
        all_teachers = User.objects.filter(
            Q(courses_as_teacher__auditoire__filiere=filiere) |
            Q(courses_as_assistant__auditoire__filiere=filiere),
            role__in=['enseignant', 'assistant']
        ).distinct()

        print(f"   👨‍🏫 Titulaires seulement: {teachers_only.count()}")
        print(f"   👥 Titulaires + Assistants: {all_teachers.count()}")

        # Lister les enseignants
        if all_teachers.exists():
            print(f"   Liste complète:")
            for teacher in all_teachers:
                # Trouver le rôle dans les cours de cette filière
                is_titulaire = Course.objects.filter(
                    titulaire=teacher,
                    auditoire__filiere=filiere
                ).exists()
                is_assistant = Course.objects.filter(
                    assistants=teacher,
                    auditoire__filiere=filiere
                ).exists()

                roles = []
                if is_titulaire:
                    roles.append("Titulaire")
                if is_assistant:
                    roles.append("Assistant")

                role_str = " + ".join(roles)
                print(f"      - {teacher.get_full_name()} ({teacher.role}) [{role_str}]")
        else:
            print(f"   ⚠️  Aucun enseignant")

        print()

    # Test par Section
    print("\n" + "="*70)
    print("🎓 COMPTAGE PAR SECTION")
    print("="*70 + "\n")

    sections = Section.objects.all()
    for section in sections:
        print(f"🎓 Section: {section.nom}")

        # Méthode 1: Via titulaires seulement (ANCIENNE)
        teachers_only = User.objects.filter(
            courses_as_teacher__auditoire__filiere__section=section
        ).distinct()

        # Méthode 2: Via titulaires ET assistants (NOUVELLE)
        all_teachers = User.objects.filter(
            Q(courses_as_teacher__auditoire__filiere__section=section) |
            Q(courses_as_assistant__auditoire__filiere__section=section),
            role__in=['enseignant', 'assistant']
        ).distinct()

        print(f"   👨‍🏫 Titulaires seulement: {teachers_only.count()}")
        print(f"   👥 Titulaires + Assistants: {all_teachers.count()}")

        # Lister les enseignants
        if all_teachers.exists():
            print(f"   Liste complète:")
            for teacher in all_teachers:
                is_titulaire = Course.objects.filter(
                    titulaire=teacher,
                    auditoire__filiere__section=section
                ).exists()
                is_assistant = Course.objects.filter(
                    assistants=teacher,
                    auditoire__filiere__section=section
                ).exists()

                roles = []
                if is_titulaire:
                    roles.append("Titulaire")
                if is_assistant:
                    roles.append("Assistant")

                role_str = " + ".join(roles)
                print(f"      - {teacher.get_full_name()} ({teacher.role}) [{role_str}]")
        else:
            print(f"   ⚠️  Aucun enseignant")

        print()

    # Statistiques globales
    print("\n" + "="*70)
    print("📊 STATISTIQUES GLOBALES")
    print("="*70 + "\n")

    total_teachers = User.objects.filter(
        role__in=['enseignant', 'assistant'],
        is_active=True
    ).count()

    teachers_with_courses = User.objects.filter(
        Q(courses_as_teacher__isnull=False) |
        Q(courses_as_assistant__isnull=False),
        role__in=['enseignant', 'assistant'],
        is_active=True
    ).distinct().count()

    print(f"👥 Total enseignants/assistants actifs: {total_teachers}")
    print(f"📚 Avec cours assignés: {teachers_with_courses}")
    print(f"⚠️  Sans cours: {total_teachers - teachers_with_courses}")

    print("\n" + "="*70)

if __name__ == "__main__":
    test_teacher_counting()
