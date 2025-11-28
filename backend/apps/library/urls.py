"""
Library URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookViewSet, BookLoanViewSet, BookReservationViewSet

router = DefaultRouter()
router.register(r'books', BookViewSet, basename='book')
router.register(r'loans', BookLoanViewSet, basename='loan')
router.register(r'reservations', BookReservationViewSet, basename='reservation')

urlpatterns = [
    path('', include(router.urls)),
]
