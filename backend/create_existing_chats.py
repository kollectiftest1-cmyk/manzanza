"""
Script pour créer des chats pour tous les cours existants
Exécuter avec: python manage.py shell < create_existing_chats.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.chat.models import ChatChannel
from apps.chat.signals import add_course_chat_members
from apps.courses.models import Course
from apps.auditoires.models import Section, Filiere

def create_chats_for_existing_courses():
    """Créer des chats pour tous les cours existants sans chat"""
    print("\n" + "="*60)
    print("🚀 CRÉATION DES CHATS POUR LES COURS EXISTANTS")
    print("="*60 + "\n")

    courses_without_chat = []
    courses_with_chat = []

    for course in Course.objects.filter(is_active=True):
        try:
            # Vérifier si le cours a déjà un chat
            if hasattr(course, 'chat_channel') and course.chat_channel:
                courses_with_chat.append(course)
                print(f"⏭️  {course.name} - Chat déjà existant")
            else:
                # Créer le chat
                chat_channel = ChatChannel.objects.create(
                    name=f"💬 {course.name}",
                    description=f"Discussion du cours {course.name}",
                    channel_type='course',
                    course=course,
                    created_by=course.titulaire
                )

                # Ajouter les membres
                add_course_chat_members(chat_channel, course)
                courses_without_chat.append(course)

                print(f"✅ {course.name} - Chat créé avec {chat_channel.members.count()} membres")

        except Exception as e:
            print(f"❌ Erreur pour {course.name}: {e}")

    print("\n" + "="*60)
    print(f"📊 RÉSUMÉ")
    print("="*60)
    print(f"✅ Nouveaux chats créés: {len(courses_without_chat)}")
    print(f"⏭️  Chats déjà existants: {len(courses_with_chat)}")
    print(f"📚 Total de cours: {len(courses_without_chat) + len(courses_with_chat)}")
    print("="*60 + "\n")


def create_chats_for_sections_and_filieres():
    """Créer des chats pour les sections et filières"""
    print("\n" + "="*60)
    print("🚀 CRÉATION DES CHATS POUR SECTIONS ET FILIÈRES")
    print("="*60 + "\n")

    # Sections
    for section in Section.objects.all():
        try:
            if not hasattr(section, 'chat_channel') or not section.chat_channel:
                from apps.chat.signals import create_section_chat
                create_section_chat(Section, section, created=True)
                print(f"✅ Section {section.nom} - Chat créé")
            else:
                print(f"⏭️  Section {section.nom} - Chat déjà existant")
        except Exception as e:
            print(f"❌ Erreur pour section {section.nom}: {e}")

    # Filières
    for filiere in Filiere.objects.all():
        try:
            if not hasattr(filiere, 'chat_channel') or not filiere.chat_channel:
                from apps.chat.signals import create_filiere_chat
                create_filiere_chat(Filiere, filiere, created=True)
                print(f"✅ Filière {filiere.nom} - Chat créé")
            else:
                print(f"⏭️  Filière {filiere.nom} - Chat déjà existant")
        except Exception as e:
            print(f"❌ Erreur pour filière {filiere.nom}: {e}")

    print("\n" + "="*60 + "\n")


if __name__ == '__main__':
    create_chats_for_existing_courses()
    create_chats_for_sections_and_filieres()
    print("🎉 Terminé ! Le système de chat est maintenant complètement configuré.\n")
