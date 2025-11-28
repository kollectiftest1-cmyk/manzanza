"""
Auditoire URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuditoireViewSet, SectionViewSet, FiliereViewSet

router = DefaultRouter()
router.register(r'sections', SectionViewSet, basename='section')
router.register(r'filieres', FiliereViewSet, basename='filiere')
router.register(r'', AuditoireViewSet, basename='auditoire')

urlpatterns = [
    path('', include(router.urls)),
]
