# Manzanza Application - Complete Structure Analysis

## Executive Summary
Manzanza is a comprehensive university management system built with Django (Backend) and React (Frontend). It handles academic administration, course management, student enrollment, grading, payments, HR, and communication.

---

## 1. USER ROLES IN THE SYSTEM

### All Defined Roles (12 Roles Total)

| Role ID | Display Name | Code | Department |
|---------|-------------|------|-----------|
| `pdg` | PDG | PDG | Executive |
| `directeur_general` | Directeur Général (DG) | DIRECTEUR_GENERAL | Executive |
| `sga` | SGA (Secrétaire Général Académique) | SGA | Academic |
| `sgad` | SGAD (Secrétaire Général Admin) | SGAD | Administrative |
| `chef_section` | Chef de Section | CHEF_SECTION | Academic |
| `chef_departement` | Chef de Département/Filière | CHEF_DEPARTEMENT | Academic |
| `enseignant` | Enseignant (Teacher) | ENSEIGNANT | Academic |
| `assistant` | Assistant | ASSISTANT | Academic |
| `etudiant` | Étudiant (Student) | ETUDIANT | Academic |
| `bibliothecaire` | Bibliothécaire (Librarian) | BIBLIOTHECAIRE | Support |
| `caisse` | Caissier/Comptable | CAISSE | Financial |
| `iadmin` | iAdmin (System Admin) | IADMIN | System |

**Additional Roles (mentioned in Frontend but not in User model):**
- `apparitorat` - Apparitorat/Beadle (Disciplinary officer)
- `service_it` - IT Service
- `jury` - Jury (for thesis/defense evaluation)

---

## 2. BACKEND MODELS & ENTITIES

### A. User & Authentication
**Model:** `User` (in `apps/users/`)
- **Fields:** email, first_name, last_name, post_nom, phone, sexe, date_naissance, adresse, role, status, matricule (for students), auditoire (for students), section (for staff), filiere (for staff), avatar
- **CRUD Operations:**
  - CREATE: User registration, Admin can create users
  - READ: Get user profile, list users (role-based)
  - UPDATE: Update profile, change password
  - DELETE: Deactivate/soft delete users
- **Key Methods:** `get_avatar_url()`, `get_full_name()`, `name` (property)

---

### B. Academic Structure
**Models:** Section, Filiere, Auditoire (in `apps/auditoires/`)

#### Section
- **Fields:** nom, chef_section (OneToOne User)
- **Purpose:** Top-level academic division (e.g., "Sciences Informatiques")
- **CRUD:** Full CRUD for administrators

#### Filiere (Option/Department)
- **Fields:** nom, section (ForeignKey), chef_filiere (OneToOne User)
- **Purpose:** Subdivision within a Section (e.g., "Génie Logiciel")
- **CRUD:** Full CRUD for administrators

#### Auditoire (Virtual Classroom)
- **Fields:** nom, niveau (L1-M2), filiere, vacation (jour/soir), description, capacite_max, is_active, annee_academique
- **Purpose:** Student cohorts at specific level and vacation
- **CRUD:** Full CRUD for administrators
- **Key Properties:** students_count, student_list, courses

---

### C. Courses & Enrollment
**Models:** Course, CourseEnrollment, CourseMaterial (in `apps/courses/`)

#### Course
- **Fields:** name, code, description, credits, auditoire, titulaire (teacher), assistants (M2M), prerequisites (M2M self), duration_terms, syllabus, resources, is_active, semester, annee_academique
- **CRUD Operations:**
  - CREATE: SGA, Chef de Section, Enseignant
  - READ: All authenticated users
  - UPDATE: Titulaire, administrators
  - DELETE: Administrators only
- **Key Methods:** `save()` (auto-generates code), `section`, `filiere`, `students_count`, `progress_percentage`

#### CourseEnrollment
- **Fields:** student, course, progress (%), grade, enrolled_at, is_active
- **Purpose:** Links students to courses they're enrolled in
- **Unique Constraint:** (student, course) - students can only enroll once per course
- **CRUD:** Admin manages; auto-created when student assigned to auditoire

#### CourseMaterial
- **Fields:** course, title, description, file, content_type, uploaded_at
- **Purpose:** Store course resources
- **CRUD:** Teachers and assistants create; students read

---

### D. Assessment Systems

#### 1. Grades System (in `apps/grades/`)

**AcademicConfig** (Singleton)
- Controls: hours_per_credit, max_grade, passing_grade, passing_percentage, allow_compensation, current_academic_year, current_semester

**GradeCategory** (e.g., "Midterm", "Final", "Participation")
- Fields: name, description, weight_percentage

**CourseGradeWeight** (links categories to courses)
- Fields: course, grade_category, weight

**Grade**
- Fields: course, student, category, score, points, entered_by (teacher), entered_at
- **CRUD:** Teachers create/update; students view their own

**ExamSession**
- Fields: course, date, location, start_time, end_time, exam_type, created_by, created_at

**Transcript**
- Fields: student, course, grade, credits_earned, status, created_at
- **CRUD:** Auto-generated from grades

---

#### 2. Quiz System (in `apps/quiz/`)

**Quiz**
- **Fields:** title, description, course, start_date, end_date, duration_minutes, max_points, shuffle_questions, shuffle_choices, show_correct_answers, allow_multiple_attempts, max_attempts, quiz_type (quiz/interro/examen), status (draft/published/closed), created_by
- **CRUD Operations:**
  - CREATE: Teachers (enseignant, assistant)
  - READ: Enrolled students, teachers
  - UPDATE: Teachers
  - DELETE: Teachers

**QuizQuestion**
- **Fields:** quiz, question_text, question_type (multiple_choice/true_false/short_answer/essay/matching), points, order, is_required, explanation
- **CRUD:** Teachers manage

**QuizChoice** (for multiple choice)
- **Fields:** question, choice_text, is_correct, order

**QuizAttempt**
- **Fields:** quiz, student, started_at, submitted_at, score, status (in_progress/submitted/graded)
- **Purpose:** Track student quiz attempts

**QuizAnswer**
- **Fields:** attempt, question, student_answer, is_correct, points_earned

---

#### 3. TP/TD (Assignments) System (in `apps/assignments/`)

**Assignment**
- **Fields:** title, description, assignment_type (TP/TD), course, submission_type (electronic/physical/both), due_date, max_points, instructions, resources, status (draft/published/closed), auto_grade, created_by
- **CRUD Operations:**
  - CREATE: Teachers
  - READ: Enrolled students and teachers
  - UPDATE: Teachers before due date
  - DELETE: Teachers

**AssignmentQuestion**
- **Fields:** assignment, question_text, question_type, points, order, explanation

**AssignmentSubmission**
- **Fields:** assignment, student, submitted_at, submission_text/file, status (submitted/graded/overdue), score, feedback_by, feedback_at
- **CRUD:** Students submit; teachers grade

---

### E. Attendance & Schedules (in `apps/schedules/`)

**AcademicYear**
- **Fields:** name (e.g., "2024-2025"), start_date, end_date, is_current, is_published
- **CRUD:** Administrators manage

**Term** (Trimestre/Semestre)
- **Fields:** academic_year, name, term_type, start_date, end_date, exam_start_date, exam_end_date, makeup_start_date, makeup_end_date
- **Purpose:** Subdivisions within an academic year

**AcademicEvent** (Vacations, holidays, exams)
- **Fields:** academic_year/term, name, event_type (vacation/holiday/exam/makeup), start_date, end_date, vacation_type
- **CRUD:** Administrators manage

**TimeSlot** (Periods like "8h30-12h00")
- **Fields:** name, start_time, end_time, vacation_type (jour/soir), is_active
- **Purpose:** Reusable time periods for schedules

**Schedule** (Class/Exam Schedules)
- **Fields:** course, auditoire, day_of_week, timeslot, room, teacher, start_date, end_date, schedule_type (normal/module/exam), is_published, academic_year
- **CRUD Operations:**
  - CREATE: Administrators, Chef de Département
  - READ: All users
  - UPDATE: Administrators
  - DELETE: Administrators

**TeacherAvailability**
- **Fields:** teacher, day_of_week, timeslot, is_available
- **Purpose:** Mark when teachers are available/unavailable

---

### F. Payments & Fees (in `apps/payments/`)

**FeeType**
- **Fields:** name, category (scolarite/laboratoire/bibliotheque/inscription/examen/autre), description, amount, is_mandatory, is_active, academic_year
- **Purpose:** Define fee types

**Fee** (Fee Campaign)
- **Fields:** fee_type, name, description, amount, currency (USD/CDF), target_type (tous/section/filiere/auditoire/etudiant), target_section, target_filiere, target_auditoire, target_student, academic_year, due_date, is_active, created_by
- **Purpose:** Create bulk fee assignments
- **CRUD:** SGAD, DG, iAdmin only

**StudentFee**
- **Fields:** student, fee_type, amount, currency, due_date, created_by, created_at
- **Purpose:** Individual student fee records

**Payment**
- **Fields:** student_fee, student, payment_date, amount, currency, payment_method (cash/cheque/bank_transfer/mobile_money), transaction_reference, status (pending/confirmed/rejected/refunded), created_by
- **CRUD Operations:**
  - CREATE: Caisse, SGAD
  - READ: Student (own), Admin (all)
  - UPDATE: Caisse can confirm/reject

**PaymentVoucher** (Receipt documents)
- **Fields:** payment, voucher_number, amount, currency, issued_by, issued_at

**PaymentReceipt**
- **Fields:** payment, receipt_number, amount, issued_date, issued_by

---

### G. HR Management (in `apps/hr/`)

**Employee** (extends User profile)
- **Fields:** user, employee_id, position, department, hire_date, end_date, prestation_type (permanent/charge_horaire), salary_type, monthly_salary, hourly_rate, days_off_per_year
- **CRUD Operations:**
  - CREATE: SGAD, DG
  - READ: SGAD, DG (filtering by status)
  - UPDATE: SGAD, DG
  - DELETE: Not deleted, status changed to "demissionne"

**Contract**
- **Fields:** employee, contract_type (permanent/temporary/fixed_term), start_date, end_date, salary, position, status, created_by, created_at

**Payroll**
- **Fields:** employee, period_start, period_end, base_salary, deductions, bonus, net_amount, status (draft/approved/paid), created_by
- **CRUD:** SGAD, DG manage

**Leave** (Time off requests)
- **Fields:** employee, leave_type, start_date, end_date, reason, status (pending/approved/rejected), approved_by, approved_date
- **CRUD:** Employees request; SGAD/DG approve

---

### H. Library Management (in `apps/library/`)

**Book**
- **Fields:** title, author, isbn, description, category, book_type (physique/numerique/audio/memoire/projet), publisher, publication_year, pages, language, location, quantity, available_quantity, file (for digital), cover_image, downloadable, borrowable, is_available, is_active, added_by
- **CRUD Operations:**
  - CREATE: Bibliothecaire, Administrators
  - READ: All authenticated users
  - UPDATE: Bibliothecaire
  - DELETE: Soft delete (is_active = False)

**BookLoan**
- **Fields:** book, student, loan_date, due_date, return_date, status (borrowed/returned/overdue), extended_count
- **Purpose:** Track book loans
- **CRUD:** Bibliothecaire manages

**BookReservation**
- **Fields:** book, student, reservation_date, reserved_until, status (reserved/fulfilled/cancelled)
- **Purpose:** Students reserve books

---

### I. Communication (in `apps/chat/`)

**ChatChannel**
- **Fields:** name, description, channel_type (course/section/filiere/general), course, section, filiere, members (M2M), is_active, created_by
- **Purpose:** Discussion channels
- **CRUD:** Administrators create; users join

**Message**
- **Fields:** channel, sender, content, is_ai_response, parent_message, attachment, is_edited, is_deleted, created_at, updated_at
- **CRUD Operations:**
  - CREATE: Channel members
  - READ: Channel members
  - UPDATE: Own message author
  - DELETE: Author or admin

**MessageReaction**
- **Fields:** message, user, reaction_type (like/love/laugh/etc), created_at
- **Purpose:** Reactions to messages

---

### J. Pre-Inscriptions (in `apps/inscriptions/`)

**PreInscription**
- **Fields:** Personal info (first_name, last_name, post_nom, email, phone, sexe, date_naissance), Parents info, Tutor info, Academic choice (filiere, niveau, vacation), Attachments (carte_identite, certificats, diplome), status (en_attente/validee/rejetee), created_at, updated_at
- **CRUD Operations:**
  - CREATE: Public (no auth required)
  - READ: SGA, iAdmin
  - UPDATE: SGA, iAdmin (validate/reject)

---

### K. Notifications (in `apps/notifications/`)

**Notification**
- **Fields:** recipient, title, message, notification_type, priority, link, related_object_id, is_read, read_at, created_at
- **Purpose:** User notifications
- **Types:** cours, quiz, assignment, chat, paiement, bibliotheque, rh, systeme, calendrier, horaire

**Announcement**
- **Fields:** title, content, audience (tous/etudiants/enseignants/personnel), attachment, is_active, is_pinned, publish_date, expire_date, created_by
- **Purpose:** Public announcements

---

### L. Academic Configuration (in `apps/core/`)

**AcademicCalendarEvent**
- Event management for academic calendar

---

## 3. CRUD OPERATIONS BY ENTITY

### Summary Table

| Entity | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| User | Admin, SGA | Role-based | Owner, Admin | Admin (soft) |
| Course | SGA, Chef Dept, Teachers | Authenticated | Teachers, Admin | Admin |
| CourseEnrollment | Admin, Auto | Authenticated | Admin | Admin |
| Quiz | Teachers | Enrolled, Teachers | Teachers | Teachers |
| Assignment | Teachers | Enrolled, Teachers | Teachers | Teachers |
| Grade | Teachers | Student (own), Teachers | Teachers | Teachers |
| Schedule | Admin, Chef Dept | All | Admin | Admin |
| Payment | Caisse, SGAD | User (own), Admin | Caisse | Admin |
| Fee | SGAD, DG | Admin | Admin | Admin |
| Book | Bibliothecaire | All | Bibliothecaire | Bibliothecaire (soft) |
| Loan | Bibliothecaire | Bibliothecaire, User | Bibliothecaire | Bibliothecaire |
| Message | Channel members | Members | Author, Admin | Author, Admin |
| Notification | System auto | User | User (read) | User, Admin |

---

## 4. FRONTEND PAGES & FEATURES

### Authentication
- **Login.jsx** - Public login page
- **Home.jsx** - Landing page (public/authenticated)
- **Profile.jsx** - User profile management
- **PublicInscription.jsx** - Pre-registration (public)

### Dashboard
- **Dashboard.jsx** - Role-based dashboards:
  - EtudiantDashboard
  - EnseignantDashboard
  - AssistantDashboard
  - SGADashboard
  - SGADDashboard
  - AdminDashboard
  - ChefSectionDashboard
  - ChefDepartementDashboard
  - BibliothecaireDashboard
  - ApparitoratDashboard
  - ServiceITDashboard
  - CaisseComptabiliteDashboard
  - JuryDashboard
  - IAdminDashboard
  - DirecteurGeneralDashboard

### Academic Management
- **Courses.jsx** - View courses
- **CourseDetail.jsx** - Course details, materials, announcements
- **TPTD.jsx** - TP/TD assignments (unified view)
- **Quiz.jsx** - Quiz listing and taking
- **TeacherAssignments.jsx** - Teacher assignment management
- **TeacherQuizzes.jsx** - Teacher quiz management
- **TeacherAttendance.jsx** - Attendance tracking
- **StudentAssignments.jsx** - Student assignment submissions
- **StudentQuizzes.jsx** - Student quiz attempts

### Structural Organization
- **Auditoires.jsx** - Classroom management
- **AuditoireDetail.jsx** - Auditoire details
- **SectionDetail.jsx** - Section management
- **FiliereDetail.jsx** - Department/Option management

### Schedule & Calendar
- **Horaire.jsx** - Class schedule view
- **CalendrierAcademique.jsx** - Academic calendar

### Academic Administration
- **GestionEtudiants.jsx** - Student management
- **GestionEnseignants.jsx** - Teacher management
- **GestionInscriptions.jsx** - Pre-registration management
- **InscriptionDetail.jsx** - Pre-registration details
- **ConfigurationNotes.jsx** - Grading configuration
- **Administration.jsx** - General administration

### HR Management
- **RH/Employees.jsx** - Employee listing
- **RH/EmployeeDetail.jsx** - Employee profile
- **RH/EmployeeForm.jsx** - Create/Edit employee
- **RH/Contracts.jsx** - Contract management
- **RH/ContractForm.jsx** - Create/Edit contract
- **RH/Payrolls.jsx** - Payroll management
- **RH/PayrollForm.jsx** - Create/Edit payroll
- **RH/Leaves.jsx** - Leave requests
- **RH/LeaveForm.jsx** - Request leave

### Financial Management
- **Paiements.jsx** - Payment management (student fees)
- **GestionFrais.jsx** - Fee management and creation
- **Caisse.jsx** - Cash register and payment confirmation
- **Comptabilite.jsx** - Accounting and financial reports

### Library
- **Library.jsx** - Book listing, search, borrowing
- **BookDetail.jsx** - Book details

### Communication
- **Chat.jsx** - Channel-based messaging
- **Notifications.jsx** - User notifications

### Support
- **ServiceIT.jsx** - IT service management
- **Apparitorat.jsx** - Disciplinary tracking

---

## 5. PERMISSIONS & ACCESS CONTROL

### Permission Classes (Backend)

| Permission | Allowed Roles |
|-----------|---------------|
| IsOwnerOrAdmin | Owner, Admin roles |
| IsAdminUser | iadmin, pdg, directeur_general, sga, sgad |
| IsSGAOrAdmin | sga, sgad, caisse, iadmin, pdg, directeur_general |
| CanManageCourses | sga, chef_section, chef_departement, enseignant |
| IsTeacherOrAdmin | enseignant, assistant, chef_section, chef_departement, + admin roles |
| IsStudentUser | etudiant |
| IsLibrarianOrAdmin | bibliothecaire, sga |
| IsHROrAdmin | sgad, directeur_general |
| IsCaisseOrAdmin | caisse, sgad, iadmin, pdg, directeur_general |
| IsDGOrIAdmin | iadmin, directeur_general (financial management) |
| CanViewUsers | iadmin, sga, sgad, caisse, pdg, directeur_general, chef_section, chef_departement, enseignant |
| CanViewAcademicData | iadmin, sga, chef_section, chef_departement, enseignant |

### Frontend Role-Based Access

**Admin Roles (Full Access):** iadmin, pdg, directeur_general, sga, sgad

**Academic Roles:**
- **SGA:** Course management, auditoires, inscriptions, academic data
- **Chef de Section:** Section management, subsection oversight
- **Chef de Département:** Department courses, teachers, schedules
- **Enseignant:** Course content, grades, quizzes, assignments
- **Assistant:** Course assistance, TP/TD grading

**Student Roles:**
- **Étudiant:** View courses, submit assignments, take quizzes, view grades

**Support Roles:**
- **Bibliothecaire:** Book management, loans
- **Caisse:** Payment processing
- **Service IT:** System administration
- **Apparitorat:** Attendance, discipline
- **SGAD:** HR, payments, admin staff
- **Directeur Général:** Strategic decisions, financial oversight

---

## 6. COMPLETE ROLE-ACTION MATRIX

### PDG (President/CEO)
**Access Level:** Unrestricted (All Operations)

**Actions:**
- View all strategic dashboards and reports
- Create/manage fees and payments
- Approve financial operations (with DG)
- Create/manage users
- View full financial reports
- Access HR management
- Override all academic decisions
- System configuration

**Pages:** AdminDashboard, all management pages

---

### Directeur Général (DG)
**Access Level:** Strategic + Administrative

**Actions:**
- View all academic and financial data
- Manage HR (employees, contracts, payroll)
- Approve/create fees and payments
- Create/manage academic structure (sections, filieres, auditoires)
- Create/manage courses
- Manage schedules
- Create/manage users
- Financial reports and oversight

**Pages:** DirecteurGeneralDashboard, RH pages, payments, courses, schedules

---

### SGA (Secrétaire Général Académique)
**Access Level:** Academic Administration

**Actions:**
- Manage courses (create, edit, delete)
- Manage auditoires and academic structure
- Manage student enrollments
- Manage pre-inscriptions (validate/reject)
- View academic statistics
- Manage academic calendar
- View sections and filieres
- Create schedules

**Restrictions:** Cannot access financial management, HR, payments

**Pages:** Courses, Auditoires, GestionInscriptions, Sections, Filieres

---

### SGAD (Secrétaire Général Administration)
**Access Level:** Administrative + Financial

**Actions:**
- Create/manage fees and fee campaigns
- Create/manage HR (employees, contracts, payroll, leaves)
- Process and view payments
- Manage user accounts
- Create announcements
- View financial reports
- View academic data

**Restrictions:** Cannot teach, cannot manage courses directly

**Pages:** GestionFrais, RH/* pages, Caisse, Comptabilite, Administration

---

### Chef de Section
**Access Level:** Section Management

**Actions:**
- Create filieres within their section
- Assign department heads
- View section statistics
- View/create schedules for section
- View section courses and students
- Manage section announcements

**Restrictions:** Cannot manage payments, cannot teach, cannot manage other sections

**Pages:** SectionDetail, courses (view), Library

---

### Chef de Département (Filière)
**Access Level:** Department/Option Management

**Actions:**
- Create courses for their department
- Assign teachers to courses
- Manage auditoires for department
- Create/manage schedules
- View department statistics
- Grade students (can edit grades)
- View department students and teachers
- Manage course materials

**Restrictions:** Cannot manage payments, cannot manage other departments

**Pages:** FiliereDetail, Courses, Schedules, GestionEtudiants, GestionEnseignants

---

### Enseignant (Teacher)
**Access Level:** Course Management

**Actions:**
- Create/edit/publish quizzes and assignments
- Grade student submissions
- Enter grades
- View enrolled students
- Upload course materials
- Create course announcements
- Manage attendance
- View schedule for their courses
- Access chat channels (courses they teach)
- View course statistics

**Restrictions:** Cannot manage other courses, cannot create users, cannot manage finances

**Pages:** TeacherAssignments, TeacherQuizzes, TeacherAttendance, CourseDetail, Courses

---

### Assistant
**Access Level:** Course Support

**Actions:**
- Assist with course management
- Create/edit quizzes and assignments
- Grade TP/TD submissions
- Enter grades
- View enrolled students
- Upload materials
- Manage attendance
- Access chat for assisted courses

**Restrictions:** Less permissions than teachers, cannot create courses

**Pages:** TeacherAssignments, TeacherQuizzes, TeacherAttendance, CourseDetail

---

### Étudiant (Student)
**Access Level:** Restricted Read/Submit

**Actions:**
- View enrolled courses
- View grades and transcript
- Submit assignments
- Take quizzes
- View course materials
- View course schedule and calendar
- Participate in chat
- View notifications
- Pay fees (view payment status)
- View academic calendar
- Borrow/reserve books
- Access library

**Restrictions:** Cannot create content, cannot grade, cannot manage other users

**Pages:** Courses, CourseDetail, StudentAssignments, StudentQuizzes, Quiz, Library, Paiements, Chat, Profile

---

### Bibliothecaire (Librarian)
**Access Level:** Library Management

**Actions:**
- Create/edit/delete books
- Manage book loans
- View reservations
- Update availability
- Create announcements
- View library statistics

**Restrictions:** Cannot access academic management, cannot manage payments

**Pages:** Library, BookDetail, (admin backend for book management)

---

### Caisse (Cashier/Accountant)
**Access Level:** Payment Processing

**Actions:**
- Process payments
- Generate receipts
- View payment history
- Confirm/reject payments
- View fee assignments
- Generate financial reports
- View student payment status

**Restrictions:** Cannot manage users, cannot manage courses, cannot manage HR

**Pages:** Caisse, GestionFrais (view), Comptabilite

---

### iAdmin (System Administrator)
**Access Level:** Unrestricted (Technical)

**Actions:**
- Create/manage all users
- Full access to all data
- Manage system configuration
- Financial management (like DG)
- HR management
- System backups and maintenance
- Access all pages

**Pages:** All pages, special admin panel

---

### Service IT
**Access Level:** Technical

**Actions:**
- Manage user accounts
- System maintenance
- Technical support

**Restrictions:** Cannot create content, cannot teach, cannot manage finances

---

### Apparitorat (Beadle/Disciplinary)
**Access Level:** Attendance & Discipline

**Actions:**
- Track attendance
- Record disciplinary incidents
- View student attendance records

**Restrictions:** Cannot manage courses, cannot teach

---

### Jury (Thesis Committee)
**Access Level:** Evaluation

**Actions:**
- Evaluate thesis defenses
- Assign thesis topics
- Grade defenses

**Restrictions:** Limited to thesis-related activities

---

## 7. API ENDPOINTS SUMMARY

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh-token` - Refresh token
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/change-password` - Change password

### Users
- `GET/POST /api/users/` - List/create users
- `GET/PUT/DELETE /api/users/{id}/` - User CRUD
- `POST /api/users/{id}/avatar/` - Upload avatar
- `GET /api/students/` - List students
- `GET /api/teachers/` - List teachers

### Courses
- `GET/POST /api/courses/` - List/create courses
- `GET/PUT/DELETE /api/courses/{id}/` - Course CRUD
- `GET /api/courses/{id}/enrollments/` - Course enrollments
- `POST /api/courses/{id}/enroll/` - Enroll student

### Academic Structure
- `GET/POST /api/sections/` - Sections CRUD
- `GET/POST /api/filieres/` - Filieres CRUD
- `GET/POST /api/auditoires/` - Auditoires CRUD

### Quizzes
- `GET/POST /api/quiz/` - Quiz CRUD
- `POST /api/quiz/{id}/start/` - Start quiz attempt
- `POST /api/quiz/{id}/submit/` - Submit answers

### Assignments
- `GET/POST /api/assignments/` - Assignment CRUD
- `POST /api/assignments/{id}/submit/` - Student submission
- `POST /api/assignments/{id}/grade/` - Grade submission

### Grades
- `GET/POST /api/grades/` - Grade management
- `GET /api/grades/my-grades/` - Student's own grades
- `GET /api/grades/student/{id}/` - Student's grades (teachers)

### Payments
- `GET/POST /api/payments/` - Payment CRUD
- `GET /api/payments/student-fees/` - Student's fees
- `POST /api/payments/{id}/confirm/` - Confirm payment

### HR
- `GET/POST /api/hr/employees/` - Employee management
- `GET/POST /api/hr/contracts/` - Contract management
- `GET/POST /api/hr/payrolls/` - Payroll management
- `GET/POST /api/hr/leaves/` - Leave management

### Library
- `GET/POST /api/library/books/` - Book management
- `POST /api/library/books/{id}/borrow/` - Borrow book
- `POST /api/library/books/{id}/return/` - Return book

### Chat
- `GET/POST /api/chat/channels/` - Channel management
- `GET/POST /api/chat/messages/` - Message management
- `POST /api/chat/messages/{id}/react/` - React to message

### Notifications
- `GET /api/notifications/` - List notifications
- `PUT /api/notifications/{id}/read/` - Mark as read

### Schedules
- `GET/POST /api/schedules/` - Schedule CRUD
- `GET /api/schedules/my-schedule/` - User's schedule
- `GET /api/schedules/auditoire_schedule/` - Class schedule

---

## 8. KEY SYSTEM BEHAVIORS

### Automatic Enrollments
When a student is assigned to an auditoire:
- Automatically enrolled in all courses of that auditoire
- CourseEnrollment records created automatically

### Fee Management
- Fees created as campaigns targeting groups
- StudentFee records auto-generated for matching students
- Students see their fees in payment section

### Grade Calculations
- Multi-category system (participation, midterm, final, etc.)
- Weighted averages based on CourseGradeWeight
- Compensation possible if configured
- Transcripts auto-generated from grades

### Academic Calendar
- Year contains Terms (semesters/trimesters)
- Terms contain AcademicEvents (holidays, exams)
- Schedules linked to terms for term-aware planning

### Attendance Tracking
- Based on AttendanceSession records (not fully detailed in models shown)
- Teachers mark attendance
- Can calculate presence percentage per student

---

## 9. DATABASE RELATIONSHIPS SUMMARY

### User-Centric Relationships
```
User (central hub)
├── Student → Auditoire → Filiere → Section
├── Staff → Section/Filiere
├── Teacher → Courses
├── Employee → Contracts, Payroll, Leaves
└── Various roles → Notifications, Messages, Announcements
```

### Course Relationships
```
Course
├── Auditoire → Filiere → Section
├── Titulaire (Teacher)
├── Assistants (M2M)
├── Enrollments → Students
├── Grades
├── Quizzes
├── Assignments
└── Schedule
```

### Academic Calendar
```
AcademicYear
├── Terms (Semesters/Trimesters)
├── AcademicEvents
└── Schedules
```

### Financial Flow
```
Fee Campaign → StudentFees → Payments → PaymentReceipts/Vouchers
```

---

## 10. SUMMARY STATISTICS

| Category | Count |
|----------|-------|
| User Roles | 12 (+ 3 additional) |
| Backend Apps | 15 apps |
| Main Models | 40+ models |
| Frontend Pages | 50+ pages |
| API Endpoints | 100+ endpoints |
| Permission Classes | 11 classes |
| CRUD Operations | Full CRUD on most entities |

---

## 11. TECHNOLOGY STACK

### Backend
- **Framework:** Django + Django REST Framework
- **Database:** SQLite (development), can scale to PostgreSQL
- **Authentication:** Token-based (DRF)
- **Key Libraries:** django-cors-headers, djangorestframework-swagger

### Frontend
- **Framework:** React
- **State Management:** Redux
- **Routing:** React Router
- **UI Components:** Bootstrap, React Bootstrap
- **Animations:** Framer Motion
- **Icons:** React Icons

---

## 12. NOTES & OBSERVATIONS

1. **Hierarchical Structure:** Clear academic hierarchy - Section > Filiere > Auditoire > Students
2. **Multi-Role System:** Single User can have different roles (via Employee model)
3. **Academic Flexibility:** Supports multiple assessment methods (quizzes, assignments, grades)
4. **Financial Tracking:** Comprehensive payment and fee management
5. **Communication:** Built-in chat system for different organizational levels
6. **Internationalization:** French-language labels and French date/time handling expected
7. **Scalability:** Designed for a complete university system with multiple departments
8. **Soft Deletes:** Uses `is_active` flags rather than hard deletes
9. **Auto-Generation:** Codes and enrollments auto-generated in several places
10. **Modular Design:** Each function (HR, Payments, Library) in separate app

---

*Last Updated: 2026-05-31*
*Application: Manzanza University Management System*
