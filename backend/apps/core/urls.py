from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AcademicCalendarEventViewSet

router = DefaultRouter()
router.register(r'academic-calendar', AcademicCalendarEventViewSet, basename='academic-calendar')

urlpatterns = [
    path('', include(router.urls)),
]
