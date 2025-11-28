"""
Chat URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChatChannelViewSet, MessageViewSet, MessageReactionViewSet

router = DefaultRouter()
router.register(r'channels', ChatChannelViewSet, basename='channel')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'reactions', MessageReactionViewSet, basename='reaction')

urlpatterns = [
    path('', include(router.urls)),
]
