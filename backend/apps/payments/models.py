"""
Payment models
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.utils.crypto import get_random_string
import uuid


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
        return f"{self.name} - {self.amount}"


class Fee(models.Model):
    """
    Fee Campaign — Created by SGAD and targeted to a group of students.
    Calling generate_student_fees() auto-creates StudentFee records for every
    matching student.
    """
    TARGET_TYPES = [
        ('tous', 'Tous les étudiants'),
        ('section', 'Section'),
        ('filiere', 'Filière'),
        ('auditoire', 'Auditoire'),
        ('etudiant', 'Étudiant spécifique'),
    ]
    CURRENCY_CHOICES = [
        ('USD', 'Dollar américain (USD)'),
        ('CDF', 'Franc Congolais (CDF)'),
    ]

    fee_type = models.ForeignKey(
        FeeType, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='fee_campaigns', verbose_name='Catégorie'
    )
    name = models.CharField(max_length=200, verbose_name='Intitulé')
    description = models.TextField(blank=True, verbose_name='Description')
    amount = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='Montant')
    currency = models.CharField(max_length=5, choices=CURRENCY_CHOICES, default='USD', verbose_name='Devise')

    # Targeting
    target_type = models.CharField(max_length=20, choices=TARGET_TYPES, verbose_name='Cible')
    target_section = models.ForeignKey(
        'auditoires.Section', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='fees', verbose_name='Section cible'
    )
    target_filiere = models.ForeignKey(
        'auditoires.Filiere', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='fees', verbose_name='Filière cible'
    )
    target_auditoire = models.ForeignKey(
        'auditoires.Auditoire', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='fees', verbose_name='Auditoire cible'
    )
    target_student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='targeted_fees', verbose_name='Étudiant cible'
    )

    academic_year = models.CharField(max_length=20, default='2024-2025', verbose_name='Année académique')
    due_date = models.DateField(verbose_name='Date limite de paiement')
    is_active = models.BooleanField(default=True, verbose_name='Actif')
    students_count = models.IntegerField(default=0, verbose_name="Étudiants concernés")

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name='fees_created_by', verbose_name='Créé par'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Frais (campagne)'
        verbose_name_plural = 'Frais (campagnes)'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} — {self.amount} {self.currency}"

    def get_target_students(self):
        """Return queryset of all active students targeted by this fee."""
        from apps.users.models import User
        qs = User.objects.filter(role='etudiant', is_active=True)
        if self.target_type == 'tous':
            return qs
        elif self.target_type == 'section' and self.target_section_id:
            return qs.filter(auditoire__filiere__section_id=self.target_section_id)
        elif self.target_type == 'filiere' and self.target_filiere_id:
            return qs.filter(auditoire__filiere_id=self.target_filiere_id)
        elif self.target_type == 'auditoire' and self.target_auditoire_id:
            return qs.filter(auditoire_id=self.target_auditoire_id)
        elif self.target_type == 'etudiant' and self.target_student_id:
            return qs.filter(id=self.target_student_id)
        return qs.none()

    def generate_student_fees(self):
        """Auto-create StudentFee records for all targeted students (idempotent)."""
        students = self.get_target_students()
        created = 0
        for student in students:
            _, is_new = StudentFee.objects.get_or_create(
                student=student,
                fee_campaign=self,
                defaults={
                    'fee_type': self.fee_type,
                    'total_amount': self.amount,
                    'due_date': self.due_date,
                    'status': 'impaye',
                }
            )
            if is_new:
                created += 1
        self.students_count = StudentFee.objects.filter(fee_campaign=self).count()
        Fee.objects.filter(pk=self.pk).update(students_count=self.students_count)
        return created


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
    fee_type = models.ForeignKey(FeeType, on_delete=models.SET_NULL,
                                null=True, blank=True,
                                related_name='student_fees', verbose_name='Catégorie de frais')
    fee_campaign = models.ForeignKey(Fee, on_delete=models.SET_NULL,
                                    null=True, blank=True,
                                    related_name='student_fees', verbose_name='Campagne de frais')

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
        ('mobile', 'Mobile Money'),
        ('carte', 'Carte bancaire'),
    ]

    STATUS_CHOICES = [
        ('en_attente', 'En attente'),
        ('confirme', 'Confirmé'),
        ('rejete', 'Rejeté'),
        ('annule', 'Annulé'),
    ]

    MM_PROVIDERS = [
        ('mtn', 'MTN Mobile Money'),
        ('vodacom', 'Vodacom M-Pesa'),
        ('airtel', 'Airtel Money'),
        ('orange', 'Orange Money'),
    ]

    student_fee = models.ForeignKey(StudentFee, on_delete=models.CASCADE,
                                   related_name='payments', verbose_name='Frais')
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Montant')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS,
                                     verbose_name='Méthode de paiement')

    # Mobile Money specific fields
    mobile_money_provider = models.CharField(max_length=20, choices=MM_PROVIDERS,
                                             null=True, blank=True, verbose_name='Opérateur Mobile Money')
    mobile_money_number = models.CharField(max_length=20, null=True, blank=True,
                                           verbose_name='Numéro Mobile Money')

    reference = models.CharField(max_length=100, unique=True, verbose_name='Référence')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='en_attente',
                            verbose_name='Statut')

    # Transaction details
    transaction_id = models.CharField(max_length=200, blank=True, null=True,
                                     verbose_name='ID de transaction')
    receipt_file = models.FileField(upload_to='receipts/', blank=True, null=True,
                              verbose_name='Fichier reçu')  # Renommé pour éviter conflit avec PaymentReceipt.payment

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


class PaymentVoucher(models.Model):
    """
    Bon de paiement (Payment Voucher) - Generated before payment
    """
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('paid', 'Payé'),
        ('cancelled', 'Annulé'),
        ('expired', 'Expiré'),
    ]

    # Unique identifiers
    voucher_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Numéro du bon',
        editable=False
    )

    # Student and fee information
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payment_vouchers',
        verbose_name='Étudiant'
    )
    student_fee = models.ForeignKey(
        StudentFee,
        on_delete=models.CASCADE,
        related_name='vouchers',
        verbose_name='Frais étudiant'
    )

    # Payment details
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Montant')
    description = models.TextField(verbose_name='Description')
    payment_method = models.CharField(
        max_length=50,
        blank=True,
        default='especes',
        verbose_name='Moyen de paiement',
        help_text='Moyen choisi par l\'étudiant: especes, virement, cheque, mobile_money'
    )

    # Banking information
    beneficiary_account = models.CharField(
        max_length=100,
        verbose_name='Compte bénéficiaire',
        help_text='Numéro de compte pour le paiement'
    )
    beneficiary_name = models.CharField(
        max_length=200,
        default='SYNTAX GU',
        verbose_name='Nom du bénéficiaire'
    )

    # Status and dates
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Statut'
    )
    issue_date = models.DateTimeField(auto_now_add=True, verbose_name='Date d\'émission')
    expiry_date = models.DateTimeField(null=True, blank=True, verbose_name='Date d\'expiration')
    paid_date = models.DateTimeField(null=True, blank=True, verbose_name='Date de paiement')

    # Bank slip information (bordereau bancaire)
    bank_slip_number = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Numéro de bordereau bancaire'
    )
    bank_slip_date = models.DateField(null=True, blank=True, verbose_name='Date du bordereau')

    # Administrative
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='vouchers_created',
        verbose_name='Créé par'
    )
    validated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vouchers_validated',
        verbose_name='Validé par'
    )

    notes = models.TextField(blank=True, null=True, verbose_name='Notes')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Bon de paiement'
        verbose_name_plural = 'Bons de paiement'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.voucher_number} - {self.student.get_full_name()} - {self.amount} FCFA"

    def save(self, *args, **kwargs):
        """Generate unique voucher number if not provided"""
        if not self.voucher_number:
            # Format: BON-YYYYMMDD-XXXXX
            from datetime import datetime
            date_str = datetime.now().strftime('%Y%m%d')
            random_str = get_random_string(5, allowed_chars='0123456789')
            self.voucher_number = f"BON-{date_str}-{random_str}"

        super().save(*args, **kwargs)


class PaymentReceipt(models.Model):
    """
    Reçu de paiement (Payment Receipt) - Generated after payment validation
    """
    # Unique identifiers
    receipt_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Numéro du reçu',
        editable=False
    )
    verification_code = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        verbose_name='Code de vérification',
        help_text='Code unique pour la vérification via QR Code'
    )

    # Related voucher and payment
    voucher = models.OneToOneField(
        PaymentVoucher,
        on_delete=models.CASCADE,
        related_name='receipt',
        verbose_name='Bon de paiement'
    )
    payment = models.OneToOneField(
        Payment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='receipt',
        verbose_name='Paiement'
    )

    # Student and transaction info
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payment_receipts',
        verbose_name='Étudiant'
    )

    # Payment details (denormalized for historical record)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Montant payé')
    fee_type_name = models.CharField(max_length=200, verbose_name='Type de frais')
    payment_date = models.DateTimeField(verbose_name='Date de paiement')
    payment_method = models.CharField(max_length=50, verbose_name='Méthode de paiement')

    # Bank slip details
    bank_slip_number = models.CharField(max_length=100, blank=True, default='', verbose_name='Numéro de bordereau')
    bank_slip_date = models.DateField(null=True, blank=True, verbose_name='Date du bordereau')

    # Transaction reference
    transaction_reference = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Référence de transaction'
    )

    # PDF file
    pdf_file = models.FileField(
        upload_to='receipts/pdf/',
        blank=True,
        null=True,
        verbose_name='Fichier PDF'
    )

    # QR Code image
    qr_code = models.ImageField(
        upload_to='receipts/qr/',
        blank=True,
        null=True,
        verbose_name='QR Code'
    )

    # Email notification
    email_sent = models.BooleanField(default=False, verbose_name='Email envoyé')
    email_sent_at = models.DateTimeField(null=True, blank=True, verbose_name='Email envoyé le')

    # Administrative
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='receipts_generated',
        verbose_name='Généré par'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Reçu de paiement'
        verbose_name_plural = 'Reçus de paiement'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.receipt_number} - {self.student.get_full_name()}"

    def save(self, *args, **kwargs):
        """Generate unique receipt number if not provided"""
        if not self.receipt_number:
            # Format: REC-YYYYMMDD-XXXXX
            from datetime import datetime
            date_str = datetime.now().strftime('%Y%m%d')
            random_str = get_random_string(5, allowed_chars='0123456789')
            self.receipt_number = f"REC-{date_str}-{random_str}"

        super().save(*args, **kwargs)

    @property
    def verification_url(self):
        """Return URL for QR code verification"""
        from django.conf import settings
        base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        return f"{base_url}/verify-receipt/{self.verification_code}"


class PaymentAuditLog(models.Model):
    """
    Audit log for payment-related actions
    """
    ACTION_CHOICES = [
        ('voucher_created', 'Bon créé'),
        ('voucher_cancelled', 'Bon annulé'),
        ('payment_validated', 'Paiement validé'),
        ('payment_rejected', 'Paiement rejeté'),
        ('receipt_generated', 'Reçu généré'),
        ('receipt_emailed', 'Reçu envoyé par email'),
    ]

    action = models.CharField(max_length=50, choices=ACTION_CHOICES, verbose_name='Action')
    voucher = models.ForeignKey(
        PaymentVoucher,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='audit_logs',
        verbose_name='Bon de paiement'
    )
    receipt = models.ForeignKey(
        PaymentReceipt,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='audit_logs',
        verbose_name='Reçu'
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name='Utilisateur'
    )
    details = models.JSONField(default=dict, verbose_name='Détails')
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name='Date/Heure')

    class Meta:
        verbose_name = 'Journal d\'audit paiement'
        verbose_name_plural = 'Journaux d\'audit paiements'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.get_action_display()} - {self.timestamp}"
