"""
URL Configuration for Quiz System
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import QuizViewSet, QuizAttemptViewSet

router = DefaultRouter()
# Register specific routes FIRST to avoid conflicts with the empty string catch-all route
router.register(r'attempts', QuizAttemptViewSet, basename='quiz-attempt')
router.register(r'', QuizViewSet, basename='quiz')  # This catches /api/quiz/ endpoints

urlpatterns = [
    path('', include(router.urls)),
]
