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
        if self.action in ['create', 'academic_year_options']:
            self.permission_classes = [AllowAny]
        else:
            self.permission_classes = [IsSGAOrAdmin]
        return super().get_permissions()

    @action(detail=False, methods=['get'], url_path='academic-year-options')
    def academic_year_options(self, request):
        """Return the public academic-year choices for new applicants."""
        from apps.auditoires.utils import get_public_academic_year_options
        return Response(get_public_academic_year_options())

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
                annee_academique=pre_inscription.academic_year,
                created_by=request.user
            )

            auditoire_status = "créé automatiquement" if created else "existant"

        except Exception as e:
            return Response({
                'error': f"Erreur lors de la recherche/création de l'auditoire: {str(e)}"
            }, status=status.HTTP_400_BAD_REQUEST)

        # 2. Create the user — copy all relevant pre-inscription fields
        temp_password = get_random_string(12)
        try:
            user = User.objects.create_user(
                email=pre_inscription.email,
                password=temp_password,
                first_name=pre_inscription.first_name,
                last_name=pre_inscription.last_name,
                post_nom=pre_inscription.post_nom or '',
                phone=pre_inscription.phone,
                sexe=pre_inscription.sexe,
                date_naissance=pre_inscription.date_naissance,
                adresse=pre_inscription.adresse,
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

        # 4. Send a welcome email with credentials
        try:
            from django.core.mail import send_mail
            from django.conf import settings
            subject = "Bienvenue — Vos identifiants de connexion"
            message = (
                f"Bonjour {user.first_name} {user.last_name},\n\n"
                f"Votre inscription à l'université a été validée.\n\n"
                f"Vos identifiants de connexion :\n"
                f"  Email    : {user.email}\n"
                f"  Mot de passe : {temp_password}\n\n"
                f"Auditoire assigné : {target_auditoire.nom}\n\n"
                f"Veuillez vous connecter et changer votre mot de passe dès que possible.\n\n"
                f"Cordialement,\nL'administration"
            )
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=True)
        except Exception:
            pass  # Silently fail if email misconfigured — credentials already created

        return Response({
            'status': 'Inscription validée avec succès.',
            'message': (
                f"L'étudiant {user.first_name} {user.last_name} a été créé et affecté à "
                f"l'auditoire '{target_auditoire.nom}' ({auditoire_status}). "
                f"Un email de bienvenue a été envoyé à {user.email}."
            ),
            'user_id': user.id,
            'email': user.email,
            'auditoire_created': created,
            'academic_year': target_auditoire.annee_academique
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='reject')
    def reject_inscription(self, request, pk=None):
        """
        Rejects a pre-inscription request.
        """
        pre_inscription = self.get_object()

        if pre_inscription.status != 'en_attente':
            return Response({'error': 'Cette demande a déjà été traitée.'}, status=status.HTTP_400_BAD_REQUEST)

        reason = request.data.get('reason', '')
        pre_inscription.status = 'rejetee'
        pre_inscription.save()

        # Send rejection email
        try:
            from django.core.mail import send_mail
            from django.conf import settings
            subject = "Résultat de votre demande d'inscription"
            message = (
                f"Bonjour {pre_inscription.first_name} {pre_inscription.last_name},\n\n"
                f"Nous avons bien reçu votre demande d'inscription. Après examen de votre dossier, "
                f"nous sommes au regret de vous informer que votre candidature n'a pas été retenue.\n\n"
            )
            if reason:
                message += f"Motif : {reason}\n\n"
            message += "Cordialement,\nL'administration"
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [pre_inscription.email], fail_silently=True)
        except Exception:
            pass

        return Response({'status': 'Inscription rejetée.'}, status=status.HTTP_200_OK)
