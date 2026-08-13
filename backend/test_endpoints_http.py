"""
Manual HTTP smoke test for the API.

Usage:
    python test_endpoints_http.py

The Django development server must already be running on http://localhost:8000.
This file is safe to import during `python manage.py test`.
"""

import requests

BASE_URL = "http://localhost:8000/api"


def run():
    endpoints = [
        ("POST", "/auth/login/", {"email": "admin@syntaxgu.ac.cd", "password": "password123"}, "Login"),
        ("GET", "/users/", {}, "Users List"),
        ("GET", "/students/", {}, "Students List"),
        ("GET", "/teachers/", {}, "Teachers List"),
        ("GET", "/sections/", {}, "Sections"),
        ("GET", "/filieres/", {}, "Filieres"),
        ("GET", "/auditoires/", {}, "Auditoires"),
        ("GET", "/courses/", {}, "Courses"),
        ("GET", "/courses/enrollments/", {}, "Course Enrollments"),
        ("GET", "/courses/materials/", {}, "Course Materials"),
        ("GET", "/courses/attendances/", {}, "Attendances"),
        ("GET", "/courses/attendance-sessions/", {}, "Attendance Sessions"),
        ("GET", "/courses/teacher-assistants/", {}, "Teacher Assistants"),
        ("GET", "/inscriptions/", {}, "Pre-Inscriptions"),
        ("GET", "/notifications/", {}, "Notifications"),
        ("GET", "/notifications/announcements/", {}, "Announcements"),
        ("GET", "/assignments/", {}, "Assignments"),
        ("GET", "/assignments/submissions/", {}, "Assignment Submissions"),
        ("GET", "/quiz/", {}, "Quizzes"),
        ("GET", "/quiz/attempts/", {}, "Quiz Attempts"),
        ("GET", "/library/books/", {}, "Books"),
        ("GET", "/library/loans/", {}, "Book Loans"),
        ("GET", "/library/reservations/", {}, "Book Reservations"),
        ("GET", "/hr/employees/", {}, "Employees"),
        ("GET", "/hr/contracts/", {}, "Contracts"),
        ("GET", "/hr/payrolls/", {}, "Payrolls"),
        ("GET", "/hr/leaves/", {}, "Leaves"),
        ("GET", "/chat/channels/", {}, "Chat Channels"),
        ("GET", "/chat/messages/", {}, "Messages"),
        ("GET", "/payments/fee-types/", {}, "Fee Types"),
        ("GET", "/payments/fees/", {}, "Fees"),
        ("GET", "/payments/student-fees/", {}, "Student Fees"),
        ("GET", "/payments/", {}, "Payments"),
        ("GET", "/payments/vouchers/", {}, "Payment Vouchers"),
        ("GET", "/payments/receipts/", {}, "Payment Receipts"),
        ("GET", "/payments/audit-logs/", {}, "Payment Audit Logs"),
        ("GET", "/schedules/academic-years/", {}, "Academic Years"),
        ("GET", "/schedules/terms/", {}, "Terms"),
        ("GET", "/schedules/schedules/", {}, "Schedules"),
        ("GET", "/schedules/availability/", {}, "Teacher Availability"),
        ("GET", "/grades/config/", {}, "Academic Config"),
        ("GET", "/grades/grades/", {}, "Grades"),
    ]

    print("=" * 80)
    print("TESTING API ENDPOINTS (HTTP)")
    print("=" * 80)
    print("NOTE: server must be running on http://localhost:8000")
    print("=" * 80)

    errors = []
    success = 0
    auth_required = 0

    for method, path, data, name in endpoints:
        try:
            url = BASE_URL + path

            if method == "GET":
                response = requests.get(url, timeout=5)
            else:
                response = requests.post(url, json=data, timeout=5)

            status_code = response.status_code

            if status_code >= 500:
                print(f"FAIL {name}: HTTP {status_code} - server error")
                errors.append((name, status_code, response.text[:500]))
            elif status_code in (401, 403):
                print(f"AUTH {name}: HTTP {status_code} - authentication required")
                auth_required += 1
            elif status_code >= 400:
                print(f"WARN {name}: HTTP {status_code} - client error")
            else:
                print(f"OK   {name}: HTTP {status_code}")
                success += 1

        except requests.exceptions.ConnectionError:
            print(f"WARN {name}: connection error - server not running")
        except Exception as exc:
            print(f"FAIL {name}: exception - {str(exc)[:100]}")
            errors.append((name, "Exception", str(exc)))

    print("\n" + "=" * 80)
    print(f"SUMMARY: {success} success, {auth_required} auth required, {len(errors)} errors")
    print("=" * 80)

    if errors:
        print("\nERRORS FOUND:\n")
        for name, status_code, detail in errors:
            print(f"\n{name} ({status_code}):")
            print("-" * 40)
            print(detail)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(run())
