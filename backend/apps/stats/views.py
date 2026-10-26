from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from apps.users.permissions import IsSGAOrAdmin
from apps.users.models import User
from apps.courses.models import Course
from apps.auditoires.models import Auditoire, Section


class SGADashboardStats(APIView):
    permission_classes = [IsSGAOrAdmin]

    def get(self, request):
        total_students = User.objects.filter(role='etudiant', is_active=True).count()
        from apps.inscriptions.models import PreInscription
        pending_inscriptions = PreInscription.objects.filter(status='en_attente').count()
        total_sections = Section.objects.count()
        total_auditoires = Auditoire.objects.count()
        total_courses = Course.objects.filter(is_active=True).count()
        total_teachers = User.objects.filter(role__in=['enseignant', 'assistant'], is_active=True).count()

        # Payment stats (safe import)
        payment_stats = {}
        try:
            from apps.payments.models import Fee, StudentFee, Payment
            # Jamais d'addition entre devises : les totaux historiques sont exprimés en USD,
            # le détail par devise est fourni dans « by_currency ».
            fees = StudentFee.objects.exclude(status='annule')
            by_currency = {}
            for row in fees.values('currency').annotate(due=Sum('total_amount'), paid=Sum('amount_paid')):
                by_currency[row['currency'] or 'USD'] = {'expected': float(row['due'] or 0),
                                                         'paid': float(row['paid'] or 0)}
            usd = by_currency.get('USD', {'expected': 0, 'paid': 0})
            total_expected = usd['expected']
            total_paid = usd['paid']
            payment_stats = {
                'total_fees_campaigns': Fee.objects.count(),
                'active_campaigns': Fee.objects.filter(is_active=True).count(),
                'total_expected': total_expected,
                'total_paid': total_paid,
                'total_pending': total_expected - total_paid,
                'by_currency': by_currency,
                'paid_students': StudentFee.objects.filter(status='paye').values('student').distinct().count(),
                'unpaid_students': StudentFee.objects.filter(status__in=['impaye', 'partiel']).values('student').distinct().count(),
                'recent_payments': list(
                    Payment.objects.filter(status='confirme')
                    .order_by('-payment_date')[:5]
                    .values('id', 'amount', 'payment_date', 'payment_method',
                            'student_fee__student__first_name',
                            'student_fee__student__last_name',
                            'student_fee__fee_campaign__name')
                ),
            }
        except Exception:
            pass

        # HR stats (safe import)
        hr_stats = {}
        try:
            from apps.hr.models import Employee, Payroll
            hr_stats = {
                'total_employees': Employee.objects.filter(is_active=True).count(),
                'total_payroll_paid': float(
                    Payroll.objects.filter(status='paye').aggregate(s=Sum('net_salary'))['s'] or 0
                ),
            }
        except Exception:
            pass

        return Response({
            'total_students': total_students,
            'pending_inscriptions': pending_inscriptions,
            'total_sections': total_sections,
            'total_auditoires': total_auditoires,
            'total_courses': total_courses,
            'total_teachers': total_teachers,
            **payment_stats,
            **hr_stats,
        })
