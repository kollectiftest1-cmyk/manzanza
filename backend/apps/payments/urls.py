"""
Payment URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FeeTypeViewSet, StudentFeeViewSet, PaymentViewSet

router = DefaultRouter()
router.register(r'fee-types', FeeTypeViewSet, basename='feetype')
router.register(r'student-fees', StudentFeeViewSet, basename='studentfee')
router.register(r'', PaymentViewSet, basename='payment')

urlpatterns = [
    path('', include(router.urls)),
]
