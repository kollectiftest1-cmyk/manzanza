"""
URL Configuration for Assignment System
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AssignmentViewSet, AssignmentSubmissionViewSet

router = DefaultRouter()
# Register specific routes FIRST to avoid conflicts with the empty string catch-all route
router.register(r'submissions', AssignmentSubmissionViewSet, basename='assignment-submission')
router.register(r'', AssignmentViewSet, basename='assignment')  # This catches /api/assignments/ endpoints

urlpatterns = [
    path('', include(router.urls)),
]
