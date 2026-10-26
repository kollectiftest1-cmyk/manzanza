"""
Workflow des feuilles de notes (phase 2 du cahier des charges v2).

    brouillon ──soumettre (titulaire)──▶ soumise ──approuver (chef / SGA)──▶ approuvée
        ▲                                   │                                   │
        └──────────renvoyer (motif)─────────┘          ouverture délibération ──▶ verrouillée

  * Une note ne se crée / modifie / supprime que si la feuille est en brouillon.
  * À l'approbation, les notes deviennent visibles par l'étudiant (statut « validated »).
  * Après verrouillage, toute correction passe par une GradeCorrectionRequest tranchée
    par le président du jury ou le SGA, avec trace dans le journal d'audit.
"""
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.core.audit import audit

from .models import Grade, GradeCorrectionRequest, GradeSheet


class SheetLocked(ValidationError):
    pass


def get_sheet(course, session=1):
    sheet, _ = GradeSheet.objects.get_or_create(course=course, session=session or 1)
    return sheet


def assert_editable(course, session=1):
    sheet = get_sheet(course, session)
    if not sheet.is_editable:
        raise SheetLocked({
            'detail': (
                f"La feuille de notes de « {course.name} » (session {sheet.session}) est "
                f"{sheet.get_status_display().lower()} : modification impossible. "
                "Demandez son renvoi en brouillon ou déposez une demande de correction."
            )
        })
    return sheet


def grade_status_for(sheet):
    return 'validated' if sheet.status in ('approved', 'locked') else 'draft'


def sync_grade(student, course, category, session_number, value, label, exam_session=1):
    """
    Utilisé par les modules Quiz et TP/TD pour reporter une note dans le carnet.
    Si la feuille n'est plus en brouillon, la note n'est pas modifiée (retourne None).
    """
    sheet = get_sheet(course, exam_session)
    if not sheet.is_editable:
        return None
    grade, _ = Grade.all_objects.update_or_create(
        student=student, course=course, category=category,
        session_number=session_number, exam_session=exam_session,
        defaults={'value': value, 'max_value': 20, 'label': label, 'status': 'draft',
                  'deleted_at': None, 'deleted_by': None},
    )
    return grade


def _is_chef_of(user, course):
    from apps.users.permissions import has_role, manages_course, teaches_course
    if has_role(user, 'sga', 'pdg'):
        return True
    if has_role(user, 'chef_section', 'chef_departement') and manages_course(user, course):
        return not teaches_course(user, course)  # on ne valide pas ses propres notes
    return False


@transaction.atomic
def submit(sheet, user):
    from apps.users.permissions import teaches_course, has_role
    if not (teaches_course(user, sheet.course) or has_role(user, 'sga', 'pdg')):
        raise PermissionDenied("Seul un enseignant du cours peut soumettre la feuille.")
    if sheet.status != 'draft':
        raise ValidationError({'detail': "Seule une feuille en brouillon peut être soumise."})
    sheet.status = 'submitted'
    sheet.submitted_by = user
    sheet.submitted_at = timezone.now()
    sheet.return_reason = ''
    sheet.save()
    audit('grade', sheet, user=user, details={'action': 'feuille_soumise', 'session': sheet.session})
    return sheet


@transaction.atomic
def approve(sheet, user):
    if not _is_chef_of(user, sheet.course):
        raise PermissionDenied("L'approbation revient au chef de filière, au chef de section ou au SGA.")
    if sheet.status != 'submitted':
        raise ValidationError({'detail': "Seule une feuille soumise peut être approuvée."})
    sheet.status = 'approved'
    sheet.approved_by = user
    sheet.approved_at = timezone.now()
    sheet.save()
    Grade.objects.filter(course=sheet.course, exam_session=sheet.session).update(status='validated')
    _recompute_course(sheet.course)
    audit('grade', sheet, user=user, details={'action': 'feuille_approuvee', 'session': sheet.session})
    return sheet


@transaction.atomic
def send_back(sheet, user, reason):
    """Renvoi en brouillon : par le chef (feuille soumise) ou le SGA (feuille approuvée)."""
    from apps.users.permissions import has_role
    reason = (reason or '').strip()
    if not reason:
        raise ValidationError({'reason': "Le motif du renvoi est obligatoire."})
    if sheet.status == 'submitted':
        if not _is_chef_of(user, sheet.course):
            raise PermissionDenied("Seul un validateur peut renvoyer cette feuille.")
    elif sheet.status == 'approved':
        if not has_role(user, 'sga', 'pdg'):
            raise PermissionDenied("Seul le SGA peut rouvrir une feuille approuvée.")
    else:
        raise ValidationError({'detail': "Cette feuille ne peut pas être renvoyée (brouillon ou verrouillée)."})
    sheet.status = 'draft'
    sheet.return_reason = reason
    sheet.save()
    Grade.objects.filter(course=sheet.course, exam_session=sheet.session).update(status='draft')
    _recompute_course(sheet.course)
    audit('grade', sheet, user=user, details={'action': 'feuille_renvoyee', 'motif': reason})
    return sheet


def lock_sheets(courses, session, user=None):
    now = timezone.now()
    count = GradeSheet.objects.filter(course__in=courses, session=session, status='approved').update(
        status='locked', locked_at=now)
    return count


def unapproved_courses(courses, session):
    approved = set(GradeSheet.objects.filter(course__in=courses, session=session,
                                             status__in=['approved', 'locked']).values_list('course_id', flat=True))
    return [c for c in courses if c.id not in approved]


@transaction.atomic
def request_correction(grade, user, new_value, reason):
    from apps.users.permissions import manages_course
    if not manages_course(user, grade.course):
        raise PermissionDenied("Vous ne pouvez demander une correction que pour vos cours.")
    if not (reason or '').strip():
        raise ValidationError({'reason': "Le motif est obligatoire."})
    if grade.correction_requests.filter(status='pending').exists():
        raise ValidationError({'detail': "Une demande est déjà en attente pour cette note."})
    req = GradeCorrectionRequest.objects.create(
        grade=grade, old_value=grade.value, new_value=new_value, reason=reason.strip(), requested_by=user)
    audit('grade', grade, user=user, details={'action': 'correction_demandee', 'avant': str(grade.value),
                                              'apres': str(new_value), 'motif': reason})
    return req


@transaction.atomic
def decide_correction(req, user, accept, note=''):
    from apps.users.permissions import has_role
    from apps.scolarite.models import Deliberation
    course = req.grade.course
    is_president = Deliberation.objects.filter(
        auditoire=course.auditoire, president=user, statut__in=['ouverte', 'preparation']).exists()
    if not (is_president or has_role(user, 'sga', 'pdg')):
        raise PermissionDenied("La décision revient au président du jury ou au SGA.")
    if req.requested_by_id == user.id:
        raise PermissionDenied("Vous ne pouvez pas trancher votre propre demande.")
    if req.status != 'pending':
        raise ValidationError({'detail': "Demande déjà traitée."})
    req.status = 'approved' if accept else 'rejected'
    req.decided_by = user
    req.decided_at = timezone.now()
    req.decision_note = note or ''
    req.save()
    if accept:
        grade = req.grade
        if req.new_value > grade.max_value or req.new_value < 0:
            raise ValidationError({'new_value': "Note hors barème."})
        grade.value = req.new_value
        grade.save(update_fields=['value'])
        _recompute_course(course)
    audit('grade', req.grade, user=user, details={
        'action': 'correction_acceptee' if accept else 'correction_refusee',
        'avant': str(req.old_value), 'apres': str(req.new_value), 'note': note})
    return req


def _recompute_course(course):
    from apps.users.models import User
    from .views import _recompute_transcript
    for student in User.objects.filter(grades__course=course).distinct():
        _recompute_transcript(student, course.auditoire)
