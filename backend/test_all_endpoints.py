"""
Smoke-test API ViewSets without starting the HTTP server.

Manual usage:
    python test_all_endpoints.py

This file is intentionally safe to import so `python manage.py test` does not
execute the smoke test as a side effect.
"""

import os
import traceback

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")


def run():
    import django

    django.setup()

    from django.contrib.auth import get_user_model
    from django.test import RequestFactory
    from rest_framework.test import force_authenticate
    from rest_framework.viewsets import ViewSetMixin

    from apps.assignments.views import AssignmentSubmissionViewSet, AssignmentViewSet
    from apps.auditoires.views import AuditoireViewSet, FiliereViewSet, SectionViewSet
    from apps.chat.views import ChatChannelViewSet, MessageReactionViewSet, MessageViewSet
    from apps.core.views import AcademicCalendarEventViewSet
    from apps.courses.assistant_views import TeacherAssistantViewSet
    from apps.courses.attendance_views import AttendanceSessionViewSet, AttendanceViewSet
    from apps.courses.views import CourseEnrollmentViewSet, CourseMaterialViewSet, CourseViewSet
    from apps.grades.views import (
        AcademicConfigViewSet,
        CourseGradeWeightViewSet,
        ExamSessionViewSet,
        GradeCategoryViewSet,
        GradeViewSet,
        TranscriptViewSet,
    )
    from apps.hr.views import ContractViewSet, EmployeeViewSet, LeaveViewSet, PayrollViewSet
    from apps.inscriptions.views import PreInscriptionViewSet
    from apps.library.views import BookLoanViewSet, BookReservationViewSet, BookViewSet
    from apps.notifications.views import AnnouncementViewSet, NotificationViewSet
    from apps.payments.payment_views import (
        PaymentAuditLogViewSet,
        PaymentReceiptViewSet,
        PaymentVoucherViewSet,
    )
    from apps.payments.views import FeeTypeViewSet, FeeViewSet, PaymentViewSet, StudentFeeViewSet
    from apps.quiz.views import QuizAttemptViewSet, QuizViewSet
    from apps.schedules.views import (
        AcademicEventViewSet,
        AcademicYearViewSet,
        RoomReservationViewSet,
        RoomViewSet,
        ScheduleExceptionViewSet,
        ScheduleViewSet,
        TeacherAvailabilityViewSet,
        TermViewSet,
        TimeSlotViewSet,
    )
    from apps.users.views import StudentListView, TeacherListView, UserViewSet

    User = get_user_model()
    factory = RequestFactory()

    admin_user = User.objects.filter(is_superuser=True).first()
    if not admin_user:
        admin_user = User.objects.create_superuser(
            email="test_admin@test.com",
            password="testpass123",
            first_name="Test",
            last_name="Admin",
        )

    endpoints = [
        ("Users", UserViewSet, "list"),
        ("Students", StudentListView, "get"),
        ("Teachers", TeacherListView, "get"),
        ("Sections", SectionViewSet, "list"),
        ("Filieres", FiliereViewSet, "list"),
        ("Auditoires", AuditoireViewSet, "list"),
        ("Courses", CourseViewSet, "list"),
        ("Course Enrollments", CourseEnrollmentViewSet, "list"),
        ("Course Materials", CourseMaterialViewSet, "list"),
        ("Attendances", AttendanceViewSet, "list"),
        ("Attendance Sessions", AttendanceSessionViewSet, "list"),
        ("Teacher Assistants", TeacherAssistantViewSet, "list"),
        ("Pre-Inscriptions", PreInscriptionViewSet, "list"),
        ("Notifications", NotificationViewSet, "list"),
        ("Announcements", AnnouncementViewSet, "list"),
        ("Assignments", AssignmentViewSet, "list"),
        ("Assignment Submissions", AssignmentSubmissionViewSet, "list"),
        ("Quizzes", QuizViewSet, "list"),
        ("Quiz Attempts", QuizAttemptViewSet, "list"),
        ("Books", BookViewSet, "list"),
        ("Book Loans", BookLoanViewSet, "list"),
        ("Book Reservations", BookReservationViewSet, "list"),
        ("Employees", EmployeeViewSet, "list"),
        ("Contracts", ContractViewSet, "list"),
        ("Payrolls", PayrollViewSet, "list"),
        ("Leaves", LeaveViewSet, "list"),
        ("Chat Channels", ChatChannelViewSet, "list"),
        ("Messages", MessageViewSet, "list"),
        ("Message Reactions", MessageReactionViewSet, "list"),
        ("Fee Types", FeeTypeViewSet, "list"),
        ("Fees", FeeViewSet, "list"),
        ("Student Fees", StudentFeeViewSet, "list"),
        ("Payments", PaymentViewSet, "list"),
        ("Payment Vouchers", PaymentVoucherViewSet, "list"),
        ("Payment Receipts", PaymentReceiptViewSet, "list"),
        ("Payment Audit Logs", PaymentAuditLogViewSet, "list"),
        ("Academic Calendar Events", AcademicCalendarEventViewSet, "list"),
        ("Academic Years", AcademicYearViewSet, "list"),
        ("Terms", TermViewSet, "list"),
        ("Schedule Events", AcademicEventViewSet, "list"),
        ("Rooms", RoomViewSet, "list"),
        ("Room Reservations", RoomReservationViewSet, "list"),
        ("Time Slots", TimeSlotViewSet, "list"),
        ("Schedules", ScheduleViewSet, "list"),
        ("Schedule Exceptions", ScheduleExceptionViewSet, "list"),
        ("Teacher Availability", TeacherAvailabilityViewSet, "list"),
        ("Academic Config", AcademicConfigViewSet, "list"),
        ("Grade Categories", GradeCategoryViewSet, "list"),
        ("Course Grade Weights", CourseGradeWeightViewSet, "list"),
        ("Grades", GradeViewSet, "list"),
        ("Exam Sessions", ExamSessionViewSet, "list"),
        ("Transcripts", TranscriptViewSet, "list"),
    ]

    print("=" * 80)
    print("TESTING API VIEWSETS")
    print("=" * 80)

    errors_found = []
    success_count = 0

    for name, view_class, action in endpoints:
        try:
            request = factory.get("/", HTTP_HOST="localhost")
            force_authenticate(request, user=admin_user)

            if isinstance(view_class, type) and issubclass(view_class, ViewSetMixin):
                view = view_class.as_view({"get": action})
            else:
                view = view_class.as_view()

            response = view(request)

            if response.status_code >= 500:
                print(f"FAIL {name}: HTTP {response.status_code}")
                errors_found.append((name, response.status_code, getattr(response, "data", "")))
            elif response.status_code >= 400:
                print(f"WARN {name}: HTTP {response.status_code}")
            else:
                print(f"OK   {name}: HTTP {response.status_code}")
                success_count += 1

        except Exception:
            print(f"FAIL {name}: exception")
            errors_found.append((name, "Exception", traceback.format_exc()))

    print("\n" + "=" * 80)
    print(f"SUMMARY: {success_count}/{len(endpoints)} endpoints returned < 400")
    print("=" * 80)

    if errors_found:
        print(f"\nFound {len(errors_found)} server errors or exceptions:\n")
        for name, status_code, detail in errors_found:
            print(f"\n{name} ({status_code}):")
            print("-" * 40)
            print(str(detail)[:1000])
        return 1

    print("\nAll smoke-tested endpoints avoided server errors.")
    return 0


if __name__ == "__main__":
    raise SystemExit(run())
