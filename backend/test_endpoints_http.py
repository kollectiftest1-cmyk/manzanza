"""
Test API endpoints using HTTP requests
Make sure the server is running on http://localhost:8000
"""

import requests
import json

BASE_URL = "http://localhost:8000/api"

# Test endpoints (without authentication for public ones, will need auth for protected ones)
endpoints = [
    # Public endpoints
    ("POST", "/auth/login/", {"email": "test@test.com", "password": "test"}, "Login"),

    # Protected endpoints (will test if accessible)
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
    ("GET", "/inscriptions/pre-inscriptions/", {}, "Pre-Inscriptions"),
    ("GET", "/notifications/", {}, "Notifications"),
    ("GET", "/announcements/", {}, "Announcements"),
    ("GET", "/assignments/", {}, "Assignments"),
    ("GET", "/submissions/", {}, "Submissions"),
    ("GET", "/quizzes/", {}, "Quizzes"),
    ("GET", "/questions/", {}, "Questions"),
    ("GET", "/books/", {}, "Books"),
    ("GET", "/book-loans/", {}, "Book Loans"),
    ("GET", "/employees/", {}, "Employees"),
    ("GET", "/contracts/", {}, "Contracts"),
    ("GET", "/payrolls/", {}, "Payrolls"),
    ("GET", "/leaves/", {}, "Leaves"),
    ("GET", "/chat/channels/", {}, "Chat Channels"),
    ("GET", "/chat/messages/", {}, "Messages"),
    ("GET", "/fee-types/", {}, "Fee Types"),
    ("GET", "/student-fees/", {}, "Student Fees"),
    ("GET", "/payments/", {}, "Payments"),
    ("GET", "/payments/vouchers/", {}, "Payment Vouchers"),
    ("GET", "/payments/receipts/", {}, "Payment Receipts"),
    ("GET", "/academic-calendar/", {}, "Academic Calendar"),
]

print("=" * 80)
print("TESTING API ENDPOINTS (HTTP)")
print("=" * 80)
print("NOTE: Server must be running on http://localhost:8000")
print("=" * 80)

errors = []
success = 0
auth_required = 0

for method, path, data, name in endpoints:
    try:
        url = BASE_URL + path

        if method == "GET":
            response = requests.get(url, timeout=5)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=5)

        status = response.status_code

        if status >= 500:
            print(f"❌ {name}: HTTP {status} - SERVER ERROR")
            errors.append((name, status, response.text[:200]))
        elif status == 401 or status == 403:
            print(f"🔒 {name}: HTTP {status} - Auth Required")
            auth_required += 1
        elif status >= 400:
            print(f"⚠️  {name}: HTTP {status} - Client Error")
        else:
            print(f"✅ {name}: HTTP {status}")
            success += 1

    except requests.exceptions.ConnectionError:
        print(f"⚠️  {name}: Connection Error - Server not running?")
    except Exception as e:
        print(f"❌ {name}: Exception - {str(e)[:100]}")
        errors.append((name, "Exception", str(e)))

print("\n" + "=" * 80)
print(f"SUMMARY: {success} success, {auth_required} auth required, {len(errors)} errors")
print("=" * 80)

if errors:
    print(f"\n⚠️  ERRORS FOUND:\n")
    for name, status, detail in errors:
        print(f"\n{name} ({status}):")
        print("-" * 40)
        print(detail)
        print()
