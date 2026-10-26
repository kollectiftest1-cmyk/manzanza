"""
Suppression douce (corbeille) — briques réutilisables.

Tout modèle qui hérite de ``SoftDeleteModel`` :
  * n'est jamais supprimé immédiatement : ``obj.delete()`` le place dans la corbeille ;
  * disparaît des requêtes ``Model.objects`` tant qu'il est dans la corbeille ;
  * reste accessible via ``Model.all_objects`` (corbeille, restauration, purge) ;
  * est supprimé définitivement par la purge automatique après la durée de
    conservation configurée (60 jours par défaut).

La logique de cascade, de protection et de restauration vit dans ``apps.core.trash``.
"""
from django.conf import settings
from django.db import models


class SoftDeleteQuerySet(models.QuerySet):
    def alive(self):
        return self.filter(deleted_at__isnull=True)

    def dead(self):
        return self.filter(deleted_at__isnull=False)

    def delete(self):
        """Une suppression en masse envoie chaque élément à la corbeille."""
        from apps.core.trash import soft_delete

        count = 0
        for obj in self:
            if obj.deleted_at is None:
                soft_delete(obj)
                count += 1
        return count, {self.model._meta.label: count}

    def hard_delete(self):
        return super().delete()


class SoftDeleteManager(models.Manager.from_queryset(SoftDeleteQuerySet)):
    """Manager par défaut : masque les éléments présents dans la corbeille."""

    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)


class AllObjectsManager(models.Manager.from_queryset(SoftDeleteQuerySet)):
    """Manager complet : inclut les éléments présents dans la corbeille."""


class SoftDeleteModel(models.Model):
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True, editable=False,
                                      verbose_name='Supprimé le')
    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        editable=False, related_name='+', verbose_name='Supprimé par'
    )

    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()

    class Meta:
        abstract = True
        # NB : le « base manager » de Django (relations directes, purge) reste le
        # Manager standard, qui voit aussi les éléments présents dans la corbeille.

    @property
    def is_deleted(self):
        return self.deleted_at is not None

    def delete(self, using=None, keep_parents=False, user=None, reason=''):
        from apps.core.trash import soft_delete

        return soft_delete(self, user=user, reason=reason)

    def hard_delete(self, using=None, keep_parents=False):
        """Suppression physique — réservée à la purge automatique de la corbeille."""
        return models.Model.delete(self, using=using, keep_parents=keep_parents)

    def restore(self, user=None):
        from apps.core.trash import restore_object

        return restore_object(self, user=user)
