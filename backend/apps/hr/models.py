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

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                               related_name='employee_profile', verbose_name='Utilisateur')

    # Employment details
    employee_id = models.CharField(max_length=50, unique=True, verbose_name='Matricule employé')
    position = models.CharField(max_length=50, choices=POSITION_CHOICES, verbose_name='Poste')
    department = models.CharField(max_length=100, blank=True, null=True, verbose_name='Département')

    hire_date = models.DateField(verbose_name='Date d\'embauche')
    end_date = models.DateField(blank=True, null=True, verbose_name='Date de fin')

    # Salary
    base_salary = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Salaire de base')
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

    period_start = models.DateField(verbose_name='Début de période')
    period_end = models.DateField(verbose_name='Fin de période')

    # Salary components
    base_salary = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Salaire de base')
    bonuses = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Primes')
    deductions = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Déductions')
    net_salary = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Salaire net')

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
        ordering = ['-period_end']

    def __str__(self):
        return f"{self.employee.user.get_full_name()} - {self.period_start} to {self.period_end}"

    def save(self, *args, **kwargs):
        """Override save to calculate net salary"""
        self.net_salary = self.base_salary + self.bonuses - self.deductions
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
