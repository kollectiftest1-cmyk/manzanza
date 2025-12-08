"""
Chat signals - Automatic chat creation
"""
from django.db.models.signals import post_save, m2m_changed
from django.dispatch import receiver
from apps.courses.models import Course
from apps.auditoires.models import Section, Filiere, Auditoire
from apps.users.models import User
from .models import ChatChannel


@receiver(post_save, sender=Course)
def create_course_chat(sender, instance, created, **kwargs):
    """
    Créer automatiquement un chat quand un cours est créé.
    Membres: étudiants de l'auditoire, titulaire, assistants, chef section, chef filière, SGA
    """
    if created:
        # Créer un nom intelligent pour le chat
        chat_name = generate_course_chat_name(instance)

        # Créer le canal de chat
        chat_channel = ChatChannel.objects.create(
            name=chat_name,
            description=f"Discussion du cours {instance.name}",
            channel_type='course',
            course=instance,
            created_by=instance.titulaire
        )

        # Ajouter les membres automatiquement
        add_course_chat_members(chat_channel, instance)


def generate_course_chat_name(course):
    """
    Générer un nom intelligent pour le chat du cours
    Format: "Programmation Python - L1 Génie Logiciel"
    """
    if course.auditoire:
        auditoire_name = course.auditoire.nom
        return f"{course.name} - {auditoire_name}"
    return f"💬 {course.name}"


def add_course_chat_members(chat_channel, course):
    """
    Ajouter tous les membres pertinents au chat du cours
    """
    members = []

    # 1. Tous les étudiants de l'auditoire
    if course.auditoire:
        students = User.objects.filter(auditoire=course.auditoire, role='etudiant', is_active=True)
        members.extend(students)

    # 2. L'enseignant titulaire
    if course.titulaire:
        members.append(course.titulaire)

    # 3. Les assistants
    members.extend(course.assistants.all())

    # 4. Le chef de département (filière)
    if course.auditoire and course.auditoire.filiere:
        chef_filiere = course.auditoire.filiere.chef_filiere
        if chef_filiere:
            members.append(chef_filiere)

    # 5. Le chef de section
    if course.auditoire and course.auditoire.filiere and course.auditoire.filiere.section:
        chef_section = course.auditoire.filiere.section.chef_section
        if chef_section:
            members.append(chef_section)

    # 6. Tous les SGA (ils voient tout)
    sga_users = User.objects.filter(role='sga', is_active=True)
    members.extend(sga_users)

    # Ajouter tous les membres uniques au chat
    chat_channel.members.set(members)


@receiver(post_save, sender=Section)
def create_section_chat(sender, instance, created, **kwargs):
    """
    Créer automatiquement un chat de section pour les enseignants
    """
    if created:
        chat_channel = ChatChannel.objects.create(
            name=f"👥 Section {instance.nom}",
            description=f"Discussion pour les enseignants de la section {instance.nom}",
            channel_type='section',
            section=instance,
            created_by=instance.chef_section
        )

        # Ajouter tous les enseignants de cette section
        update_section_chat_members(chat_channel, instance)


def update_section_chat_members(chat_channel, section):
    """
    Mettre à jour les membres du chat de section
    """
    members = []

    # Chef de section
    if section.chef_section:
        members.append(section.chef_section)

    # Tous les enseignants qui donnent des cours dans cette section
    courses_in_section = Course.objects.filter(
        auditoire__filiere__section=section,
        is_active=True
    )

    for course in courses_in_section:
        if course.titulaire:
            members.append(course.titulaire)
        members.extend(course.assistants.all())

    # Ajouter les chefs de filières de cette section
    chefs_filieres = User.objects.filter(managed_filiere__section=section)
    members.extend(chefs_filieres)

    chat_channel.members.set(members)


@receiver(post_save, sender=Filiere)
def create_filiere_chat(sender, instance, created, **kwargs):
    """
    Créer automatiquement un chat de filière pour les enseignants
    """
    if created:
        chat_channel = ChatChannel.objects.create(
            name=f"🎓 Filière {instance.nom}",
            description=f"Discussion pour les enseignants de la filière {instance.nom}",
            channel_type='filiere',
            filiere=instance,
            created_by=instance.chef_filiere
        )

        # Ajouter tous les enseignants de cette filière
        update_filiere_chat_members(chat_channel, instance)


def update_filiere_chat_members(chat_channel, filiere):
    """
    Mettre à jour les membres du chat de filière
    """
    members = []

    # Chef de filière
    if filiere.chef_filiere:
        members.append(filiere.chef_filiere)

    # Chef de section parent
    if filiere.section and filiere.section.chef_section:
        members.append(filiere.section.chef_section)

    # Tous les enseignants qui donnent des cours dans cette filière
    courses_in_filiere = Course.objects.filter(
        auditoire__filiere=filiere,
        is_active=True
    )

    for course in courses_in_filiere:
        if course.titulaire:
            members.append(course.titulaire)
        members.extend(course.assistants.all())

    chat_channel.members.set(members)


@receiver(post_save, sender=User)
def update_user_chats(sender, instance, created, **kwargs):
    """
    Gérer les chats lors de la création ou modification d'un utilisateur
    - Étudiant affecté à auditoire → Ajouter aux chats des cours
    - SGA → Ajouter à tous les chats
    - Changement de rôle → Mettre à jour les memberships
    """
    # Étudiant affecté à un auditoire
    if instance.role == 'etudiant' and instance.auditoire:
        courses = Course.objects.filter(auditoire=instance.auditoire, is_active=True)

        for course in courses:
            try:
                chat_channel = ChatChannel.objects.get(course=course)
                chat_channel.members.add(instance)
            except ChatChannel.DoesNotExist:
                # Si le chat n'existe pas, le créer
                chat_name = generate_course_chat_name(course)
                chat_channel = ChatChannel.objects.create(
                    name=chat_name,
                    description=f"Discussion du cours {course.name}",
                    channel_type='course',
                    course=course,
                    created_by=course.titulaire
                )
                add_course_chat_members(chat_channel, course)

    # SGA → Ajouter à tous les chats
    if instance.role == 'sga':
        all_chats = ChatChannel.objects.filter(is_active=True)
        for chat in all_chats:
            chat.members.add(instance)

    # Chef de section → Ajouter aux chats de sa section
    if instance.role == 'chef_section' and hasattr(instance, 'managed_section'):
        section = instance.managed_section
        # Chat de la section
        if hasattr(section, 'chat_channel'):
            section.chat_channel.members.add(instance)
        # Chats des filières de la section
        for filiere in section.filieres.all():
            if hasattr(filiere, 'chat_channel'):
                filiere.chat_channel.members.add(instance)
        # Chats des cours de la section
        courses = Course.objects.filter(auditoire__filiere__section=section, is_active=True)
        for course in courses:
            if hasattr(course, 'chat_channel'):
                course.chat_channel.members.add(instance)

    # Chef de département → Ajouter aux chats de sa filière
    if instance.role == 'chef_departement' and hasattr(instance, 'managed_filiere'):
        filiere = instance.managed_filiere
        # Chat de la filière
        if hasattr(filiere, 'chat_channel'):
            filiere.chat_channel.members.add(instance)
        # Chat de la section parent
        if filiere.section and hasattr(filiere.section, 'chat_channel'):
            filiere.section.chat_channel.members.add(instance)
        # Chats des cours de la filière
        courses = Course.objects.filter(auditoire__filiere=filiere, is_active=True)
        for course in courses:
            if hasattr(course, 'chat_channel'):
                course.chat_channel.members.add(instance)


@receiver(m2m_changed, sender=Course.assistants.through)
def update_course_chat_assistants(sender, instance, action, **kwargs):
    """
    Quand des assistants sont ajoutés/retirés d'un cours, mettre à jour le chat
    """
    if action in ['post_add', 'post_remove', 'post_clear']:
        try:
            chat_channel = ChatChannel.objects.get(course=instance)
            add_course_chat_members(chat_channel, instance)
        except ChatChannel.DoesNotExist:
            pass
