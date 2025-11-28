"""
Chat models
"""
from django.db import models
from django.conf import settings


class ChatChannel(models.Model):
    """Chat Channel Model (Forum for each course)"""

    name = models.CharField(max_length=200, verbose_name='Nom du canal')
    description = models.TextField(blank=True, null=True, verbose_name='Description')
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE,
                              related_name='chat_channels', verbose_name='Cours',
                              null=True, blank=True)

    # If not linked to a course, it's a general channel
    is_general = models.BooleanField(default=False, verbose_name='Canal général')
    is_active = models.BooleanField(default=True, verbose_name='Actif')

    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                  null=True, related_name='channels_created')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Canal de discussion'
        verbose_name_plural = 'Canaux de discussion'
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def participants_count(self):
        """Count active participants"""
        if self.course:
            return self.course.enrollments.filter(is_active=True).count()
        return 0


class Message(models.Model):
    """Message Model"""

    channel = models.ForeignKey(ChatChannel, on_delete=models.CASCADE,
                               related_name='messages', verbose_name='Canal')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                              related_name='messages_sent', verbose_name='Expéditeur')
    content = models.TextField(verbose_name='Contenu')

    # Message type
    is_ai_response = models.BooleanField(default=False, verbose_name='Réponse IA')
    parent_message = models.ForeignKey('self', on_delete=models.SET_NULL,
                                      null=True, blank=True, related_name='replies',
                                      verbose_name='Message parent')

    # Attachments
    attachment = models.FileField(upload_to='chat_attachments/', blank=True, null=True,
                                 verbose_name='Pièce jointe')

    # Status
    is_edited = models.BooleanField(default=False, verbose_name='Édité')
    is_deleted = models.BooleanField(default=False, verbose_name='Supprimé')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Envoyé à')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Message'
        verbose_name_plural = 'Messages'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.get_full_name()} - {self.channel.name}"


class MessageReaction(models.Model):
    """Message reactions (likes, etc.)"""

    REACTION_TYPES = [
        ('like', '👍'),
        ('love', '❤️'),
        ('laugh', '😂'),
        ('wow', '😮'),
    ]

    message = models.ForeignKey(Message, on_delete=models.CASCADE,
                               related_name='reactions', verbose_name='Message')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                           related_name='message_reactions', verbose_name='Utilisateur')
    reaction_type = models.CharField(max_length=20, choices=REACTION_TYPES, verbose_name='Type de réaction')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Réaction'
        verbose_name_plural = 'Réactions'
        unique_together = ['message', 'user', 'reaction_type']

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.get_reaction_type_display()}"
