"""
Assiduité des étudiants (LMD) : taux de présence par cours, calculé sur les séances
d'appel clôturées. Sert à la règle d'admission à l'examen (AcademicConfig.min_attendance_percent).
"""
from decimal import Decimal


def attendance_rate(student, course):
    """Pourcentage de présence (None s'il n'y a eu aucune séance clôturée)."""
    from apps.courses.attendance_models import Attendance, AttendanceSession
    from apps.grades.models import AcademicConfig
    sessions = AttendanceSession.objects.filter(course=course, is_finalized=True)
    total = sessions.count()
    if not total:
        return None
    ok_status = ['present', 'excuse'] + (['retard'] if AcademicConfig.load().include_retard_in_presence else [])
    present = Attendance.objects.filter(student=student, session__in=sessions, status__in=ok_status).count()
    return (Decimal(present) * 100 / Decimal(total)).quantize(Decimal('0.1'))


def exam_admissible(student, course):
    """(admissible: bool, taux: Decimal|None, seuil: Decimal)."""
    from apps.grades.models import AcademicConfig
    threshold = Decimal(AcademicConfig.load().min_attendance_percent or 0)
    rate = attendance_rate(student, course)
    if threshold <= 0 or rate is None:
        return True, rate, threshold
    return rate >= threshold, rate, threshold
