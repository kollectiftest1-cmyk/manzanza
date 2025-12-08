"""
Test direct de l'endpoint teacher-stats
"""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User
from apps.users.teacher_stats_views import teacher_statistics
from django.test import RequestFactory
from rest_framework.test import force_authenticate

def test_teacher_stats_endpoint():
    """
    Tester l'endpoint teacher-stats directement
    """
    print("\n" + "="*70)
    print("TEST: Endpoint /users/{id}/teacher-stats/")
    print("="*70 + "\n")

    # Trouver un enseignant ou assistant
    teachers = User.objects.filter(role__in=['enseignant', 'assistant'], is_active=True)

    if not teachers.exists():
        print("❌ Aucun enseignant/assistant trouvé dans la base de données")
        return

    for teacher in teachers[:3]:  # Tester les 3 premiers
        print(f"\n{'='*70}")
        print(f"👨‍🏫 Test pour: {teacher.get_full_name()} (ID: {teacher.id})")
        print(f"   Rôle: {teacher.role}")
        print(f"{'='*70}\n")

        # Créer une fausse requête
        factory = RequestFactory()
        request = factory.get(f'/api/users/{teacher.id}/teacher-stats/')
        force_authenticate(request, user=teacher)

        # Appeler la vue
        response = teacher_statistics(request, user_id=teacher.id)

        print(f"📊 Status Code: {response.status_code}")

        if response.status_code == 200:
            data = response.data
            print("\n✅ Réponse réussie!")
            print(f"\n📈 Teacher Stats:")
            print(f"   - Cours enseignés: {data['teacher_stats'].get('courses_taught_count', 0)}")
            print(f"   - Total étudiants: {data['teacher_stats'].get('total_students_managed', 0)}")
            print(f"   - Performance moyenne: {data['teacher_stats'].get('average_student_performance', 0)}%")
            print(f"   - Taux présence moyen: {data['teacher_stats'].get('average_attendance_rate', 0)}%")

            print(f"\n📚 Cours ({len(data['courses'])} trouvés):")
            for course in data['courses']:
                print(f"\n   📖 {course['nom']} ({course['code']})")
                print(f"      🏫 Auditoire: {course['auditoire_detail']['nom']}")
                print(f"      👥 Étudiants: {course['students_count']}")
                print(f"      📈 Progression: {course['progress_percentage']}%")
                print(f"      ✓ Présence: {course['attendance_rate']}%")
                print(f"      👔 Rôle: {course['role']}")

            # Afficher le JSON complet du premier cours
            if data['courses']:
                print(f"\n🔍 JSON détaillé du premier cours:")
                print(json.dumps(data['courses'][0], indent=2, ensure_ascii=False))

        else:
            print(f"\n❌ Erreur!")
            print(f"   Message: {response.data}")

        print("\n" + "="*70)

if __name__ == "__main__":
    test_teacher_stats_endpoint()
