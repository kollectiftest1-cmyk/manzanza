from django.urls import path
from .views import SGADashboardStats

urlpatterns = [
    path('sga/', SGADashboardStats.as_view(), name='sga_dashboard_stats'),
]
