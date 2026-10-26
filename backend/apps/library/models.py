"""
Library models
"""
from django.db import models

from apps.core.softdelete import SoftDeleteModel
from django.conf import settings
from datetime import timedelta
from django.utils import timezone


class Book(SoftDeleteModel):
    """Book Model"""

    BOOK_TYPES = [
        ('physique', 'Livre physique'),
        ('numerique', 'Livre numérique'),
        ('audio', 'Livre audio'),
        ('memoire', 'Mémoire'),
        ('projet', 'Projet'),
    ]

    CATEGORY_CHOICES = [
        ('comptabilite', 'Comptabilité'),
        ('economie', 'Économie'),
        ('mathematiques', 'Mathématiques'),
        ('droit', 'Droit'),
        ('finance', 'Finance'),
        ('gestion', 'Gestion'),
        ('marketing', 'Marketing'),
        ('rh', 'Ressources Humaines'),
        ('autre', 'Autre'),
    ]

    title = models.CharField(max_length=300, verbose_name='Titre')
    author = models.CharField(max_length=200, verbose_name='Auteur')
    isbn = models.CharField(max_length=20, blank=True, null=True, unique=True, verbose_name='ISBN')

    description = models.TextField(blank=True, null=True, verbose_name='Description')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, verbose_name='Catégorie')
    book_type = models.CharField(max_length=20, choices=BOOK_TYPES, default='physique',
                                 verbose_name='Type de livre')

    # Physical details
    publisher = models.CharField(max_length=200, blank=True, null=True, verbose_name='Éditeur')
    publication_year = models.IntegerField(blank=True, null=True, verbose_name='Année de publication')
    pages = models.IntegerField(blank=True, null=True, verbose_name='Nombre de pages')
    language = models.CharField(max_length=50, default='Français', verbose_name='Langue')

    # Location & Availability
    location = models.CharField(max_length=200, blank=True, null=True, verbose_name='Emplacement')
    quantity = models.IntegerField(default=1, verbose_name='Quantité totale')
    available_quantity = models.IntegerField(default=1, verbose_name='Quantité disponible')

    # Digital content
    file = models.FileField(upload_to='library/books/', blank=True, null=True, verbose_name='Fichier')
    cover_image = models.ImageField(upload_to='library/covers/', blank=True, null=True,
                                   verbose_name='Image de couverture')
    downloadable = models.BooleanField(default=False, verbose_name='Téléchargeable')

    # Settings
    borrowable = models.BooleanField(default=True, verbose_name='Empruntable')
    is_available = models.BooleanField(default=True, verbose_name='Disponible')
    is_active = models.BooleanField(default=True, verbose_name='Actif')

    added_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                null=True, related_name='books_added')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Livre'
        verbose_name_plural = 'Livres'
        ordering = ['title']

    def __str__(self):
        return f"{self.title} - {self.author}"

    @property
    def is_in_stock(self):
        """Check if book is in stock"""
        return self.available_quantity > 0


class BookLoan(SoftDeleteModel):
    """Book loan/borrowing model"""

    STATUS_CHOICES = [
        ('en_cours', 'En cours'),
        ('retourne', 'Retourné'),
        ('en_retard', 'En retard'),
        ('perdu', 'Perdu'),
    ]

    book = models.ForeignKey(Book, on_delete=models.CASCADE,
                           related_name='loans', verbose_name='Livre')
    borrower = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                related_name='book_loans', verbose_name='Emprunteur')

    borrow_date = models.DateTimeField(auto_now_add=True, verbose_name='Date d\'emprunt')
    due_date = models.DateTimeField(verbose_name='Date de retour prévue')
    return_date = models.DateTimeField(null=True, blank=True, verbose_name='Date de retour réelle')

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='en_cours',
                            verbose_name='Statut')
    notes = models.TextField(blank=True, null=True, verbose_name='Notes')

    # Fines
    fine_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0,
                                     verbose_name='Montant de l\'amende')
    fine_paid = models.BooleanField(default=False, verbose_name='Amende payée')

    librarian = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                 null=True, related_name='loans_processed',
                                 verbose_name='Bibliothécaire')

    class Meta:
        verbose_name = 'Emprunt de livre'
        verbose_name_plural = 'Emprunts de livres'
        ordering = ['-borrow_date']

    def __str__(self):
        return f"{self.borrower.get_full_name()} - {self.book.title}"

    def save(self, *args, **kwargs):
        """Override save to set due date if not provided"""
        if not self.due_date:
            # Default loan period: 30 days
            self.due_date = timezone.now() + timedelta(days=30)
        super().save(*args, **kwargs)

    @property
    def is_overdue(self):
        """Check if loan is overdue"""
        if self.status == 'retourne':
            return False
        return timezone.now() > self.due_date

    @property
    def days_overdue(self):
        """Calculate days overdue"""
        if not self.is_overdue:
            return 0
        return (timezone.now() - self.due_date).days


class BookReservation(SoftDeleteModel):
    """Book reservation model"""

    STATUS_CHOICES = [
        ('en_attente', 'En attente'),
        ('pret', 'Prêt à emprunter'),
        ('annule', 'Annulé'),
        ('expire', 'Expiré'),
    ]

    book = models.ForeignKey(Book, on_delete=models.CASCADE,
                           related_name='reservations', verbose_name='Livre')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                           related_name='book_reservations', verbose_name='Utilisateur')

    reserved_at = models.DateTimeField(auto_now_add=True, verbose_name='Réservé le')
    expires_at = models.DateTimeField(verbose_name='Expire le')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='en_attente',
                            verbose_name='Statut')

    class Meta:
        verbose_name = 'Réservation de livre'
        verbose_name_plural = 'Réservations de livres'
        ordering = ['-reserved_at']

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.book.title}"

    def save(self, *args, **kwargs):
        """Override save to set expiration date"""
        if not self.expires_at:
            # Reservation expires after 7 days
            self.expires_at = timezone.now() + timedelta(days=7)
        super().save(*args, **kwargs)
