"""
Test all API endpoints to identify 500 errors
Run this script with: python manage.py shell < test_all_endpoints.py
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import RequestFactory
from django.contrib.auth import get_user_model
from rest_framework.test import force_authenticate
import traceback

User = get_user_model()

# Import all ViewSets
from apps.users.views import UserViewSet, StudentListView, TeacherListView
from apps.auditoires.views import SectionViewSet, FiliereViewSet, AuditoireViewSet
from apps.courses.views import CourseViewSet, CourseEnrollmentViewSet, CourseMaterialViewSet
from apps.courses.attendance_views import AttendanceViewSet, AttendanceSessionViewSet
from apps.courses.assistant_views import TeacherAssistantViewSet
from apps.inscriptions.views import PreInscriptionViewSet
from apps.notifications.views import NotificationViewSet, AnnouncementViewSet
from apps.assignments.views import AssignmentViewSet, SubmissionViewSet, SubmissionCommentViewSet
from apps.quiz.views import QuizViewSet, QuestionViewSet, QuestionOptionViewSet, QuizAttemptViewSet
from apps.library.views import BookViewSet, BookLoanViewSet, BookReservationViewSet
from apps.hr.views import EmployeeViewSet, ContractViewSet, PayrollViewSet, LeaveViewSet
from apps.chat.views import ChatChannelViewSet, MessageViewSet, MessageReactionViewSet
from apps.payments.views import FeeTypeViewSet, StudentFeeViewSet, PaymentViewSet
from apps.payments.payment_views import PaymentVoucherViewSet, PaymentReceiptViewSet, PaymentAuditLogViewSet
from apps.core.views import AcademicCalendarEventViewSet

factory = RequestFactory()

# Create or get a superuser for testing
try:
    admin_user = User.objects.filter(is_superuser=True).first()
    if not admin_user:
        admin_user = User.objects.create_superuser(
            email='test_admin@test.com',
            password='testpass123',
            first_name='Test',
            last_name='Admin'
        )
except Exception as e:
    print(f"❌ Error creating admin user: {e}")
    admin_user = None

# Define all endpoints to test
endpoints = [
    ('Users', UserViewSet, 'list'),
    ('Students', StudentListView, 'get'),
    ('Teachers', TeacherListView, 'get'),
    ('Sections', SectionViewSet, 'list'),
    ('Filieres', FiliereViewSet, 'list'),
    ('Auditoires', AuditoireViewSet, 'list'),
    ('Courses', CourseViewSet, 'list'),
    ('Course Enrollments', CourseEnrollmentViewSet, 'list'),
    ('Course Materials', CourseMaterialViewSet, 'list'),
    ('Attendances', AttendanceViewSet, 'list'),
    ('Attendance Sessions', AttendanceSessionViewSet, 'list'),
    ('Teacher Assistants', TeacherAssistantViewSet, 'list'),
    ('Pre-Inscriptions', PreInscriptionViewSet, 'list'),
    ('Notifications', NotificationViewSet, 'list'),
    ('Announcements', AnnouncementViewSet, 'list'),
    ('Assignments', AssignmentViewSet, 'list'),
    ('Submissions', SubmissionViewSet, 'list'),
    ('Submission Comments', SubmissionCommentViewSet, 'list'),
    ('Quizzes', QuizViewSet, 'list'),
    ('Questions', QuestionViewSet, 'list'),
    ('Question Options', QuestionOptionViewSet, 'list'),
    ('Quiz Attempts', QuizAttemptViewSet, 'list'),
    ('Books', BookViewSet, 'list'),
    ('Book Loans', BookLoanViewSet, 'list'),
    ('Book Reservations', BookReservationViewSet, 'list'),
    ('Employees', EmployeeViewSet, 'list'),
    ('Contracts', ContractViewSet, 'list'),
    ('Payrolls', PayrollViewSet, 'list'),
    ('Leaves', LeaveViewSet, 'list'),
    ('Chat Channels', ChatChannelViewSet, 'list'),
    ('Messages', MessageViewSet, 'list'),
    ('Message Reactions', MessageReactionViewSet, 'list'),
    ('Fee Types', FeeTypeViewSet, 'list'),
    ('Student Fees', StudentFeeViewSet, 'list'),
    ('Payments', PaymentViewSet, 'list'),
    ('Payment Vouchers', PaymentVoucherViewSet, 'list'),
    ('Payment Receipts', PaymentReceiptViewSet, 'list'),
    ('Payment Audit Logs', PaymentAuditLogViewSet, 'list'),
    ('Academic Calendar Events', AcademicCalendarEventViewSet, 'list'),
]

print("=" * 80)
print("TESTING ALL API ENDPOINTS")
print("=" * 80)

errors_found = []
success_count = 0

for name, view_class, action in endpoints:
    try:
        request = factory.get('/')
        if admin_user:
            force_authenticate(request, user=admin_user)

        # Handle different view types
        if hasattr(view_class, 'as_view'):
            # For generic views (ListAPIView, etc.)
            view = view_class.as_view()
            response = view(request)
        else:
            # For ViewSets
            view = view_class.as_view({action: action})
            response = view(request)

        if response.status_code >= 500:
            print(f"❌ {name}: HTTP {response.status_code}")
            errors_found.append((name, response.status_code, str(response.data if hasattr(response, 'data') else 'No data')))
        elif response.status_code >= 400:
            print(f"⚠️  {name}: HTTP {response.status_code} (Client Error)")
        else:
            print(f"✅ {name}: HTTP {response.status_code}")
            success_count += 1

    except Exception as e:
        print(f"❌ {name}: Exception - {str(e)[:100]}")
        errors_found.append((name, 'Exception', traceback.format_exc()))

print("\n" + "=" * 80)
print(f"SUMMARY: {success_count}/{len(endpoints)} endpoints working")
print("=" * 80)

if errors_found:
    print(f"\n⚠️  Found {len(errors_found)} errors:\n")
    for name, status, detail in errors_found:
        print(f"\n{name} ({status}):")
        print("-" * 40)
        print(detail[:500])
        print()
else:
    print("\n✅ All endpoints tested successfully!")
