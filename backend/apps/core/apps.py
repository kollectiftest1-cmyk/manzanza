from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.core'
    verbose_name = 'Système (corbeille, audit, paramètres)'

    def ready(self):
        # Liens signés à durée limitée pour tous les fichiers privés exposés par l'API.
        from django.db import models
        from rest_framework.serializers import ModelSerializer
        from .media import SignedFileField, SignedImageField
        ModelSerializer.serializer_field_mapping[models.FileField] = SignedFileField
        ModelSerializer.serializer_field_mapping[models.ImageField] = SignedImageField
