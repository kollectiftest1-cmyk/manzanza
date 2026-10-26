"""
HR URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (ContractViewSet, EmployeeViewSet, LeaveViewSet, PayrollSettingsView, PayrollViewSet,
                    StaffAttendanceViewSet, TeachingHoursView)

router = DefaultRouter()
router.register(r'employees', EmployeeViewSet, basename='employee')
router.register(r'contracts', ContractViewSet, basename='contract')
router.register(r'payrolls', PayrollViewSet, basename='payroll')
router.register(r'leaves', LeaveViewSet, basename='leave')
router.register(r'attendance', StaffAttendanceViewSet, basename='staff-attendance')

urlpatterns = [
    path('payroll-settings/', PayrollSettingsView.as_view(), name='payroll-settings'),
    path('teaching-hours/', TeachingHoursView.as_view(), name='teaching-hours'),
    path('', include(router.urls)),
]
