"""
Notification models
"""
from django.db import models

from apps.core.softdelete import SoftDeleteModel
from django.conf import settings


class Notification(SoftDeleteModel):
    """Notification Model"""

    NOTIFICATION_TYPES = [
        ('cours', 'Cours'),
        ('quiz', 'Quiz'),
        ('assignment', 'Travail (TP/TD)'),
        ('chat', 'Chat'),
        ('paiement', 'Paiement'),
        ('bibliotheque', 'Bibliothèque'),
        ('rh', 'RH'),
        ('systeme', 'Système'),
        ('calendrier', 'Calendrier Académique'),
        ('horaire', 'Horaire'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Basse'),
        ('medium', 'Moyenne'),
        ('high', 'Haute'),
        ('urgent', 'Urgente'),
    ]

    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                 related_name='notifications', verbose_name='Destinataire')

    title = models.CharField(max_length=200, verbose_name='Titre')
    message = models.TextField(verbose_name='Message')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES,
                                        verbose_name='Type')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium',
                               verbose_name='Priorité')

    # Links
    link = models.CharField(max_length=500, blank=True, null=True, verbose_name='Lien')
    related_object_id = models.IntegerField(blank=True, null=True,
                                           verbose_name='ID de l\'objet lié')

    # Status
    is_read = models.BooleanField(default=False, verbose_name='Lu')
    read_at = models.DateTimeField(blank=True, null=True, verbose_name='Lu le')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Créé le')

    class Meta:
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.recipient.get_full_name()} - {self.title}"

    def mark_as_read(self):
        """Mark notification as read"""
        from django.utils import timezone
        self.is_read = True
        self.read_at = timezone.now()
        self.save()


class Announcement(SoftDeleteModel):
    """Public announcements"""

    AUDIENCE_CHOICES = [
        ('tous', 'Tous'),
        ('etudiants', 'Étudiants'),
        ('enseignants', 'Enseignants'),
        ('personnel', 'Personnel'),
    ]

    title = models.CharField(max_length=200, verbose_name='Titre')
    content = models.TextField(verbose_name='Contenu')
    audience = models.CharField(max_length=20, choices=AUDIENCE_CHOICES, default='tous',
                               verbose_name='Audience')

    # Attachments
    attachment = models.FileField(upload_to='announcements/', blank=True, null=True,
                                 verbose_name='Pièce jointe')

    # Settings
    is_active = models.BooleanField(default=True, verbose_name='Actif')
    is_pinned = models.BooleanField(default=False, verbose_name='Épinglé')

    # Dates
    publish_date = models.DateTimeField(verbose_name='Date de publication')
    expire_date = models.DateTimeField(blank=True, null=True, verbose_name='Date d\'expiration')

    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                  null=True, related_name='announcements_created',
                                  verbose_name='Créé par')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Annonce'
        verbose_name_plural = 'Annonces'
        ordering = ['-publish_date']

    def __str__(self):
        return self.title
