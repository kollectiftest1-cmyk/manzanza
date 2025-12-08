"""
Test de l'API auditoires avec le serializer
"""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.auditoires.models import Auditoire
from apps.auditoires.serializers import AuditoireSerializer
from apps.users.models import User

def test_auditoires_api_response():
    """
    Tester ce que l'API renvoie réellement (via le serializer)
    """
    print("\n" + "="*70)
    print("TEST: Réponse de l'API auditoires (via AuditoireSerializer)")
    print("="*70 + "\n")

    # Récupérer les auditoires comme le fait le ViewSet
    auditoires = Auditoire.objects.select_related(
        'filiere__section',
        'filiere'
    ).prefetch_related(
        'students',
        'courses'
    ).all()

    print(f"📊 Total auditoires: {auditoires.count()}\n")

    # Sérialiser (comme le fait l'API)
    serializer = AuditoireSerializer(auditoires, many=True)
    data = serializer.data

    for aud_data in data:
        auditoire = Auditoire.objects.get(id=aud_data['id'])

        print(f"🏫 {aud_data['nom']}")
        if aud_data.get('filiere_name'):
            print(f"   📚 Filière: {aud_data['filiere_name']}")
        if aud_data.get('section_name'):
            print(f"   🎓 Section: {aud_data['section_name']}")

        # Comparer avec le comptage direct
        real_count = auditoire.students.filter(is_active=True).count()
        api_count = aud_data['etudiants_count']

        print(f"   👥 API retourne: {api_count} étudiants")
        print(f"   ✓  Comptage réel: {real_count} étudiants")
        print(f"   📖 Cours actifs: {aud_data['cours_count']}")

        if api_count == real_count:
            print(f"   ✅ CORRECT!")
        else:
            print(f"   ❌ ERREUR: Différence de {abs(api_count - real_count)}")

        # Afficher quelques étudiants
        if real_count > 0:
            students = auditoire.students.filter(is_active=True)[:3]
            print(f"   Exemples:")
            for s in students:
                print(f"      - {s.get_full_name()}")

        print()

    # Calculer les totaux
    total_from_api = sum(aud['etudiants_count'] for aud in data)
    total_students = User.objects.filter(
        role='etudiant',
        is_active=True,
        auditoire__isnull=False
    ).count()

    print("="*70)
    print(f"📊 Total via API: {total_from_api}")
    print(f"✓  Total réel: {total_students}")

    if total_from_api == total_students:
        print("✅ Les totaux correspondent parfaitement!")
    else:
        print(f"⚠️  Différence: {abs(total_from_api - total_students)}")

    print("="*70)

if __name__ == "__main__":
    test_auditoires_api_response()
