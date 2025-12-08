# backend/apps/users/api_urls.py
from django.urls import path
from .views import StudentListView, TeacherListView
from .teacher_stats_views import teacher_statistics

urlpatterns = [
    path('students/', StudentListView.as_view(), name='student-list'),
    path('teachers/', TeacherListView.as_view(), name='teacher-list'),
    path('users/<int:user_id>/teacher-stats/', teacher_statistics, name='teacher-statistics'),
]
