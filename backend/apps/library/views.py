"""
Library views
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from .models import Book, BookLoan, BookReservation
from .serializers import BookSerializer, BookLoanSerializer, BookReservationSerializer
from apps.users.permissions import IsLibrarianOrAdmin


class BookViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Book model
    """
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'book_type', 'is_available', 'is_active', 'borrowable', 'downloadable']
    search_fields = ['title', 'author', 'isbn', 'description']
    ordering_fields = ['title', 'author', 'publication_year', 'created_at']

    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsLibrarianOrAdmin()]
        return super().get_permissions()

    def perform_create(self, serializer):
        """Set added_by to current user"""
        serializer.save(added_by=self.request.user)

    @action(detail=True, methods=['post'])
    def borrow(self, request, pk=None):
        """Borrow a book"""
        book = self.get_object()
        borrower = request.user

        # Check if book is available
        if not book.is_in_stock or not book.borrowable:
            return Response(
                {'error': 'Ce livre n\'est pas disponible pour l\'emprunt.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user already has this book
        existing_loan = BookLoan.objects.filter(
            book=book,
            borrower=borrower,
            status='en_cours'
        ).first()

        if existing_loan:
            return Response(
                {'error': 'Vous avez déjà emprunté ce livre.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create loan
        loan = BookLoan.objects.create(
            book=book,
            borrower=borrower,
            librarian=request.user if request.user.role in ['bibliothecaire', 'pdg'] else None
        )

        # Update book availability
        book.available_quantity -= 1
        if book.available_quantity == 0:
            book.is_available = False
        book.save()

        serializer = BookLoanSerializer(loan)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def reserve(self, request, pk=None):
        """Reserve a book"""
        book = self.get_object()
        user = request.user

        # Check if book is already reserved by user
        existing_reservation = BookReservation.objects.filter(
            book=book,
            user=user,
            status__in=['en_attente', 'pret']
        ).first()

        if existing_reservation:
            return Response(
                {'error': 'Vous avez déjà réservé ce livre.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create reservation
        reservation = BookReservation.objects.create(book=book, user=user)

        serializer = BookReservationSerializer(reservation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class BookLoanViewSet(viewsets.ModelViewSet):
    """
    ViewSet for BookLoan model
    """
    queryset = BookLoan.objects.all()
    serializer_class = BookLoanSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['book', 'borrower', 'status', 'fine_paid']
    search_fields = ['book__title', 'borrower__first_name', 'borrower__last_name']
    ordering_fields = ['borrow_date', 'due_date', 'return_date']

    def get_queryset(self):
        """Filter loans based on user role"""
        user = self.request.user

        if user.role in ['pdg', 'bibliothecaire', 'sga']:
            return self.queryset
        else:
            # Users see only their own loans
            return self.queryset.filter(borrower=user)

    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsLibrarianOrAdmin()]
        return super().get_permissions()

    @action(detail=True, methods=['post'])
    def return_book(self, request, pk=None):
        """Return a borrowed book"""
        loan = self.get_object()

        # Only librarians can process returns
        if request.user.role not in ['bibliothecaire', 'pdg']:
            return Response(
                {'error': 'Seuls les bibliothécaires peuvent traiter les retours.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if loan.status == 'retourne':
            return Response(
                {'error': 'Ce livre a déjà été retourné.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        loan.return_date = timezone.now()
        loan.status = 'retourne'

        # Calculate fine if overdue
        if loan.is_overdue:
            # 500 FCFA per day overdue
            loan.fine_amount = loan.days_overdue * 500

        loan.save()

        # Update book availability
        book = loan.book
        book.available_quantity += 1
        book.is_available = True
        book.save()

        serializer = BookLoanSerializer(loan)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_loans(self, request):
        """Get current user's loans"""
        loans = self.queryset.filter(borrower=request.user)
        serializer = self.get_serializer(loans, many=True)
        return Response(serializer.data)


class BookReservationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for BookReservation model
    """
    queryset = BookReservation.objects.all()
    serializer_class = BookReservationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['book', 'user', 'status']
    search_fields = ['book__title', 'user__first_name', 'user__last_name']
    ordering_fields = ['reserved_at', 'expires_at']

    def get_queryset(self):
        """Filter reservations based on user role"""
        user = self.request.user

        if user.role in ['pdg', 'bibliothecaire', 'sga']:
            return self.queryset
        else:
            return self.queryset.filter(user=user)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a reservation"""
        reservation = self.get_object()

        if reservation.user != request.user and request.user.role not in ['bibliothecaire', 'pdg']:
            return Response(
                {'error': 'Vous ne pouvez annuler que vos propres réservations.'},
                status=status.HTTP_403_FORBIDDEN
            )

        reservation.status = 'annule'
        reservation.save()

        return Response({'detail': 'Réservation annulée.'})
