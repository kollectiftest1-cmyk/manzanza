"""
Serializers for the inscriptions app.
"""
from rest_framework import serializers
from .models import PreInscription
from apps.auditoires.models import normalize_academic_year_label
from apps.auditoires.utils import get_public_academic_year_options

class PreInscriptionSerializer(serializers.ModelSerializer):
    """
    Serializer for the PreInscription model, handling file uploads.
    """
    filiere_name = serializers.CharField(source='filiere.nom', read_only=True)

    class Meta:
        model = PreInscription
        fields = [
            'id', 'first_name', 'last_name', 'post_nom', 'email', 'phone', 'sexe',
            'date_naissance', 'lieu_naissance', 'pays_naissance', 'nationalite', 'adresse',
            
            'nom_complet_pere', 'contact_pere', 'nom_complet_mere', 'contact_mere',
            'nom_tuteur', 'postnom_tuteur', 'prenom_tuteur', 'telephone_tuteur',
            'whatsapp_tuteur', 'email_tuteur', 'adresse_tuteur',
            
            'filiere', 'filiere_name', 'niveau', 'vacation', 'academic_year', 'points_diplome_etat',
            
            'carte_identite', 'certificat_naissance', 'certificat_etude_primaire',
            'bulletin_5', 'bulletin_6', 'diplome_etat',
            'etablissement_origine', 'releve_notes_precedent',

            'dossier_status', 'dossier_comment', 'dossier_verified_at',
            'frais_dossier_paye', 'frais_dossier_reference',
            'commission_decision', 'commission_comment', 'decided_at',
            'status', 'created_at'
        ]
        read_only_fields = ['status', 'created_at', 'filiere_name', 'dossier_status', 'dossier_comment',
                            'dossier_verified_at', 'frais_dossier_paye', 'frais_dossier_reference',
                            'commission_decision', 'commission_comment', 'decided_at']
        extra_kwargs = {
            # Set fields from the frontend that are not required in the backend
            'post_nom': {'required': False, 'allow_blank': True},
            'lieu_naissance': {'required': False, 'allow_blank': True},
            'pays_naissance': {'required': False, 'allow_blank': True},
            'nom_complet_pere': {'required': False, 'allow_blank': True},
            'contact_pere': {'required': False, 'allow_blank': True},
            'nom_complet_mere': {'required': False, 'allow_blank': True},
            'contact_mere': {'required': False, 'allow_blank': True},
            'nom_tuteur': {'required': False, 'allow_blank': True},
            'postnom_tuteur': {'required': False, 'allow_blank': True},
            'prenom_tuteur': {'required': False, 'allow_blank': True},
            'telephone_tuteur': {'required': False, 'allow_blank': True},
            'whatsapp_tuteur': {'required': False, 'allow_blank': True},
            'email_tuteur': {'required': False, 'allow_blank': True},
            'adresse_tuteur': {'required': False, 'allow_blank': True},
            'vacation': {'required': True, 'allow_blank': False},
            'academic_year': {'required': True, 'allow_blank': False},
            'points_diplome_etat': {'required': False, 'allow_null': True},
            'carte_identite': {'required': True},
            'certificat_etude_primaire': {'required': True},
            'etablissement_origine': {'required': False, 'allow_blank': True},
            'releve_notes_precedent': {'required': False, 'allow_null': True},
        }


    def validate_email(self, value):
        """
        Check that the email is not already in use by an existing user or a pending pre-inscription.
        """
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Un compte utilisateur existe déjà avec cette adresse e-mail.")
        
        # Check for pending applications with the same email
        if PreInscription.objects.filter(email=value, status='en_attente').exists():
            # If we are updating an instance, we should allow the email to be the same.
            if self.instance and self.instance.email == value:
                pass
            else:
                raise serializers.ValidationError("Une demande d'inscription avec cette adresse e-mail est déjà en cours.")
        return value

    ALLOWED_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png'}
    MAX_FILE_SIZE = 5 * 1024 * 1024
    FILE_FIELDS = ['carte_identite', 'certificat_naissance', 'certificat_etude_primaire',
                   'bulletin_5', 'bulletin_6', 'diplome_etat']
    UPLOAD_FIELDS = FILE_FIELDS + ['releve_notes_precedent']

    def validate(self, data):
        import os
        errors = {}
        for name in self.UPLOAD_FIELDS:
            upload = data.get(name)
            if not upload or not hasattr(upload, 'size'):
                continue
            ext = os.path.splitext(upload.name or '')[1].lower()
            if ext not in self.ALLOWED_EXTENSIONS:
                errors[name] = "Format refusé : seuls PDF, JPG et PNG sont acceptés."
            elif upload.size > self.MAX_FILE_SIZE:
                errors[name] = "Fichier trop volumineux (5 Mo maximum)."
            else:
                head = upload.read(8)
                upload.seek(0)
                is_pdf = head.startswith(b'%PDF')
                is_png = head.startswith(b'\x89PNG')
                is_jpg = head[:3] == b'\xff\xd8\xff'
                if not (is_pdf or is_png or is_jpg):
                    errors[name] = "Le contenu du fichier ne correspond pas à un PDF, JPG ou PNG."
        niveau = data.get('niveau', getattr(self.instance, 'niveau', 'L1'))
        if niveau and niveau != 'L1':
            # Entrée en cours de cursus = transfert : établissement d'origine et relevé exigés.
            if not (data.get('etablissement_origine') or '').strip():
                errors['etablissement_origine'] = "Obligatoire pour une admission au-delà de L1 (transfert)."
            if not data.get('releve_notes_precedent') and not getattr(self.instance, 'releve_notes_precedent', None):
                errors['releve_notes_precedent'] = "Le relevé de notes de l'établissement d'origine est exigé."
        email, year = data.get('email'), data.get('academic_year')
        if email and year and PreInscription.objects.filter(email=email, academic_year=year).exclude(
            pk=getattr(self.instance, 'pk', None)
        ).exclude(status='rejetee').exists():
            errors['email'] = "Une candidature existe déjà avec cet e-mail pour cette année académique."
        if errors:
            raise serializers.ValidationError(errors)
        return data

    def validate_academic_year(self, value):
        value = normalize_academic_year_label(value)
        parts = value.split('-')
        if len(parts) != 2 or not all(part.isdigit() for part in parts):
            raise serializers.ValidationError("Format attendu: AAAA-AAAA.")

        start, end = [int(part) for part in parts]
        if end != start + 1:
            raise serializers.ValidationError("L'année académique doit couvrir deux années consécutives.")

        allowed = {option['value'] for option in get_public_academic_year_options()}
        if value not in allowed:
            raise serializers.ValidationError("Choisissez l'année académique en cours ou la prochaine année.")

        return value

    def _validate_and_normalize_phone(self, value, required=True):
        """
        Helper method to validate and normalize phone numbers.
        """
        from apps.core.validators import validate_international_phone, normalize_phone_number

        if not value:
            if required:
                raise serializers.ValidationError("Le numéro de téléphone est requis.")
            return value

        # Normalize the phone number
        normalized = normalize_phone_number(value)

        # Validate the normalized number
        try:
            validate_international_phone(normalized)
        except Exception as e:
            raise serializers.ValidationError(str(e))

        return normalized

    def validate_phone(self, value):
        """Validate main phone number (required)"""
        return self._validate_and_normalize_phone(value, required=True)

    def validate_contact_pere(self, value):
        """Validate father's contact (optional)"""
        return self._validate_and_normalize_phone(value, required=False)

    def validate_contact_mere(self, value):
        """Validate mother's contact (optional)"""
        return self._validate_and_normalize_phone(value, required=False)

    def validate_telephone_tuteur(self, value):
        """Validate tutor's phone (optional)"""
        return self._validate_and_normalize_phone(value, required=False)

    def validate_whatsapp_tuteur(self, value):
        """Validate tutor's WhatsApp (optional)"""
        return self._validate_and_normalize_phone(value, required=False)
