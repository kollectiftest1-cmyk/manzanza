# Manzanza - Role-Action Matrix (Quick Reference)

## Role Hierarchy & Access Levels

```
┌─────────────────────────────────────────────────────────┐
│ EXECUTIVE LEVEL (Unrestricted)                          │
│ • PDG - President/CEO                                   │
│ • Directeur Général - General Director                  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ ADMINISTRATIVE LEVEL (Full Management)                  │
│ • SGA - Academic Secretary General (Academic)           │
│ • SGAD - Admin Secretary General (Admin + Financial)    │
│ • iAdmin - System Administrator (Technical)             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ ACADEMIC LEADERSHIP LEVEL (Department/Section Heads)    │
│ • Chef de Section - Section Head                        │
│ • Chef de Département - Department/Option Head          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ TEACHING LEVEL (Course Instructors)                     │
│ • Enseignant - Teacher                                  │
│ • Assistant - Teaching Assistant                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ STUDENT LEVEL (Restricted Access)                       │
│ • Étudiant - Student                                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ SUPPORT STAFF LEVEL (Specialized Functions)             │
│ • Bibliothecaire - Librarian                            │
│ • Caisse - Cashier/Accountant                           │
│ • Service IT - IT Support                               │
│ • Apparitorat - Beadle/Discipline Officer               │
│ • Jury - Thesis Evaluator                               │
└─────────────────────────────────────────────────────────┘
```

---

## Detailed Role-Action Matrix

### 1. PDG (President/CEO)
```
Access Level: UNRESTRICTED (Level 5)
Location: AdminDashboard
Responsibilities: Strategic decisions, system oversight

┌─ COURSES ────────────────────────┐
│ ✓ View all                       │
│ ✓ Create/Edit/Delete            │
│ ✓ Assign teachers/assistants     │
│ ✓ Publish/Archive                │
└──────────────────────────────────┘

┌─ USERS ──────────────────────────┐
│ ✓ Create/Edit/Delete all         │
│ ✓ Change roles                   │
│ ✓ View all data                  │
│ ✓ Manage permissions             │
└──────────────────────────────────┘

┌─ ACADEMIC STRUCTURE ─────────────┐
│ ✓ Create/Edit Sections           │
│ ✓ Create/Edit Filieres           │
│ ✓ Create/Edit Auditoires         │
│ ✓ Manage assignments             │
└──────────────────────────────────┘

┌─ FINANCIAL ──────────────────────┐
│ ✓ Create/Edit/Delete Fees        │
│ ✓ Approve Payments               │
│ ✓ View all financial reports     │
│ ✓ Refund payments                │
└──────────────────────────────────┘

┌─ HR MANAGEMENT ──────────────────┐
│ ✓ Create/Edit Employees          │
│ ✓ Create/Edit Contracts          │
│ ✓ Manage Payroll                 │
│ ✓ Approve Leave Requests         │
│ ✓ Fire employees                 │
└──────────────────────────────────┘

┌─ SCHEDULES ──────────────────────┐
│ ✓ Create/Edit/Delete all         │
│ ✓ Publish schedules              │
│ ✓ Manage academic calendar       │
└──────────────────────────────────┘

┌─ GRADES ─────────────────────────┐
│ ✓ View all grades                │
│ ✓ Edit grades                    │
│ ✓ Configure grading system       │
│ ✓ Generate transcripts           │
└──────────────────────────────────┘
```

---

### 2. Directeur Général (General Director)
```
Access Level: STRATEGIC + ADMINISTRATIVE (Level 4.5)
Location: DirecteurGeneralDashboard
Responsibilities: Academic & financial oversight, strategic decisions

┌─ COURSES ────────────────────────┐
│ ✓ View all                       │
│ ✓ Create/Edit/Delete            │
│ ✓ Publish/Archive                │
│ ✗ Cannot teach                   │
└──────────────────────────────────┘

┌─ USERS ──────────────────────────┐
│ ✓ Create/Edit/Delete             │
│ ✓ Change roles                   │
│ ✓ View all (except iAdmin)       │
│ ✓ Manage HR staff                │
└──────────────────────────────────┘

┌─ ACADEMIC ───────────────────────┐
│ ✓ Create Structure Elements      │
│ ✓ Manage Enrollments             │
│ ✓ Manage Calendars               │
│ ✓ Create Schedules               │
└──────────────────────────────────┘

┌─ FINANCIAL ──────────────────────┐
│ ✓ Create/Edit Fees               │
│ ✓ Approve Payments               │
│ ✓ View financial reports         │
│ ✓ Manage fees (with Caisse)      │
│ ✓ Initiate refunds               │
└──────────────────────────────────┘

┌─ HR MANAGEMENT ──────────────────┐
│ ✓ Create/Edit Employees          │
│ ✓ Create/Edit Contracts          │
│ ✓ Manage Payroll                 │
│ ✓ Approve Leaves                 │
│ ✓ Manage HR policies             │
└──────────────────────────────────┘

┌─ REPORTS ────────────────────────┐
│ ✓ View academic reports          │
│ ✓ View financial reports         │
│ ✓ Export data                    │
└──────────────────────────────────┘
```

---

### 3. SGA (Secrétaire Général Académique - Academic Secretary)
```
Access Level: ACADEMIC ADMINISTRATION (Level 4)
Location: SGADashboard
Responsibilities: Academic operations, enrollments, course management

┌─ COURSES ────────────────────────┐
│ ✓ Create/Edit/Delete            │
│ ✓ Assign teachers                │
│ ✓ Manage prerequisites           │
│ ✓ Publish/Archive                │
│ ✗ Cannot teach/grade             │
└──────────────────────────────────┘

┌─ ACADEMIC STRUCTURE ─────────────┐
│ ✓ Create/Edit Sections           │
│ ✓ Create/Edit Filieres           │
│ ✓ Create/Edit Auditoires         │
│ ✓ View all structures            │
└──────────────────────────────────┘

┌─ ENROLLMENTS ────────────────────┐
│ ✓ View all enrollments           │
│ ✓ Enroll students                │
│ ✓ Manage course assignments      │
│ ✓ Generate enrollment lists      │
└──────────────────────────────────┘

┌─ PRE-INSCRIPTIONS ───────────────┐
│ ✓ View pending requests          │
│ ✓ Validate/Reject applications   │
│ ✓ Generate reports               │
│ ✓ Create student accounts        │
└──────────────────────────────────┘

┌─ ACADEMIC CALENDAR ──────────────┐
│ ✓ Create/Edit calendar events    │
│ ✓ Manage terms                   │
│ ✓ Set academic year              │
│ ✓ Publish calendar               │
└──────────────────────────────────┘

┌─ SCHEDULES ──────────────────────┐
│ ✓ Create schedules               │
│ ✓ View schedules                 │
│ ✓ Publish for review             │
│ ✗ Cannot delete (admin only)     │
└──────────────────────────────────┘

┌─ REPORTS ────────────────────────┐
│ ✓ Academic statistics            │
│ ✓ Enrollment reports             │
│ ✓ Course load analysis           │
└──────────────────────────────────┘

┌─ RESTRICTIONS ───────────────────┐
│ ✗ Cannot process payments        │
│ ✗ Cannot manage HR               │
│ ✗ Cannot grade students          │
│ ✗ Cannot create fees             │
└──────────────────────────────────┘
```

---

### 4. SGAD (Secrétaire Général Administration - Admin Secretary)
```
Access Level: ADMINISTRATIVE + FINANCIAL (Level 4)
Location: SGADDashboard
Responsibilities: Admin operations, HR, payments

┌─ FEES & PAYMENTS ────────────────┐
│ ✓ Create/Edit/Delete Fee types   │
│ ✓ Create Fee campaigns           │
│ ✓ Generate StudentFees           │
│ ✓ View payments                  │
│ ✓ Approve/Reject payments        │
│ ✓ Generate receipts              │
└──────────────────────────────────┘

┌─ USERS ──────────────────────────┐
│ ✓ View all users                 │
│ ✓ Create users                   │
│ ✓ Edit user details              │
│ ✓ Deactivate users               │
│ ✓ View user activity             │
└──────────────────────────────────┘

┌─ HR MANAGEMENT ──────────────────┐
│ ✓ Create/Edit Employees          │
│ ✓ Create/Edit Contracts          │
│ ✓ Create/Edit Payroll            │
│ ✓ Approve/Reject Leaves          │
│ ✓ View employee records          │
│ ✓ Calculate prestation           │
└──────────────────────────────────┘

┌─ ACADEMIC STRUCTURE ─────────────┐
│ ✓ View (read-only)               │
│ ✓ View sections/filieres         │
│ ✗ Cannot modify                  │
└──────────────────────────────────┘

┌─ ANNOUNCEMENTS ──────────────────┐
│ ✓ Create announcements           │
│ ✓ Edit announcements             │
│ ✓ Pin announcements              │
│ ✓ Delete announcements           │
└──────────────────────────────────┘

┌─ REPORTS ────────────────────────┐
│ ✓ Financial reports              │
│ ✓ Payment statistics             │
│ ✓ HR reports                     │
│ ✓ Employee payroll reports       │
└──────────────────────────────────┘

┌─ RESTRICTIONS ───────────────────┐
│ ✗ Cannot manage courses          │
│ ✗ Cannot teach                   │
│ ✗ Cannot grade                   │
│ ✗ Cannot create academic items   │
└──────────────────────────────────┘
```

---

### 5. Chef de Section
```
Access Level: SECTION MANAGEMENT (Level 3)
Location: ChefSectionDashboard
Responsibilities: Section operations, oversight

┌─ STRUCTURE ──────────────────────┐
│ ✓ View section details           │
│ ✓ Create Filieres                │
│ ✓ Edit Filieres                  │
│ ✓ Assign department heads        │
│ ✓ View students in section       │
│ ✓ View teachers in section       │
└──────────────────────────────────┘

┌─ SCHEDULES ──────────────────────┐
│ ✓ View section schedules         │
│ ✓ Create schedules for section   │
│ ✓ Approve section schedules      │
└──────────────────────────────────┘

┌─ COURSES ────────────────────────┐
│ ✓ View all courses               │
│ ✓ View section courses           │
│ ✗ Cannot create/edit             │
└──────────────────────────────────┘

┌─ STATISTICS ─────────────────────┐
│ ✓ View section stats             │
│ ✓ View student counts            │
│ ✓ View teacher workload          │
└──────────────────────────────────┘

┌─ LIBRARY ACCESS ─────────────────┐
│ ✓ Can access library             │
└──────────────────────────────────┘

┌─ RESTRICTIONS ───────────────────┐
│ ✗ Cannot manage payments         │
│ ✗ Cannot manage HR               │
│ ✗ Cannot teach                   │
│ ✗ Cannot delete courses          │
│ ✗ Cannot manage other sections   │
└──────────────────────────────────┘
```

---

### 6. Chef de Département (Department/Option Head)
```
Access Level: DEPARTMENT MANAGEMENT (Level 3.5)
Location: ChefDepartementDashboard
Responsibilities: Department operations, course management

┌─ COURSES ────────────────────────┐
│ ✓ Create courses                 │
│ ✓ Edit courses                   │
│ ✓ Delete courses                 │
│ ✓ Assign teachers                │
│ ✓ Assign assistants              │
│ ✓ View course details            │
└──────────────────────────────────┘

┌─ STAFF MANAGEMENT ───────────────┐
│ ✓ View department teachers       │
│ ✓ View department assistants     │
│ ✓ View department students       │
│ ✓ Request HR changes (not direct)│
└──────────────────────────────────┘

┌─ AUDITOIRES ─────────────────────┐
│ ✓ Create auditoires              │
│ ✓ Edit auditoires                │
│ ✓ View department auditoires     │
│ ✓ Manage capacity                │
└──────────────────────────────────┘

┌─ SCHEDULES ──────────────────────┐
│ ✓ Create department schedules    │
│ ✓ Edit schedules                 │
│ ✓ Publish schedules              │
│ ✓ Check conflicts                │
└──────────────────────────────────┘

┌─ GRADES ─────────────────────────┐
│ ✓ View grades                    │
│ ✓ Edit grades                    │
│ ✓ View transcripts               │
└──────────────────────────────────┘

┌─ LIBRARY ACCESS ─────────────────┐
│ ✓ Can access and use library     │
└──────────────────────────────────┘

┌─ RESTRICTIONS ───────────────────┐
│ ✗ Cannot manage payments         │
│ ✗ Cannot manage HR               │
│ ✗ Cannot teach (can assist)      │
│ ✗ Cannot create users            │
│ ✗ Cannot manage other depts      │
└──────────────────────────────────┘
```

---

### 7. Enseignant (Teacher)
```
Access Level: COURSE INSTRUCTOR (Level 2)
Location: EnseignantDashboard, TeacherAssignments, TeacherQuizzes
Responsibilities: Course instruction, grading, assessment

┌─ COURSES ────────────────────────┐
│ ✓ View assigned courses          │
│ ✓ Upload course materials        │
│ ✓ Create announcements           │
│ ✓ View enrolled students         │
│ ✓ View course schedule           │
│ ✗ Cannot create/delete courses   │
└──────────────────────────────────┘

┌─ QUIZZES ────────────────────────┐
│ ✓ Create quizzes                 │
│ ✓ Edit quizzes                   │
│ ✓ Publish quizzes                │
│ ✓ Delete own quizzes             │
│ ✓ View attempts                  │
│ ✓ Grade essays/free response     │
│ ✓ View quiz statistics           │
└──────────────────────────────────┘

┌─ ASSIGNMENTS (TP/TD) ────────────┐
│ ✓ Create assignments             │
│ ✓ Edit assignments               │
│ ✓ Publish assignments            │
│ ✓ View submissions               │
│ ✓ Grade submissions              │
│ ✓ Leave feedback                 │
│ ✓ View submission statistics     │
└──────────────────────────────────┘

┌─ GRADES ─────────────────────────┐
│ ✓ Enter grades                   │
│ ✓ Edit grades                    │
│ ✓ View grades                    │
│ ✓ View student transcripts       │
│ ✗ Cannot edit grading config     │
└──────────────────────────────────┘

┌─ ATTENDANCE ─────────────────────┐
│ ✓ Mark attendance                │
│ ✓ View attendance records        │
│ ✓ View attendance statistics     │
└──────────────────────────────────┘

┌─ CHAT ───────────────────────────┐
│ ✓ Access course chats            │
│ ✓ Post messages                  │
│ ✓ View all messages              │
│ ✓ Delete own messages            │
└──────────────────────────────────┘

┌─ SCHEDULE ───────────────────────┐
│ ✓ View teaching schedule         │
│ ✓ View exam schedule             │
└──────────────────────────────────┘

┌─ RESTRICTIONS ───────────────────┐
│ ✗ Cannot manage course structure │
│ ✗ Cannot manage payments         │
│ ✗ Cannot manage other teachers   │
│ ✗ Cannot create users            │
│ ✗ Cannot manage schedules        │
│ ✗ Cannot delete assignments      │
└──────────────────────────────────┘
```

---

### 8. Assistant
```
Access Level: COURSE SUPPORT (Level 2)
Location: AssistantDashboard, TeacherAssignments, TeacherQuizzes
Responsibilities: Course assistance, TP/TD grading

┌─ COURSES ────────────────────────┐
│ ✓ View assigned courses          │
│ ✓ Upload materials (with teacher)│
│ ✓ View enrolled students         │
│ ✗ Cannot manage course settings  │
└──────────────────────────────────┘

┌─ TP/TD ASSIGNMENTS ──────────────┐
│ ✓ View assignments               │
│ ✓ Grade submissions              │
│ ✓ Leave feedback                 │
│ ✓ View statistics                │
│ ✗ Cannot create assignments      │
└──────────────────────────────────┘

┌─ QUIZZES ────────────────────────┐
│ ✓ View quizzes                   │
│ ✓ Grade essays (teacher assigned)│
│ ✓ View statistics                │
│ ✗ Cannot create quizzes          │
└──────────────────────────────────┘

┌─ GRADES ─────────────────────────┐
│ ✓ View grades                    │
│ ✓ Grade TP/TD work               │
│ ✗ Cannot enter final course grade│
└──────────────────────────────────┘

┌─ ATTENDANCE ─────────────────────┐
│ ✓ Mark attendance (if assigned)  │
│ ✓ View attendance                │
└──────────────────────────────────┘

┌─ CHAT ───────────────────────────┐
│ ✓ Participate in course chats    │
│ ✓ Post messages                  │
│ ✓ Help students                  │
└──────────────────────────────────┘

┌─ RESTRICTIONS ───────────────────┐
│ ✗ Cannot create courses          │
│ ✗ Cannot manage other courses    │
│ ✗ Cannot enter final grades      │
│ ✗ Cannot create users            │
│ ✗ Cannot manage payments         │
└──────────────────────────────────┘
```

---

### 9. Étudiant (Student)
```
Access Level: RESTRICTED READ/SUBMIT (Level 1)
Location: EtudiantDashboard, StudentAssignments, StudentQuizzes
Responsibilities: Learning, submission, communication

┌─ COURSES ────────────────────────┐
│ ✓ View enrolled courses          │
│ ✓ Download materials             │
│ ✓ View course schedule           │
│ ✓ View course announcements      │
│ ✓ View classmates                │
│ ✗ Cannot create content          │
└──────────────────────────────────┘

┌─ QUIZZES ────────────────────────┐
│ ✓ View quizzes (if published)    │
│ ✓ Take quizzes                   │
│ ✓ Submit answers                 │
│ ✓ View results (after closing)   │
│ ✓ View correct answers (if set)  │
│ ✗ Cannot create quizzes          │
│ ✗ Cannot edit answers            │
└──────────────────────────────────┘

┌─ ASSIGNMENTS ────────────────────┐
│ ✓ View assignments               │
│ ✓ Download instructions          │
│ ✓ Submit work                    │
│ ✓ View feedback                  │
│ ✓ View grades                    │
│ ✓ See submission deadline        │
│ ✗ Cannot create assignments      │
│ ✗ Cannot view others' work       │
└──────────────────────────────────┘

┌─ GRADES ─────────────────────────┐
│ ✓ View own grades                │
│ ✓ View own transcript            │
│ ✓ View grade breakdown           │
│ ✓ See passing status             │
│ ✗ Cannot view other students     │
│ ✗ Cannot challenge grades (yet)  │
└──────────────────────────────────┘

┌─ ACADEMIC CALENDAR ──────────────┐
│ ✓ View calendar                  │
│ ✓ View important dates           │
│ ✓ View exam schedule             │
└──────────────────────────────────┘

┌─ SCHEDULE ───────────────────────┐
│ ✓ View class schedule            │
│ ✓ View exam times                │
│ ✓ Add to calendar                │
└──────────────────────────────────┘

┌─ CHAT ───────────────────────────┐
│ ✓ Participate in course chats    │
│ ✓ Post messages                  │
│ ✓ Ask teachers questions         │
│ ✓ Collaborate with peers         │
│ ✓ React to messages              │
│ ✗ Cannot delete others' messages │
└──────────────────────────────────┘

┌─ PAYMENTS ───────────────────────┐
│ ✓ View assigned fees             │
│ ✓ View payment status            │
│ ✓ View due dates                 │
│ ✓ Make payments                  │
│ ✓ View receipts                  │
│ ✗ Cannot dispute payments        │
└──────────────────────────────────┘

┌─ LIBRARY ────────────────────────┐
│ ✓ Browse books                   │
│ ✓ Search library                 │
│ ✓ Borrow books                   │
│ ✓ Reserve books                  │
│ ✓ Renew loans                    │
│ ✓ View loan history              │
│ ✗ Cannot manage books            │
└──────────────────────────────────┘

┌─ PROFILE ────────────────────────┐
│ ✓ View own profile               │
│ ✓ Edit own profile               │
│ ✓ Change password                │
│ ✓ Upload avatar                  │
│ ✗ Cannot view other students     │
└──────────────────────────────────┘

┌─ NOTIFICATIONS ──────────────────┐
│ ✓ View notifications             │
│ ✓ Mark as read                   │
│ ✓ Delete notifications           │
│ ✗ Cannot send notifications      │
└──────────────────────────────────┘

┌─ RESTRICTIONS ───────────────────┐
│ ✗ Cannot create content          │
│ ✗ Cannot modify grades           │
│ ✗ Cannot view other students     │
│ ✗ Cannot access admin areas      │
│ ✗ Cannot manage system           │
└──────────────────────────────────┘
```

---

### 10. Bibliothecaire (Librarian)
```
Access Level: LIBRARY MANAGEMENT (Level 2)
Location: Library (read-only for others)
Responsibilities: Book management, loans, reservations

┌─ BOOKS ──────────────────────────┐
│ ✓ Create books                   │
│ ✓ Edit books                     │
│ ✓ Delete books (soft)            │
│ ✓ Upload covers                  │
│ ✓ Update availability            │
│ ✓ View all books                 │
│ ✓ Search/Filter books            │
└──────────────────────────────────┘

┌─ LOANS ──────────────────────────┐
│ ✓ Create loans                   │
│ ✓ Record returns                 │
│ ✓ Manage extensions              │
│ ✓ Handle overdue books           │
│ ✓ View loan history              │
│ ✓ Generate reports               │
└──────────────────────────────────┘

┌─ RESERVATIONS ───────────────────┐
│ ✓ View reservations              │
│ ✓ Fulfill reservations           │
│ ✓ Cancel reservations            │
│ ✓ Notify students                │
└──────────────────────────────────┘

┌─ LIBRARY ANALYTICS ──────────────┐
│ ✓ View circulation stats         │
│ ✓ View popular books             │
│ ✓ View overdue reports           │
│ ✓ Manage inventory               │
└──────────────────────────────────┘

┌─ ANNOUNCEMENTS ──────────────────┐
│ ✓ Create library news            │
│ ✓ Share resources                │
└──────────────────────────────────┘

┌─ RESTRICTIONS ───────────────────┐
│ ✗ Cannot manage courses          │
│ ✗ Cannot manage payments         │
│ ✗ Cannot manage users            │
│ ✗ Cannot access other systems    │
└──────────────────────────────────┘
```

---

### 11. Caisse (Cashier/Accountant)
```
Access Level: FINANCIAL PROCESSING (Level 2)
Location: Caisse, Comptabilite (read-only)
Responsibilities: Payment processing, receipts

┌─ PAYMENTS ───────────────────────┐
│ ✓ View payments                  │
│ ✓ Process payments               │
│ ✓ Confirm payments               │
│ ✓ Reject payments                │
│ ✓ Generate receipts              │
│ ✓ Record payment method          │
│ ✓ Handle refunds (DG approval)   │
└──────────────────────────────────┘

┌─ FEES ───────────────────────────┐
│ ✓ View fee assignments           │
│ ✓ View student fees              │
│ ✓ View payment deadlines         │
│ ✓ Generate fee reports           │
│ ✗ Cannot create fees             │
└──────────────────────────────────┘

┌─ ACCOUNTING ─────────────────────┐
│ ✓ View payment records           │
│ ✓ Generate transaction reports   │
│ ✓ View cash summary              │
│ ✓ Print receipts                 │
│ ✓ Export payment data            │
└──────────────────────────────────┘

┌─ STUDENT MANAGEMENT ─────────────┐
│ ✓ View student payment status    │
│ ✓ View payment history           │
│ ✓ Send payment reminders         │
│ ✗ Cannot view student details    │
└──────────────────────────────────┘

┌─ RESTRICTIONS ───────────────────┐
│ ✗ Cannot create/delete fees      │
│ ✗ Cannot manage users            │
│ ✗ Cannot manage courses          │
│ ✗ Cannot modify student records  │
│ ✗ Cannot access HR               │
│ ✗ Cannot refund (DG only)        │
└──────────────────────────────────┘
```

---

### 12. iAdmin (System Administrator)
```
Access Level: UNRESTRICTED (Level 5)
Location: All admin panels
Responsibilities: System administration, technical support

✓ COMPLETE ACCESS TO ALL SYSTEMS AND DATA

Same as PDG for all operations + technical functions
```

---

### 13. Service IT
```
Access Level: TECHNICAL (Level 2)
Responsibilities: Technical support, system maintenance

┌─ USER MANAGEMENT ────────────────┐
│ ✓ Reset passwords                │
│ ✓ Unlock accounts                │
│ ✓ View account logs              │
│ ✓ Manage user permissions        │
└──────────────────────────────────┘

┌─ SYSTEM MAINTENANCE ─────────────┐
│ ✓ View system logs               │
│ ✓ Monitor performance            │
│ ✓ Manage backups                 │
│ ✓ System updates                 │
└──────────────────────────────────┘

┌─ RESTRICTIONS ───────────────────┐
│ ✗ Cannot manage content          │
│ ✗ Cannot teach                   │
│ ✗ Cannot manage payments         │
│ ✗ Cannot modify academic data    │
└──────────────────────────────────┘
```

---

### 14. Apparitorat (Beadle/Discipline Officer)
```
Access Level: DISCIPLINARY (Level 1.5)
Responsibilities: Attendance, discipline

┌─ ATTENDANCE ─────────────────────┐
│ ✓ Record attendance              │
│ ✓ View attendance records        │
│ ✓ View attendance stats          │
│ ✓ Record absences               │
└──────────────────────────────────┘

┌─ DISCIPLINE ─────────────────────┐
│ ✓ Record incidents               │
│ ✓ Issue disciplinary records     │
│ ✓ View student discipline        │
│ ✓ Generate reports               │
└──────────────────────────────────┘

┌─ RESTRICTIONS ───────────────────┐
│ ✗ Cannot manage courses          │
│ ✗ Cannot modify grades           │
│ ✗ Cannot delete records          │
└──────────────────────────────────┘
```

---

### 15. Jury (Thesis Committee)
```
Access Level: EVALUATION (Level 1.5)
Responsibilities: Thesis/Defense evaluation

┌─ EVALUATIONS ────────────────────┐
│ ✓ Evaluate theses                │
│ ✓ Grade defenses                 │
│ ✓ Assign topics                  │
│ ✓ View defense schedule          │
└──────────────────────────────────┘

┌─ RESTRICTIONS ───────────────────┐
│ ✗ Cannot access other functions  │
│ Limited to thesis activities     │
└──────────────────────────────────┘
```

---

## Common Permission Patterns

### Can View All Data
- PDG, Directeur Général, iAdmin, SGA, SGAD

### Can Manage Users
- PDG, Directeur Général, iAdmin, SGAD

### Can Grade
- Teachers, Assistants, Heads of Departments

### Can Create Content
- Teachers, Assistants, Department Heads, Librarian, Caisse

### Can Approve/Validate
- PDG, Directeur Général, SGA, SGAD, Heads

### Can Process Payments
- Caisse, SGAD, DG, PDG, iAdmin

### Can Access Library
- All authenticated users (Librarian has management access)

### Can Chat
- All authenticated users (access limited to relevant channels)

### Can View Schedules
- All authenticated users (personalized based on role)

---

## Access Control Matrix Summary

```
┌─────────────┬────────┬────────┬────────┬────────┬────────┬────────┐
│ Role        │ Courses│ Users  │Finance │ HR     │Library │System  │
├─────────────┼────────┼────────┼────────┼────────┼────────┼────────┤
│ PDG         │  Full  │ Full   │  Full  │ Full   │ Read   │ Full   │
│ DG          │  Full  │ Full   │  Full  │ Full   │ Read   │ View   │
│ SGA         │  Full  │ Assign │ View   │ View   │ Read   │ -      │
│ SGAD        │  View  │ Full   │  Full  │ Full   │ Read   │ View   │
│ Chef Sect.  │  View  │ View   │  -     │ View   │ Read   │ -      │
│ Chef Dept.  │  Full  │ View   │  -     │ View   │ Read   │ -      │
│ Teacher     │ Own    │ View   │  -     │ -      │ Read   │ -      │
│ Assistant   │ Assist │ View   │  -     │ -      │ Read   │ -      │
│ Student     │ Own    │ Own    │ Own    │ -      │ Full   │ -      │
│ Librarian   │  -     │  -     │  -     │ -      │ Full   │ -      │
│ Caisse      │  -     │ View   │  Full  │ -      │ -      │ -      │
│ Service IT  │  -     │ Manage │  -     │ -      │ -      │ Full   │
└─────────────┴────────┴────────┴────────┴────────┴────────┴────────┘

Key: Full = Create/Read/Edit/Delete
     Own = Own data only
     View = Read-only
     Read = Library browsing
     Manage = Reset/Unlock/Logs
     Assist = Limited editing
     - = No access
```

---

*Last Updated: 2026-05-31*
*Manzanza - Complete Role-Action Matrix*
