"""
Test du comptage des étudiants dans l'endpoint auditoires
"""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.auditoires.models import Auditoire
from apps.users.models import User
from django.db.models import Count, Q

def test_auditoires_student_count():
    """
    Tester le comptage des étudiants par auditoire
    """
    print("\n" + "="*70)
    print("TEST: Comptage des étudiants dans les auditoires")
    print("="*70 + "\n")

    # Méthode 1: Via annotate (comme dans le ViewSet)
    auditoires_annotated = Auditoire.objects.select_related(
        'filiere__section', 'filiere'
    ).annotate(
        etudiants_count=Count('students', filter=Q(students__is_active=True)),
        cours_count=Count('courses', filter=Q(courses__is_active=True))
    ).all()

    print(f"📊 Total auditoires trouvés: {auditoires_annotated.count()}\n")

    for auditoire in auditoires_annotated:
        # Comptage via annotation
        count_via_annotation = auditoire.etudiants_count

        # Comptage direct (pour vérification)
        count_via_relation = auditoire.students.filter(is_active=True).count()

        # Comptage des cours
        cours_count = auditoire.cours_count

        print(f"🏫 {auditoire.nom}")
        if auditoire.filiere:
            print(f"   📚 Filière: {auditoire.filiere.nom}")
            if auditoire.filiere.section:
                print(f"   🎓 Section: {auditoire.filiere.section.nom}")

        print(f"   👥 Étudiants (annotation): {count_via_annotation}")
        print(f"   👥 Étudiants (relation):   {count_via_relation}")
        print(f"   📖 Cours actifs:           {cours_count}")

        if count_via_annotation == count_via_relation:
            print(f"   ✅ Comptage correct!")
        else:
            print(f"   ⚠️  ATTENTION: Différence détectée!")

        # Afficher quelques étudiants
        if count_via_relation > 0:
            students = auditoire.students.filter(is_active=True)[:3]
            print(f"   Étudiants:")
            for student in students:
                print(f"      - {student.get_full_name()} ({student.email})")

        print()

    # Statistiques globales
    print("\n" + "="*70)
    print("Statistiques globales")
    print("="*70 + "\n")

    total_students = User.objects.filter(role='etudiant', is_active=True).count()
    students_with_auditoire = User.objects.filter(
        role='etudiant',
        is_active=True,
        auditoire__isnull=False
    ).count()
    students_without_auditoire = total_students - students_with_auditoire

    print(f"👥 Total étudiants actifs: {total_students}")
    print(f"🏫 Avec auditoire: {students_with_auditoire}")
    print(f"⚠️  Sans auditoire: {students_without_auditoire}")

    # Total par auditoire
    total_via_auditoires = sum(a.etudiants_count for a in auditoires_annotated)
    print(f"\n📊 Total étudiants via auditoires: {total_via_auditoires}")

    if total_via_auditoires == students_with_auditoire:
        print("✅ Les totaux correspondent parfaitement!")
    else:
        print(f"⚠️  Différence: {abs(total_via_auditoires - students_with_auditoire)} étudiants")

    print("\n" + "="*70)

if __name__ == "__main__":
    test_auditoires_student_count()
