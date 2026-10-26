"""
HR (Human Resources) models
"""
from django.db import models

from apps.core.softdelete import SoftDeleteModel
from django.conf import settings


class Employee(SoftDeleteModel):
    """Employee Model (extends User)"""

    POSITION_CHOICES = [
        ('professeur', 'Professeur'),
        ('assistant', 'Assistant'),
        ('chef_departement', 'Chef de Département'),
        ('chef_section', 'Chef de Section'),
        ('bibliothecaire', 'Bibliothécaire'),
        ('appariteur', 'Appariteur'),
        ('comptable', 'Comptable'),
        ('secretaire', 'Secrétaire'),
        ('technicien_it', 'Technicien IT'),
        ('personnel_admin', 'Personnel Administratif'),
        ('direction', 'Direction'),
    ]

    STATUS_CHOICES = [
        ('actif', 'Actif'),
        ('conge', 'En congé'),
        ('suspendu', 'Suspendu'),
        ('demissionne', 'Démissionné'),
        ('retraite', 'Retraité'),
    ]

    PRESTATION_CHOICES = [
        ('permanent', 'Permanent'),
        ('charge_horaire', 'Par charge horaire'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                            related_name='employee_profiles', verbose_name='Utilisateur')

    MAX_PROFILES = 3  # Maximum number of employee profiles per user

    # Employment details
    employee_id = models.CharField(max_length=50, unique=True, verbose_name='Matricule employé')
    position = models.CharField(max_length=50, choices=POSITION_CHOICES, verbose_name='Poste')
    department = models.CharField(max_length=100, blank=True, null=True, verbose_name='Département')

    hire_date = models.DateField(verbose_name='Date d\'embauche')
    end_date = models.DateField(blank=True, null=True, verbose_name='Date de fin')

    # Prestation type
    prestation_type = models.CharField(max_length=20, choices=PRESTATION_CHOICES,
                                       default='permanent', verbose_name='Type de prestation')

    # Salary: permanent → salaire_journalier, charge_horaire → salaire_horaire
    salaire_journalier = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True,
                                              verbose_name='Salaire journalier (permanent)')
    salaire_horaire = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True,
                                           verbose_name='Salaire horaire (charge horaire)')
    # --- Paie (refonte v2) ---
    base_monthly_salary = models.DecimalField(
        max_digits=12, decimal_places=2, blank=True, null=True, verbose_name='Salaire mensuel de base',
        help_text="Permanents : salaire de base du mois complet (sinon salaire journalier × jours ouvrables)")
    housing_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=0,
                                            verbose_name='Indemnité de logement (non imposable)')
    transport_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=0,
                                              verbose_name='Indemnité de transport (non imposable)')
    dependents = models.PositiveSmallIntegerField(default=0, verbose_name='Personnes à charge')
    statutory_teaching_hours = models.DecimalField(
        max_digits=6, decimal_places=2, default=0, verbose_name="Charge horaire statutaire (h/mois)",
        help_text="Enseignant permanent : heures de cours dues par mois ; au-delà = heures complémentaires")
    extra_hour_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0,
                                          verbose_name='Taux heure complémentaire / vacation')
    payment_account = models.CharField(max_length=100, blank=True, default='',
                                       verbose_name='Compte bancaire / Mobile Money')
    currency = models.CharField(max_length=10, default='USD', verbose_name='Devise')

    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='actif',
                            verbose_name='Statut')

    # Additional info
    emergency_contact = models.CharField(max_length=200, blank=True, null=True,
                                        verbose_name='Contact d\'urgence')
    emergency_phone = models.CharField(max_length=20, blank=True, null=True,
                                      verbose_name='Téléphone d\'urgence')

    notes = models.TextField(blank=True, null=True, verbose_name='Notes')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Employé'
        verbose_name_plural = 'Employés'
        ordering = ['user__last_name', 'user__first_name']
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'position'],
                name='unique_user_position',
            ),
        ]

    def clean(self):
        from django.core.exceptions import ValidationError
        # Max 3 profiles per user
        if self.user_id:
            existing = Employee.objects.filter(user=self.user).exclude(pk=self.pk).count()
            if existing >= self.MAX_PROFILES:
                raise ValidationError(
                    f'Un utilisateur ne peut avoir que {self.MAX_PROFILES} profils employé maximum.'
                )
            # Same position check
            if self.position and Employee.objects.filter(user=self.user, position=self.position).exclude(pk=self.pk).exists():
                raise ValidationError(
                    f'Cet utilisateur a déjà un profil avec le poste "{self.get_position_display()}".'
                )

    def save(self, *args, **kwargs):
        # Run clean() but skip full field validation (DRF handles that)
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.get_position_display()}"


class Contract(SoftDeleteModel):
    """Employment Contract Model"""

    CONTRACT_TYPES = [
        ('CDI', 'Contrat à Durée Indéterminée'),
        ('CDD', 'Contrat à Durée Déterminée'),
        ('stage', 'Stage'),
        ('vacation', 'Vacation'),
    ]

    STATUS_CHOICES = [
        ('actif', 'Actif'),
        ('termine', 'Terminé'),
        ('annule', 'Annulé'),
        ('en_attente', 'En attente'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE,
                                related_name='contracts', verbose_name='Employé')
    contract_type = models.CharField(max_length=20, choices=CONTRACT_TYPES, verbose_name='Type de contrat')

    start_date = models.DateField(verbose_name='Date de début')
    end_date = models.DateField(blank=True, null=True, verbose_name='Date de fin')

    salary = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Salaire')
    hours_per_week = models.IntegerField(blank=True, null=True, verbose_name='Heures par semaine')

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='actif',
                            verbose_name='Statut')

    # Documents
    contract_file = models.FileField(upload_to='contracts/', blank=True, null=True,
                                    verbose_name='Fichier du contrat')

    notes = models.TextField(blank=True, null=True, verbose_name='Notes')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Contrat'
        verbose_name_plural = 'Contrats'
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.employee.user.get_full_name()} - {self.get_contract_type_display()}"


class Payroll(SoftDeleteModel):
    """Payroll Model"""

    def trash_guard(self):
        from apps.core.trash import TrashProtectedError
        if self.status == 'paye':
            raise TrashProtectedError("Une fiche de paie payée ne peut pas être supprimée ; annulez-la.")

    STATUS_CHOICES = [
        ('en_attente', 'Brouillon (calculée)'),
        ('valide', 'Validée (bon à payer)'),
        ('paye', 'Payé'),
        ('annule', 'Annulé'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE,
                                related_name='payrolls', verbose_name='Employé')

    MONTH_CHOICES = [
        (1, 'Janvier'), (2, 'Février'), (3, 'Mars'), (4, 'Avril'),
        (5, 'Mai'), (6, 'Juin'), (7, 'Juillet'), (8, 'Août'),
        (9, 'Septembre'), (10, 'Octobre'), (11, 'Novembre'), (12, 'Décembre'),
    ]

    mois = models.PositiveSmallIntegerField(
        choices=MONTH_CHOICES, verbose_name='Mois', default=1
    )
    annee = models.PositiveIntegerField(verbose_name='Année', default=2025)

    # Work quantity
    jours_prestes = models.PositiveIntegerField(
        blank=True, null=True, verbose_name='Nombre de jours prestés',
        help_text='Pour les employés permanents'
    )
    heures_prestees = models.DecimalField(
        max_digits=8, decimal_places=2, blank=True, null=True,
        verbose_name='Nombre d\'heures prestées',
        help_text='Pour les employés à charge horaire'
    )

    # Salary components (auto-calculated)
    base_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0,
                                       verbose_name='Salaire de base (calculé)')
    bonuses = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Primes')
    deductions = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Déductions')
    net_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Salaire net')

    # --- Détail du calcul (bulletin de paie) ---
    jours_ouvrables = models.PositiveSmallIntegerField(default=0)
    jours_absence_injustifiee = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    retenue_absences = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    heures_cours = models.DecimalField(max_digits=8, decimal_places=2, default=0,
                                       verbose_name='Heures de cours prestées')
    heures_complementaires = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    montant_heures_complementaires = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    heures_supplementaires = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    montant_heures_supplementaires = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    indemnites = models.DecimalField(max_digits=12, decimal_places=2, default=0,
                                     verbose_name='Indemnités non imposables')
    brut_imposable = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    inss_salarie = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    ipr = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='IPR / IRPP')
    inss_patronal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    inpp = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    onem = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cout_employeur = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    details = models.JSONField(default=dict, blank=True)
    computed_at = models.DateTimeField(null=True, blank=True)
    validated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
                                     blank=True, related_name='+')
    validated_at = models.DateTimeField(null=True, blank=True)
    paid_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
                                related_name='+')

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='en_attente',
                            verbose_name='Statut')

    # Payment details
    payment_date = models.DateField(blank=True, null=True, verbose_name='Date de paiement')
    payment_method = models.CharField(max_length=50, blank=True, null=True,
                                     verbose_name='Méthode de paiement')

    notes = models.TextField(blank=True, null=True, verbose_name='Notes')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Paie'
        verbose_name_plural = 'Paies'
        ordering = ['-annee', '-mois']
        constraints = [
            models.UniqueConstraint(
                fields=['employee', 'mois', 'annee'],
                name='unique_payroll_employee_period',
            ),
        ]

    def __str__(self):
        month_name = dict(self.MONTH_CHOICES).get(self.mois, self.mois)
        return f"{self.employee.user.get_full_name()} - {month_name} {self.annee}"

    @property
    def period_label(self):
        month_name = dict(self.MONTH_CHOICES).get(self.mois, self.mois)
        return f"{month_name} {self.annee}"

    @property
    def currency(self):
        return self.employee.currency


class Leave(SoftDeleteModel):
    """Employee leave/vacation model"""

    LEAVE_TYPES = [
        ('conge_annuel', 'Congé annuel'),
        ('conge_maladie', 'Congé maladie'),
        ('conge_maternite', 'Congé maternité'),
        ('conge_paternite', 'Congé paternité'),
        ('conge_sans_solde', 'Congé sans solde'),
        ('absence', 'Absence'),
    ]

    STATUS_CHOICES = [
        ('en_attente', 'En attente'),
        ('approuve', 'Approuvé'),
        ('rejete', 'Rejeté'),
        ('annule', 'Annulé'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE,
                                related_name='leaves', verbose_name='Employé')
    leave_type = models.CharField(max_length=50, choices=LEAVE_TYPES, verbose_name='Type de congé')

    start_date = models.DateField(verbose_name='Date de début')
    end_date = models.DateField(verbose_name='Date de fin')
    reason = models.TextField(verbose_name='Raison')

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='en_attente',
                            verbose_name='Statut')

    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                   null=True, blank=True, related_name='leaves_approved',
                                   verbose_name='Approuvé par')
    approved_at = models.DateTimeField(blank=True, null=True, verbose_name='Approuvé le')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Congé'
        verbose_name_plural = 'Congés'
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.employee.user.get_full_name()} - {self.get_leave_type_display()}"

    @property
    def duration_days(self):
        """Calculate leave duration in days"""
        return (self.end_date - self.start_date).days + 1



class PayrollSettings(models.Model):
    """
    Paramètres de paie (singleton). Valeurs par défaut indicatives pour la RDC :
    À FAIRE VALIDER par le comptable / la DGI avant la première paie réelle.
    """
    working_days_per_month = models.PositiveSmallIntegerField(default=26, verbose_name='Jours ouvrables de référence / mois')
    hours_per_day = models.DecimalField(max_digits=4, decimal_places=2, default=8)
    inss_employee_rate = models.DecimalField(max_digits=5, decimal_places=2, default=5, verbose_name='INSS salarié (%)')
    inss_employer_rate = models.DecimalField(max_digits=5, decimal_places=2, default=13, verbose_name='INSS patronal (%)')
    inpp_rate = models.DecimalField(max_digits=5, decimal_places=2, default=2, verbose_name='INPP (%)')
    onem_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.2, verbose_name='ONEM (%)')
    ipr_brackets = models.JSONField(
        default=list, blank=True,
        help_text='Barème annuel en CDF : [[plafond_tranche, taux_%], …, [null, taux_%]]')
    ipr_cap_rate = models.DecimalField(max_digits=5, decimal_places=2, default=30,
                                       verbose_name="Plafond de l'impôt (% du revenu imposable)")
    ipr_dependent_reduction = models.DecimalField(max_digits=5, decimal_places=2, default=2,
                                                  verbose_name='Réduction par personne à charge (%)')
    ipr_max_dependents = models.PositiveSmallIntegerField(default=9)
    exchange_rate_cdf_per_usd = models.DecimalField(max_digits=10, decimal_places=2, default=2800,
                                                    verbose_name='Taux de change (CDF pour 1 USD)')
    overtime_multiplier = models.DecimalField(max_digits=4, decimal_places=2, default=1.3,
                                              verbose_name="Majoration des heures supplémentaires")
    late_tolerance_minutes = models.PositiveSmallIntegerField(default=15)
    updated_at = models.DateTimeField(auto_now=True)

    DEFAULT_BRACKETS = [[524160, 3], [1428000, 15], [2700000, 30], [None, 40]]

    class Meta:
        verbose_name = 'Paramètres de paie'

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        if not obj.ipr_brackets:
            obj.ipr_brackets = cls.DEFAULT_BRACKETS
            obj.save(update_fields=['ipr_brackets'])
        return obj


class StaffAttendance(models.Model):
    """Pointage journalier du personnel (présence, retard, absence, congé, mission)."""
    STATUS_CHOICES = [
        ('present', 'Présent'),
        ('retard', 'En retard'),
        ('absent_justifie', 'Absence justifiée'),
        ('absent_injustifie', 'Absence non justifiée'),
        ('conge', 'Congé'),
        ('mission', 'Mission'),
        ('ferie', 'Jour férié'),
    ]
    PAID_STATUSES = ('present', 'retard', 'absent_justifie', 'conge', 'mission', 'ferie')

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendances')
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='present')
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    hours_worked = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    overtime_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    note = models.CharField(max_length=255, blank=True, default='')
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='+')
    self_declared = models.BooleanField(default=False, help_text="Pointé par l'employé lui-même")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['employee', 'date']
        ordering = ['-date', 'employee__user__last_name']
        verbose_name = 'Pointage du personnel'
        verbose_name_plural = 'Pointages du personnel'

    def __str__(self):
        return f"{self.employee} — {self.date} ({self.get_status_display()})"

    def save(self, *args, **kwargs):
        from datetime import datetime
        from decimal import Decimal
        if self.check_in and self.check_out:
            start = datetime.combine(self.date, self.check_in)
            end = datetime.combine(self.date, self.check_out)
            hours = max((end - start).total_seconds() / 3600, 0)
            self.hours_worked = Decimal(str(round(hours, 2)))
            settings_obj = PayrollSettings.load()
            # Heures supplémentaires : au-delà de la journée normale, par tranches entières
            # de 30 minutes (quelques minutes de dépassement ne constituent pas des heures sup).
            excess = self.hours_worked - Decimal(settings_obj.hours_per_day)
            self.overtime_hours = (excess * 2).to_integral_value(rounding='ROUND_FLOOR') / 2 if excess >= Decimal('0.5') \
                else Decimal(0)
        super().save(*args, **kwargs)
