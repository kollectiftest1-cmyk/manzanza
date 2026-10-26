"""
Inscriptions annuelles : création, validation administrative/pédagogique, réinscription
après délibération, reprise des données historiques (user.auditoire).
"""
from datetime import date

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.core.audit import audit

from ..models import NIVEAU_SUIVANT, NIVEAUX_TERMINAUX, InscriptionAnnuelle, InscriptionUE, UniteEnseignement
from .finance import admin_fees_settled, generate_fees_for_inscription


def academic_year_for_label(label, create=True):
    """Retrouve (ou crée) l'AcademicYear correspondant à un libellé « 2026-2027 »."""
    from apps.schedules.models import AcademicYear
    from apps.auditoires.models import normalize_academic_year_label

    label = normalize_academic_year_label(label)
    year = AcademicYear.all_objects.filter(name=label).first()
    if year is not None:
        if year.deleted_at is not None:
            AcademicYear.all_objects.filter(pk=year.pk).update(deleted_at=None, deleted_by=None)
            year.refresh_from_db()
        return year
    if not create:
        return None
    try:
        start = int(label[:4])
    except (TypeError, ValueError):
        start = timezone.localdate().year
    return AcademicYear.objects.create(name=label, start_date=date(start, 9, 1), end_date=date(start + 1, 8, 31))


def current_year():
    from apps.schedules.models import AcademicYear
    return AcademicYear.objects.filter(is_current=True).first()


@transaction.atomic
def create_inscription(student, auditoire, user=None, type_inscription='nouvelle', decision_precedente='',
                       academic_year=None):
    if student.role != 'etudiant':
        raise ValidationError({'student': "Seul un étudiant peut être inscrit."})
    year = academic_year or auditoire.academic_year or academic_year_for_label(auditoire.annee_academique)
    if auditoire.academic_year_id != year.id:
        auditoire.academic_year = year
        auditoire.save()
    if InscriptionAnnuelle.objects.filter(student=student, academic_year=year).exists():
        raise ValidationError({'detail': f"{student} est déjà inscrit pour l'année {year}."})
    effectif = InscriptionAnnuelle.objects.filter(auditoire=auditoire,
                                                  statut__in=InscriptionAnnuelle.ACTIVE_STATUTS).count()
    if auditoire.capacite_max and effectif >= auditoire.capacite_max:
        raise ValidationError({'detail': f"Le groupe {auditoire.nom} est complet ({effectif}/{auditoire.capacite_max})."})
    ins = InscriptionAnnuelle.objects.create(
        student=student, academic_year=year, auditoire=auditoire, niveau=auditoire.niveau,
        type_inscription=type_inscription, decision_precedente=decision_precedente, created_by=user)
    generate_fees_for_inscription(ins)
    generate_pedagogique(ins)
    audit('inscription', ins, user=user, details={'action': 'inscription_annuelle', 'type': type_inscription,
                                                  'groupe': auditoire.nom, 'annee': year.name})
    return ins


def generate_pedagogique(ins, dettes=None):
    """UE de l'année (filière + niveau) + éventuelles dettes de crédits."""
    ues = UniteEnseignement.objects.filter(filiere=ins.auditoire.filiere, niveau=ins.niveau, is_active=True)
    for ue in ues:
        InscriptionUE.objects.get_or_create(inscription=ins, ue=ue)
    for ue in dettes or []:
        obj, created = InscriptionUE.objects.get_or_create(inscription=ins, ue=ue, defaults={'is_dette': True})
        if not created and not obj.is_dette:
            obj.is_dette = True
            obj.save(update_fields=['is_dette'])


@transaction.atomic
def validate_admin(ins, user, force=False):
    if ins.statut not in ('en_attente',):
        raise ValidationError({'detail': "Seule une inscription en attente peut être validée administrativement."})
    if not force and not admin_fees_settled(ins):
        raise ValidationError({'detail': "Les frais requis pour l'inscription administrative ne sont pas réglés."})
    ins.statut = 'administrative'
    ins.admin_validated_at = timezone.now()
    ins.admin_validated_by = user
    ins.save()
    audit('inscription', ins, user=user, details={'action': 'validation_administrative', 'forcee': force})
    return ins


@transaction.atomic
def validate_peda(ins, user):
    if ins.statut != 'administrative':
        raise ValidationError({'detail': "L'inscription administrative doit être validée d'abord."})
    ins.statut = 'pedagogique'
    ins.peda_validated_at = timezone.now()
    ins.peda_validated_by = user
    ins.save()
    _sync_course_enrollments(ins)
    audit('inscription', ins, user=user, details={'action': 'validation_pedagogique',
                                                  'ue': ins.ues.count()})
    return ins


def _sync_course_enrollments(ins):
    """Inscrit l'étudiant aux cours de son groupe (et aux cours des UE en dette s'ils existent)."""
    from apps.courses.models import Course, CourseEnrollment
    courses = list(Course.objects.filter(auditoire=ins.auditoire, is_active=True))
    dette_ues = ins.ues.filter(is_dette=True).values_list('ue_id', flat=True)
    courses += list(Course.objects.filter(ue_id__in=list(dette_ues), is_active=True,
                                          auditoire__academic_year=ins.academic_year))
    for course in courses:
        enr, created = CourseEnrollment.objects.get_or_create(student=ins.student, course=course)
        if not created and not enr.is_active:
            enr.is_active = True
            enr.save(update_fields=['is_active'])


@transaction.atomic
def prepare_reinscriptions(deliberation, next_year, user):
    """
    À partir d'une délibération finale, prépare les inscriptions de l'année suivante :
    admis → niveau supérieur ; admis avec dette → niveau supérieur + UE en dette ;
    redouble / ajourné en fin de 2e session → même niveau ; fin de cycle admis → diplômé.
    """
    from apps.auditoires.utils import find_or_create_auditoire

    summary = {'passages': 0, 'redoublements': 0, 'diplomes': 0, 'ignores': 0}
    auditoire = deliberation.auditoire
    for res in deliberation.resultats.select_related('student', 'inscription'):
        student = res.student
        if res.decision in ('admis', 'admis_dette'):
            if auditoire.niveau in NIVEAUX_TERMINAUX and res.decision == 'admis' and auditoire.niveau == 'M2':
                if res.inscription:
                    res.inscription.statut = 'diplome'
                    res.inscription.save()
                summary['diplomes'] += 1
                continue
            niveau = NIVEAU_SUIVANT.get(auditoire.niveau)
            if niveau is None:
                summary['ignores'] += 1
                continue
            type_ins = 'reinscription'
        elif res.decision in ('redouble', 'ajourne') and deliberation.session == 2:
            niveau = auditoire.niveau
            type_ins = 'redoublement'
        else:
            summary['ignores'] += 1
            continue
        target, _ = find_or_create_auditoire(auditoire.filiere, niveau, auditoire.vacation,
                                             annee_academique=next_year.name, created_by=user)
        if InscriptionAnnuelle.objects.filter(student=student, academic_year=next_year).exists():
            summary['ignores'] += 1
            continue
        try:
            ins = create_inscription(student, target, user=user, type_inscription=type_ins,
                                     decision_precedente=res.get_decision_display(), academic_year=next_year)
        except ValidationError:
            summary['ignores'] += 1
            continue
        if res.decision == 'admis_dette':
            dettes = [ue for ue in UniteEnseignement.objects.filter(
                code__in=[d['ue_code'] for d in res.details.get('ues', []) if not d.get('validee')])]
            generate_pedagogique(ins, dettes=dettes)
        summary['passages' if type_ins == 'reinscription' else 'redoublements'] += 1
    audit('inscription', deliberation, user=user, details={'action': 'reinscriptions_preparees',
                                                           'annee': next_year.name, **summary})
    return summary


def backfill_from_legacy(apps_registry=None):
    """
    Reprise des données : chaque étudiant rattaché à un auditoire reçoit une inscription
    annuelle (statut pédagogique validé : il suivait déjà les cours) pour l'année du groupe.
    Utilisé par la migration de données ; idempotent.
    """
    from apps.users.models import User
    created = 0
    for student in User.objects.filter(role='etudiant', auditoire__isnull=False).select_related('auditoire'):
        aud = student.auditoire
        year = aud.academic_year or academic_year_for_label(aud.annee_academique)
        if aud.academic_year_id != year.id:
            type(aud).objects.filter(pk=aud.pk).update(academic_year=year)
        if InscriptionAnnuelle.all_objects.filter(student=student, academic_year=year).exists():
            continue
        InscriptionAnnuelle.objects.create(student=student, academic_year=year, auditoire=aud, niveau=aud.niveau,
                                           statut='pedagogique', type_inscription='nouvelle',
                                           notes='Reprise automatique des données (refonte v2)')
        created += 1
    return created
