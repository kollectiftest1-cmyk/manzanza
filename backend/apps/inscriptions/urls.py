"""
URLs for the inscriptions app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PreInscriptionViewSet

router = DefaultRouter()
router.register(r'', PreInscriptionViewSet, basename='preinscription')

urlpatterns = [
    path('', include(router.urls)),
]
