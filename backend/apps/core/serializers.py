from rest_framework import serializers
from .models import AcademicCalendarEvent

class AcademicCalendarEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicCalendarEvent
        fields = '__all__'
