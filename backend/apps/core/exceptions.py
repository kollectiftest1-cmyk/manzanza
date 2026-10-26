"""Gestionnaire d'exceptions DRF : erreurs métier lisibles au lieu d'erreurs 500."""
from django.db import IntegrityError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler, set_rollback

from .trash import TrashError


def exception_handler(exc, context):
    if isinstance(exc, TrashError):
        set_rollback()
        return Response({'detail': str(exc)}, status=status.HTTP_409_CONFLICT)

    if isinstance(exc, IntegrityError):
        set_rollback()
        return Response(
            {
                'detail': (
                    "Cette opération crée un doublon. Un élément identique existe peut-être "
                    "dans la corbeille : restaurez-le plutôt que d'en créer un nouveau."
                )
            },
            status=status.HTTP_409_CONFLICT,
        )

    return drf_exception_handler(exc, context)
