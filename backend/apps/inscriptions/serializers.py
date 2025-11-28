"""
Serializers for the inscriptions app.
"""
from rest_framework import serializers
from .models import PreInscription

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
            
            'filiere', 'filiere_name', 'niveau', 'vacation', 'points_diplome_etat',
            
            'carte_identite', 'certificat_naissance', 'certificat_etude_primaire',
            'bulletin_5', 'bulletin_6', 'diplome_etat',
            
            'status', 'created_at'
        ]
        read_only_fields = ['status', 'created_at', 'filiere_name']
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
            'points_diplome_etat': {'required': False, 'allow_null': True},
            'carte_identite': {'required': True},
            'certificat_etude_primaire': {'required': True},
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

    def validate_phone(self, value):
        """
        Custom validation for the phone number to remove length constraint if using react-phone-number-input
        """
        # The frontend now handles formatting, so we might not need strict validation here.
        # However, we can check for a reasonable length.
        if len(value) < 9:
            raise serializers.ValidationError("Le numéro de téléphone semble trop court.")
        return value
