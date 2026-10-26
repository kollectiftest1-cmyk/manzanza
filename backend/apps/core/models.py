from datetime import timedelta

from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone

from .softdelete import SoftDeleteModel  # noqa: F401  (ré-export pratique)


class AcademicCalendarEvent(SoftDeleteModel):
    title = models.CharField(max_length=200)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.title


class InstitutionSettings(models.Model):
    """
    Paramètres système de l'établissement (singleton, pk=1).
    Modifiables uniquement par le PDG.
    """
    trash_retention_days = models.PositiveIntegerField(
        default=60,
        validators=[MinValueValidator(1), MaxValueValidator(3650)],
        verbose_name='Durée de conservation dans la corbeille (jours)',
        help_text="Au-delà de cette durée, les éléments de la corbeille sont supprimés définitivement."
    )
    # Accès conditionné au paiement (phase 3)
    exam_min_paid_percent = models.PositiveSmallIntegerField(
        default=100, validators=[MaxValueValidator(100)],
        verbose_name="Part minimale des frais obligatoires réglée pour accéder aux examens (%)"
    )
    results_require_clearance = models.BooleanField(
        default=True, verbose_name="Résultats et documents officiels réservés aux étudiants en règle"
    )
    admission_requires_application_fee = models.BooleanField(
        default=True, verbose_name="L'admission exige le paiement des frais de dossier"
    )
    institution_name = models.CharField(max_length=200, default='Université MAZANZA')
    institution_city = models.CharField(max_length=100, default='Kinshasa')
    rector_name = models.CharField(max_length=150, blank=True, default='', verbose_name='Recteur / DG (signataire)')
    sga_name = models.CharField(max_length=150, blank=True, default='', verbose_name='SGA (signataire)')

    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='+'
    )

    class Meta:
        verbose_name = 'Paramètres de l’établissement'
        verbose_name_plural = 'Paramètres de l’établissement'

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise RuntimeError("Les paramètres de l'établissement ne peuvent pas être supprimés.")

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(
            pk=1, defaults={'trash_retention_days': getattr(settings, 'TRASH_RETENTION_DAYS', 60)}
        )
        return obj

    def __str__(self):
        return 'Paramètres de l’établissement'


class TrashItem(models.Model):
    """
    Une ligne par élément placé dans la corbeille. Les éléments supprimés ensemble
    (élément racine + dépendances en cascade) partagent le même ``batch``.
    """
    batch = models.UUIDField(db_index=True)
    is_root = models.BooleanField(default=False, db_index=True)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.CharField(max_length=64)
    object_repr = models.CharField(max_length=255)
    module = models.CharField(max_length=50, db_index=True)
    reason = models.CharField(max_length=255, blank=True, default='')
    deleted_at = models.DateTimeField(default=timezone.now, db_index=True)
    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='+'
    )

    class Meta:
        ordering = ['-deleted_at']
        verbose_name = 'Élément de la corbeille'
        verbose_name_plural = 'Corbeille'
        indexes = [models.Index(fields=['content_type', 'object_id'])]

    def __str__(self):
        return f"{self.object_repr} ({self.content_type.model})"

    def expires_at(self, retention_days=None):
        if retention_days is None:
            retention_days = InstitutionSettings.load().trash_retention_days
        return self.deleted_at + timedelta(days=retention_days)

    def get_object(self):
        model = self.content_type.model_class()
        manager = getattr(model, 'all_objects', model._base_manager)
        return manager.filter(pk=self.object_id).first()


class AuditLog(models.Model):
    """Journal d'audit immuable des actions sensibles."""
    ACTION_CHOICES = [
        ('trash', 'Mise à la corbeille'),
        ('restore', 'Restauration'),
        ('purge', 'Purge définitive'),
        ('settings', 'Paramètres modifiés'),
        ('login', 'Connexion'),
        ('login_failed', 'Échec de connexion'),
        ('grade', 'Note saisie / modifiée'),
        ('payment', 'Opération de paiement'),
        ('inscription', 'Décision d’inscription'),
        ('role', 'Changement de rôle'),
        ('create', 'Création'),
        ('update', 'Modification'),
        ('export', 'Consultation / export de document'),
        ('security', 'Événement de sécurité'),
    ]

    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='+'
    )
    actor_repr = models.CharField(max_length=255, blank=True, default='')
    action = models.CharField(max_length=30, choices=ACTION_CHOICES, db_index=True)
    content_type = models.ForeignKey(ContentType, on_delete=models.SET_NULL, null=True, blank=True)
    object_id = models.CharField(max_length=64, blank=True, default='')
    object_repr = models.CharField(max_length=255, blank=True, default='')
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = "Entrée du journal d'audit"
        verbose_name_plural = "Journal d'audit"

    def __str__(self):
        return f"{self.timestamp:%Y-%m-%d %H:%M} {self.action} {self.object_repr}"

    def save(self, *args, **kwargs):
        if self.pk:
            raise RuntimeError("Une entrée du journal d'audit ne peut pas être modifiée.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise RuntimeError("Une entrée du journal d'audit ne peut pas être supprimée.")


class SupportTicket(models.Model):
    """Demande d'assistance informatique (helpdesk du Service IT)."""
    CATEGORY_CHOICES = [('compte', 'Compte / mot de passe'), ('reseau', 'Réseau / Wi-Fi'),
                        ('materiel', 'Matériel'), ('logiciel', 'Application / logiciel'), ('autre', 'Autre')]
    PRIORITY_CHOICES = [('basse', 'Basse'), ('normale', 'Normale'), ('haute', 'Haute'), ('urgente', 'Urgente')]
    STATUS_CHOICES = [('ouvert', 'Ouvert'), ('en_cours', 'En cours'), ('resolu', 'Résolu'), ('ferme', 'Fermé')]

    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=10, choices=CATEGORY_CHOICES, default='autre')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normale')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='ouvert')
    location = models.CharField(max_length=120, blank=True, default='', help_text='Salle, bureau…')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='support_tickets')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='assigned_tickets')
    resolution = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Ticket d'assistance"
        verbose_name_plural = "Tickets d'assistance"

    def __str__(self):
        return f"#{self.pk} {self.title}"
