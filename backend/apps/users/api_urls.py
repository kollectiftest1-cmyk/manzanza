# backend/apps/users/api_urls.py
from django.urls import path
from .views import StudentListView, TeacherListView

urlpatterns = [
    path('students/', StudentListView.as_view(), name='student-list'),
    path('teachers/', TeacherListView.as_view(), name='teacher-list'),
]
