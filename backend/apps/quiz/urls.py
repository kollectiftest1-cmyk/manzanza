"""
Quiz URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import QuizViewSet, QuestionViewSet, QuestionOptionViewSet, QuizAttemptViewSet

router = DefaultRouter()
router.register(r'', QuizViewSet, basename='quiz')
router.register(r'questions', QuestionViewSet, basename='question')
router.register(r'options', QuestionOptionViewSet, basename='option')
router.register(r'attempts', QuizAttemptViewSet, basename='attempt')

urlpatterns = [
    path('', include(router.urls)),
]
