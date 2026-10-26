"""
Reprise des données existantes (refonte v2) — idempotente :
  1. chaque auditoire est rattaché à son AcademicYear (créée si besoin à partir du libellé) ;
  2. chaque étudiant affecté à un auditoire reçoit une InscriptionAnnuelle « pédagogique »
     (il suivait déjà les cours), avec ses UE éventuelles ;
  3. les frais existants de l'étudiant sont rattachés à cette inscription ;
  4. les cours ayant déjà des notes validées reçoivent une feuille de notes « approuvée »
     (rien ne disparaît pour les étudiants ; les nouvelles notes suivront le circuit).
"""
import re
from datetime import date

from django.db import migrations
from django.utils import timezone


def _label(value):
    m = re.fullmatch(r'\s*(\d{4})\s*-\s*(\d{4})\s*', str(value or ''))
    return f"{m.group(1)}-{m.group(2)}" if m else None


def forwards(apps, schema_editor):
    AcademicYear = apps.get_model('schedules', 'AcademicYear')
    Auditoire = apps.get_model('auditoires', 'Auditoire')
    User = apps.get_model('users', 'User')
    Inscription = apps.get_model('scolarite', 'InscriptionAnnuelle')
    InscriptionUE = apps.get_model('scolarite', 'InscriptionUE')
    UE = apps.get_model('scolarite', 'UniteEnseignement')
    StudentFee = apps.get_model('payments', 'StudentFee')
    Grade = apps.get_model('grades', 'Grade')
    GradeSheet = apps.get_model('grades', 'GradeSheet')

    years = {}

    def year_for(label):
        label = _label(label) or f"{timezone.localdate().year}-{timezone.localdate().year + 1}"
        if label not in years:
            year = AcademicYear.objects.filter(name=label).first()
            if year is None:
                start = int(label[:4])
                year = AcademicYear.objects.create(name=label, start_date=date(start, 9, 1),
                                                   end_date=date(start + 1, 8, 31))
            years[label] = year
        return years[label]

    for aud in Auditoire.objects.filter(deleted_at__isnull=True):
        if aud.academic_year_id is None:
            aud.academic_year = year_for(aud.annee_academique)
            aud.save(update_fields=['academic_year'])

    for student in User.objects.filter(role='etudiant', auditoire__isnull=False, deleted_at__isnull=True):
        aud = Auditoire.objects.get(pk=student.auditoire_id)
        year = aud.academic_year or year_for(aud.annee_academique)
        ins = Inscription.objects.filter(student=student, academic_year=year).first()
        if ins is None:
            ins = Inscription.objects.create(
                student=student, academic_year=year, auditoire=aud, niveau=aud.niveau,
                statut='pedagogique' if student.is_active else 'suspendue', type_inscription='nouvelle',
                notes='Reprise automatique des données (refonte v2)')
            for ue in UE.objects.filter(filiere_id=aud.filiere_id, niveau=aud.niveau):
                InscriptionUE.objects.get_or_create(inscription=ins, ue=ue)
        StudentFee.objects.filter(student=student, inscription__isnull=True).update(inscription=ins)

    now = timezone.now()
    course_ids = Grade.objects.filter(status='validated').values_list('course_id', flat=True).distinct()
    for course_id in course_ids:
        GradeSheet.objects.get_or_create(course_id=course_id, session=1,
                                         defaults={'status': 'approved', 'approved_at': now})


class Migration(migrations.Migration):

    dependencies = [
        ('scolarite', '0001_initial'),
        ('auditoires', '0011_auditoire_academic_year_and_more'),
        ('grades', '0007_alter_grade_unique_together_and_more'),
        ('payments', '0010_studentfee_inscription_contrepassation_decided_by_and_more'),
        ('users', '0007_alter_user_role'),
    ]

    operations = [migrations.RunPython(forwards, migrations.RunPython.noop)]
