"""
Scolarité — colonne vertébrale du modèle universitaire (cahier des charges v2).

  * UniteEnseignement (UE) : catalogue stable ; un cours (EC) appartient à une UE.
  * InscriptionAnnuelle   : un étudiant × une année académique × un groupe (auditoire).
                            Tout s'y rattache : frais, cours suivis, délibération.
  * InscriptionUE         : inscription pédagogique (UE de l'année + dettes de crédits).
  * AffectationRole       : rôles supplémentaires datés et limités à un périmètre.
  * Deliberation / ResultatDeliberation : jury, calcul LMD, décisions, PV.
  * DocumentOfficiel      : relevés, attestations, diplômes numérotés et vérifiables.
"""
import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.core.softdelete import SoftDeleteModel

NIVEAU_CHOICES = [('L1', 'Licence 1'), ('L2', 'Licence 2'), ('L3', 'Licence 3'),
                  ('M1', 'Master 1'), ('M2', 'Master 2')]
NIVEAU_SUIVANT = {'L1': 'L2', 'L2': 'L3', 'L3': 'M1', 'M1': 'M2', 'M2': None}
NIVEAUX_TERMINAUX = {'L3', 'M2'}  # fin de cycle : diplôme


class UniteEnseignement(SoftDeleteModel):
    """Unité d'enseignement (UE) du programme : regroupe des éléments constitutifs (cours)."""
    code = models.CharField(max_length=30, unique=True)
    intitule = models.CharField(max_length=200)
    filiere = models.ForeignKey('auditoires.Filiere', on_delete=models.PROTECT, related_name='ues')
    niveau = models.CharField(max_length=2, choices=NIVEAU_CHOICES)
    semestre = models.PositiveSmallIntegerField(choices=[(1, 'Semestre 1'), (2, 'Semestre 2')], default=1)
    TYPE_CHOICES = [('fondamentale', 'Fondamentale'), ('complementaire', 'Complémentaire / optionnelle'),
                    ('transversale', 'Transversale')]
    type_ue = models.CharField(max_length=15, choices=TYPE_CHOICES, default='fondamentale', verbose_name="Type d'UE")
    description = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['filiere', 'niveau', 'semestre', 'code']
        verbose_name = "Unité d'enseignement"
        verbose_name_plural = "Unités d'enseignement"

    def __str__(self):
        return f"{self.code} — {self.intitule}"

    def current_courses(self):
        """
        Cours (EC) de l'UE pour l'année en cours. Une UE appartient au programme et sert d'une
        année à l'autre ; ses cours sont recréés pour chaque groupe annuel : on ne compte donc
        que ceux de l'année courante (à défaut, ceux de la dernière année où l'UE a été donnée).
        """
        from apps.schedules.models import AcademicYear
        qs = self.cours.filter(is_active=True).select_related('auditoire__academic_year')
        current = AcademicYear.objects.filter(is_current=True).first()
        if current is not None:
            cur = qs.filter(auditoire__academic_year=current)
            if cur.exists():
                return cur
        last = qs.exclude(auditoire__academic_year__isnull=True).order_by('-auditoire__academic_year__start_date').first()
        if last is not None:
            return qs.filter(auditoire__academic_year=last.auditoire.academic_year)
        return qs

    @property
    def credits(self):
        return sum(c.credits or 0 for c in self.current_courses())


class InscriptionAnnuelle(SoftDeleteModel):
    STATUT_CHOICES = [
        ('en_attente', 'En attente de validation administrative'),
        ('administrative', 'Inscription administrative validée'),
        ('pedagogique', 'Inscription pédagogique validée'),
        ('suspendue', 'Suspendue'),
        ('abandon', 'Abandon'),
        ('diplome', 'Diplômé'),
    ]
    TYPE_CHOICES = [
        ('nouvelle', 'Première inscription'),
        ('reinscription', 'Réinscription (passage)'),
        ('redoublement', 'Redoublement'),
        ('transfert', 'Transfert / équivalence'),
    ]
    ACTIVE_STATUTS = ('en_attente', 'administrative', 'pedagogique')

    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='inscriptions',
                                limit_choices_to={'role': 'etudiant'})
    academic_year = models.ForeignKey('schedules.AcademicYear', on_delete=models.PROTECT,
                                      related_name='inscriptions')
    auditoire = models.ForeignKey('auditoires.Auditoire', on_delete=models.PROTECT, related_name='inscriptions')
    niveau = models.CharField(max_length=2, choices=NIVEAU_CHOICES)
    type_inscription = models.CharField(max_length=15, choices=TYPE_CHOICES, default='nouvelle')
    statut = models.CharField(max_length=15, choices=STATUT_CHOICES, default='en_attente')
    decision_precedente = models.CharField(max_length=40, blank=True, default='')
    notes = models.TextField(blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name='+')
    admin_validated_at = models.DateTimeField(null=True, blank=True)
    admin_validated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
                                           blank=True, related_name='+')
    peda_validated_at = models.DateTimeField(null=True, blank=True)
    peda_validated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
                                          blank=True, related_name='+')

    class Meta:
        ordering = ['-academic_year__start_date', 'student__last_name']
        unique_together = ['student', 'academic_year']
        verbose_name = 'Inscription annuelle'
        verbose_name_plural = 'Inscriptions annuelles'

    def __str__(self):
        return f"{self.student} — {self.academic_year} — {self.auditoire.nom}"

    @property
    def is_active(self):
        return self.statut in self.ACTIVE_STATUTS

    def save(self, *args, **kwargs):
        if not self.niveau and self.auditoire_id:
            self.niveau = self.auditoire.niveau
        super().save(*args, **kwargs)
        # Compatibilité : le reste de l'application lit encore user.auditoire.
        # On le tient à jour à partir de l'inscription active de l'année courante.
        if self.is_active and self.academic_year.is_current and self.student.auditoire_id != self.auditoire_id:
            self.student.auditoire = self.auditoire
            self.student.save()


class InscriptionUE(models.Model):
    """Inscription pédagogique : UE suivie pendant l'année (y compris dette de crédits)."""
    inscription = models.ForeignKey(InscriptionAnnuelle, on_delete=models.CASCADE, related_name='ues')
    ue = models.ForeignKey(UniteEnseignement, on_delete=models.PROTECT, related_name='inscrits')
    is_dette = models.BooleanField(default=False, help_text="UE non validée d'une année précédente")

    class Meta:
        unique_together = ['inscription', 'ue']
        verbose_name = 'Inscription pédagogique (UE)'
        verbose_name_plural = 'Inscriptions pédagogiques (UE)'

    def __str__(self):
        return f"{self.inscription.student} — {self.ue.code}{' (dette)' if self.is_dette else ''}"


class AffectationRole(SoftDeleteModel):
    """
    Rôle supplémentaire, daté et limité à un périmètre (ex. un enseignant nommé chef de
    filière pour deux ans, un membre de la commission d'admission pour une campagne).
    """
    ROLE_CHOICES = [
        ('chef_section', 'Chef de section'),
        ('chef_departement', 'Chef de filière / département'),
        ('commission_admission', "Membre de la commission d'admission"),
        ('comptable', 'Comptable'),
        ('apparitorat', 'Apparitorat'),
        ('caisse', 'Caissier'),
        ('jury', 'Membre de jury'),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='affectations')
    role = models.CharField(max_length=30, choices=ROLE_CHOICES)
    section = models.ForeignKey('auditoires.Section', on_delete=models.CASCADE, null=True, blank=True)
    filiere = models.ForeignKey('auditoires.Filiere', on_delete=models.CASCADE, null=True, blank=True)
    start_date = models.DateField(default=timezone.localdate)
    end_date = models.DateField(null=True, blank=True)
    motif = models.CharField(max_length=255, blank=True, default='')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name='+')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-start_date']
        verbose_name = 'Affectation de rôle'
        verbose_name_plural = 'Affectations de rôles'

    def __str__(self):
        scope = self.filiere or self.section or 'établissement'
        return f"{self.user} — {self.get_role_display()} ({scope})"

    @property
    def is_current(self):
        today = timezone.localdate()
        return self.start_date <= today and (self.end_date is None or self.end_date >= today)


class Deliberation(models.Model):
    STATUT_CHOICES = [
        ('preparation', 'En préparation'),
        ('ouverte', 'Ouverte (notes verrouillées)'),
        ('cloturee', 'Clôturée (PV signé)'),
        ('publiee', 'Résultats publiés'),
    ]
    SESSION_CHOICES = [(1, '1re session'), (2, '2e session (rattrapage)')]

    auditoire = models.ForeignKey('auditoires.Auditoire', on_delete=models.PROTECT, related_name='deliberations')
    academic_year = models.ForeignKey('schedules.AcademicYear', on_delete=models.PROTECT, null=True, blank=True,
                                      related_name='deliberations')
    session = models.PositiveSmallIntegerField(choices=SESSION_CHOICES, default=1)
    statut = models.CharField(max_length=12, choices=STATUT_CHOICES, default='preparation')

    president = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='+')
    secretaire = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='+')
    membres = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name='jurys')

    opened_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    publication_date = models.DateTimeField(null=True, blank=True,
                                            help_text="Date à partir de laquelle les étudiants voient leur résultat")
    pv_file = models.FileField(upload_to='deliberations/pv/', null=True, blank=True)
    pv_sha256 = models.CharField(max_length=64, blank=True, default='')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name='+')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['auditoire', 'session']
        verbose_name = 'Délibération'
        verbose_name_plural = 'Délibérations'

    def __str__(self):
        return f"Délibération {self.auditoire.nom} — {self.get_session_display()}"

    @property
    def is_published(self):
        return self.statut == 'publiee' and (self.publication_date is None or self.publication_date <= timezone.now())

    def jury_ids(self):
        return {self.president_id, self.secretaire_id} | set(self.membres.values_list('id', flat=True))


class ResultatDeliberation(models.Model):
    DECISION_CHOICES = [
        ('admis', 'Admis'),
        ('admis_dette', 'Admis avec dette de crédits'),
        ('ajourne', 'Ajourné (2e session)'),
        ('redouble', 'Redouble'),
        ('defaillant', 'Défaillant (notes manquantes)'),
        ('exclu', 'Exclu'),
    ]
    MENTION_CHOICES = [
        ('', '—'),
        ('satisfaction', 'Satisfaction'),
        ('distinction', 'Distinction'),
        ('grande_distinction', 'Grande distinction'),
        ('plus_grande_distinction', 'La plus grande distinction'),
    ]

    deliberation = models.ForeignKey(Deliberation, on_delete=models.CASCADE, related_name='resultats')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='resultats')
    inscription = models.ForeignKey(InscriptionAnnuelle, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='resultats')
    moyenne = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text='Sur 20')
    credits_obtenus = models.PositiveIntegerField(default=0)
    credits_total = models.PositiveIntegerField(default=0)
    decision = models.CharField(max_length=15, choices=DECISION_CHOICES)
    decision_calculee = models.CharField(max_length=15, choices=DECISION_CHOICES, blank=True, default='')
    mention = models.CharField(max_length=30, choices=MENTION_CHOICES, blank=True, default='')
    details = models.JSONField(default=dict, blank=True)
    decision_modifiee = models.BooleanField(default=False)
    justification = models.TextField(blank=True, default='')
    rang = models.PositiveIntegerField(null=True, blank=True)
    computed_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['rang', 'student__last_name']
        unique_together = ['deliberation', 'student']
        verbose_name = 'Résultat de délibération'
        verbose_name_plural = 'Résultats de délibération'

    def __str__(self):
        return f"{self.student} — {self.get_decision_display()} ({self.moyenne}/20)"


class DocumentOfficiel(models.Model):
    TYPE_CHOICES = [
        ('releve', 'Relevé de notes'),
        ('attestation_reussite', 'Attestation de réussite'),
        ('attestation_inscription', "Attestation d'inscription"),
        ('diplome', 'Diplôme'),
    ]
    type_document = models.CharField(max_length=30, choices=TYPE_CHOICES)
    numero = models.CharField(max_length=40, unique=True, editable=False)
    verification_code = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='documents')
    academic_year = models.ForeignKey('schedules.AcademicYear', on_delete=models.PROTECT, null=True, blank=True)
    resultat = models.ForeignKey(ResultatDeliberation, on_delete=models.PROTECT, null=True, blank=True)
    inscription = models.ForeignKey(InscriptionAnnuelle, on_delete=models.PROTECT, null=True, blank=True)
    snapshot = models.JSONField(default=dict, help_text="Données figées au moment de l'émission")
    pdf_file = models.FileField(upload_to='documents/officiels/', null=True, blank=True)
    issued_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='+')
    issued_at = models.DateTimeField(auto_now_add=True)
    revoked = models.BooleanField(default=False)
    revoked_reason = models.CharField(max_length=255, blank=True, default='')

    class Meta:
        ordering = ['-issued_at']
        verbose_name = 'Document officiel'
        verbose_name_plural = 'Documents officiels'

    def __str__(self):
        return f"{self.get_type_document_display()} {self.numero} — {self.student}"

    def save(self, *args, **kwargs):
        if not self.numero:
            prefix = {'releve': 'RN', 'attestation_reussite': 'AR', 'attestation_inscription': 'AI',
                      'diplome': 'DIP'}[self.type_document]
            year = timezone.localdate().year
            last = DocumentOfficiel.objects.filter(numero__startswith=f"{prefix}-{year}-").order_by('-numero') \
                .values_list('numero', flat=True).first()
            seq = int(last.rsplit('-', 1)[-1]) + 1 if last else 1
            self.numero = f"{prefix}-{year}-{seq:06d}"
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise RuntimeError("Un document officiel ne se supprime pas : il se révoque.")


class Memoire(models.Model):
    """
    Travail de fin de cycle (TFC en L3, mémoire en M2) : sujet → validation par le chef de
    filière → dépôt → programmation de la soutenance (jury, date, salle) → note du jury.
    La note est reportée dans le cours « mémoire / TFC » du groupe s'il est indiqué.
    """
    TYPE_CHOICES = [('tfc', 'Travail de fin de cycle (TFC)'), ('memoire', 'Mémoire'), ('these', 'Thèse')]
    STATUT_CHOICES = [
        ('propose', 'Sujet proposé'),
        ('valide', 'Sujet validé'),
        ('refuse', 'Sujet refusé'),
        ('depose', 'Déposé'),
        ('programme', 'Soutenance programmée'),
        ('soutenu', 'Soutenu'),
    ]
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='memoires')
    inscription = models.ForeignKey(InscriptionAnnuelle, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='memoires')
    type_travail = models.CharField(max_length=10, choices=TYPE_CHOICES, default='tfc')
    titre = models.CharField(max_length=300)
    resume = models.TextField(blank=True, default='')
    directeur = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='memoires_diriges')
    encadreur = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
                                  related_name='memoires_encadres')
    course = models.ForeignKey('courses.Course', on_delete=models.SET_NULL, null=True, blank=True,
                               related_name='memoires', help_text='Cours « TFC / mémoire » où reporter la note')
    statut = models.CharField(max_length=10, choices=STATUT_CHOICES, default='propose')
    motif_refus = models.TextField(blank=True, default='')
    fichier = models.FileField(upload_to='documents/memoires/', null=True, blank=True)
    depose_le = models.DateTimeField(null=True, blank=True)
    date_soutenance = models.DateTimeField(null=True, blank=True)
    salle = models.CharField(max_length=100, blank=True, default='')
    president_jury = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
                                       related_name='+')
    membres_jury = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name='jurys_memoires')
    note = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text='Sur 20')
    observations = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Mémoire / TFC'
        verbose_name_plural = 'Mémoires / TFC'

    def __str__(self):
        return f"{self.get_type_travail_display()} — {self.student} — {self.titre[:60]}"

    @property
    def mention(self):
        from .services.deliberation import mention_for
        return mention_for(self.note) if self.note is not None and self.note >= 10 else ''
