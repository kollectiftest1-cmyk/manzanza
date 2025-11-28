from django.contrib import admin
from .models import Book, BookLoan, BookReservation


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    """Admin configuration for Book model"""

    list_display = ['title', 'author', 'category', 'book_type', 'available_quantity',
                   'quantity', 'is_available', 'is_active']
    list_filter = ['category', 'book_type', 'is_available', 'is_active', 'borrowable', 'downloadable']
    search_fields = ['title', 'author', 'isbn', 'publisher']

    fieldsets = (
        ('Informations principales', {
            'fields': ('title', 'author', 'isbn', 'description', 'category', 'book_type')
        }),
        ('Détails de publication', {
            'fields': ('publisher', 'publication_year', 'pages', 'language')
        }),
        ('Localisation et disponibilité', {
            'fields': ('location', 'quantity', 'available_quantity')
        }),
        ('Contenu numérique', {
            'fields': ('file', 'cover_image', 'downloadable')
        }),
        ('Paramètres', {
            'fields': ('borrowable', 'is_available', 'is_active')
        }),
    )


@admin.register(BookLoan)
class BookLoanAdmin(admin.ModelAdmin):
    """Admin configuration for BookLoan model"""

    list_display = ['book', 'borrower', 'borrow_date', 'due_date', 'return_date',
                   'status', 'is_overdue', 'fine_amount']
    list_filter = ['status', 'fine_paid', 'borrow_date', 'due_date']
    search_fields = ['book__title', 'borrower__first_name', 'borrower__last_name']
    readonly_fields = ['borrow_date', 'is_overdue', 'days_overdue']

    fieldsets = (
        ('Emprunt', {
            'fields': ('book', 'borrower', 'librarian')
        }),
        ('Dates', {
            'fields': ('borrow_date', 'due_date', 'return_date')
        }),
        ('Statut', {
            'fields': ('status', 'is_overdue', 'days_overdue', 'notes')
        }),
        ('Amendes', {
            'fields': ('fine_amount', 'fine_paid')
        }),
    )


@admin.register(BookReservation)
class BookReservationAdmin(admin.ModelAdmin):
    """Admin configuration for BookReservation model"""

    list_display = ['book', 'user', 'reserved_at', 'expires_at', 'status']
    list_filter = ['status', 'reserved_at', 'expires_at']
    search_fields = ['book__title', 'user__first_name', 'user__last_name']
