"""
Fichiers médias publics / privés.

* Publics (avatars, couvertures, supports de cours…) : servis tels quels (nginx en production).
* Privés (dossiers de candidature, contrats, PV, documents officiels, reçus, copies d'étudiants,
  réponses aux quiz, pièces jointes de messagerie) : jamais accessibles par simple URL.
  L'API ne renvoie leur lien qu'aux utilisateurs autorisés à voir l'objet, sous forme d'URL
  signée à durée limitée (MEDIA_SIGNED_URL_MAX_AGE, 2 h par défaut). Django vérifie la
  signature avant de servir le fichier.

Le remplacement est global : ``SignedFileField`` devient le champ par défaut des
FileField/ImageField de tous les ModelSerializer (voir CoreConfig.ready).
"""
import mimetypes
import os

from django.conf import settings
from django.core import signing
from django.http import FileResponse, Http404
from django.utils._os import safe_join
from rest_framework import serializers

PRIVATE_PREFIXES = (
    'inscriptions/', 'contracts/', 'deliberations/', 'documents/', 'receipts/',
    'assignments/submissions/', 'quiz/answers/', 'chat_attachments/',
)
_signer = signing.TimestampSigner(salt='mz.media')


def is_private(path):
    return path.lstrip('/').startswith(PRIVATE_PREFIXES)



def signed_query(path):
    token = _signer.sign(path)
    return token[len(path) + 1:]  # "<timestamp>:<signature>"


def check_token(path, token):
    max_age = getattr(settings, 'MEDIA_SIGNED_URL_MAX_AGE', 7200)
    try:
        _signer.unsign(f"{path}:{token}", max_age=max_age)
        return True
    except signing.BadSignature:
        return False


def media_view(request, path):
    path = path.lstrip('/')
    if '..' in path.split('/'):
        raise Http404
    if is_private(path):
        if not check_token(path, request.GET.get('t', '')):
            raise Http404("Lien expiré ou invalide.")
    elif not settings.DEBUG:
        raise Http404  # en production les fichiers publics sont servis par nginx
    try:
        full = safe_join(str(settings.MEDIA_ROOT), path)
    except Exception:
        raise Http404
    if not os.path.isfile(full):
        raise Http404
    ctype, _ = mimetypes.guess_type(full)
    resp = FileResponse(open(full, 'rb'), content_type=ctype or 'application/octet-stream')
    if is_private(path):
        resp['Cache-Control'] = 'private, no-store'
        resp['X-Content-Type-Options'] = 'nosniff'
    return resp


def _signed_representation(field, value, parent_to_representation):
    if not value:
        return None
    name = value.name
    if is_private(name):
        url = f"/{settings.MEDIA_URL.strip('/')}/{name}?t={signed_query(name)}"
        request = field.context.get('request')
        return request.build_absolute_uri(url) if request else url
    return parent_to_representation(value)


class SignedFileField(serializers.FileField):
    def to_representation(self, value):
        return _signed_representation(self, value, super().to_representation)


class SignedImageField(serializers.ImageField):
    def to_representation(self, value):
        return _signed_representation(self, value, super().to_representation)
