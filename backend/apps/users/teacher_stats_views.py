"""
Views for teacher/assistant statistics
"""
from django.db.models import Count, Avg, Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from apps.courses.models import Course, Attendance
from apps.users.models import User


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def teacher_statistics(request, user_id):
    """
    Get comprehensive statistics for a teacher or assistant

    Returns:
    - courses: List of courses with details
    - teacher_stats: Overall statistics
    """
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'Utilisateur non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Vérifier que c'est un enseignant ou assistant
    if user.role not in ['enseignant', 'assistant']:
        return Response(
            {'error': 'Cet utilisateur n\'est pas un enseignant ou assistant'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Récupérer les cours où l'utilisateur est titulaire ou assistant
    # Utiliser Q objects au lieu de union() pour éviter l'erreur ORDER BY
    from django.db.models import Q

    all_courses = Course.objects.filter(
        Q(titulaire=user) | Q(assistants=user),
        is_active=True
    ).select_related(
        'auditoire',
        'auditoire__filiere',
        'auditoire__filiere__section'
    ).distinct()

    # Préparer les données des cours
    courses_data = []
    total_progress = 0
    course_count = 0
    total_attendance_rate = 0
    unique_auditoires = set()  # Track unique auditoires to avoid counting same students twice

    for course in all_courses:
        # Nombre d'étudiants dans l'auditoire du cours
        # Utiliser la relation directe 'students' de l'auditoire (related_name)
        if course.auditoire:
            students_count = course.auditoire.students.filter(
                is_active=True
            ).count()
            # Track unique auditoires for total student count
            unique_auditoires.add(course.auditoire.id)
        else:
            students_count = 0

        # Progression moyenne du cours (peut être calculé depuis les enrollments)
        progress = course.progress_percentage or 0

        # Calculer le taux de présence moyen pour ce cours
        attendances = Attendance.objects.filter(course=course)
        total_att = attendances.count()

        if total_att > 0:
            present_count = attendances.filter(status='present').count()
            attendance_rate = round((present_count / total_att) * 100, 2)
        else:
            attendance_rate = 0

        # Déterminer le rôle dans ce cours
        role_in_course = 'titulaire' if course.titulaire == user else 'assistant'

        # Récupérer les infos de l'auditoire
        auditoire_detail = {
            'id': None,
            'nom': 'N/A',
            'filiere': 'N/A',
            'section': 'N/A',
        }

        if course.auditoire:
            auditoire_detail['id'] = course.auditoire.id
            auditoire_detail['nom'] = course.auditoire.nom
            if course.auditoire.filiere:
                auditoire_detail['filiere'] = course.auditoire.filiere.nom
                if course.auditoire.filiere.section:
                    auditoire_detail['section'] = course.auditoire.filiere.section.nom

        courses_data.append({
            'id': course.id,
            'nom': course.name,
            'code': course.code,
            'role': role_in_course,
            'auditoire_detail': auditoire_detail,
            'students_count': students_count,
            'progress_percentage': progress,
            'attendance_rate': attendance_rate,
            'credits': course.credits,
            'semester': course.semester,
            'annee_academique': course.annee_academique,
        })

        # Accumuler pour les statistiques globales
        total_progress += progress
        total_attendance_rate += attendance_rate
        course_count += 1

    # Calculate total unique students across all auditoires (not per course)
    # This prevents counting same students multiple times when teacher teaches multiple courses in same auditoire
    from apps.auditoires.models import Auditoire
    total_students = 0
    if unique_auditoires:
        for auditoire_id in unique_auditoires:
            try:
                auditoire = Auditoire.objects.get(id=auditoire_id)
                total_students += auditoire.students.filter(is_active=True).count()
            except Auditoire.DoesNotExist:
                pass

    # Calculer les statistiques globales
    teacher_stats = {
        'courses_taught_count': course_count,
        'total_students_managed': total_students,
        'average_student_performance': round(total_progress / course_count, 2) if course_count > 0 else 0,
        'average_attendance_rate': round(total_attendance_rate / course_count, 2) if course_count > 0 else 0,
    }

    return Response({
        'courses': courses_data,
        'teacher_stats': teacher_stats
    })
