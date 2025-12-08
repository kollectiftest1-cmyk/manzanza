"""
Script de test pour vérifier le comptage des étudiants dans les cours
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User
from apps.courses.models import Course
from apps.auditoires.models import Auditoire

def test_student_count():
    """
    Tester le comptage des étudiants pour chaque cours
    """
    print("\n" + "="*60)
    print("TEST: Comptage des étudiants dans les cours")
    print("="*60 + "\n")

    # Récupérer tous les cours actifs
    courses = Course.objects.filter(is_active=True).select_related('auditoire')

    if not courses.exists():
        print("❌ Aucun cours trouvé dans la base de données")
        return

    for course in courses:
        print(f"📚 Cours: {course.name} ({course.code})")

        if course.auditoire:
            # Compter via la relation directe (NOUVELLE MÉTHODE)
            students_via_relation = course.auditoire.students.filter(is_active=True).count()

            # Compter via requête directe (ANCIENNE MÉTHODE - pour comparaison)
            students_via_query = User.objects.filter(
                auditoire=course.auditoire,
                role='etudiant',
                is_active=True
            ).count()

            # Compter TOUS les étudiants (actifs et inactifs)
            total_students = course.auditoire.students.count()

            print(f"   🏫 Auditoire: {course.auditoire.nom}")
            print(f"   ✅ Étudiants actifs (via relation): {students_via_relation}")
            print(f"   🔍 Étudiants actifs (via query):    {students_via_query}")
            print(f"   📊 Total étudiants (tous statuts):  {total_students}")

            if students_via_relation == students_via_query:
                print(f"   ✅ Les deux méthodes donnent le même résultat!")
            else:
                print(f"   ⚠️  ATTENTION: Différence entre les méthodes!")

            # Afficher quelques étudiants
            students = course.auditoire.students.filter(is_active=True)[:3]
            if students.exists():
                print(f"   👥 Exemples d'étudiants:")
                for student in students:
                    print(f"      - {student.get_full_name()} ({student.matricule})")
            else:
                print(f"   ⚠️  Aucun étudiant actif dans cet auditoire")
        else:
            print(f"   ⚠️  Aucun auditoire assigné à ce cours")

        print()

    print("\n" + "="*60)
    print("Résumé des Auditoires")
    print("="*60 + "\n")

    auditoires = Auditoire.objects.filter(is_active=True)
    for auditoire in auditoires:
        student_count = auditoire.students.filter(is_active=True).count()
        print(f"🏫 {auditoire.nom}")
        print(f"   👥 {student_count} étudiants actifs")
        print(f"   📚 {auditoire.courses.filter(is_active=True).count()} cours")
        print()

if __name__ == "__main__":
    test_student_count()
