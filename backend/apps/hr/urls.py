"""
HR URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmployeeViewSet, ContractViewSet, PayrollViewSet, LeaveViewSet

router = DefaultRouter()
router.register(r'employees', EmployeeViewSet, basename='employee')
router.register(r'contracts', ContractViewSet, basename='contract')
router.register(r'payrolls', PayrollViewSet, basename='payroll')
router.register(r'leaves', LeaveViewSet, basename='leave')

urlpatterns = [
    path('', include(router.urls)),
]
