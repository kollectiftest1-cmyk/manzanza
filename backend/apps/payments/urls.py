"""
Payment URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FeeTypeViewSet, FeeViewSet, StudentFeeViewSet, PaymentViewSet
from .finance_views import (BaremeFraisViewSet, CashSessionViewSet, ContrepassationViewSet,
                            mobile_money_callback)
from .payment_views import (
    PaymentVoucherViewSet, PaymentReceiptViewSet,
    PaymentAuditLogViewSet, ReceiptVerificationView
)

router = DefaultRouter()
router.register(r'fee-types', FeeTypeViewSet, basename='feetype')
router.register(r'fees', FeeViewSet, basename='fee')
router.register(r'student-fees', StudentFeeViewSet, basename='studentfee')
router.register(r'vouchers', PaymentVoucherViewSet, basename='payment-voucher')
router.register(r'receipts', PaymentReceiptViewSet, basename='payment-receipt')
router.register(r'audit-logs', PaymentAuditLogViewSet, basename='payment-audit-log')
router.register(r'baremes', BaremeFraisViewSet, basename='bareme')
router.register(r'cash-sessions', CashSessionViewSet, basename='cash-session')
router.register(r'contrepassations', ContrepassationViewSet, basename='contrepassation')
router.register(r'', PaymentViewSet, basename='payment')

urlpatterns = [
    path('mobile-money/callback/', mobile_money_callback, name='mobile-money-callback'),
    path('', include(router.urls)),
    path('verify-receipt/<uuid:verification_code>/', ReceiptVerificationView.as_view(), name='verify-receipt'),
]
