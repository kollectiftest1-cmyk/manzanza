"""
Payment URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FeeTypeViewSet, StudentFeeViewSet, PaymentViewSet
from .payment_views import (
    PaymentVoucherViewSet, PaymentReceiptViewSet,
    PaymentAuditLogViewSet, ReceiptVerificationView
)

router = DefaultRouter()
router.register(r'fee-types', FeeTypeViewSet, basename='feetype')
router.register(r'student-fees', StudentFeeViewSet, basename='studentfee')
router.register(r'vouchers', PaymentVoucherViewSet, basename='payment-voucher')
router.register(r'receipts', PaymentReceiptViewSet, basename='payment-receipt')
router.register(r'audit-logs', PaymentAuditLogViewSet, basename='payment-audit-log')
router.register(r'', PaymentViewSet, basename='payment')

urlpatterns = [
    path('', include(router.urls)),
    path('verify-receipt/<uuid:verification_code>/', ReceiptVerificationView.as_view(), name='verify-receipt'),
]
