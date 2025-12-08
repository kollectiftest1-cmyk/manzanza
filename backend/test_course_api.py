"""
Test de l'API courses pour vérifier que les assistants sont inclus
"""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.courses.models import Course
from apps.courses.serializers import CourseSerializer

def test_course_api_response():
    """
    Tester que l'API retourne bien les titulaires ET assistants
    """
    print("\n" + "="*70)
    print("TEST: API Courses - Titulaires et Assistants")
    print("="*70 + "\n")

    # Récupérer les cours
    courses = Course.objects.filter(is_active=True).select_related(
        'titulaire',
        'auditoire__filiere__section'
    ).prefetch_related('assistants').all()

    print(f"📚 Total cours actifs: {courses.count()}\n")

    # Sérialiser
    serializer = CourseSerializer(courses, many=True)
    data = serializer.data

    for course_data in data:
        course = Course.objects.get(id=course_data['id'])

        print(f"📖 Cours: {course_data['name']} ({course_data['code']})")

        # Vérifier le titulaire
        if course_data.get('titulaire_detail'):
            print(f"   👨‍🏫 Titulaire (detail): {course_data['titulaire_detail'].get('name', 'N/A')}")
        elif course_data.get('titulaire'):
            print(f"   👨‍🏫 Titulaire (ID): {course_data['titulaire']}")
        else:
            print(f"   ⚠️  Pas de titulaire")

        # Vérifier les assistants
        assistants_detail = course_data.get('assistants_detail', [])
        assistants = course_data.get('assistants', [])

        print(f"   🤝 Assistants (detail): {len(assistants_detail)}")
        print(f"   🤝 Assistants (IDs): {len(assistants)}")

        if assistants_detail:
            print(f"   Liste des assistants:")
            for asst in assistants_detail:
                print(f"      - {asst.get('name', 'N/A')} ({asst.get('role', 'N/A')})")
        elif assistants:
            print(f"   IDs des assistants: {assistants}")

        # Compter total enseignants
        total_teachers = 0
        if course_data.get('titulaire_detail'):
            total_teachers += 1
        if assistants_detail:
            total_teachers += len(assistants_detail)

        print(f"   📊 Total enseignants: {total_teachers}")

        # Vérifier les autres champs importants
        if course_data.get('auditoire_detail'):
            print(f"   🏫 Auditoire: {course_data['auditoire_detail'].get('nom', 'N/A')}")

        print()

    # Statistiques globales
    print("="*70)
    print("📊 STATISTIQUES")
    print("="*70 + "\n")

    total_courses_with_assistants = sum(1 for c in data if c.get('assistants_detail') or c.get('assistants'))
    total_assistants = sum(len(c.get('assistants_detail', c.get('assistants', []))) for c in data)

    print(f"📚 Total cours: {len(data)}")
    print(f"🤝 Cours avec assistants: {total_courses_with_assistants}")
    print(f"👥 Total assistants: {total_assistants}")

    # Afficher un exemple JSON complet
    if data:
        print(f"\n🔍 Exemple JSON (premier cours):")
        print(json.dumps(data[0], indent=2, ensure_ascii=False))

    print("\n" + "="*70)

if __name__ == "__main__":
    test_course_api_response()
