"""
HR views
"""
import calendar
import io
from datetime import datetime, timedelta, time as dt_time
from decimal import Decimal

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from django.http import HttpResponse
from django.db.models import Q
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch

from .models import Employee, Contract, Payroll, Leave
from .serializers import (
    EmployeeSerializer, ContractSerializer, PayrollSerializer,
    LeaveSerializer, UserSimpleSerializer
)
from apps.users.permissions import IsHROrAdmin
from apps.users.models import User


def _calculate_teacher_hours(employee, mois, annee):
    """
    Calculate hours worked by a charge_horaire teacher for a given month/year.
    Sums (end_time - start_time) from finalized AttendanceSession records
    for courses the teacher owns or assists.
    """
    from apps.courses.attendance_models import AttendanceSession

    user = employee.user
    sessions = AttendanceSession.objects.filter(
        Q(course__titulaire=user) | Q(course__assistants=user),
        date__year=annee,
        date__month=mois,
        is_finalized=True,
    ).distinct().values('id', 'course__name', 'course__code', 'date', 'start_time', 'end_time')

    total_seconds = 0
    details = []
    for s in sessions:
        start = datetime.combine(s['date'], s['start_time'])
        end = datetime.combine(s['date'], s['end_time'])
        duration = (end - start).total_seconds()
        if duration > 0:
            total_seconds += duration
            details.append({
                'course': s['course__name'],
                'code': s['course__code'],
                'date': s['date'].isoformat(),
                'start': s['start_time'].strftime('%H:%M'),
                'end': s['end_time'].strftime('%H:%M'),
                'hours': round(duration / 3600, 2),
            })

    total_hours = round(total_seconds / 3600, 2)
    return total_hours, details


def _calculate_business_days(employee, mois, annee):
    """
    Calculate business days (Mon-Fri) in the given month, minus approved leaves.
    """
    _, last_day = calendar.monthrange(annee, mois)
    business_days = 0
    for day in range(1, last_day + 1):
        dt = datetime(annee, mois, day)
        if dt.weekday() < 5:  # Mon=0 ... Fri=4
            business_days += 1

    # Subtract approved leave days in this month
    leave_days = 0
    leaves = Leave.objects.filter(
        employee=employee,
        status='approuve',
        start_date__lte=datetime(annee, mois, last_day).date(),
        end_date__gte=datetime(annee, mois, 1).date(),
    )
    for leave in leaves:
        # Clamp to this month
        start = max(leave.start_date, datetime(annee, mois, 1).date())
        end = min(leave.end_date, datetime(annee, mois, last_day).date())
        current = start
        while current <= end:
            if current.weekday() < 5:
                leave_days += 1
            current += timedelta(days=1)

    return max(business_days - leave_days, 0), business_days, leave_days


class EmployeeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Employee model
    Supports up to 3 employee profiles per user (different positions).
    """
    queryset = Employee.objects.select_related('user').all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsHROrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['position', 'department', 'status', 'user']
    search_fields = ['user__first_name', 'user__last_name', 'employee_id', 'user__email']
    ordering_fields = ['hire_date', 'user__last_name', 'created_at']

    def perform_create(self, serializer):
        """Create employee + send notification to user."""
        employee = serializer.save()
        # Send notification to the user
        from apps.notifications.helpers import notify_users
        notify_users(
            User.objects.filter(pk=employee.user_id),
            title='Nouveau profil employé créé',
            message=(
                f'Vous avez été enregistré(e) en tant que '
                f'"{employee.get_position_display()}" (Matricule: {employee.employee_id}). '
                f'Type de prestation: {employee.get_prestation_type_display()}.'
            ),
            notification_type='rh',
            priority='high',
            link='/rh/employees',
            related_object_id=employee.id,
        )

    @action(detail=False, methods=['get'], url_path='potential-employees')
    def potential_employees(self, request):
        """
        List users who are not students and have fewer than 3 employee profiles.
        Includes the count and existing positions for each user.
        """
        from django.db.models import Count, Q

        # Users who are not students
        users = User.objects.exclude(role='etudiant').annotate(
            employee_count=Count('employee_profiles')
        ).filter(employee_count__lt=Employee.MAX_PROFILES)

        data = []
        for u in users:
            existing_profiles = Employee.objects.filter(user=u).values_list('position', flat=True)
            data.append({
                'id': u.id,
                'first_name': u.first_name,
                'last_name': u.last_name,
                'email': u.email,
                'role': u.role,
                'phone': u.phone,
                'employee_count': u.employee_count,
                'existing_positions': list(existing_profiles),
            })

        return Response(data)


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
    ViewSet for Payroll model.
    - Auto-calculates heures_prestees / jours_prestes from attendance & business days
    - Prevents duplicate payroll (same employee + month + year)
    - Blocks edits on already-paid payrolls
    """
    queryset = Payroll.objects.select_related('employee__user').all()
    serializer_class = PayrollSerializer
    permission_classes = [IsHROrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['employee', 'status', 'mois', 'annee']
    search_fields = ['employee__user__first_name', 'employee__user__last_name', 'employee__employee_id']
    ordering_fields = ['annee', 'mois', 'payment_date', 'created_at']

    def perform_create(self, serializer):
        """Auto-fill heures/jours from attendance/business days on create."""
        employee = serializer.validated_data['employee']
        mois = serializer.validated_data['mois']
        annee = serializer.validated_data['annee']

        if employee.prestation_type == 'charge_horaire':
            hours, _ = _calculate_teacher_hours(employee, mois, annee)
            serializer.save(heures_prestees=Decimal(str(hours)))
        else:
            days, _, _ = _calculate_business_days(employee, mois, annee)
            serializer.save(jours_prestes=days)

    def perform_update(self, serializer):
        """Block edits on paid payrolls."""
        payroll = self.get_object()
        if payroll.status == 'paye':
            from rest_framework.exceptions import ValidationError
            raise ValidationError('Impossible de modifier une fiche de paie déjà payée.')
        # Re-calculate on update too
        employee = payroll.employee
        mois = serializer.validated_data.get('mois', payroll.mois)
        annee = serializer.validated_data.get('annee', payroll.annee)

        if employee.prestation_type == 'charge_horaire':
            hours, _ = _calculate_teacher_hours(employee, mois, annee)
            serializer.save(heures_prestees=Decimal(str(hours)))
        else:
            days, _, _ = _calculate_business_days(employee, mois, annee)
            serializer.save(jours_prestes=days)

    @action(detail=False, methods=['get'], url_path='calculate-prestation')
    def calculate_prestation(self, request):
        """
        GET /api/hr/payrolls/calculate-prestation/?employee=ID&mois=M&annee=Y
        Returns auto-calculated hours/days and whether a payroll already exists.
        """
        employee_id = request.query_params.get('employee')
        mois = request.query_params.get('mois')
        annee = request.query_params.get('annee')

        if not all([employee_id, mois, annee]):
            return Response(
                {'error': 'Paramètres requis: employee, mois, annee'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            employee = Employee.objects.select_related('user').get(pk=employee_id)
            mois = int(mois)
            annee = int(annee)
        except (Employee.DoesNotExist, ValueError):
            return Response(
                {'error': 'Employé introuvable ou paramètres invalides.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if payroll already exists
        existing = Payroll.objects.filter(
            employee=employee, mois=mois, annee=annee
        ).first()

        result = {
            'employee_id': employee.id,
            'employee_name': employee.user.get_full_name(),
            'prestation_type': employee.prestation_type,
            'mois': mois,
            'annee': annee,
            'already_exists': existing is not None,
            'existing_payroll_id': existing.id if existing else None,
            'existing_status': existing.status if existing else None,
        }

        if employee.prestation_type == 'charge_horaire':
            hours, details = _calculate_teacher_hours(employee, mois, annee)
            result['heures_prestees'] = hours
            result['sessions'] = details
            result['sessions_count'] = len(details)
        else:
            days_worked, total_business, leave_days = _calculate_business_days(employee, mois, annee)
            result['jours_prestes'] = days_worked
            result['jours_ouvrables'] = total_business
            result['jours_conge'] = leave_days

        return Response(result)

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

    @action(detail=True, methods=['get'], url_path='generate-payslip')
    def generate_payslip(self, request, pk=None):
        """Generate a PDF payslip for a payroll record."""
        payroll = self.get_object()
        employee = payroll.employee
        user = employee.user

        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter

        # --- Header ---
        p.setFont("Helvetica-Bold", 16)
        p.drawString(inch, height - inch, "Fiche de Paie")
        p.setFont("Helvetica", 10)
        month_name = dict(Payroll.MONTH_CHOICES).get(payroll.mois, payroll.mois)
        p.drawString(inch, height - 1.25 * inch, f"P\u00e9riode: {month_name} {payroll.annee}")

        # --- Employee Info ---
        p.setFont("Helvetica-Bold", 12)
        p.drawString(inch, height - 2 * inch, "Informations de l'employé")
        p.setFont("Helvetica", 10)
        p.drawString(inch, height - 2.25 * inch, f"Nom: {user.get_full_name()}")
        p.drawString(inch, height - 2.4 * inch, f"Matricule: {employee.employee_id}")
        p.drawString(inch, height - 2.55 * inch, f"Poste: {employee.get_position_display()}")
        p.drawString(inch, height - 2.7 * inch, f"Type: {employee.get_prestation_type_display()}")

        # --- Prestation Details ---
        p.setFont("Helvetica-Bold", 12)
        p.drawString(inch, height - 3.1 * inch, "Prestation")
        p.setFont("Helvetica", 10)
        if employee.prestation_type == 'permanent':
            p.drawString(inch, height - 3.3 * inch, f"Jours prest\u00e9s: {payroll.jours_prestes or 0}")
            p.drawString(inch, height - 3.45 * inch,
                         f"Salaire journalier: {employee.salaire_journalier or 0} {employee.currency}")
        else:
            p.drawString(inch, height - 3.3 * inch, f"Heures prest\u00e9es: {payroll.heures_prestees or 0}")
            p.drawString(inch, height - 3.45 * inch,
                         f"Salaire horaire: {employee.salaire_horaire or 0} {employee.currency}")

        # --- Salary Details ---
        p.setFont("Helvetica-Bold", 12)
        p.drawString(inch, height - 3.85 * inch, "D\u00e9tails du Salaire")
        y = height - 4.1 * inch
        
        p.setFont("Helvetica", 10)
        p.drawString(inch, y, "Salaire de base:")
        p.drawString(4 * inch, y, f"{payroll.base_salary} {employee.currency}")
        y -= 0.25 * inch

        p.drawString(inch, y, "Primes / Bonus:")
        p.drawString(4 * inch, y, f"{payroll.bonuses} {employee.currency}")
        y -= 0.25 * inch

        p.drawString(inch, y, "Déductions:")
        p.drawString(4 * inch, y, f"-{payroll.deductions} {employee.currency}")
        y -= 0.25 * inch
        
        p.line(inch, y, width - inch, y)
        y -= 0.25 * inch

        p.setFont("Helvetica-Bold", 12)
        p.drawString(inch, y, "Salaire Net:")
        p.drawString(4 * inch, y, f"{payroll.net_salary} {employee.currency}")

        # --- Footer ---
        p.setFont("Helvetica-Oblique", 8)
        p.drawString(inch, inch, f"Généré le {timezone.now().strftime('%d/%m/%Y %H:%M')}")

        p.showPage()
        p.save()

        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="fiche_de_paie_{user.last_name}_{payroll.mois}_{payroll.annee}.pdf"'
        return response


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

        # Users see only their own leaves (across all profiles)
        try:
            employee_ids = Employee.objects.filter(user=user).values_list('id', flat=True)
            if employee_ids:
                return self.queryset.filter(employee_id__in=employee_ids)
            return self.queryset.none()
        except Exception:
            return self.queryset.none()

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a leave request"""
        leave = self.get_object()

        if not IsHROrAdmin().has_permission(request, self):
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

        if not IsHROrAdmin().has_permission(request, self):
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
