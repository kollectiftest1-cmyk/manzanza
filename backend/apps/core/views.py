from rest_framework import viewsets
from .models import AcademicCalendarEvent
from .serializers import AcademicCalendarEventSerializer
from apps.users.permissions import IsAdminUser

class AcademicCalendarEventViewSet(viewsets.ModelViewSet):
    queryset = AcademicCalendarEvent.objects.all()
    serializer_class = AcademicCalendarEventSerializer
    permission_classes = [IsAdminUser]
