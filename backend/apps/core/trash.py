"""
Corbeille : mise à la corbeille en cascade, restauration par lot, purge automatique.

Règles métier (cf. cahier des charges v2, section « Corbeille ») :
  1. Rien n'est supprimé immédiatement : l'élément et ses dépendances partent dans
     la corbeille dans un même lot.
  2. Restaurer un lot restaure tout ce qui avait été supprimé avec lui.
  3. Impossible de restaurer un élément dont le parent est lui-même dans la corbeille.
  4. Les données financières et académiques (paiements, reçus, notes, bulletins,
     copies et tentatives d'évaluation) ne peuvent jamais être emportées par une
     suppression en cascade : on désactive l'élément au lieu de le supprimer.
  5. Purge définitive automatique après ``InstitutionSettings.trash_retention_days``.
"""
import logging
import uuid
from datetime import timedelta

from django.contrib.contenttypes.models import ContentType
from django.db import router, transaction
from django.db.models.deletion import Collector, ProtectedError, RestrictedError
from django.utils import timezone

from .audit import audit
from .context import get_current_user
from .softdelete import SoftDeleteModel

logger = logging.getLogger(__name__)

# Données qui ne doivent jamais disparaître par effet de bord d'une suppression.
PROTECTED_MODELS = {
    'payments.payment': 'paiements',
    'payments.paymentreceipt': 'reçus de paiement',
    'payments.paymentvoucher': 'bons de paiement',
    'grades.grade': 'notes',
    'grades.transcript': 'bulletins',
    'quiz.quizattempt': 'tentatives de quiz',
    'assignments.assignmentsubmission': 'copies de TP/TD',
    'hr.payroll': 'fiches de paie',
    'scolarite.deliberation': 'délibérations',
    'scolarite.resultatdeliberation': 'résultats de délibération',
    'scolarite.documentofficiel': 'documents officiels',
    'grades.gradesheet': 'feuilles de notes',
    'payments.cashsession': 'sessions de caisse',
    'payments.contrepassation': 'contre-passations',
}

# Périmètre de la corbeille par rôle (modules = app_label Django).
ROLE_TRASH_MODULES = {
    'sga': {'auditoires', 'courses', 'grades', 'schedules', 'inscriptions', 'quiz',
            'assignments', 'notifications', 'core', 'scolarite'},
    'sgad': {'payments', 'hr'},
    'bibliothecaire': {'library'},
}


class TrashError(Exception):
    """Erreur métier de la corbeille (convertie en réponse 409 par l'API)."""


class TrashProtectedError(TrashError):
    pass


class TrashRestoreError(TrashError):
    pass


def _collect(obj):
    collector = Collector(using=router.db_for_write(obj.__class__, instance=obj))
    try:
        collector.collect([obj])
    except (ProtectedError, RestrictedError) as exc:
        blockers = list(exc.protected_objects if isinstance(exc, ProtectedError) else exc.restricted_objects)[:3]
        names = ', '.join(str(b) for b in blockers)
        raise TrashProtectedError(
            f"« {obj} » est encore utilisé ({names}). Retirez ces liens ou désactivez l'élément."
        ) from exc

    instances = []
    for objs in collector.data.values():
        instances.extend(objs)
    for qs in collector.fast_deletes:
        instances.extend(list(qs))
    return instances


def _check_protected(root, instances):
    found = {}
    for inst in instances:
        if inst is root or (inst.__class__ is root.__class__ and inst.pk == root.pk):
            continue
        label = inst._meta.label_lower
        if label in PROTECTED_MODELS and getattr(inst, 'deleted_at', None) is None:
            found[label] = found.get(label, 0) + 1
    if found:
        details = ', '.join(f"{count} {PROTECTED_MODELS[label]}" for label, count in found.items())
        raise TrashProtectedError(
            f"Suppression refusée : « {root} » est lié à des données à conserver ({details}). "
            "Désactivez-le (statut inactif) au lieu de le supprimer."
        )


def soft_delete(obj, user=None, reason=''):
    """Place ``obj`` et ses dépendances dans la corbeille. Retourne le nombre d'éléments."""
    from .models import TrashItem

    if not isinstance(obj, SoftDeleteModel):
        raise TrashError(f"Le type « {obj._meta.verbose_name} » ne peut pas être supprimé.")
    if obj.deleted_at is not None:
        return 0

    guard = getattr(obj, 'trash_guard', None)
    if callable(guard):
        guard()

    user = user or get_current_user()
    instances = _collect(obj)
    _check_protected(obj, instances)

    batch = uuid.uuid4()
    now = timezone.now()
    count = 0
    seen = set()
    with transaction.atomic():
        for inst in [obj] + [i for i in instances if i is not obj]:
            if not isinstance(inst, SoftDeleteModel):
                continue
            key = (inst._meta.label_lower, inst.pk)
            if key in seen:
                continue
            seen.add(key)
            current = type(inst).all_objects.filter(pk=inst.pk).values_list('deleted_at', flat=True).first()
            if current is not None:
                continue  # déjà dans la corbeille (lot précédent)
            type(inst).all_objects.filter(pk=inst.pk).update(deleted_at=now, deleted_by=user)
            inst.deleted_at = now
            inst.deleted_by = user
            TrashItem.objects.create(
                batch=batch,
                is_root=(key == (obj._meta.label_lower, obj.pk)),
                content_type=ContentType.objects.get_for_model(inst.__class__),
                object_id=str(inst.pk),
                object_repr=str(inst)[:255],
                module=inst._meta.app_label,
                reason=(reason or '')[:255],
                deleted_at=now,
                deleted_by=user,
            )
            count += 1

        hook = getattr(obj, 'after_trash', None)
        if callable(hook):
            hook()

    audit('trash', obj, user=user, details={'batch': str(batch), 'elements': count, 'motif': reason or ''})
    return count


def restore_batch(batch, user=None):
    """Restaure tous les éléments d'un lot. Retourne l'objet racine restauré."""
    from .models import TrashItem

    items = list(TrashItem.objects.filter(batch=batch).select_related('content_type'))
    if not items:
        raise TrashRestoreError("Cet élément n'est plus dans la corbeille.")
    root_item = next((i for i in items if i.is_root), items[0])
    root = root_item.get_object()
    if root is None:
        TrashItem.objects.filter(batch=batch).delete()
        raise TrashRestoreError("L'élément a déjà été purgé définitivement.")

    # Le parent d'un élément restauré doit exister et ne pas être dans la corbeille.
    for field in root._meta.concrete_fields:
        if not field.is_relation or not (field.many_to_one or field.one_to_one):
            continue
        related = field.related_model
        if related is None or not issubclass(related, SoftDeleteModel):
            continue
        parent_id = getattr(root, field.attname)
        if parent_id is None or field.name == 'deleted_by':
            continue
        parent = related.all_objects.filter(pk=parent_id, deleted_at__isnull=False).first()
        if parent is not None:
            raise TrashRestoreError(
                f"Restaurez d'abord « {parent} » ({related._meta.verbose_name}), "
                "qui est lui-même dans la corbeille."
            )

    user = user or get_current_user()
    with transaction.atomic():
        for item in items:
            model = item.content_type.model_class()
            if model is None:
                continue
            model.all_objects.filter(pk=item.object_id).update(deleted_at=None, deleted_by=None)
        TrashItem.objects.filter(batch=batch).delete()
        root.deleted_at = None
        root.deleted_by = None
        hook = getattr(root, 'after_restore', None)
        if callable(hook):
            hook()

    audit('restore', root, user=user, details={'batch': str(batch), 'elements': len(items)})
    return root


def restore_object(obj, user=None):
    from .models import TrashItem

    item = TrashItem.objects.filter(
        content_type=ContentType.objects.get_for_model(obj.__class__), object_id=str(obj.pk)
    ).first()
    if item is None:
        raise TrashRestoreError("Cet élément n'est pas dans la corbeille.")
    return restore_batch(item.batch, user=user)


def purge_expired(now=None, dry_run=False):
    """
    Supprime définitivement les lots dont la durée de conservation est écoulée.
    Retourne la liste des libellés purgés.
    """
    from .models import InstitutionSettings, TrashItem

    now = now or timezone.now()
    retention = InstitutionSettings.load().trash_retention_days
    cutoff = now - timedelta(days=retention)
    purged = []

    roots = TrashItem.objects.filter(is_root=True, deleted_at__lte=cutoff).select_related('content_type')
    for root_item in roots:
        label = f"{root_item.object_repr} ({root_item.content_type.model})"
        if dry_run:
            purged.append(label)
            continue
        obj = root_item.get_object()
        try:
            with transaction.atomic():
                if obj is not None:
                    _check_protected(obj, _collect(obj))
                    obj.hard_delete()
                TrashItem.objects.filter(batch=root_item.batch).delete()
            purged.append(label)
            audit('purge', None, user=None, details={
                'element': label, 'batch': str(root_item.batch),
                'supprime_le': root_item.deleted_at.isoformat(), 'conservation_jours': retention,
            })
        except TrashError as exc:
            logger.warning("Purge ignorée pour %s : %s", label, exc)
        except Exception:
            logger.exception("Échec de purge pour %s", label)

    if not dry_run:
        # Entrées orphelines (objet disparu, ex. purgé avec son parent).
        for item in TrashItem.objects.filter(deleted_at__lte=cutoff).select_related('content_type'):
            if item.get_object() is None:
                item.delete()
    return purged


def visible_trash_items(user):
    """Éléments racines de la corbeille visibles par ``user``."""
    from .models import TrashItem

    qs = TrashItem.objects.filter(is_root=True).select_related('content_type', 'deleted_by')
    if user.is_superuser or getattr(user, 'role', None) == 'pdg':
        return qs
    modules = ROLE_TRASH_MODULES.get(getattr(user, 'role', None), set())
    from django.db.models import Q
    return qs.filter(Q(module__in=modules) | Q(deleted_by=user))
