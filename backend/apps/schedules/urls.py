"""
URLs for academic schedules and calendar
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AcademicYearViewSet, TermViewSet, AcademicEventViewSet,
    RoomViewSet, RoomReservationViewSet, TimeSlotViewSet, ScheduleViewSet,
    ScheduleExceptionViewSet, TeacherAvailabilityViewSet
)

router = DefaultRouter()
# Academic Calendar
router.register(r'academic-years', AcademicYearViewSet, basename='academicyear')
router.register(r'terms', TermViewSet, basename='term')
router.register(r'academic-events', AcademicEventViewSet, basename='academicevent')
# Scheduling
router.register(r'rooms', RoomViewSet, basename='room')
router.register(r'reservations', RoomReservationViewSet, basename='roomreservation')
router.register(r'timeslots', TimeSlotViewSet, basename='timeslot')
router.register(r'schedules', ScheduleViewSet, basename='schedule')
router.register(r'exceptions', ScheduleExceptionViewSet, basename='scheduleexception')
router.register(r'availability', TeacherAvailabilityViewSet, basename='availability')

urlpatterns = [
    path('', include(router.urls)),
]
