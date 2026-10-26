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
from apps.users.permissions import IsSGAOrAdmin, IsAcademicAdmin, has_role
from rest_framework.permissions import BasePermission
from apps.core.audit import audit
from apps.auditoires.models import Auditoire # Import Auditoire model

User = get_user_model()


class CanReviewInscriptions(BasePermission):
    """
    Lecture : SGA, PDG, apparitorat, commission, caisse. Chaque action du circuit vérifie
    ensuite son propre rôle (pièces → apparitorat, frais → caisse, décision → commission).
    """
    ACTION_ROLES = {'verify_dossier', 'mark_fee_paid', 'waitlist', 'validate_inscription', 'reject_inscription'}

    def has_permission(self, request, view):
        readers = ('sga', 'pdg', 'apparitorat', 'commission_admission', 'caisse')
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return has_role(request.user, *readers)
        if getattr(view, 'action', None) in self.ACTION_ROLES:
            return has_role(request.user, *readers)
        return has_role(request.user, 'sga', 'pdg')


def generate_matricule(academic_year=''):
    """Matricule permanent et unique : MZ-<année d'entrée>-<séquence sur 6 chiffres>."""
    year = (academic_year or '')[:4]
    if not year.isdigit():
        from django.utils import timezone
        year = str(timezone.localdate().year)
    prefix = f"MZ-{year}-"
    last = User.all_objects.filter(matricule__startswith=prefix).order_by('-matricule').values_list(
        'matricule', flat=True).first()
    seq = int(last.rsplit('-', 1)[-1]) + 1 if last and last.rsplit('-', 1)[-1].isdigit() else 1
    while User.all_objects.filter(matricule=f"{prefix}{seq:06d}").exists():
        seq += 1
    return f"{prefix}{seq:06d}"

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
            self.permission_classes = [CanReviewInscriptions]
        return super().get_permissions()

    def get_throttles(self):
        # Formulaire public : limite anti-spam par adresse IP.
        if self.action == 'create':
            self.throttle_scope = 'public_form'
        return super().get_throttles()

    def perform_destroy(self, instance):
        instance.delete(user=self.request.user)

    @action(detail=False, methods=['get'], url_path='academic-year-options')
    def academic_year_options(self, request):
        """Return the public academic-year choices for new applicants."""
        from apps.auditoires.utils import get_public_academic_year_options
        return Response(get_public_academic_year_options())

    # --- Circuit d'admission -------------------------------------------------
    #   1. Apparitorat : contrôle des pièces (conforme / à compléter)
    #   2. Caisse      : encaissement des frais de dossier (si exigés)
    #   3. Commission  : admis / liste d'attente / refusé (SGA ou membre de commission)
    #   4. Admis       : compte étudiant + matricule + inscription annuelle « en attente »
    #                    (frais facturés automatiquement selon les barèmes)

    @action(detail=True, methods=['get'], url_path=r'document/(?P<field>[a-z_0-9]+)')
    def document(self, request, pk=None, field=None):
        from django.http import FileResponse, Http404
        from .serializers import PreInscriptionSerializer as S
        if field not in S.UPLOAD_FIELDS:
            raise Http404
        obj = self.get_object()
        f = getattr(obj, field)
        if not f:
            raise Http404
        audit('export', obj, details={'action': 'consultation_piece', 'piece': field})
        return FileResponse(f.open('rb'), filename=f.name.rsplit('/', 1)[-1])

    @action(detail=True, methods=['post'], url_path='verify-dossier')
    def verify_dossier(self, request, pk=None):
        from django.utils import timezone
        if not has_role(request.user, 'apparitorat', 'sga', 'pdg'):
            return Response({'error': "Contrôle des pièces : apparitorat ou SGA."}, status=status.HTTP_403_FORBIDDEN)
        obj = self.get_object()
        if obj.status != 'en_attente':
            return Response({'error': 'Cette demande a déjà été traitée.'}, status=status.HTTP_400_BAD_REQUEST)
        value = request.data.get('dossier_status')
        comment = (request.data.get('comment') or '').strip()
        if value not in ('conforme', 'a_completer'):
            return Response({'error': "Valeur attendue : conforme ou a_completer."}, status=status.HTTP_400_BAD_REQUEST)
        if value == 'a_completer' and not comment:
            return Response({'error': "Précisez les pièces à compléter."}, status=status.HTTP_400_BAD_REQUEST)
        obj.dossier_status = value
        obj.dossier_comment = comment
        obj.dossier_verified_by = request.user
        obj.dossier_verified_at = timezone.now()
        obj.save()
        audit('inscription', obj, details={'action': 'controle_pieces', 'resultat': value, 'commentaire': comment})
        return Response(self.get_serializer(obj).data)

    @action(detail=True, methods=['post'], url_path='mark-fee-paid')
    def mark_fee_paid(self, request, pk=None):
        if not has_role(request.user, 'caisse', 'pdg'):
            return Response({'error': "L'encaissement des frais de dossier relève de la caisse."},
                            status=status.HTTP_403_FORBIDDEN)
        obj = self.get_object()
        reference = (request.data.get('reference') or '').strip()
        if not reference:
            return Response({'error': "Référence du reçu obligatoire."}, status=status.HTTP_400_BAD_REQUEST)
        obj.frais_dossier_paye = True
        obj.frais_dossier_reference = reference
        obj.frais_dossier_enregistre_par = request.user
        obj.save()
        audit('payment', obj, details={'action': 'frais_dossier', 'reference': reference})
        return Response(self.get_serializer(obj).data)

    def _commission_guard(self, request, obj):
        from apps.core.models import InstitutionSettings
        if not has_role(request.user, 'sga', 'pdg', 'commission_admission'):
            return Response({'error': "Décision réservée à la commission d'admission."},
                            status=status.HTTP_403_FORBIDDEN)
        if obj.status != 'en_attente':
            return Response({'error': 'Cette demande a déjà été traitée.'}, status=status.HTTP_400_BAD_REQUEST)
        if obj.dossier_status != 'conforme':
            return Response({'error': "Le dossier doit être déclaré conforme par l'apparitorat."},
                            status=status.HTTP_400_BAD_REQUEST)
        if InstitutionSettings.load().admission_requires_application_fee and not obj.frais_dossier_paye:
            return Response({'error': "Les frais de dossier ne sont pas encaissés."},
                            status=status.HTTP_400_BAD_REQUEST)
        return None

    @action(detail=True, methods=['post'], url_path='waitlist')
    def waitlist(self, request, pk=None):
        from django.utils import timezone
        obj = self.get_object()
        denied = self._commission_guard(request, obj)
        if denied:
            return denied
        obj.commission_decision = 'liste_attente'
        obj.commission_comment = (request.data.get('comment') or '').strip()
        obj.decided_by = request.user
        obj.decided_at = timezone.now()
        obj.save()
        audit('inscription', obj, details={'decision': 'liste_attente'})
        return Response(self.get_serializer(obj).data)

    @action(detail=True, methods=['post'], url_path='validate')
    @transaction.atomic
    def validate_inscription(self, request, pk=None):
        """Admission : crée le compte étudiant et son inscription annuelle (en attente de paiement)."""
        from django.utils import timezone
        from apps.auditoires.utils import find_or_create_auditoire
        from apps.scolarite.models import InscriptionAnnuelle
        from apps.scolarite.services.enrollment import create_inscription

        pre_inscription = self.get_object()
        denied = self._commission_guard(request, pre_inscription)
        if denied:
            return denied

        target_auditoire, created = find_or_create_auditoire(
            filiere=pre_inscription.filiere, niveau=pre_inscription.niveau, vacation=pre_inscription.vacation,
            annee_academique=pre_inscription.academic_year, created_by=request.user)
        auditoire_status = "créé automatiquement" if created else "existant"

        # Capacité d'accueil : dépassement possible uniquement sur décision explicite du SGA.
        effectif = InscriptionAnnuelle.objects.filter(
            auditoire=target_auditoire, statut__in=InscriptionAnnuelle.ACTIVE_STATUTS).count()
        override = str(request.data.get('override_capacity', '')).lower() in ('1', 'true', 'oui') \
            and has_role(request.user, 'sga', 'pdg')
        if target_auditoire.capacite_max and effectif >= target_auditoire.capacite_max and not override:
            transaction.set_rollback(True)
            return Response({
                'error': (f"L'auditoire « {target_auditoire.nom} » est complet "
                          f"({effectif}/{target_auditoire.capacite_max}). Placez le candidat en liste d'attente, "
                          "confirmez le dépassement (override_capacity) ou augmentez la capacité."),
                'capacity_full': True,
            }, status=status.HTTP_409_CONFLICT)

        temp_password = get_random_string(12)
        user = User.objects.create_user(
            email=pre_inscription.email, password=temp_password,
            first_name=pre_inscription.first_name, last_name=pre_inscription.last_name,
            post_nom=pre_inscription.post_nom or '', phone=pre_inscription.phone, sexe=pre_inscription.sexe,
            date_naissance=pre_inscription.date_naissance, adresse=pre_inscription.adresse,
            role='etudiant', status='actif',
            matricule=generate_matricule(target_auditoire.annee_academique),
        )
        user.auditoire = target_auditoire
        if hasattr(user, 'must_change_password'):
            user.must_change_password = True
        user.save()

        type_ins = 'nouvelle' if pre_inscription.niveau == 'L1' else 'transfert'
        if target_auditoire.capacite_max and effectif >= target_auditoire.capacite_max:
            # dépassement autorisé : on relève la capacité pour tracer la décision
            target_auditoire.capacite_max = effectif + 1
            target_auditoire.save()
        ins = create_inscription(user, target_auditoire, user=request.user, type_inscription=type_ins)

        pre_inscription.status = 'validee'
        pre_inscription.commission_decision = 'admis'
        pre_inscription.commission_comment = (request.data.get('comment') or '').strip()
        pre_inscription.decided_by = request.user
        pre_inscription.decided_at = timezone.now()
        pre_inscription.save()
        audit('inscription', pre_inscription, details={
            'decision': 'admis', 'etudiant_id': user.id, 'matricule': user.matricule,
            'auditoire': target_auditoire.nom, 'inscription_annuelle': ins.id, 'type': type_ins,
            'depassement_capacite': override,
        })

        try:
            from django.core.mail import send_mail
            from django.conf import settings
            send_mail(
                "Admission — vos identifiants de connexion",
                (f"Bonjour {user.first_name} {user.last_name},\n\n"
                 f"Votre admission en {target_auditoire.nom} est prononcée. Matricule : {user.matricule}.\n"
                 f"Identifiants : {user.email} / {temp_password}\n\n"
                 "Votre inscription deviendra définitive après règlement des frais d'inscription "
                 "auprès de la caisse. Changez votre mot de passe à la première connexion.\n\n"
                 "Le Secrétariat Général Académique"),
                settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=True)
        except Exception:
            pass

        return Response({
            'status': 'Candidat admis.',
            'message': (f"{user.first_name} {user.last_name} est admis(e) en « {target_auditoire.nom} » "
                        f"({auditoire_status}). Inscription annuelle créée — en attente du paiement des frais."),
            'user_id': user.id, 'email': user.email, 'matricule': user.matricule,
            'inscription_annuelle': ins.id, 'auditoire_created': created,
            'academic_year': target_auditoire.annee_academique,
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='reject')
    def reject_inscription(self, request, pk=None):
        """
        Rejects a pre-inscription request.
        """
        pre_inscription = self.get_object()
        if not has_role(request.user, 'sga', 'pdg', 'commission_admission'):
            return Response({'error': "Décision réservée à la commission d'admission."},
                            status=status.HTTP_403_FORBIDDEN)

        if pre_inscription.status != 'en_attente':
            return Response({'error': 'Cette demande a déjà été traitée.'}, status=status.HTTP_400_BAD_REQUEST)

        reason = (request.data.get('reason') or '').strip()
        if not reason:
            return Response({'error': 'Le motif du refus est obligatoire.'}, status=status.HTTP_400_BAD_REQUEST)
        from django.utils import timezone
        pre_inscription.status = 'rejetee'
        pre_inscription.commission_decision = 'refuse'
        pre_inscription.commission_comment = reason
        pre_inscription.decided_by = request.user
        pre_inscription.decided_at = timezone.now()
        pre_inscription.save()
        audit('inscription', pre_inscription, details={'decision': 'rejetee', 'motif': reason})

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
