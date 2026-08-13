"""
Admin configuration for academic schedules and calendar
"""
from django.contrib import admin
from .models import (
    AcademicYear, Term, AcademicEvent,
    Room, RoomReservation, TimeSlot, Schedule, ScheduleException, TeacherAvailability
)


@admin.register(AcademicYear)
class AcademicYearAdmin(admin.ModelAdmin):
    list_display = ['name', 'start_date', 'end_date', 'is_current']
    list_filter = ['is_current']
    search_fields = ['name']


@admin.register(Term)
class TermAdmin(admin.ModelAdmin):
    list_display = ['name', 'academic_year', 'term_type', 'order', 'start_date', 'end_date', 'is_active']
    list_filter = ['academic_year', 'term_type', 'is_active']
    search_fields = ['name']


@admin.register(AcademicEvent)
class AcademicEventAdmin(admin.ModelAdmin):
    list_display = ['name', 'event_type', 'academic_year', 'term', 'start_date', 'end_date']
    list_filter = ['event_type', 'academic_year']
    search_fields = ['name']


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['name', 'building', 'capacity', 'room_type']
    list_filter = ['room_type']
    search_fields = ['name', 'building']


@admin.register(RoomReservation)
class RoomReservationAdmin(admin.ModelAdmin):
    list_display = ['room', 'date', 'start_time', 'end_time', 'requested_by', 'status']
    list_filter = ['status', 'date', 'room']
    search_fields = ['room__name', 'requested_by__email', 'purpose']


@admin.register(TimeSlot)
class TimeSlotAdmin(admin.ModelAdmin):
    list_display = ['label', 'start_time', 'end_time', 'vacation_type', 'order']
    list_filter = ['vacation_type']


@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    list_display = ['course', 'auditoire', 'schedule_type', 'day_of_week', 'timeslot', 'term', 'is_active']
    list_filter = ['schedule_type', 'is_active', 'term']
    search_fields = ['course__name', 'auditoire__nom']


@admin.register(ScheduleException)
class ScheduleExceptionAdmin(admin.ModelAdmin):
    list_display = ['schedule', 'date', 'reason', 'is_cancelled']
    list_filter = ['is_cancelled']


@admin.register(TeacherAvailability)
class TeacherAvailabilityAdmin(admin.ModelAdmin):
    list_display = ['teacher', 'day_of_week', 'timeslot', 'availability_type']
    list_filter = ['availability_type', 'day_of_week']
