"""
Règles financières transverses : facturation automatique et situation financière.
"""
from decimal import Decimal

from django.db.models import Sum
from django.utils import timezone


def generate_fees_for_inscription(inscription):
    """Crée les dettes (StudentFee) prévues par les barèmes de l'année. Idempotent."""
    from apps.payments.models import BaremeFrais, StudentFee

    created = []
    baremes = BaremeFrais.objects.filter(academic_year=inscription.academic_year).select_related('fee_type')
    for bareme in baremes:
        if not bareme.applies_to(inscription.auditoire):
            continue
        if StudentFee.all_objects.filter(inscription=inscription, bareme=bareme).exists():
            continue
        created.append(StudentFee.objects.create(
            student=inscription.student,
            inscription=inscription,
            bareme=bareme,
            fee_type=bareme.fee_type,
            total_amount=bareme.amount,
            currency=bareme.currency,
            due_date=bareme.due_date,
            status='impaye',
            notes=bareme.libelle,
        ))
    return created


def admin_fees_settled(inscription):
    """Les barèmes marqués « requis pour l'inscription administrative » sont-ils réglés ?"""
    from apps.payments.models import StudentFee
    pending = StudentFee.objects.filter(
        inscription=inscription, bareme__required_for_admin_validation=True).exclude(status__in=['paye', 'annule'])
    return not pending.exists()


def paid_ratio(student, inscription=None, as_of=None):
    """
    Part (%) des frais obligatoires ÉCHUS réglée à la date `as_of` (aujourd'hui par défaut) :
    une tranche dont l'échéance n'est pas encore arrivée n'est pas exigée (en janvier,
    la 2e tranche payable en février ne bloque pas les examens du 1er semestre).
    Calculée par devise (on n'additionne jamais USD et CDF) puis on retient la devise
    la moins réglée : l'étudiant est en règle seulement s'il l'est dans chaque devise.
    """
    from django.db.models import Q
    from apps.payments.models import StudentFee
    qs = StudentFee.objects.filter(student=student).exclude(status='annule')
    if inscription is not None:
        qs = qs.filter(Q(inscription=inscription) | Q(inscription__isnull=True))
    qs = qs.filter(Q(bareme__is_mandatory=True) | (
        Q(bareme__isnull=True) & (Q(fee_type__is_mandatory=True) | Q(fee_type__isnull=True))))
    as_of = as_of or timezone.localdate()
    qs = qs.filter(Q(due_date__isnull=True) | Q(due_date__lte=as_of))
    totals, paid = {}, {}
    for fee in qs:
        if fee.total_amount and fee.total_amount > 0:
            cur = fee.currency or 'USD'
            totals[cur] = totals.get(cur, Decimal(0)) + fee.total_amount
            paid[cur] = paid.get(cur, Decimal(0)) + min(fee.amount_paid, fee.total_amount)
    if not totals:
        return Decimal(100)
    worst = min(paid[c] / totals[c] for c in totals)
    return (worst * 100).quantize(Decimal('0.01'))


def clearance(student, inscription=None):
    """
    Situation financière de l'étudiant.
    Retourne {'cleared': bool, 'paid_percent': Decimal, 'required_percent': int, 'overdue': [...]}.
    """
    from apps.core.models import InstitutionSettings
    from apps.payments.models import StudentFee

    settings_obj = InstitutionSettings.load()
    ratio = paid_ratio(student, inscription)
    today = timezone.localdate()
    overdue = list(StudentFee.objects.filter(student=student, due_date__lt=today)
                   .exclude(status__in=['paye', 'annule'])
                   .values('id', 'notes', 'total_amount', 'amount_paid', 'currency', 'due_date'))
    required = settings_obj.exam_min_paid_percent
    return {
        'cleared': ratio >= required,
        'paid_percent': ratio,
        'required_percent': required,
        'overdue': overdue,
    }


def totals_by_currency(queryset, amount_field='amount'):
    out = {}
    for row in queryset.values('student_fee__currency').annotate(total=Sum(amount_field)):
        out[row['student_fee__currency'] or 'USD'] = float(row['total'] or 0)
    return out
