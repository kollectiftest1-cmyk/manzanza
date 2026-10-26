from django.urls import path

from .home import HomeView
from .kpis import ExportView, KPIView
from .views import SGADashboardStats

urlpatterns = [
    path('sga/', SGADashboardStats.as_view(), name='sga_dashboard_stats'),
    path('home/', HomeView.as_view(), name='home'),
    path('kpis/', KPIView.as_view(), name='kpis'),
    path('export/<str:kind>/', ExportView.as_view(), name='stats-export'),
]
