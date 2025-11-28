"""
HR views
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from .models import Employee, Contract, Payroll, Leave
from .serializers import EmployeeSerializer, ContractSerializer, PayrollSerializer, LeaveSerializer
from apps.users.permissions import IsHROrAdmin


class EmployeeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Employee model
    """
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsHROrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['position', 'department', 'status']
    search_fields = ['user__first_name', 'user__last_name', 'employee_id']
    ordering_fields = ['hire_date', 'created_at']


class ContractViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Contract model
    """
    queryset = Contract.objects.all()
    serializer_class = ContractSerializer
    permission_classes = [IsHROrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['employee', 'contract_type', 'status']
    search_fields = ['employee__user__first_name', 'employee__user__last_name']
    ordering_fields = ['start_date', 'end_date', 'created_at']


class PayrollViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Payroll model
    """
    queryset = Payroll.objects.all()
    serializer_class = PayrollSerializer
    permission_classes = [IsHROrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['employee', 'status']
    search_fields = ['employee__user__first_name', 'employee__user__last_name', 'employee__employee_id']
    ordering_fields = ['period_start', 'period_end', 'payment_date', 'created_at']

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Mark payroll as paid"""
        payroll = self.get_object()

        if payroll.status == 'paye':
            return Response(
                {'error': 'Cette paie a déjà été marquée comme payée.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        payroll.status = 'paye'
        payroll.payment_date = timezone.now().date()
        payroll.save()

        return Response({'detail': 'Paie marquée comme payée.'})


class LeaveViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Leave model
    """
    queryset = Leave.objects.all()
    serializer_class = LeaveSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['employee', 'leave_type', 'status']
    search_fields = ['employee__user__first_name', 'employee__user__last_name']
    ordering_fields = ['start_date', 'end_date', 'created_at']

    def get_queryset(self):
        """Filter leaves based on user role"""
        user = self.request.user

        if user.role in ['iadmin', 'sgad', 'directeur_general']:
            return self.queryset

        # Users see only their own leaves
        try:
            employee = user.employee_profile
            return self.queryset.filter(employee=employee)
        except:
            return self.queryset.none()

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a leave request"""
        leave = self.get_object()

        if request.user.role not in ['iadmin', 'sgad', 'directeur_general']:
            return Response(
                {'error': 'Vous n\'avez pas la permission d\'approuver des congés.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if leave.status != 'en_attente':
            return Response(
                {'error': 'Seuls les congés en attente peuvent être approuvés.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        leave.status = 'approuve'
        leave.approved_by = request.user
        leave.approved_at = timezone.now()
        leave.save()

        return Response({'detail': 'Congé approuvé.'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a leave request"""
        leave = self.get_object()

        if request.user.role not in ['iadmin', 'sgad', 'directeur_general']:
            return Response(
                {'error': 'Vous n\'avez pas la permission de rejeter des congés.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if leave.status != 'en_attente':
            return Response(
                {'error': 'Seuls les congés en attente peuvent être rejetés.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        leave.status = 'rejete'
        leave.approved_by = request.user
        leave.approved_at = timezone.now()
        leave.save()

        return Response({'detail': 'Congé rejeté.'})
