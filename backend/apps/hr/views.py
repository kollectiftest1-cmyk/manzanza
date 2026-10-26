"""
HR views
"""
import calendar
import io
from datetime import datetime, timedelta, time as dt_time
from decimal import Decimal

from rest_framework.exceptions import PermissionDenied
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

from . import payroll as payroll_service
from .models import Contract, Employee, Leave, Payroll, PayrollSettings, StaffAttendance
from .serializers import (
    EmployeeSerializer, ContractSerializer, PayrollSerializer, PayrollSettingsSerializer,
    LeaveSerializer, StaffAttendanceSerializer, UserSimpleSerializer
)
from rest_framework.views import APIView
from apps.core.audit import audit
from apps.users.permissions import IsHROrAdmin
from apps.users.models import User


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
    Paie mensuelle. Circuit : génération (brouillon calculé) → validation (SGAD / direction)
    → paiement (comptabilité / caisse). Un bulletin payé ne se modifie ni ne se supprime.
    Les montants sont TOUS calculés par le serveur (apps/hr/payroll.py).
    """
    queryset = Payroll.objects.select_related('employee__user', 'validated_by').all()
    serializer_class = PayrollSerializer
    permission_classes = [IsHROrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['employee', 'status', 'mois', 'annee']
    search_fields = ['employee__user__first_name', 'employee__user__last_name', 'employee__employee_id']
    ordering_fields = ['annee', 'mois', 'payment_date', 'created_at', 'net_salary']

    def get_permissions(self):
        if self.action in ('mark_paid', 'list', 'retrieve', 'generate_payslip', 'export', 'summary'):
            return [IsAuthenticated()]
        return super().get_permissions()

    def get_queryset(self):
        from apps.users.permissions import has_role
        qs = super().get_queryset()
        if has_role(self.request.user, 'sgad', 'directeur_general', 'comptable', 'caisse'):
            return qs
        # Chaque employé consulte ses propres bulletins (validés ou payés).
        return qs.filter(employee__user=self.request.user, status__in=['valide', 'paye'])

    def perform_create(self, serializer):
        payroll = serializer.save()
        payroll_service.compute(payroll)

    def perform_update(self, serializer):
        from rest_framework.exceptions import ValidationError
        if serializer.instance.status != 'en_attente':
            raise ValidationError("Seul un bulletin en brouillon se modifie (primes, retenues, notes).")
        payroll_service.compute(serializer.save())

    def perform_destroy(self, instance):
        from rest_framework.exceptions import ValidationError
        if instance.status in ('valide', 'paye'):
            raise ValidationError("Un bulletin validé ou payé ne se supprime pas : annulez-le.")
        instance.delete(user=self.request.user)

    def _period(self, request):
        from rest_framework.exceptions import ValidationError
        try:
            mois = int(request.data.get('mois') or request.query_params.get('mois'))
            annee = int(request.data.get('annee') or request.query_params.get('annee'))
        except (TypeError, ValueError):
            raise ValidationError({'detail': 'Paramètres mois et annee requis.'})
        if not 1 <= mois <= 12:
            raise ValidationError({'mois': 'Mois invalide.'})
        return mois, annee

    @action(detail=False, methods=['get'], url_path='calculate-prestation')
    def calculate_prestation(self, request):
        """Aperçu du calcul pour un employé et un mois (rien n'est enregistré)."""
        mois, annee = self._period(request)
        employee = Employee.objects.select_related('user').filter(pk=request.query_params.get('employee')).first()
        if not employee:
            return Response({'error': 'Employé introuvable.'}, status=status.HTTP_400_BAD_REQUEST)
        existing = Payroll.objects.filter(employee=employee, mois=mois, annee=annee).first()
        preview = payroll_service.compute(Payroll(employee=employee, mois=mois, annee=annee), save=False)
        data = PayrollSerializer(preview).data
        data.update({'employee_id': employee.id, 'employee_name': employee.user.get_full_name(),
                     'already_exists': existing is not None, 'existing_payroll_id': existing.id if existing else None,
                     'existing_status': existing.status if existing else None,
                     'sessions': (preview.details or {}).get('seances', []),
                     'sessions_count': len((preview.details or {}).get('seances', [])),
                     'heures_prestees': float(preview.heures_prestees or 0),
                     'jours_prestes': preview.jours_prestes})
        return Response(data)

    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Calcule (ou recalcule) les bulletins brouillons du mois pour tout le personnel actif."""
        mois, annee = self._period(request)
        summary = payroll_service.generate_month(mois, annee)
        audit('update', None, details={'action': 'paie_generee', 'mois': mois, 'annee': annee, **summary})
        return Response(summary)

    @action(detail=True, methods=['post'])
    def recompute(self, request, pk=None):
        payroll = self.get_object()
        if payroll.status != 'en_attente':
            return Response({'detail': 'Seul un brouillon se recalcule.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(self.get_serializer(payroll_service.compute(payroll)).data)

    @action(detail=True, methods=['post'])
    def validate(self, request, pk=None):
        from apps.users.permissions import has_role
        if not has_role(request.user, 'sgad', 'directeur_general'):
            raise PermissionDenied("La validation de la paie revient au SGAD ou à la direction.")
        payroll = self.get_object()
        if payroll.status != 'en_attente':
            return Response({'detail': 'Seul un brouillon se valide.'}, status=status.HTTP_400_BAD_REQUEST)
        payroll_service.compute(payroll)
        payroll.status = 'valide'
        payroll.validated_by = request.user
        payroll.validated_at = timezone.now()
        payroll.save()
        audit('payment', payroll, details={'action': 'paie_validee', 'net': str(payroll.net_salary)})
        return Response(self.get_serializer(payroll).data)

    @action(detail=False, methods=['post'], url_path='validate-month')
    def validate_month(self, request):
        from apps.users.permissions import has_role
        if not has_role(request.user, 'sgad', 'directeur_general'):
            raise PermissionDenied("La validation de la paie revient au SGAD ou à la direction.")
        mois, annee = self._period(request)
        n = 0
        for payroll in Payroll.objects.filter(mois=mois, annee=annee, status='en_attente'):
            payroll_service.compute(payroll)
            payroll.status = 'valide'
            payroll.validated_by = request.user
            payroll.validated_at = timezone.now()
            payroll.save()
            n += 1
        audit('payment', None, details={'action': 'paie_mois_validee', 'mois': mois, 'annee': annee, 'bulletins': n})
        return Response({'valides': n})

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Paiement d'un bulletin VALIDÉ : comptabilité / caisse (séparation des tâches)."""
        from apps.users.permissions import has_role
        if not has_role(request.user, 'comptable', 'caisse', 'sgad'):
            raise PermissionDenied("Le paiement relève de la comptabilité ou de la caisse.")
        payroll = self.get_object()
        if payroll.status != 'valide':
            return Response({'error': 'Seul un bulletin validé peut être payé.'}, status=status.HTTP_400_BAD_REQUEST)
        if payroll.validated_by_id == request.user.id and not request.user.role == 'pdg':
            raise PermissionDenied("Celui qui valide la paie ne la paie pas.")
        payroll.status = 'paye'
        payroll.payment_date = timezone.now().date()
        payroll.payment_method = request.data.get('payment_method') or payroll.payment_method or 'virement'
        payroll.paid_by = request.user
        payroll.save()
        audit('payment', payroll, details={'action': 'salaire_paye', 'net': str(payroll.net_salary),
                                           'mode': payroll.payment_method})
        try:
            from apps.notifications.helpers import notify_users
            notify_users(User.objects.filter(pk=payroll.employee.user_id), title='Salaire payé',
                         message=f"Votre salaire de {payroll.period_label} ({payroll.net_salary} "
                                 f"{payroll.employee.currency}) a été payé.", notification_type='rh',
                         link='/rh/mes-bulletins')
        except Exception:
            pass
        return Response({'detail': 'Paie marquée comme payée.'})

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        from apps.users.permissions import has_role
        if not has_role(request.user, 'sgad', 'directeur_general'):
            raise PermissionDenied()
        payroll = self.get_object()
        reason = (request.data.get('reason') or '').strip()
        if not reason:
            return Response({'reason': 'Motif obligatoire.'}, status=status.HTTP_400_BAD_REQUEST)
        if payroll.status == 'paye':
            return Response({'detail': "Un salaire payé ne s'annule pas ici : passez par une contre-passation comptable."},
                            status=status.HTTP_400_BAD_REQUEST)
        payroll.status = 'annule'
        payroll.notes = ((payroll.notes or '') + f"\nAnnulé : {reason}").strip()
        payroll.save()
        audit('payment', payroll, details={'action': 'paie_annulee', 'motif': reason})
        return Response(self.get_serializer(payroll).data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Masse salariale du mois, par devise et par statut."""
        from django.db.models import Count, Sum
        mois, annee = self._period(request)
        qs = self.get_queryset().filter(mois=mois, annee=annee).exclude(status='annule')
        out = {}
        for row in qs.values('employee__currency').annotate(
                n=Count('id'), brut=Sum('brut_imposable'), net=Sum('net_salary'), inss=Sum('inss_salarie'),
                ipr=Sum('ipr'), cout=Sum('cout_employeur'), indem=Sum('indemnites')):
            out[row['employee__currency'] or 'USD'] = {k: float(v or 0) if k != 'n' else v for k, v in row.items()
                                                      if k != 'employee__currency'}
        statuses = dict(qs.values_list('status').annotate(n=Count('id')))
        return Response({'par_devise': out, 'par_statut': statuses})

    @action(detail=False, methods=['get'])
    def export(self, request):
        """Livre de paie du mois (CSV)."""
        import csv
        mois, annee = self._period(request)
        resp = HttpResponse(content_type='text/csv; charset=utf-8')
        resp['Content-Disposition'] = f'attachment; filename="livre_de_paie_{annee}_{mois:02d}.csv"'
        resp.write('\ufeff')
        w = csv.writer(resp, delimiter=';')
        w.writerow(['Matricule', 'Nom', 'Poste', 'Mode', 'Devise', 'Base', 'Absences', 'Retenue absences',
                    'H. cours', 'H. complém.', 'Montant h. complém.', 'H. sup.', 'Montant h. sup.', 'Primes',
                    'Brut imposable', 'Indemnités', 'INSS salarié', 'IPR', 'Autres retenues', 'Net à payer',
                    'INSS patronal', 'INPP', 'ONEM', 'Coût employeur', 'Statut'])
        for p in self.get_queryset().filter(mois=mois, annee=annee).select_related('employee__user'):
            e = p.employee
            w.writerow([e.employee_id, e.user.get_full_name(), e.get_position_display(), e.get_prestation_type_display(),
                        e.currency, p.base_salary, p.jours_absence_injustifiee, p.retenue_absences, p.heures_cours,
                        p.heures_complementaires, p.montant_heures_complementaires, p.heures_supplementaires,
                        p.montant_heures_supplementaires, p.bonuses, p.brut_imposable, p.indemnites, p.inss_salarie,
                        p.ipr, p.deductions, p.net_salary, p.inss_patronal, p.inpp, p.onem, p.cout_employeur,
                        p.get_status_display()])
        audit('export', None, details={'export': 'livre_de_paie', 'mois': mois, 'annee': annee})
        return resp

    @action(detail=True, methods=['get'], url_path='generate-payslip')
    def generate_payslip(self, request, pk=None):
        """Bulletin de paie PDF (brouillon marqué comme tel)."""
        from .payslip import build_payslip
        payroll = self.get_object()
        pdf = build_payslip(payroll)
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = (f'attachment; filename="bulletin_{payroll.employee.user.last_name}_'
                                           f'{payroll.annee}_{payroll.mois:02d}.pdf"')
        return response


class PayrollSettingsView(APIView):
    """Paramètres de paie : lecture RH / direction, modification SGAD / direction."""
    permission_classes = [IsHROrAdmin]

    def get(self, request):
        return Response(PayrollSettingsSerializer(PayrollSettings.load()).data)

    def patch(self, request):
        obj = PayrollSettings.load()
        ser = PayrollSettingsSerializer(obj, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        audit('settings', obj, details={'action': 'parametres_paie', 'champs': list(request.data.keys())})
        return Response(ser.data)


class StaffAttendanceViewSet(viewsets.ModelViewSet):
    """
    Pointage du personnel. RH : saisie et correction (y compris en masse pour une journée).
    Chaque employé : pointage d'arrivée / de départ pour lui-même et consultation de ses présences.
    """
    serializer_class = StaffAttendanceSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['employee', 'status', 'date']
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def _is_hr(self):
        from apps.users.permissions import has_role
        return has_role(self.request.user, 'sgad', 'directeur_general')

    def get_queryset(self):
        qs = StaffAttendance.objects.select_related('employee__user', 'recorded_by')
        p = self.request.query_params
        if p.get('mois') and p.get('annee'):
            qs = qs.filter(date__month=int(p['mois']), date__year=int(p['annee']))
        if p.get('start') and p.get('end'):
            qs = qs.filter(date__range=(p['start'], p['end']))
        return qs if self._is_hr() else qs.filter(employee__user=self.request.user)

    def _guard_payroll(self, employee, day):
        from rest_framework.exceptions import ValidationError
        if Payroll.objects.filter(employee=employee, mois=day.month, annee=day.year,
                                  status__in=['valide', 'paye']).exists():
            raise ValidationError({'detail': "La paie de ce mois est validée : les présences sont verrouillées."})

    def perform_create(self, serializer):
        if not self._is_hr():
            raise PermissionDenied("Utilisez le pointage d'arrivée / de départ.")
        self._guard_payroll(serializer.validated_data['employee'], serializer.validated_data['date'])
        serializer.save(recorded_by=self.request.user)

    def perform_update(self, serializer):
        if not self._is_hr():
            raise PermissionDenied()
        self._guard_payroll(serializer.instance.employee, serializer.instance.date)
        serializer.save(recorded_by=self.request.user)

    def perform_destroy(self, instance):
        if not self._is_hr():
            raise PermissionDenied()
        self._guard_payroll(instance.employee, instance.date)
        instance.delete()

    @action(detail=False, methods=['post'])
    def bulk(self, request):
        """Feuille de présence d'une journée : {date, entries:[{employee, status, check_in?, check_out?, note?}]}."""
        from rest_framework.exceptions import ValidationError
        from django.utils.dateparse import parse_date
        if not self._is_hr():
            raise PermissionDenied()
        day = parse_date(str(request.data.get('date') or ''))
        if not day:
            raise ValidationError({'date': 'Date invalide.'})
        saved = 0
        for entry in request.data.get('entries', []):
            emp = Employee.objects.filter(pk=entry.get('employee')).first()
            if not emp:
                continue
            self._guard_payroll(emp, day)
            obj, _ = StaffAttendance.objects.get_or_create(employee=emp, date=day)
            ser = StaffAttendanceSerializer(obj, data={k: entry.get(k) for k in ('status', 'check_in', 'check_out', 'note')
                                                       if k in entry}, partial=True)
            ser.is_valid(raise_exception=True)
            ser.save(recorded_by=request.user)
            saved += 1
        audit('update', None, details={'action': 'pointage_journee', 'date': day.isoformat(), 'lignes': saved})
        return Response({'saved': saved})

    def _my_employee(self, request):
        from rest_framework.exceptions import ValidationError
        emp = Employee.objects.filter(user=request.user).exclude(status__in=['demissionne', 'retraite']).first()
        if not emp:
            raise ValidationError({'detail': "Aucun dossier du personnel n'est associé à votre compte."})
        return emp

    @action(detail=False, methods=['get'])
    def me(self, request):
        emp = Employee.objects.filter(user=request.user).first()
        today = timezone.localdate()
        rec = StaffAttendance.objects.filter(employee=emp, date=today).first() if emp else None
        return Response({'employee': emp.id if emp else None,
                         'today': StaffAttendanceSerializer(rec).data if rec else None})

    @action(detail=False, methods=['post'], url_path='check-in')
    def check_in(self, request):
        emp = self._my_employee(request)
        now = timezone.localtime()
        cfg = PayrollSettings.load()
        obj, created = StaffAttendance.objects.get_or_create(employee=emp, date=now.date(),
                                                             defaults={'self_declared': True})
        if obj.check_in:
            return Response({'detail': 'Arrivée déjà pointée.'}, status=status.HTTP_400_BAD_REQUEST)
        obj.check_in = now.time().replace(microsecond=0)
        start_ref = dt_time(8, 0)
        late = (datetime.combine(now.date(), obj.check_in) - datetime.combine(now.date(), start_ref)).total_seconds() / 60
        obj.status = 'retard' if late > cfg.late_tolerance_minutes else 'present'
        obj.self_declared = True
        obj.save()
        return Response(StaffAttendanceSerializer(obj).data)

    @action(detail=False, methods=['post'], url_path='check-out')
    def check_out(self, request):
        emp = self._my_employee(request)
        now = timezone.localtime()
        obj = StaffAttendance.objects.filter(employee=emp, date=now.date()).first()
        if not obj or not obj.check_in:
            return Response({'detail': "Pointez d'abord votre arrivée."}, status=status.HTTP_400_BAD_REQUEST)
        obj.check_out = now.time().replace(microsecond=0)
        obj.save()
        return Response(StaffAttendanceSerializer(obj).data)

    @action(detail=False, methods=['get'], url_path='month-summary')
    def month_summary(self, request):
        """Récapitulatif mensuel par employé : jours par statut, heures, heures supplémentaires."""
        from django.db.models import Count, Sum
        mois = int(request.query_params.get('mois'))
        annee = int(request.query_params.get('annee'))
        qs = self.get_queryset().filter(date__month=mois, date__year=annee)
        out = {}
        for row in qs.values('employee', 'employee__employee_id', 'employee__user__first_name',
                             'employee__user__last_name', 'status').annotate(n=Count('id'), h=Sum('hours_worked'),
                                                                             ot=Sum('overtime_hours')):
            e = out.setdefault(row['employee'], {
                'employee': row['employee'], 'matricule': row['employee__employee_id'],
                'nom': f"{row['employee__user__first_name']} {row['employee__user__last_name']}",
                'statuts': {}, 'heures': 0.0, 'heures_sup': 0.0})
            e['statuts'][row['status']] = row['n']
            e['heures'] += float(row['h'] or 0)
            e['heures_sup'] += float(row['ot'] or 0)
        return Response({'jours_ouvrables': payroll_service.calendar_working_days(mois, annee),
                         'employes': sorted(out.values(), key=lambda x: x['nom'])})


class TeachingHoursView(APIView):
    """Heures de cours prestées par enseignant pour un mois + taux d'exécution des cours."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.users.permissions import has_role
        mois = int(request.query_params.get('mois') or timezone.localdate().month)
        annee = int(request.query_params.get('annee') or timezone.localdate().year)
        is_admin = has_role(request.user, 'sgad', 'sga', 'directeur_general', 'chef_section', 'chef_departement')
        teachers = User.objects.filter(role__in=['enseignant', 'assistant', 'chef_section', 'chef_departement'],
                                       is_active=True)
        if not is_admin:
            teachers = teachers.filter(pk=request.user.pk)
        rows = []
        for t in teachers.order_by('last_name'):
            hours, courses, _sessions = payroll_service.teaching_hours(t, mois, annee)
            emp = Employee.objects.filter(user=t).first()
            statutory = float(emp.statutory_teaching_hours) if emp else 0.0
            rows.append({'teacher_id': t.id, 'teacher': t.get_full_name(), 'role': t.get_role_display(),
                         'mode': emp.get_prestation_type_display() if emp else 'Sans dossier RH',
                         'heures': float(hours), 'charge_statutaire': statutory,
                         'heures_complementaires': max(float(hours) - statutory, 0) if statutory else 0,
                         'cours': courses})
        execution = payroll_service.course_execution() if is_admin else []
        if not is_admin:
            execution = [c for c in payroll_service.course_execution() if c['titulaire'] == request.user.name]
        return Response({'mois': mois, 'annee': annee, 'enseignants': rows, 'execution_cours': execution})


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

        if user.role in ['pdg', 'sgad', 'directeur_general']:
            return self.queryset

        # Users see only their own leaves (across all profiles)
        try:
            employee_ids = Employee.objects.filter(user=user).values_list('id', flat=True)
            if employee_ids:
                return self.queryset.filter(employee_id__in=employee_ids)
            return self.queryset.none()
        except Exception:
            return self.queryset.none()

    def _is_hr(self):
        return IsHROrAdmin().has_permission(self.request, self)

    def perform_create(self, serializer):
        employee = serializer.validated_data.get('employee')
        if not self._is_hr():
            if employee is None or employee.user_id != self.request.user.id:
                raise PermissionDenied("Vous ne pouvez demander un congé que pour vous-même.")
            serializer.save(status='en_attente', approved_by=None)
            return
        serializer.save()

    def perform_update(self, serializer):
        leave = serializer.instance
        if not self._is_hr():
            # Le demandeur modifie seulement sa demande en attente, sans toucher au statut.
            if leave.status != 'en_attente' or {'status', 'approved_by', 'employee'} & set(serializer.validated_data):
                raise PermissionDenied("Seule une demande en attente peut être modifiée, sans changer son statut.")
        serializer.save()

    def perform_destroy(self, instance):
        if not self._is_hr() and instance.status != 'en_attente':
            raise PermissionDenied("Seule une demande en attente peut être retirée.")
        instance.delete(user=self.request.user)

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
        # Les jours ouvrables du congé apparaissent au pointage (payés, non comptés absents).
        day = leave.start_date
        marked = 0
        while day <= leave.end_date:
            if day.weekday() < 6:
                obj, created = StaffAttendance.objects.get_or_create(
                    employee=leave.employee, date=day, defaults={'status': 'conge'})
                if created or obj.status in ('absent_injustifie', 'absent_justifie'):
                    obj.status = 'conge'
                    obj.note = f"Congé {leave.get_leave_type_display()}"
                    obj.recorded_by = request.user
                    obj.save()
                    marked += 1
            day += timedelta(days=1)

        return Response({'detail': f'Congé approuvé ({marked} jour(s) inscrits au pointage).'})

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
