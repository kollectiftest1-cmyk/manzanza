"""Paie, pointage et heures prestées."""
from datetime import date, time
from decimal import Decimal

from django.core.cache import cache
from rest_framework.test import APITestCase

from apps.auditoires.models import Auditoire, Filiere, Section
from apps.courses.attendance_models import AttendanceSession
from apps.courses.models import Course
from apps.users.models import User

from .models import Employee, Leave, Payroll, StaffAttendance
from .payroll import compute, generate_month


def mk(role, email, **kw):
    return User.objects.create_user(email=email, password='x12345678!', role=role, first_name=role.title(),
                                    last_name='RH', **kw)


class PayrollTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.sgad = mk('sgad', 'sgad@hr.test')
        self.comptable = mk('comptable', 'compta@hr.test')
        self.agent = mk('apparitorat', 'agent@hr.test')
        self.prof = mk('enseignant', 'prof@hr.test')
        self.vac = mk('enseignant', 'vac@hr.test')
        self.emp = Employee.objects.create(user=self.agent, employee_id='P-001', position='appariteur',
                                           hire_date=date(2024, 1, 1), prestation_type='permanent',
                                           base_monthly_salary=Decimal('1000'), housing_allowance=Decimal('100'),
                                           dependents=2)
        self.prof_emp = Employee.objects.create(user=self.prof, employee_id='P-002', position='professeur',
                                                hire_date=date(2024, 1, 1), prestation_type='permanent',
                                                base_monthly_salary=Decimal('1500'),
                                                statutory_teaching_hours=Decimal('4'), extra_hour_rate=Decimal('20'))
        self.vac_emp = Employee.objects.create(user=self.vac, employee_id='V-001', position='professeur',
                                               hire_date=date(2024, 1, 1), prestation_type='charge_horaire',
                                               salaire_horaire=Decimal('25'))
        fil = Filiere.objects.create(nom='Info', section=Section.objects.create(nom='Sciences'))
        aud = Auditoire.objects.create(nom='L1 Info', niveau='L1', filiere=fil, vacation='jour',
                                       annee_academique='2026-2027')
        c1 = Course.objects.create(name='Algo', credits=4, auditoire=aud, titulaire=self.prof)
        c2 = Course.objects.create(name='Réseaux', credits=3, auditoire=aud, titulaire=self.vac)
        for d in (5, 12, 19):  # 3 séances de 2 h pour le permanent → 6 h (charge 4 h → 2 h compl.)
            AttendanceSession.objects.create(course=c1, date=date(2026, 10, d), start_time=time(8), end_time=time(10),
                                             is_finalized=True, created_by=self.prof)
        AttendanceSession.objects.create(course=c2, date=date(2026, 10, 6), start_time=time(13), end_time=time(16),
                                         is_finalized=True, created_by=self.vac)
        AttendanceSession.objects.create(course=c2, date=date(2026, 10, 7), start_time=time(13), end_time=time(16),
                                         is_finalized=False, created_by=self.vac)  # appel non clôturé : non payé
        for d in (8, 9):
            StaffAttendance.objects.create(employee=self.emp, date=date(2026, 10, d), status='absent_injustifie')

    def test_permanent_payslip_absences_inss_ipr(self):
        p = compute(Payroll.objects.create(employee=self.emp, mois=10, annee=2026))
        self.assertEqual(p.retenue_absences, Decimal('76.92'))
        self.assertEqual(p.brut_imposable, Decimal('923.08'))
        self.assertEqual(p.inss_salarie, Decimal('46.15'))
        # Base IPR 876,93 USD × 2800 = 2 455 404 CDF ; barème plafonné à 30 % ; −2 % × 2 personnes à charge
        self.assertEqual(p.ipr, Decimal('252.56'))
        self.assertEqual(p.indemnites, Decimal('100.00'))
        self.assertEqual(p.net_salary, p.brut_imposable + p.indemnites - p.inss_salarie - p.ipr)
        self.assertEqual(p.inss_patronal, Decimal('120.00'))
        self.assertGreater(p.cout_employeur, p.net_salary)

    def test_teacher_hours_complementary_and_vacation(self):
        p = compute(Payroll.objects.create(employee=self.prof_emp, mois=10, annee=2026))
        self.assertEqual(p.heures_cours, Decimal('6'))
        self.assertEqual(p.heures_complementaires, Decimal('2'))
        self.assertEqual(p.montant_heures_complementaires, Decimal('40.00'))
        self.assertEqual(p.brut_imposable, Decimal('1540.00'))
        v = compute(Payroll.objects.create(employee=self.vac_emp, mois=10, annee=2026))
        self.assertEqual(v.heures_prestees, Decimal('3'))
        self.assertEqual(v.base_salary, Decimal('75.00'))

    def test_workflow_generate_validate_pay_and_separation(self):
        self.assertEqual(generate_month(10, 2026)['crees'], 3)
        p = Payroll.objects.get(employee=self.emp, mois=10, annee=2026)
        self.client.force_authenticate(self.comptable)
        self.assertEqual(self.client.post(f'/api/hr/payrolls/{p.id}/mark_paid/').status_code, 400)  # non validé
        self.client.force_authenticate(self.sgad)
        r = self.client.post('/api/hr/payrolls/validate-month/', {'mois': 10, 'annee': 2026}, format='json')
        self.assertEqual(r.data['valides'], 3)
        self.assertEqual(self.client.post(f'/api/hr/payrolls/{p.id}/mark_paid/').status_code, 403)  # valideur
        # pointage verrouillé une fois la paie validée
        r = self.client.post('/api/hr/attendance/bulk/', {'date': '2026-10-10', 'entries': [
            {'employee': self.emp.id, 'status': 'present'}]}, format='json')
        self.assertEqual(r.status_code, 400)
        self.client.force_authenticate(self.comptable)
        self.assertEqual(self.client.post(f'/api/hr/payrolls/{p.id}/mark_paid/').status_code, 200)
        pdf = self.client.get(f'/api/hr/payrolls/{p.id}/generate-payslip/')
        self.assertTrue(pdf.content.startswith(b'%PDF'))
        # l'employé ne voit que ses bulletins
        self.client.force_authenticate(self.agent)
        mine = self.client.get('/api/hr/payrolls/').data
        self.assertEqual([x['id'] for x in mine.get('results', mine)], [p.id])

    def test_self_check_in_and_leave_marks_attendance(self):
        self.client.force_authenticate(self.agent)
        r = self.client.post('/api/hr/attendance/check-in/')
        self.assertEqual(r.status_code, 200, r.data)
        self.assertTrue(r.data['self_declared'])
        self.assertEqual(self.client.post('/api/hr/attendance/check-in/').status_code, 400)
        leave = Leave.objects.create(employee=self.emp, leave_type='conge_annuel', start_date=date(2026, 11, 2),
                                     end_date=date(2026, 11, 4), reason='Congé')
        self.client.force_authenticate(self.sgad)
        self.client.post(f'/api/hr/leaves/{leave.id}/approve/')
        self.assertEqual(StaffAttendance.objects.filter(employee=self.emp, status='conge').count(), 3)

    def test_teaching_hours_report(self):
        self.client.force_authenticate(self.sgad)
        r = self.client.get('/api/hr/teaching-hours/?mois=10&annee=2026')
        rows = {x['teacher_id']: x for x in r.data['enseignants']}
        self.assertEqual(rows[self.prof.id]['heures'], 6.0)
        self.assertEqual(rows[self.prof.id]['heures_complementaires'], 2.0)
        algo = [c for c in r.data['execution_cours'] if c['course'] == 'Algo'][0]
        self.assertEqual(algo['volume_prevu'], 60.0)  # 4 crédits × 15 h
        self.assertEqual(algo['taux_execution'], 10.0)

    def test_overtime_counted_by_half_hours_only(self):
        a = StaffAttendance.objects.create(employee=self.emp, date=date(2026, 10, 5), status='present',
                                           check_in=time(7, 50), check_out=time(16, 5))   # 8 h 15
        self.assertEqual(a.overtime_hours, Decimal(0))
        b = StaffAttendance.objects.create(employee=self.emp, date=date(2026, 10, 6), status='present',
                                           check_in=time(8, 0), check_out=time(17, 50))   # 9 h 50
        self.assertEqual(b.overtime_hours, Decimal('1.5'))
