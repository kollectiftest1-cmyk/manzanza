"""
Course URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, CourseEnrollmentViewSet, CourseMaterialViewSet

router = DefaultRouter()
router.register(r'', CourseViewSet, basename='course')
router.register(r'enrollments', CourseEnrollmentViewSet, basename='enrollment')
router.register(r'materials', CourseMaterialViewSet, basename='material')

urlpatterns = [
    path('', include(router.urls)),
]
