"""
Calcul de la paie (bulletin) — règles paramétrables (PayrollSettings).

  Permanent      : salaire mensuel de base (ou journalier × jours de référence)
                   − absences non justifiées (au prorata journalier)
                   + heures complémentaires d'enseignement (au-delà de la charge statutaire)
                   + heures supplémentaires pointées (majorées)
  Vacataire      : heures prestées × taux horaire (cours tenus pour un enseignant,
                   heures pointées pour le personnel)
  Brut imposable = rémunération + heures + primes ; indemnités de logement/transport non imposables
  Retenues       : INSS salarié, IPR/IRPP (barème annuel progressif en CDF, plafond, réduction
                   par personne à charge), avances et autres retenues
  Charges patronales : INSS employeur, INPP, ONEM → coût employeur
"""
import calendar
from datetime import date, datetime
from decimal import ROUND_HALF_UP, Decimal

from django.db import transaction
from django.db.models import Q, Sum
from django.utils import timezone

from .models import Employee, Payroll, PayrollSettings, StaffAttendance

D0 = Decimal(0)
CENT = Decimal('0.01')


def _q(value):
    return Decimal(value).quantize(CENT, rounding=ROUND_HALF_UP)


def month_bounds(mois, annee):
    last = calendar.monthrange(annee, mois)[1]
    return date(annee, mois, 1), date(annee, mois, last)


def calendar_working_days(mois, annee):
    """Jours ouvrables du mois (lundi → samedi)."""
    first, last = month_bounds(mois, annee)
    return sum(1 for d in range(1, last.day + 1) if date(annee, mois, d).weekday() < 6)


def teaching_hours(user, mois, annee):
    """
    Heures de cours effectivement prestées : séances d'appel clôturées que l'enseignant a
    tenues (créées par lui ; à défaut de créateur, celles du titulaire du cours).
    """
    from apps.courses.attendance_models import AttendanceSession
    first, last = month_bounds(mois, annee)
    sessions = AttendanceSession.objects.filter(date__range=(first, last), is_finalized=True).filter(
        Q(created_by=user) | Q(created_by__isnull=True, course__titulaire=user)
    ).select_related('course').order_by('date', 'start_time')
    total = D0
    by_course = {}
    rows = []
    for s in sessions:
        hours = Decimal(str(round((datetime.combine(s.date, s.end_time) -
                                   datetime.combine(s.date, s.start_time)).total_seconds() / 3600, 2)))
        if hours <= 0:
            continue
        total += hours
        key = s.course_id
        by_course.setdefault(key, {'course_id': s.course_id, 'course': s.course.name, 'code': s.course.code,
                                   'hours': D0, 'sessions': 0})
        by_course[key]['hours'] += hours
        by_course[key]['sessions'] += 1
        rows.append({'date': s.date.isoformat(), 'course': s.course.name, 'start': s.start_time.strftime('%H:%M'),
                     'end': s.end_time.strftime('%H:%M'), 'hours': float(hours)})
    courses = [{**c, 'hours': float(c['hours'])} for c in by_course.values()]
    return total, courses, rows


def compute_ipr(base_imposable, currency, dependents, cfg):
    """IPR mensuel dans la devise du salaire, à partir du barème annuel en CDF."""
    rate = Decimal(cfg.exchange_rate_cdf_per_usd) if currency == 'USD' else Decimal(1)
    monthly_cdf = base_imposable * rate
    annual = monthly_cdf * 12
    tax = D0
    lower = D0
    for upper, pct in (cfg.ipr_brackets or PayrollSettings.DEFAULT_BRACKETS):
        upper_d = Decimal(str(upper)) if upper is not None else None
        if annual <= lower:
            break
        slice_top = annual if upper_d is None else min(annual, upper_d)
        tax += (slice_top - lower) * Decimal(str(pct)) / 100
        if upper_d is None:
            break
        lower = upper_d
    monthly_tax = tax / 12
    cap = monthly_cdf * Decimal(cfg.ipr_cap_rate) / 100
    monthly_tax = min(monthly_tax, cap)
    n = min(int(dependents or 0), int(cfg.ipr_max_dependents))
    monthly_tax *= max(Decimal(1) - Decimal(cfg.ipr_dependent_reduction) * n / 100, D0)
    return _q(monthly_tax / rate) if rate else D0


@transaction.atomic
def compute(payroll, save=True):
    if payroll.pk and payroll.status in ('valide', 'paye', 'annule'):
        return payroll
    cfg = PayrollSettings.load()
    emp = payroll.employee
    mois, annee = payroll.mois, payroll.annee
    first, last = month_bounds(mois, annee)
    days_ref = Decimal(cfg.working_days_per_month or 26)
    hours_per_day = Decimal(cfg.hours_per_day or 8)

    att = StaffAttendance.objects.filter(employee=emp, date__range=(first, last))
    absences = Decimal(att.filter(status='absent_injustifie').count())
    presences = att.filter(status__in=StaffAttendance.PAID_STATUSES).count()
    pointed_hours = att.aggregate(s=Sum('hours_worked'))['s'] or D0
    overtime = att.aggregate(s=Sum('overtime_hours'))['s'] or D0
    t_hours, t_courses, t_rows = teaching_hours(emp.user, mois, annee)

    details = {'mode': emp.prestation_type, 'jours_reference': float(days_ref), 'cours': t_courses,
               'seances': t_rows[:200], 'pointages': att.count()}
    base = D0
    retenue_abs = D0
    hourly = D0
    if emp.prestation_type == 'permanent':
        full = Decimal(emp.base_monthly_salary or 0) or Decimal(emp.salaire_journalier or 0) * days_ref
        daily = full / days_ref if days_ref else D0
        hourly = daily / hours_per_day if hours_per_day else D0
        retenue_abs = _q(daily * absences)
        base = _q(full) - retenue_abs
        details.update({'salaire_mensuel_complet': float(_q(full)), 'taux_journalier': float(_q(daily))})
        payroll.jours_prestes = presences or None
    else:
        hourly = Decimal(emp.salaire_horaire or 0)
        hours = t_hours if t_hours > 0 else Decimal(pointed_hours)
        base = _q(hours * hourly)
        payroll.heures_prestees = hours
        details.update({'heures_retenues': float(hours), 'source_heures': 'cours' if t_hours > 0 else 'pointage'})

    comp_hours = D0
    comp_amount = D0
    if emp.prestation_type == 'permanent' and Decimal(emp.statutory_teaching_hours or 0) > 0:
        comp_hours = max(t_hours - Decimal(emp.statutory_teaching_hours), D0)
        comp_amount = _q(comp_hours * Decimal(emp.extra_hour_rate or emp.salaire_horaire or 0))
        details['charge_statutaire'] = float(emp.statutory_teaching_hours)
    sup_amount = D0
    if emp.prestation_type == 'permanent' and overtime > 0:
        sup_amount = _q(Decimal(overtime) * hourly * Decimal(cfg.overtime_multiplier))

    primes = Decimal(payroll.bonuses or 0)
    brut = _q(base + comp_amount + sup_amount + primes)
    indemnites = _q(Decimal(emp.housing_allowance or 0) + Decimal(emp.transport_allowance or 0))
    inss = _q(brut * Decimal(cfg.inss_employee_rate) / 100)
    ipr = compute_ipr(brut - inss, emp.currency, emp.dependents, cfg)
    autres = Decimal(payroll.deductions or 0)
    net = _q(brut + indemnites - inss - ipr - autres)
    inss_p = _q(brut * Decimal(cfg.inss_employer_rate) / 100)
    inpp = _q(brut * Decimal(cfg.inpp_rate) / 100)
    onem = _q(brut * Decimal(cfg.onem_rate) / 100)

    payroll.jours_ouvrables = calendar_working_days(mois, annee)
    payroll.jours_absence_injustifiee = absences
    payroll.retenue_absences = retenue_abs
    payroll.heures_cours = t_hours
    payroll.heures_complementaires = comp_hours
    payroll.montant_heures_complementaires = comp_amount
    payroll.heures_supplementaires = Decimal(overtime)
    payroll.montant_heures_supplementaires = sup_amount
    payroll.base_salary = base
    payroll.indemnites = indemnites
    payroll.brut_imposable = brut
    payroll.inss_salarie = inss
    payroll.ipr = ipr
    payroll.net_salary = net
    payroll.inss_patronal = inss_p
    payroll.inpp = inpp
    payroll.onem = onem
    payroll.cout_employeur = _q(brut + indemnites + inss_p + inpp + onem)
    payroll.details = details
    payroll.computed_at = timezone.now()
    if save:
        payroll.save()
    return payroll


def eligible_employees(mois, annee):
    first, last = month_bounds(mois, annee)
    return Employee.objects.filter(hire_date__lte=last).filter(
        Q(end_date__isnull=True) | Q(end_date__gte=first)).exclude(status__in=['demissionne', 'retraite']) \
        .select_related('user')


@transaction.atomic
def generate_month(mois, annee):
    """Crée ou recalcule les bulletins (brouillons) du mois pour tout le personnel actif."""
    summary = {'crees': 0, 'recalcules': 0, 'ignores': 0}
    for emp in eligible_employees(mois, annee):
        payroll, created = Payroll.objects.get_or_create(employee=emp, mois=mois, annee=annee)
        if payroll.status in ('valide', 'paye', 'annule'):
            summary['ignores'] += 1
            continue
        compute(payroll)
        summary['crees' if created else 'recalcules'] += 1
    return summary


def course_execution(annee_academique=None):
    """Taux d'exécution des cours : volume horaire prévu vs heures réellement tenues."""
    from apps.courses.attendance_models import AttendanceSession
    from apps.courses.models import Course
    from apps.grades.models import AcademicConfig
    hpc = Decimal(getattr(AcademicConfig.load(), 'hours_per_credit', 15) or 15)
    qs = Course.objects.filter(is_active=True).select_related('titulaire', 'auditoire')
    if annee_academique:
        qs = qs.filter(auditoire__annee_academique=annee_academique)
    out = []
    for c in qs:
        planned = Decimal(c.volume_horaire_total or 0) or Decimal(c.credits or 0) * hpc
        done = D0
        for s in AttendanceSession.objects.filter(course=c, is_finalized=True):
            done += Decimal(str(max((datetime.combine(s.date, s.end_time) -
                                     datetime.combine(s.date, s.start_time)).total_seconds() / 3600, 0)))
        out.append({'course_id': c.id, 'code': c.code, 'course': c.name,
                    'groupe': c.auditoire.nom if c.auditoire_id else '',
                    'titulaire': c.titulaire.name if c.titulaire_id else '', 'credits': c.credits,
                    'volume_prevu': float(planned), 'heures_tenues': float(round(done, 2)),
                    'taux_execution': float(round(done * 100 / planned, 1)) if planned else None})
    return out
