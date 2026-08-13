"""
HR (Human Resources) models
"""
from django.db import models
from django.conf import settings


class Employee(models.Model):
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


class Contract(models.Model):
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


class Payroll(models.Model):
    """Payroll Model"""

    STATUS_CHOICES = [
        ('en_attente', 'En attente'),
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

    def save(self, *args, **kwargs):
        """Auto-calculate base_salary and net_salary from employee rate × quantity."""
        from decimal import Decimal
        emp = self.employee
        if emp.prestation_type == 'permanent' and self.jours_prestes and emp.salaire_journalier:
            self.base_salary = Decimal(str(self.jours_prestes)) * emp.salaire_journalier
        elif emp.prestation_type == 'charge_horaire' and self.heures_prestees and emp.salaire_horaire:
            self.base_salary = self.heures_prestees * emp.salaire_horaire

        self.net_salary = (self.base_salary or Decimal('0')) + (self.bonuses or Decimal('0')) - (self.deductions or Decimal('0'))
        super().save(*args, **kwargs)


class Leave(models.Model):
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
