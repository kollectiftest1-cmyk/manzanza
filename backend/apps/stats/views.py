from rest_framework.views import APIView
from rest_framework.response import Response
from apps.users.permissions import IsSGAOrAdmin  # Import your custom permission
from apps.users.models import User
from apps.courses.models import Course
from apps.auditoires.models import Auditoire, Section

class SGADashboardStats(APIView):
    permission_classes = [IsSGAOrAdmin]  # Use your custom permission

    def get(self, request):
        total_students = User.objects.filter(role='etudiant', is_active=True).count()
        pending_inscriptions = User.objects.filter(status='inactif', role='etudiant').count()
        total_sections = Section.objects.count()
        total_auditoires = Auditoire.objects.count()

        # Nouvelles stats pour cours et enseignants
        total_courses = Course.objects.filter(is_active=True).count()
        total_teachers = User.objects.filter(role__in=['enseignant', 'assistant'], is_active=True).count()

        return Response({
            'total_students': total_students,
            'pending_inscriptions': pending_inscriptions,
            'total_sections': total_sections,
            'total_auditoires': total_auditoires,
            'total_courses': total_courses,
            'total_teachers': total_teachers,
        })
