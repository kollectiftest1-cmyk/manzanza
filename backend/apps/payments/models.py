"""
Payment models
"""
from django.db import models
from django.conf import settings
from django.utils import timezone


class FeeType(models.Model):
    """Fee types (tuition, library, lab, etc.)"""

    FEE_CATEGORIES = [
        ('scolarite', 'Frais de scolarité'),
        ('laboratoire', 'Frais de laboratoire'),
        ('bibliotheque', 'Frais de bibliothèque'),
        ('inscription', 'Frais d\'inscription'),
        ('examen', 'Frais d\'examen'),
        ('autre', 'Autre'),
    ]

    name = models.CharField(max_length=200, verbose_name='Nom')
    category = models.CharField(max_length=50, choices=FEE_CATEGORIES, verbose_name='Catégorie')
    description = models.TextField(blank=True, null=True, verbose_name='Description')
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Montant')

    # Settings
    is_mandatory = models.BooleanField(default=True, verbose_name='Obligatoire')
    is_active = models.BooleanField(default=True, verbose_name='Actif')
    academic_year = models.CharField(max_length=20, default='2024-2025', verbose_name='Année académique')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Type de frais'
        verbose_name_plural = 'Types de frais'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} - {self.amount} FCFA"


class StudentFee(models.Model):
    """Fees assigned to students"""

    STATUS_CHOICES = [
        ('impaye', 'Impayé'),
        ('partiel', 'Paiement partiel'),
        ('paye', 'Payé'),
        ('annule', 'Annulé'),
    ]

    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                               related_name='fees', verbose_name='Étudiant')
    fee_type = models.ForeignKey(FeeType, on_delete=models.CASCADE,
                                related_name='student_fees', verbose_name='Type de frais')

    total_amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Montant total')
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0,
                                     verbose_name='Montant payé')
    due_date = models.DateField(verbose_name='Date d\'échéance')

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='impaye',
                            verbose_name='Statut')
    notes = models.TextField(blank=True, null=True, verbose_name='Notes')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Frais étudiant'
        verbose_name_plural = 'Frais étudiants'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.fee_type.name}"

    @property
    def amount_remaining(self):
        """Calculate remaining amount"""
        return self.total_amount - self.amount_paid

    @property
    def payment_percentage(self):
        """Calculate payment percentage"""
        if self.total_amount == 0:
            return 0
        return round((self.amount_paid / self.total_amount) * 100, 2)

    def update_status(self):
        """Update payment status based on amount paid"""
        if self.amount_paid == 0:
            self.status = 'impaye'
        elif self.amount_paid < self.total_amount:
            self.status = 'partiel'
        else:
            self.status = 'paye'
        self.save()


class Payment(models.Model):
    """Payment transactions"""

    PAYMENT_METHODS = [
        ('especes', 'Espèces'),
        ('virement', 'Virement bancaire'),
        ('cheque', 'Chèque'),
        ('mobile', 'Paiement mobile'),
        ('carte', 'Carte bancaire'),
    ]

    STATUS_CHOICES = [
        ('en_attente', 'En attente'),
        ('confirme', 'Confirmé'),
        ('rejete', 'Rejeté'),
        ('annule', 'Annulé'),
    ]

    student_fee = models.ForeignKey(StudentFee, on_delete=models.CASCADE,
                                   related_name='payments', verbose_name='Frais')
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Montant')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS,
                                     verbose_name='Méthode de paiement')

    reference = models.CharField(max_length=100, unique=True, verbose_name='Référence')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='en_attente',
                            verbose_name='Statut')

    # Transaction details
    transaction_id = models.CharField(max_length=200, blank=True, null=True,
                                     verbose_name='ID de transaction')
    receipt = models.FileField(upload_to='receipts/', blank=True, null=True,
                              verbose_name='Reçu')

    notes = models.TextField(blank=True, null=True, verbose_name='Notes')
    processed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                    null=True, related_name='payments_processed',
                                    verbose_name='Traité par')

    payment_date = models.DateTimeField(default=timezone.now, verbose_name='Date de paiement')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Paiement'
        verbose_name_plural = 'Paiements'
        ordering = ['-payment_date']

    def __str__(self):
        return f"{self.reference} - {self.amount} FCFA"

    def save(self, *args, **kwargs):
        """Override save to generate reference if not provided"""
        if not self.reference:
            # Generate unique reference
            prefix = 'PAY'
            last_payment = Payment.objects.order_by('-id').first()
            if last_payment:
                last_id = last_payment.id
            else:
                last_id = 0
            self.reference = f"{prefix}{str(last_id + 1).zfill(6)}"
        super().save(*args, **kwargs)
