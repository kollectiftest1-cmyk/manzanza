"""
Models for the inscriptions (pre-registration) process.
"""
from django.db import models

from apps.core.softdelete import SoftDeleteModel
from apps.auditoires.models import Filiere

def inscription_upload_path(instance, filename):
    """
    Generates a unique path for uploaded inscription files.
    e.g., inscriptions/123_lastname_firstname/diplome.pdf
    """
    # The instance.id is not available on the first save, so we need a placeholder
    # A better approach might involve saving the file after the object is created.
    # For now, let's use a temporary unique identifier if id is not present.
    import uuid
    from django.utils.text import get_valid_filename, slugify
    instance_id = instance.id or uuid.uuid4().hex
    folder = slugify(instance.last_name or '') or 'candidat'
    # Nom de fichier assaini + préfixe aléatoire : chemins non devinables.
    return f'inscriptions/{instance_id}_{folder}/{uuid.uuid4().hex[:8]}_{get_valid_filename(filename)}'

class PreInscription(SoftDeleteModel):
    """
    Represents a pre-registration request from a potential student.
    """
    STATUS_CHOICES = [('en_attente', 'En attente'), ('validee', 'Validée'), ('rejetee', 'Rejetée')]
    NIVEAU_CHOICES = [('L1', 'Licence 1'), ('L2', 'Licence 2'), ('L3', 'Licence 3'), ('M1', 'Master 1'), ('M2', 'Master 2')]
    SEXE_CHOICES = [('M', 'Masculin'), ('F', 'Féminin')]
    VACATION_CHOICES = [('jour', 'Jour'), ('soir', 'Soir')]

    # --- Personal Information ---
    first_name = models.CharField(max_length=150, verbose_name="Prénom")
    last_name = models.CharField(max_length=150, verbose_name="Nom")
    post_nom = models.CharField(max_length=150, verbose_name="Post-nom", null=True, blank=True)
    # Unicité par année académique : un candidat refusé peut recandidater l'année suivante.
    email = models.EmailField(verbose_name="Adresse e-mail")
    phone = models.CharField(max_length=30, verbose_name="Téléphone") # Increased length for international format
    sexe = models.CharField(max_length=1, choices=SEXE_CHOICES, verbose_name="Sexe")
    date_naissance = models.DateField(verbose_name="Date de naissance")
    lieu_naissance = models.CharField(max_length=150, verbose_name="Lieu de naissance", null=True, blank=True)
    pays_naissance = models.CharField(max_length=100, verbose_name="Pays de naissance", null=True, blank=True)
    nationalite = models.CharField(max_length=100, verbose_name="Nationalité")
    adresse = models.TextField(verbose_name="Adresse complète")

    # --- Parents Information ---
    nom_complet_pere = models.CharField(max_length=255, verbose_name="Nom complet du père", null=True, blank=True)
    contact_pere = models.CharField(max_length=100, verbose_name="Contact du père", null=True, blank=True)
    nom_complet_mere = models.CharField(max_length=255, verbose_name="Nom complet de la mère", null=True, blank=True)
    contact_mere = models.CharField(max_length=100, verbose_name="Contact de la mère", null=True, blank=True)

    # --- Tutor Information ---
    nom_tuteur = models.CharField(max_length=150, verbose_name="Nom du tuteur", null=True, blank=True)
    postnom_tuteur = models.CharField(max_length=150, verbose_name="Post-nom du tuteur", null=True, blank=True)
    prenom_tuteur = models.CharField(max_length=150, verbose_name="Prénom du tuteur", null=True, blank=True)
    telephone_tuteur = models.CharField(max_length=30, verbose_name="Téléphone du tuteur", null=True, blank=True)
    whatsapp_tuteur = models.CharField(max_length=30, verbose_name="WhatsApp du tuteur", null=True, blank=True)
    email_tuteur = models.EmailField(verbose_name="Email du tuteur", null=True, blank=True)
    adresse_tuteur = models.TextField(verbose_name="Adresse du tuteur", null=True, blank=True)

    # --- Academic Choice ---
    filiere = models.ForeignKey(Filiere, on_delete=models.SET_NULL, null=True, verbose_name="Filière souhaitée")
    niveau = models.CharField(max_length=10, choices=NIVEAU_CHOICES, default='L1', verbose_name="Niveau d'étude")
    vacation = models.CharField(max_length=10, choices=VACATION_CHOICES, verbose_name="Vacation", default='jour')
    academic_year = models.CharField(max_length=20, blank=True, default='', verbose_name="Année académique choisie")
    points_diplome_etat = models.PositiveIntegerField(verbose_name="Points au diplôme d'état (%)", null=True, blank=True)

    # --- Attachments ---
    carte_identite = models.FileField(upload_to=inscription_upload_path, verbose_name="Carte d'identité", null=True, blank=False)
    certificat_naissance = models.FileField(upload_to=inscription_upload_path, verbose_name="Certificat de naissance", null=True, blank=False)
    certificat_etude_primaire = models.FileField(upload_to=inscription_upload_path, verbose_name="Certificat d'étude primaire", null=True, blank=False)
    bulletin_5 = models.FileField(upload_to=inscription_upload_path, verbose_name="Bulletin 5ème Humanités")
    bulletin_6 = models.FileField(upload_to=inscription_upload_path, verbose_name="Bulletin 6ème Humanités")
    diplome_etat = models.FileField(upload_to=inscription_upload_path, verbose_name="Diplôme d'État ou équivalent")

    # --- Transfert / équivalence (obligatoire pour une entrée au-delà de L1) ---
    etablissement_origine = models.CharField(max_length=200, blank=True, default='',
                                             verbose_name="Établissement d'origine")
    releve_notes_precedent = models.FileField(upload_to=inscription_upload_path, null=True, blank=True,
                                              verbose_name="Relevé de notes de l'établissement d'origine")

    # --- Contrôle du dossier (apparitorat) ---
    DOSSIER_CHOICES = [('a_verifier', 'À vérifier'), ('conforme', 'Conforme'), ('a_completer', 'À compléter')]
    dossier_status = models.CharField(max_length=12, choices=DOSSIER_CHOICES, default='a_verifier',
                                      verbose_name='Contrôle des pièces')
    dossier_comment = models.TextField(blank=True, default='')
    dossier_verified_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True,
                                            related_name='+')
    dossier_verified_at = models.DateTimeField(null=True, blank=True)

    # --- Frais de dossier ---
    frais_dossier_paye = models.BooleanField(default=False, verbose_name='Frais de dossier payés')
    frais_dossier_reference = models.CharField(max_length=100, blank=True, default='')
    frais_dossier_enregistre_par = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True,
                                                     blank=True, related_name='+')

    # --- Décision de la commission d'admission ---
    DECISION_CHOICES = [('en_attente', 'En attente'), ('admis', 'Admis'), ('liste_attente', "Liste d'attente"),
                        ('refuse', 'Refusé')]
    commission_decision = models.CharField(max_length=15, choices=DECISION_CHOICES, default='en_attente')
    commission_comment = models.TextField(blank=True, default='')
    decided_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name='+')
    decided_at = models.DateTimeField(null=True, blank=True)

    # --- Status ---
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='en_attente', verbose_name="Statut")

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Pré-inscription"
        verbose_name_plural = "Pré-inscriptions"
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(fields=['email', 'academic_year'], name='uniq_preinscription_email_annee'),
        ]

    def __str__(self):
        return f"{self.first_name} {self.post_nom or ''} {self.last_name} - {self.email}"

    def save(self, *args, **kwargs):
        # If the object is new, it won't have an id yet.
        # The file path depends on the id, so we need to save the model first,
        # then save the files if they exist.
        is_new = not self.pk
        # File handling (unchanged)
        if is_new:
            _files = {}
            for field in self._meta.get_fields():
                if isinstance(field, models.FileField):
                    if getattr(self, field.name):
                        _files[field.name] = getattr(self, field.name)
                        setattr(self, field.name, None)
            super().save(*args, **kwargs)
            for field_name, file_obj in _files.items():
                setattr(self, field_name, file_obj)
            super().save(update_fields=_files.keys())
        else:
            super().save(*args, **kwargs)
        # La création du compte étudiant se fait UNIQUEMENT via l'action « validate » de l'API
        # (affectation d'auditoire, matricule, journal d'audit).
