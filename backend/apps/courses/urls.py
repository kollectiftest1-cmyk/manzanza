"""
Course URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, CourseEnrollmentViewSet, CourseMaterialViewSet
from .attendance_views import AttendanceViewSet, AttendanceSessionViewSet
from .assistant_views import TeacherAssistantViewSet

router = DefaultRouter()
# Register specific routes first to avoid conflicts with the empty string route
router.register(r'attendance-sessions', AttendanceSessionViewSet, basename='attendance-session')
router.register(r'teacher-assistants', TeacherAssistantViewSet, basename='teacher-assistant')
router.register(r'enrollments', CourseEnrollmentViewSet, basename='enrollment')
router.register(r'materials', CourseMaterialViewSet, basename='material')
router.register(r'attendances', AttendanceViewSet, basename='attendance')
# Register the main CourseViewSet last with empty string to catch /api/courses/ endpoints
router.register(r'', CourseViewSet, basename='course')

urlpatterns = [
    path('', include(router.urls)),
]
