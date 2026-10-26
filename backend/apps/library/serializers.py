"""
Library serializers
"""
from rest_framework import serializers

from apps.core.validation import check
from .models import Book, BookLoan, BookReservation


class BookSerializer(serializers.ModelSerializer):
    """Book Serializer"""

    added_by_name = serializers.CharField(source='added_by.get_full_name', read_only=True)
    is_in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Book
        fields = [
            'id', 'title', 'author', 'isbn', 'description',
            'category', 'book_type', 'publisher', 'publication_year',
            'pages', 'language', 'location', 'quantity',
            'available_quantity', 'file', 'cover_image',
            'downloadable', 'borrowable', 'is_available',
            'is_active', 'is_in_stock',
            'added_by', 'added_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_in_stock']

    def create(self, validated_data):
        if 'available_quantity' not in validated_data:
            validated_data['available_quantity'] = validated_data.get('quantity', 1)
        return super().create(validated_data)


class BookLoanSerializer(serializers.ModelSerializer):
    """BookLoan Serializer"""

    book_title = serializers.CharField(source='book.title', read_only=True)
    borrower_name = serializers.CharField(source='borrower.get_full_name', read_only=True)
    librarian_name = serializers.CharField(source='librarian.get_full_name', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    days_overdue = serializers.IntegerField(read_only=True)

    class Meta:
        model = BookLoan
        fields = [
            'id', 'book', 'book_title', 'borrower', 'borrower_name',
            'borrow_date', 'due_date', 'return_date', 'status',
            'notes', 'fine_amount', 'fine_paid',
            'librarian', 'librarian_name',
            'is_overdue', 'days_overdue'
        ]
        read_only_fields = ['id', 'borrow_date', 'is_overdue', 'days_overdue']

    def validate(self, attrs):
        check(self, attrs, order=[('borrow_date', 'due_date'), ('borrow_date', 'return_date')], not_past=['due_date'])
        return attrs


class BookReservationSerializer(serializers.ModelSerializer):
    """BookReservation Serializer"""

    book_title = serializers.CharField(source='book.title', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = BookReservation
        fields = [
            'id', 'book', 'book_title', 'user', 'user_name',
            'reserved_at', 'expires_at', 'status'
        ]
        read_only_fields = ['id', 'reserved_at', 'expires_at']
