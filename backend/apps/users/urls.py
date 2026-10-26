"""
User URLs
"""
from django.urls import path
from .views import CookieTokenRefreshView, LoginView, LogoutView

urlpatterns = [
    # Authentication endpoints
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
]
