"""
Script pour créer des utilisateurs de test pour chaque rôle
Usage: python create_test_users.py
"""

import os
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User

def create_test_users():
    """Créer des utilisateurs de test pour tous les rôles"""

    users_data = [
        {
            'email': 'etudiant@syntaxgu.ac.cd',
            'password': 'password123',
            'first_name': 'Jean',
            'last_name': 'Dupont',
            'role': 'etudiant',
            'is_active': True,
        },
        {
            'email': 'enseignant@syntaxgu.ac.cd',
            'password': 'password123',
            'first_name': 'Martin',
            'last_name': 'Dubois',
            'role': 'enseignant',
            'is_active': True,
        },
        {
            'email': 'assistant@syntaxgu.ac.cd',
            'password': 'password123',
            'first_name': 'Sophie',
            'last_name': 'Laurent',
            'role': 'assistant',
            'is_active': True,
        },
        {
            'email': 'chef.departement@syntaxgu.ac.cd',
            'password': 'password123',
            'first_name': 'Pierre',
            'last_name': 'Morel',
            'role': 'chef_departement',
            'is_active': True,
        },
        {
            'email': 'chef.section@syntaxgu.ac.cd',
            'password': 'password123',
            'first_name': 'Marie',
            'last_name': 'Legrand',
            'role': 'chef_section',
            'is_active': True,
        },
        {
            'email': 'sga@syntaxgu.ac.cd',
            'password': 'password123',
            'first_name': 'Luc',
            'last_name': 'Bernard',
            'role': 'sga',
            'is_active': True,
        },
        {
            'email': 'sgad@syntaxgu.ac.cd',
            'password': 'password123',
            'first_name': 'Anne',
            'last_name': 'Petit',
            'role': 'sgad',
            'is_active': True,
        },
        {
            'email': 'directeur@syntaxgu.ac.cd',
            'password': 'password123',
            'first_name': 'Claude',
            'last_name': 'Rousseau',
            'role': 'directeur_general',
            'is_active': True,
        },
        {
            'email': 'pdg@syntaxgu.ac.cd',
            'password': 'password123',
            'first_name': 'François',
            'last_name': 'Vincent',
            'role': 'pdg',
            'is_active': True,
        },
        {
            'email': 'bibliothecaire@syntaxgu.ac.cd',
            'password': 'password123',
            'first_name': 'Isabelle',
            'last_name': 'Girard',
            'role': 'bibliothecaire',
            'is_active': True,
        },
        {
            'email': 'caisse@syntaxgu.ac.cd',
            'password': 'password123',
            'first_name': 'Robert',
            'last_name': 'Bonnet',
            'role': 'caisse',
            'is_active': True,
        },
        {
            'email': 'it@syntaxgu.ac.cd',
            'password': 'password123',
            'first_name': 'Nicolas',
            'last_name': 'Fournier',
            'role': 'service_it',
            'is_active': True,
        },
        {
            'email': 'apparitorat@syntaxgu.ac.cd',
            'password': 'password123',
            'first_name': 'Thomas',
            'last_name': 'Mercier',
            'role': 'apparitorat',
            'is_active': True,
        },
        {
            'email': 'jury@syntaxgu.ac.cd',
            'password': 'password123',
            'first_name': 'Christine',
            'last_name': 'Blanc',
            'role': 'jury',
            'is_active': True,
        },
        {
            'email': 'admin@syntaxgu.ac.cd',
            'password': 'password123',
            'first_name': 'Admin',
            'last_name': 'System',
            'role': 'iadmin',
            'is_staff': True,
            'is_superuser': True,
            'is_active': True,
        },
    ]

    created_count = 0
    skipped_count = 0
    updated_count = 0

    print("=" * 60)
    print("Création des utilisateurs de test")
    print("=" * 60)
    print()

    for user_data in users_data:
        email = user_data['email']

        # Vérifier si l'utilisateur existe déjà
        existing_user = User.objects.filter(email=email).first()
        if existing_user:
            changed = False
            for field in ['first_name', 'last_name', 'role', 'is_active', 'is_staff', 'is_superuser']:
                if field in user_data and getattr(existing_user, field) != user_data[field]:
                    setattr(existing_user, field, user_data[field])
                    changed = True

            existing_user.set_password(user_data['password'])
            existing_user.save()

            if changed:
                print(f"UPD  {email:40s} - Mis a jour ({user_data['role']})")
                updated_count += 1
            else:
                print(f"SKIP {email:40s} - Existe deja")
                skipped_count += 1
            continue

        # Créer l'utilisateur
        try:
            User.objects.create_user(**user_data)
            print(f"OK   {email:40s} - Cree ({user_data['role']})")
            created_count += 1
        except Exception as e:
            print(f"WARN {email:40s} - Erreur: {str(e)}")

    print()
    print("=" * 60)
    print(f"Résumé:")
    print(f"  - Utilisateurs créés: {created_count}")
    print(f"  - Utilisateurs corriges: {updated_count}")
    print(f"  - Utilisateurs existants: {skipped_count}")
    print("=" * 60)
    print()
    print("Identifiants de connexion:")
    print("  Email: [role]@syntaxgu.ac.cd")
    print("  Mot de passe: password123")
    print()
    print("Exemples:")
    print("  - Étudiant:    etudiant@syntaxgu.ac.cd / password123")
    print("  - Enseignant:  enseignant@syntaxgu.ac.cd / password123")
    print("  - Admin:       admin@syntaxgu.ac.cd / password123")
    print()

if __name__ == '__main__':
    create_test_users()
