from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (AcademicCalendarEventViewSet, AuditLogViewSet, InstitutionSettingsView, SupportTicketViewSet,
                    TrashViewSet)

router = DefaultRouter()
router.register(r'academic-calendar', AcademicCalendarEventViewSet, basename='academic-calendar')
router.register(r'trash', TrashViewSet, basename='trash')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')
router.register(r'tickets', SupportTicketViewSet, basename='support-ticket')

urlpatterns = [
    path('settings/', InstitutionSettingsView.as_view(), name='institution-settings'),
    path('', include(router.urls)),
]
