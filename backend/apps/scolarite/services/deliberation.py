"""
Délibération LMD : calcul des moyennes, crédits capitalisés et décisions.

Règles (paramétrables dans la configuration académique) :
  * note de cours /20 = moyenne pondérée des catégories (interro, TP, examen…), avec les
    pondérations propres au cours, sinon les pondérations institutionnelles ;
  * en 2e session, la note d'examen de rattrapage remplace celle de 1re session et la
    meilleure des deux notes de cours est retenue ;
  * note d'UE = moyenne des cours de l'UE pondérée par leurs crédits ; un cours sans UE
    forme une UE à lui seul ;
  * UE validée si note ≥ seuil de passage ; compensation possible (si activée) quand la note
    d'UE ≥ seuil de compensation et la moyenne générale ≥ seuil de passage ;
  * notes manquantes → « défaillant » ;
  * tous les crédits → « admis » + mention ; sinon 1re session → « ajourné » ;
    2e session → « admis avec dette » si crédits ≥ ratio minimal, sinon « redouble ».
"""
from collections import defaultdict
from decimal import ROUND_HALF_UP, Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.core.audit import audit

from ..models import Deliberation, InscriptionAnnuelle, ResultatDeliberation
from .assiduite import exam_admissible

TWO = Decimal('0.01')


def _q(value):
    return Decimal(value).quantize(TWO, rounding=ROUND_HALF_UP)


def mention_for(moyenne):
    m = Decimal(moyenne)
    if m >= 18:
        return 'plus_grande_distinction'
    if m >= 16:
        return 'grande_distinction'
    if m >= 14:
        return 'distinction'
    if m >= 10:
        return 'satisfaction'
    return ''


def _weights_for(course, categories_seen):
    from apps.grades.models import CourseGradeWeight
    overrides = {w.category_id: Decimal(w.weight) for w in CourseGradeWeight.objects.filter(course=course)}
    if overrides:
        return overrides, True
    return {c.id: Decimal(c.weight) for c in categories_seen if c.weight}, False


def course_score(student, course, session=1, exclude_exam=False):
    """
    Retourne (note_sur_20 | None, manquant: bool).
    Seules les notes publiées (feuille approuvée/verrouillée) comptent.
    exclude_exam : étudiant non admis à l'examen (assiduité insuffisante) → l'examen compte 0.
    """
    from apps.grades.models import Grade
    grades = list(Grade.objects.filter(student=student, course=course, status='validated')
                  .select_related('category'))
    if exclude_exam:
        for g in grades:
            if g.category.category_type == 'examen':
                g.value = 0

    def compute(gs):
        by_cat = defaultdict(list)
        cats = {}
        for g in gs:
            by_cat[g.category_id].append(g)
            cats[g.category_id] = g.category
        weights, explicit = _weights_for(course, cats.values())
        if not weights:
            return None, True
        missing = explicit and any(cat_id not in by_cat for cat_id, w in weights.items() if w > 0)
        num = Decimal(0)
        den = Decimal(0)
        for cat_id, items in by_cat.items():
            w = weights.get(cat_id)
            if not w:
                continue
            pct = sum(Decimal(g.value) / Decimal(g.max_value) for g in items if g.max_value) / len(items)
            num += pct * 20 * w
            den += w
        if den == 0:
            return None, True
        return _q(num / den), missing

    s1 = [g for g in grades if g.exam_session == 1]
    score1, missing1 = compute(s1)
    if session == 1:
        return score1, missing1 or score1 is None
    # 2e session : l'examen de rattrapage remplace l'examen de 1re session
    rattrapage = [g for g in grades if g.exam_session == 2]
    if not rattrapage:
        return score1, missing1 or score1 is None
    exam_cats = {g.category_id for g in rattrapage}
    s2 = [g for g in s1 if g.category_id not in exam_cats] + rattrapage
    score2, missing2 = compute(s2)
    best = max([s for s in (score1, score2) if s is not None], default=None)
    return best, (best is None) or (missing2 and missing1)


def compute_student(deliberation, student, courses, config):
    passing = Decimal(config.passing_grade) / Decimal(config.max_grade) * 20
    comp_threshold = Decimal(config.compensation_threshold) / Decimal(config.max_grade) * 20
    ues = defaultdict(lambda: {'courses': [], 'credits': 0})
    for course in courses:
        key = course.ue.code if course.ue_id else f"EC-{course.code}"
        label = course.ue.intitule if course.ue_id else course.name
        ues[key]['label'] = label
        ues[key]['credits'] += course.credits or 0
        ues[key]['courses'].append(course)

    any_missing = False
    ue_rows = []
    total_credits = 0
    weighted = Decimal(0)
    for code, data in ues.items():
        num = Decimal(0)
        den = 0
        course_rows = []
        ue_missing = False
        for course in data['courses']:
            admissible, rate, _seuil = exam_admissible(student, course)
            score, missing = course_score(student, course, deliberation.session, exclude_exam=not admissible)
            ue_missing = ue_missing or missing
            course_rows.append({'course_id': course.id, 'code': course.code, 'intitule': course.name,
                                'credits': course.credits, 'note': float(score) if score is not None else None,
                                'manquante': missing,
                                'assiduite': float(rate) if rate is not None else None,
                                'non_admis_examen': not admissible})
            if score is not None and course.credits:
                num += score * course.credits
                den += course.credits
        note_ue = _q(num / den) if den else None
        any_missing = any_missing or ue_missing
        total_credits += data['credits']
        if note_ue is not None:
            weighted += note_ue * data['credits']
        ue_rows.append({'ue_code': code, 'intitule': data['label'], 'credits': data['credits'],
                        'note': float(note_ue) if note_ue is not None else None, 'cours': course_rows,
                        'validee': bool(note_ue is not None and note_ue >= passing), 'compensee': False})

    moyenne = _q(weighted / total_credits) if total_credits else Decimal(0)
    if config.allow_compensation and moyenne >= passing:
        for row in ue_rows:
            if not row['validee'] and row['note'] is not None and Decimal(str(row['note'])) >= comp_threshold:
                row['compensee'] = True
                row['validee'] = True
    credits = sum(r['credits'] for r in ue_rows if r['validee'])

    if any_missing:
        decision = 'defaillant'
    elif credits >= total_credits and total_credits > 0:
        decision = 'admis'
    elif deliberation.session == 1:
        decision = 'ajourne'
    else:
        ratio = Decimal(credits) / Decimal(total_credits) * 100 if total_credits else Decimal(0)
        decision = 'admis_dette' if ratio >= Decimal(config.min_credits_ratio_passage) else 'redouble'
    return {
        'moyenne': moyenne, 'credits_obtenus': credits, 'credits_total': total_credits, 'decision': decision,
        'mention': mention_for(moyenne) if decision in ('admis', 'admis_dette') else '',
        'details': {'ues': ue_rows, 'seuil_passage': float(passing), 'session': deliberation.session},
    }


def students_of(deliberation):
    """Étudiants de la délibération : inscrits actifs du groupe (1re session) ou ajournés (2e)."""
    from apps.users.models import User
    if deliberation.session == 2:
        first = Deliberation.objects.filter(auditoire=deliberation.auditoire, session=1).first()
        if first:
            ids = first.resultats.filter(decision__in=['ajourne', 'defaillant']).values_list('student_id', flat=True)
            return User.objects.filter(id__in=list(ids))
    ins_ids = InscriptionAnnuelle.objects.filter(auditoire=deliberation.auditoire).exclude(
        statut__in=['abandon', 'suspendue']).values_list('student_id', flat=True)
    legacy = User.objects.filter(role='etudiant', auditoire=deliberation.auditoire, is_active=True)
    return (User.objects.filter(id__in=list(ins_ids)) | legacy).distinct()


def _assert_jury(deliberation, user, president_only=False):
    from apps.users.permissions import has_role
    if has_role(user, 'sga', 'pdg'):
        return
    if president_only and deliberation.president_id != user.id:
        raise PermissionDenied("Action réservée au président du jury ou au SGA.")
    if user.id not in deliberation.jury_ids():
        raise PermissionDenied("Vous n'êtes pas membre de ce jury.")


@transaction.atomic
def open_deliberation(deliberation, user, force=False):
    from apps.courses.models import Course
    from apps.grades.workflow import lock_sheets, unapproved_courses
    _assert_jury(deliberation, user, president_only=True)
    if deliberation.statut != 'preparation':
        raise ValidationError({'detail': "Cette délibération n'est plus en préparation."})
    courses = list(Course.objects.filter(auditoire=deliberation.auditoire, is_active=True))
    missing = unapproved_courses(courses, deliberation.session)
    if missing and not force:
        raise ValidationError({
            'detail': "Feuilles de notes non approuvées : " + ', '.join(c.name for c in missing[:10]),
            'courses': [c.id for c in missing],
        })
    lock_sheets(courses, deliberation.session, user)
    deliberation.statut = 'ouverte'
    deliberation.opened_at = timezone.now()
    deliberation.save()
    audit('grade', deliberation, user=user, details={'action': 'deliberation_ouverte',
                                                     'feuilles_non_approuvees': len(missing), 'forcee': force})
    compute_results(deliberation, user)
    return deliberation


@transaction.atomic
def compute_results(deliberation, user):
    from apps.courses.models import Course
    from apps.grades.models import AcademicConfig
    _assert_jury(deliberation, user)
    if deliberation.statut not in ('ouverte',):
        raise ValidationError({'detail': "Les résultats se calculent quand la délibération est ouverte."})
    config = AcademicConfig.load()
    courses = list(Course.objects.filter(auditoire=deliberation.auditoire, is_active=True).select_related('ue'))
    count = 0
    for student in students_of(deliberation):
        data = compute_student(deliberation, student, courses, config)
        ins = InscriptionAnnuelle.objects.filter(student=student, auditoire=deliberation.auditoire).first()
        res, created = ResultatDeliberation.objects.get_or_create(
            deliberation=deliberation, student=student,
            defaults={'decision': data['decision'], 'inscription': ins})
        res.moyenne = data['moyenne']
        res.credits_obtenus = data['credits_obtenus']
        res.credits_total = data['credits_total']
        res.decision_calculee = data['decision']
        res.details = data['details']
        res.inscription = ins
        if not res.decision_modifiee:
            res.decision = data['decision']
            res.mention = data['mention']
        res.save()
        count += 1
    # Rang
    for rank, res in enumerate(deliberation.resultats.order_by('-moyenne', 'student__last_name'), start=1):
        if res.rang != rank:
            ResultatDeliberation.objects.filter(pk=res.pk).update(rang=rank)
    return count


@transaction.atomic
def override_decision(result, user, decision, justification, mention=None):
    _assert_jury(result.deliberation, user)
    if result.deliberation.statut != 'ouverte':
        raise ValidationError({'detail': "Une décision ne se modifie que pendant la délibération."})
    if decision not in dict(ResultatDeliberation.DECISION_CHOICES):
        raise ValidationError({'decision': "Décision inconnue."})
    if not (justification or '').strip():
        raise ValidationError({'justification': "La justification est obligatoire."})
    before = result.decision
    result.decision = decision
    result.mention = mention if mention is not None else (
        mention_for(result.moyenne) if decision in ('admis', 'admis_dette') else '')
    result.decision_modifiee = decision != result.decision_calculee
    result.justification = justification.strip()
    result.save()
    audit('grade', result, user=user, details={'action': 'decision_jury', 'avant': before, 'apres': decision,
                                               'justification': justification})
    return result


@transaction.atomic
def close_deliberation(deliberation, user):
    import hashlib
    from django.core.files.base import ContentFile
    from .documents import build_pv_pdf
    _assert_jury(deliberation, user, president_only=True)
    if deliberation.statut != 'ouverte':
        raise ValidationError({'detail': "Seule une délibération ouverte peut être clôturée."})
    if not deliberation.resultats.exists():
        raise ValidationError({'detail': "Aucun résultat : calculez les résultats avant de clôturer."})
    deliberation.statut = 'cloturee'
    deliberation.closed_at = timezone.now()
    pdf = build_pv_pdf(deliberation)
    deliberation.pv_sha256 = hashlib.sha256(pdf).hexdigest()
    deliberation.pv_file.save(f"PV_{deliberation.auditoire_id}_S{deliberation.session}.pdf", ContentFile(pdf),
                              save=False)
    deliberation.save()
    audit('grade', deliberation, user=user, details={'action': 'deliberation_cloturee',
                                                     'pv_sha256': deliberation.pv_sha256})
    return deliberation


@transaction.atomic
def publish(deliberation, user, publication_date=None):
    from apps.users.permissions import has_role
    if not (has_role(user, 'sga', 'pdg') or deliberation.president_id == user.id):
        raise PermissionDenied("La publication revient au SGA ou au président du jury.")
    if deliberation.statut != 'cloturee':
        raise ValidationError({'detail': "Seule une délibération clôturée peut être publiée."})
    deliberation.statut = 'publiee'
    deliberation.publication_date = publication_date or timezone.now()
    deliberation.save()
    _notify_students(deliberation)
    audit('grade', deliberation, user=user, details={'action': 'resultats_publies',
                                                     'date': deliberation.publication_date.isoformat()})
    return deliberation


def _notify_students(deliberation):
    try:
        from apps.notifications.models import Notification
        for res in deliberation.resultats.select_related('student'):
            Notification.objects.create(
                recipient=res.student, title='Résultats publiés',
                message=(f"Les résultats de la {deliberation.get_session_display().lower()} "
                         f"({deliberation.auditoire.nom}) sont disponibles à partir du "
                         f"{deliberation.publication_date:%d/%m/%Y %H:%M}."),
                notification_type='cours', priority='high', link='/mes-resultats',
            )
    except Exception:
        pass
