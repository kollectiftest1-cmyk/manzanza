"""
Views for the inscriptions app.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from django.utils.crypto import get_random_string
from django.db import transaction

from .models import PreInscription
from .serializers import PreInscriptionSerializer
from apps.users.permissions import IsSGAOrAdmin
from apps.auditoires.models import Auditoire # Import Auditoire model

User = get_user_model()

class PreInscriptionViewSet(viewsets.ModelViewSet):
    """
    ViewSet to manage pre-registration requests.
    - Public can create (apply).
    - Admin/SGA can list, validate, or reject.
    """
    queryset = PreInscription.objects.select_related('filiere').all().order_by('-created_at')
    serializer_class = PreInscriptionSerializer

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action == 'create':
            self.permission_classes = [AllowAny]
        else:
            self.permission_classes = [IsSGAOrAdmin]
        return super().get_permissions()

    @action(detail=True, methods=['post'], url_path='validate')
    @transaction.atomic
    def validate_inscription(self, request, pk=None):
        """
        Validates a pre-inscription, creates a new student user,
        and assigns them to the correct auditoire.
        If the auditoire doesn't exist, it will be created automatically.
        """
        from apps.auditoires.utils import find_or_create_auditoire

        pre_inscription = self.get_object()

        if pre_inscription.status != 'en_attente':
            return Response({'error': 'Cette demande a déjà été traitée.'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Find or create the target auditoire
        try:
            target_auditoire, created = find_or_create_auditoire(
                filiere=pre_inscription.filiere,
                niveau=pre_inscription.niveau,
                vacation=pre_inscription.vacation,
                created_by=request.user
            )

            auditoire_status = "créé automatiquement" if created else "existant"

        except Exception as e:
            return Response({
                'error': f"Erreur lors de la recherche/création de l'auditoire: {str(e)}"
            }, status=status.HTTP_400_BAD_REQUEST)

        # 2. Create the user
        temp_password = get_random_string(12)
        try:
            user = User.objects.create_user(
                email=pre_inscription.email,
                password=temp_password,
                first_name=pre_inscription.first_name,
                last_name=pre_inscription.last_name,
                phone=pre_inscription.phone,
                role='etudiant',
                status='actif'
            )
            # Assign the found/created auditoire to the student
            user.auditoire = target_auditoire
            user.save()

        except Exception as e:
            # This will roll back the transaction if user creation fails
            return Response({'error': f"Erreur lors de la création de l'utilisateur: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 3. Update the pre-inscription status
        pre_inscription.status = 'validee'
        pre_inscription.save()

        # TODO: Send an email to the user with their temporary password
        # and a link to login and change it.

        return Response({
            'status': 'Inscription validée avec succès.',
            'message': f"L'étudiant {user.first_name} {user.last_name} a été créé et affecté à l'auditoire '{target_auditoire.nom}' ({auditoire_status}).",
            'user_id': user.id,
            'email': user.email,
            'temp_password': temp_password,  # For testing; consider removing in production
            'auditoire_created': created
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='reject')
    def reject_inscription(self, request, pk=None):
        """
        Rejects a pre-inscription request.
        """
        pre_inscription = self.get_object()

        if pre_inscription.status != 'en_attente':
            return Response({'error': 'Cette demande a déjà été traitée.'}, status=status.HTTP_400_BAD_REQUEST)

        pre_inscription.status = 'rejetee'
        pre_inscription.save()

        # TODO: Optionally, send a rejection email.

        return Response({'status': 'Inscription rejetée.'}, status=status.HTTP_200_OK)
