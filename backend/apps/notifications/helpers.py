"""
Notification helper utilities for bulk notification creation.
"""
from django.contrib.auth import get_user_model
from .models import Notification

User = get_user_model()


def notify_users(recipients_qs, title, message, notification_type='systeme',
                 priority='medium', link=None, related_object_id=None):
    """
    Create notifications for a queryset of users.
    Uses bulk_create for efficiency.
    
    Args:
        recipients_qs: QuerySet of User objects
        title: Notification title
        message: Notification message
        notification_type: One of Notification.NOTIFICATION_TYPES
        priority: One of Notification.PRIORITY_CHOICES
        link: Optional frontend link (e.g. '/calendrier')
        related_object_id: Optional related object ID
    
    Returns:
        Number of notifications created
    """
    notifications = [
        Notification(
            recipient=user,
            title=title,
            message=message,
            notification_type=notification_type,
            priority=priority,
            link=link,
            related_object_id=related_object_id,
        )
        for user in recipients_qs
    ]
    if notifications:
        Notification.objects.bulk_create(notifications)
    return len(notifications)


def notify_all_active_users(title, message, notification_type='systeme',
                            priority='medium', link=None, related_object_id=None):
    """
    Send notification to ALL active users.
    """
    users = User.objects.filter(is_active=True, status='actif')
    return notify_users(users, title, message, notification_type,
                        priority, link, related_object_id)


def notify_auditoire_stakeholders(auditoire, title, message,
                                  notification_type='horaire',
                                  priority='medium', link=None,
                                  related_object_id=None):
    """
    Send notification to all stakeholders of an auditoire:
    - Students enrolled in the auditoire
    - Assistants teaching courses in the auditoire
    - Teachers (titulaires) of courses in the auditoire
    - Chef de filière (département) of the auditoire
    - Chef de section of the auditoire
    """
    from django.db.models import Q
    from apps.courses.models import Course

    recipient_ids = set()

    # 1. Students in this auditoire
    student_ids = User.objects.filter(
        auditoire=auditoire, role='etudiant', is_active=True, status='actif'
    ).values_list('id', flat=True)
    recipient_ids.update(student_ids)

    # 2. Teachers and assistants of courses in this auditoire
    courses = Course.objects.filter(auditoire=auditoire, is_active=True)
    for course in courses:
        if course.titulaire_id:
            recipient_ids.add(course.titulaire_id)
        assistant_ids = course.assistants.values_list('id', flat=True)
        recipient_ids.update(assistant_ids)

    # 3. Chef de filière (département)
    filiere = auditoire.filiere
    if filiere and hasattr(filiere, 'chef_filiere') and filiere.chef_filiere_id:
        recipient_ids.add(filiere.chef_filiere_id)

    # 4. Chef de section
    section = filiere.section if filiere else None
    if section and hasattr(section, 'chef_section') and section.chef_section_id:
        recipient_ids.add(section.chef_section_id)

    # 5. SGA/admin users (they should also be notified)
    admin_ids = User.objects.filter(
        role__in=['sga', 'sgad', 'iadmin'], is_active=True, status='actif'
    ).values_list('id', flat=True)
    recipient_ids.update(admin_ids)

    # Create notifications
    recipients = User.objects.filter(id__in=recipient_ids, is_active=True)
    return notify_users(recipients, title, message, notification_type,
                        priority, link, related_object_id)
