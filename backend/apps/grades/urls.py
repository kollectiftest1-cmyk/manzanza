"""
URLs for grades, averages, bulletins, academic configuration
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AcademicConfigViewSet, GradeCategoryViewSet, CourseGradeWeightViewSet,
    GradeViewSet, ExamSessionViewSet, TranscriptViewSet,
    GradeSheetViewSet, GradeCorrectionRequestViewSet,
)

router = DefaultRouter()
router.register(r'config',        AcademicConfigViewSet,  basename='academicconfig')
router.register(r'categories',    GradeCategoryViewSet,    basename='gradecategory')
router.register(r'weights',       CourseGradeWeightViewSet, basename='coursegradeweight')
router.register(r'grades',        GradeViewSet,            basename='grade')
router.register(r'exams',         ExamSessionViewSet,      basename='examsession')
router.register(r'transcripts',   TranscriptViewSet,       basename='transcript')
router.register(r'sheets',        GradeSheetViewSet,       basename='gradesheet')
router.register(r'corrections',   GradeCorrectionRequestViewSet, basename='gradecorrection')

urlpatterns = [
    path('', include(router.urls)),
]
