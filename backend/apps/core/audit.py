"""Écriture dans le journal d'audit (ne doit jamais faire échouer l'action métier)."""
import logging

from django.contrib.contenttypes.models import ContentType
from django.db import transaction

from .context import get_client_ip, get_current_user

logger = logging.getLogger(__name__)


def audit(action, obj=None, user=None, details=None, request=None):
    from .models import AuditLog

    try:
        user = user or get_current_user()
        entry = AuditLog(
            action=action,
            actor=user if user is not None and getattr(user, 'pk', None) else None,
            actor_repr=(str(user) if user is not None else '')[:255],
            details=details or {},
            ip_address=get_client_ip(request),
        )
        if obj is not None:
            entry.content_type = ContentType.objects.get_for_model(obj.__class__)
            entry.object_id = str(obj.pk)
            entry.object_repr = str(obj)[:255]
        with transaction.atomic():
            entry.save()
        return entry
    except Exception:  # pragma: no cover - l'audit est best-effort
        logger.exception("Impossible d'écrire dans le journal d'audit (%s)", action)
        return None
