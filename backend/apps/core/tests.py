import tempfile
from datetime import date, time, timedelta

from django.test import override_settings

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from apps.auditoires.models import Auditoire, Filiere, Section
from apps.courses.attendance_models import AttendanceSession
from apps.courses.models import Course, CourseEnrollment
from apps.grades.models import Transcript
from apps.hr.models import Employee, Payroll
from apps.payments.models import StudentFee
from apps.schedules.models import AcademicYear, Room, RoomReservation, Schedule, Term, TimeSlot
from apps.users.models import User


@override_settings(MEDIA_ROOT=tempfile.mkdtemp(prefix='mz-test-media-'))
class UniversityWorkflowSmokeTests(APITestCase):
    password = "Password123!"

    def create_user(self, role, email=None, **extra):
        email = email or f"{role}@example.test"
        return User.objects.create_user(
            email=email,
            password=self.password,
            first_name=role.replace("_", " ").title(),
            last_name="Test",
            role=role,
            **extra,
        )

    def setUp(self):
        self.admin = self.create_user("pdg", is_staff=True, is_superuser=True)
        self.dg = self.create_user("directeur_general")
        self.sga = self.create_user("sga")
        self.sgad = self.create_user("sgad")
        self.caisse = self.create_user("caisse")
        self.teacher = self.create_user("enseignant")
        self.assistant = self.create_user("assistant")
        self.service_it = self.create_user("service_it")
        self.apparitorat = self.create_user("apparitorat")
        self.jury = self.create_user("jury")

        self.section = Section.objects.create(nom="Sciences")
        self.chef_section = self.create_user("chef_section", section=self.section)
        self.section.chef_section = self.chef_section
        self.section.save()

        self.filiere = Filiere.objects.create(nom="Informatique", section=self.section)
        self.chef_departement = self.create_user("chef_departement", filiere=self.filiere)
        self.filiere.chef_filiere = self.chef_departement
        self.filiere.save()

        self.auditoire = Auditoire.objects.create(
            nom="L1 Informatique Jour",
            niveau="L1",
            filiere=self.filiere,
            vacation="jour",
            annee_academique="2026-2027",
            created_by=self.admin,
        )
        self.course = Course.objects.create(
            name="Algorithmique",
            credits=5,
            auditoire=self.auditoire,
            titulaire=self.teacher,
            semester="Trimestre 1",
            annee_academique="2026-2027",
        )
        self.course.assistants.add(self.assistant)

        self.student = self.create_user("etudiant", auditoire=self.auditoire, matricule="ETU-0001")

        self.year = AcademicYear.objects.create(
            name="2026-2027",
            start_date=date(2026, 9, 1),
            end_date=date(2027, 8, 31),
            is_current=True,
        )
        self.term = Term.objects.create(
            academic_year=self.year,
            name="Trimestre 1",
            term_type="trimestre",
            order=1,
            start_date=date(2026, 9, 1),
            end_courses_date=date(2026, 12, 1),
            exam_start_date=date(2026, 12, 5),
            exam_end_date=date(2026, 12, 20),
            end_date=date(2026, 12, 20),
        )
        self.room = Room.objects.create(name="Salle 101", building="A", capacity=60)
        self.timeslot = TimeSlot.objects.create(
            label="Matin",
            start_time=time(8, 30),
            end_time=time(12, 0),
            vacation_type="jour",
            order=1,
        )
        self.schedule = Schedule.objects.create(
            course=self.course,
            auditoire=self.auditoire,
            teacher=self.teacher,
            room=self.room,
            term=self.term,
            schedule_type="normal",
            day_of_week="lundi",
            timeslot=self.timeslot,
            start_time=time(8, 30),
            end_time=time(12, 0),
        )

    def test_all_declared_roles_can_login(self):
        roles = [
            self.admin,
            self.dg,
            self.sga,
            self.sgad,
            self.chef_section,
            self.chef_departement,
            self.teacher,
            self.assistant,
            self.student,
            self.service_it,
            self.apparitorat,
            self.caisse,
            self.jury,
        ]

        from django.core.cache import cache
        for user in roles:
            cache.clear()  # la connexion est limitée à 10 tentatives/minute par IP
            response = self.client.post(
                "/api/auth/login/",
                {"email": user.email, "password": self.password},
                format="json",
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK, user.role)
            self.assertEqual(response.data["user"]["role"], user.role)

    def test_user_creation_is_not_public_but_admin_can_create_system_roles(self):
        payload = {
            "email": "new.service@example.test",
            "password": self.password,
            "first_name": "New",
            "last_name": "Service",
            "role": "service_it",
        }

        response = self.client.post("/api/users/", payload, format="json")
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

        self.client.force_authenticate(self.admin)
        response = self.client.post("/api/users/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email=payload["email"], role="service_it").exists())

    def test_academic_schedule_and_teacher_availability_workflow(self):
        self.assertTrue(CourseEnrollment.objects.filter(student=self.student, course=self.course).exists())

        self.client.force_authenticate(self.teacher)
        response = self.client.post(
            "/api/schedules/availability/",
            {
                "day_of_week": "mardi",
                "timeslot": self.timeslot.id,
                "availability_type": "disponible",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["teacher"], self.teacher.id)

        response = self.client.get(
            f"/api/schedules/schedules/teacher_schedule/?teacher_id={self.teacher.id}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        self.client.force_authenticate(self.chef_section)
        response = self.client.get(
            f"/api/schedules/schedules/teacher_schedule/?teacher_id={self.teacher.id}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_public_preinscription_uses_selected_academic_year_for_auditoire(self):
        options_response = self.client.get("/api/inscriptions/academic-year-options/")
        self.assertEqual(options_response.status_code, status.HTTP_200_OK)
        self.assertEqual(options_response.data[0]["value"], "2026-2027")
        self.assertEqual(options_response.data[1]["value"], "2027-2028")

        file_fields = {
            name: SimpleUploadedFile(f"{name}.pdf", b"%PDF-1.4 test", content_type="application/pdf")
            for name in [
                "carte_identite",
                "certificat_naissance",
                "certificat_etude_primaire",
                "bulletin_5",
                "bulletin_6",
                "diplome_etat",
            ]
        }
        payload = {
            "first_name": "Future",
            "last_name": "Student",
            "email": "future.student@example.test",
            "phone": "+243811111111",
            "sexe": "M",
            "date_naissance": "2004-05-10",
            "nationalite": "Congolaise",
            "adresse": "Kinshasa",
            "filiere": self.filiere.id,
            "niveau": "L1",
            "vacation": "soir",
            "academic_year": "2027-2028",
            **file_fields,
        }

        create_response = self.client.post("/api/inscriptions/", payload, format="multipart")
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED, create_response.data)

        pid = create_response.data['id']
        self.client.force_authenticate(self.sga)
        # Circuit d'admission : pas de décision sans pièces conformes ni frais de dossier.
        early = self.client.post(f"/api/inscriptions/{pid}/validate/")
        self.assertEqual(early.status_code, status.HTTP_400_BAD_REQUEST)
        checked = self.client.post(f"/api/inscriptions/{pid}/verify-dossier/", {"dossier_status": "conforme"},
                                   format="json")
        self.assertEqual(checked.status_code, status.HTTP_200_OK, checked.data)
        self.assertEqual(self.client.post(f"/api/inscriptions/{pid}/mark-fee-paid/",
                                          {"reference": "R-1"}, format="json").status_code,
                         status.HTTP_403_FORBIDDEN)  # l'encaissement relève de la caisse
        self.client.force_authenticate(self.caisse)
        paid = self.client.post(f"/api/inscriptions/{pid}/mark-fee-paid/", {"reference": "R-1"}, format="json")
        self.assertEqual(paid.status_code, status.HTTP_200_OK, paid.data)
        self.client.force_authenticate(self.sga)
        validate_response = self.client.post(f"/api/inscriptions/{pid}/validate/")
        self.assertEqual(validate_response.status_code, status.HTTP_200_OK, validate_response.data)
        from apps.scolarite.models import InscriptionAnnuelle
        ins = InscriptionAnnuelle.objects.get(pk=validate_response.data["inscription_annuelle"])
        self.assertEqual(ins.statut, "en_attente")
        self.assertEqual(ins.academic_year.name, "2027-2028")
        self.assertEqual(validate_response.data["academic_year"], "2027-2028")

        student = User.objects.get(email="future.student@example.test")
        self.assertEqual(student.auditoire.annee_academique, "2027-2028")
        self.assertTrue(
            Auditoire.objects.filter(
                filiere=self.filiere,
                niveau="L1",
                vacation="soir",
                annee_academique="2027-2028",
            ).exists()
        )

    def test_chef_section_can_manage_filieres_only_in_own_section(self):
        other_section = Section.objects.create(nom="Droit")

        self.client.force_authenticate(self.chef_section)
        own_response = self.client.post(
            "/api/filieres/",
            {"nom": "Cybersecurite", "section": self.section.id},
            format="json",
        )
        self.assertEqual(own_response.status_code, status.HTTP_201_CREATED, own_response.data)
        self.assertEqual(own_response.data["section"], self.section.id)

        other_response = self.client.post(
            "/api/filieres/",
            {"nom": "Droit Public", "section": other_section.id},
            format="json",
        )
        self.assertEqual(other_response.status_code, status.HTTP_403_FORBIDDEN)

        patch_response = self.client.patch(
            f"/api/filieres/{own_response.data['id']}/",
            {"section": other_section.id},
            format="json",
        )
        self.assertEqual(patch_response.status_code, status.HTTP_403_FORBIDDEN)

    def test_apparitorat_room_reservation_workflow(self):
        self.client.force_authenticate(self.apparitorat)
        room_response = self.client.post(
            "/api/schedules/rooms/",
            {
                "name": "Amphi A",
                "building": "Principal",
                "capacity": 150,
                "room_type": "amphitheatre",
                "equipment": ["Projecteur", "Micro"],
            },
            format="json",
        )
        self.assertEqual(room_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(room_response.data["equipment"], ["Projecteur", "Micro"])

        self.client.force_authenticate(self.student)
        reservation_response = self.client.post(
            "/api/schedules/reservations/",
            {
                "room": room_response.data["id"],
                "requested_by": self.student.id,
                "date": (date.today() + timedelta(days=14)).isoformat(),
                "startTime": "10:00",
                "endTime": "12:00",
                "purpose": "Reunion de promotion",
                "equipment_needs": ["Projecteur"],
            },
            format="json",
        )
        self.assertEqual(reservation_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(reservation_response.data["status"], "pending")
        self.assertEqual(reservation_response.data["requested_by"], self.student.id)

        self.client.force_authenticate(self.apparitorat)
        confirm_response = self.client.patch(
            f"/api/schedules/reservations/{reservation_response.data['id']}/",
            {"status": "confirmed"},
            format="json",
        )
        self.assertEqual(confirm_response.status_code, status.HTTP_200_OK)
        self.assertEqual(confirm_response.data["status"], "confirmed")

        second = RoomReservation.objects.create(
            room_id=room_response.data["id"],
            requested_by=self.teacher,
            date=date.today() + timedelta(days=14),
            start_time=time(11, 0),
            end_time=time(13, 0),
            purpose="Cours special",
        )
        conflict_response = self.client.patch(
            f"/api/schedules/reservations/{second.id}/",
            {"status": "confirmed"},
            format="json",
        )
        self.assertEqual(conflict_response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_charge_horaire_payroll_uses_finalized_attendance_sessions(self):
        employee = Employee.objects.create(
            user=self.assistant,
            employee_id="EMP-ASSIST-001",
            position="assistant",
            hire_date=date(2026, 9, 1),
            prestation_type="charge_horaire",
            salaire_horaire="25.00",
        )
        AttendanceSession.objects.create(
            course=self.course,
            date=date(2026, 10, 5),
            start_time=time(8, 0),
            end_time=time(10, 0),
            is_finalized=True,
            created_by=self.assistant,  # séance tenue par l'assistant (TP) : c'est lui qui est payé
        )
        AttendanceSession.objects.create(
            course=self.course,
            date=date(2026, 10, 6),
            start_time=time(10, 0),
            end_time=time(12, 0),
            is_finalized=False,
            created_by=self.assistant,
        )

        self.client.force_authenticate(self.sgad)
        calculation_response = self.client.get(
            f"/api/hr/payrolls/calculate-prestation/?employee={employee.id}&mois=10&annee=2026"
        )
        self.assertEqual(calculation_response.status_code, status.HTTP_200_OK)
        self.assertEqual(calculation_response.data["heures_prestees"], 2.0)
        self.assertEqual(calculation_response.data["sessions_count"], 1)

        payroll_response = self.client.post(
            "/api/hr/payrolls/",
            {
                "employee": employee.id,
                "mois": 10,
                "annee": 2026,
                "bonuses": "0.00",
                "deductions": "0.00",
                "status": "en_attente",
            },
            format="json",
        )
        self.assertEqual(payroll_response.status_code, status.HTTP_201_CREATED, payroll_response.data)
        payroll = Payroll.objects.get(pk=payroll_response.data["id"])
        self.assertEqual(payroll.heures_prestees, 2)
        self.assertEqual(payroll.base_salary, 50)

    def test_academic_calendar_ranges_are_inclusive(self):
        self.client.force_authenticate(self.sga)
        response = self.client.post(
            "/api/schedules/academic-events/",
            {
                "name": "Session intensive",
                "event_type": "examen",
                "academic_year": self.year.id,
                "start_date": "2027-01-01",
                "end_date": "2027-01-20",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data["duration_days"], 20)

        invalid = self.client.post(
            "/api/schedules/academic-events/",
            {
                "name": "Plage invalide",
                "event_type": "autre",
                "academic_year": self.year.id,
                "start_date": "2027-01-20",
                "end_date": "2027-01-01",
            },
            format="json",
        )
        self.assertEqual(invalid.status_code, status.HTTP_400_BAD_REQUEST)

    def test_transcript_module_is_generated_and_scoped_by_role(self):
        # Le barème institutionnel est fixé par le SGA ; l'enseignant ne fait que noter.
        self.client.force_authenticate(self.teacher)
        forbidden = self.client.post("/api/grades/categories/", {"name": "X", "category_type": "examen",
                                                                  "weight": "10"}, format="json")
        self.assertEqual(forbidden.status_code, status.HTTP_403_FORBIDDEN)
        self.client.force_authenticate(self.sga)
        category_response = self.client.post(
            "/api/grades/categories/",
            {
                "name": "Examen final",
                "category_type": "examen",
                "weight": "100.00",
                "description": "Evaluation finale",
            },
            format="json",
        )
        self.assertEqual(category_response.status_code, status.HTTP_201_CREATED, category_response.data)
        self.client.force_authenticate(self.teacher)

        grade_response = self.client.post(
            "/api/grades/grades/",
            {
                "student": self.student.id,
                "course": self.course.id,
                "category": category_response.data["id"],
                "label": "Final",
                "session_number": 1,
                "value": "16.00",
                "max_value": "20.00",
            },
            format="json",
        )
        self.assertEqual(grade_response.status_code, status.HTTP_201_CREATED, grade_response.data)

        # Note en brouillon : invisible tant que la feuille n'est pas approuvée.
        transcript = Transcript.objects.get(student=self.student, auditoire=self.auditoire)
        self.assertEqual(transcript.average, 0)
        sheet = self.client.post("/api/grades/sheets/ensure/", {"course": self.course.id, "session": 1},
                                 format="json")
        self.assertEqual(sheet.status_code, status.HTTP_200_OK, sheet.data)
        submitted = self.client.post(f"/api/grades/sheets/{sheet.data['id']}/submit/")
        self.assertEqual(submitted.status_code, status.HTTP_200_OK, submitted.data)
        # Feuille soumise : l'enseignant ne peut plus modifier, ni s'auto-approuver.
        locked = self.client.patch(f"/api/grades/grades/{grade_response.data['id']}/", {"value": "19.00"},
                                   format="json")
        self.assertIn(locked.status_code, (status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN,
                                           status.HTTP_409_CONFLICT))
        self.assertEqual(self.client.post(f"/api/grades/sheets/{sheet.data['id']}/approve/").status_code,
                         status.HTTP_403_FORBIDDEN)
        self.client.force_authenticate(self.sga)
        approved = self.client.post(f"/api/grades/sheets/{sheet.data['id']}/approve/")
        self.assertEqual(approved.status_code, status.HTTP_200_OK, approved.data)
        transcript = Transcript.objects.get(student=self.student, auditoire=self.auditoire)
        self.assertEqual(transcript.year, "2026-2027")
        self.assertEqual(transcript.average, 80)

        self.client.force_authenticate(self.student)
        mine = self.client.get("/api/grades/transcripts/my-transcript/")
        self.assertEqual(mine.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mine.data), 1)

        self.client.force_authenticate(self.sga)
        filtered = self.client.get(f"/api/grades/transcripts/?student={self.student.id}")
        self.assertEqual(filtered.status_code, status.HTTP_200_OK)
        filtered_results = filtered.data.get("results", filtered.data)
        self.assertEqual(len(filtered_results), 1)

    def test_financial_fee_assignment_and_confirmed_payment_workflow(self):
        self.client.force_authenticate(self.dg)
        fee_type_response = self.client.post(
            "/api/payments/fee-types/",
            {
                "name": "Minerval annuel",
                "category": "scolarite",
                "amount": "100.00",
                "academic_year": "2026-2027",
            },
            format="json",
        )
        self.assertEqual(fee_type_response.status_code, status.HTTP_201_CREATED)

        fee_response = self.client.post(
            "/api/payments/fees/",
            {
                "fee_type": fee_type_response.data["id"],
                "name": "Minerval L1",
                "description": "Frais de scolarite L1",
                "amount": "100.00",
                "currency": "USD",
                "target_type": "auditoire",
                "target_auditoire": self.auditoire.id,
                "academic_year": "2026-2027",
                "due_date": "2026-10-15",
            },
            format="json",
        )
        self.assertEqual(fee_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(fee_response.data["assigned_count"], 1)

        student_fee = StudentFee.objects.get(student=self.student)
        # La direction consulte mais n'encaisse pas.
        self.assertEqual(self.client.post("/api/payments/", {"student_fee": student_fee.id, "amount": "1.00",
                                                             "payment_method": "especes"}, format="json").status_code,
                         status.HTTP_403_FORBIDDEN)
        self.client.force_authenticate(self.caisse)
        no_session = self.client.post("/api/payments/", {"student_fee": student_fee.id, "amount": "1.00",
                                                         "payment_method": "especes"}, format="json")
        self.assertEqual(no_session.status_code, status.HTTP_400_BAD_REQUEST)
        opened = self.client.post("/api/payments/cash-sessions/open/", {"opening_float": {"USD": "20"}},
                                  format="json")
        self.assertEqual(opened.status_code, status.HTTP_201_CREATED, opened.data)
        payment_response = self.client.post(
            "/api/payments/",
            {
                "student_fee": student_fee.id,
                "amount": "100.00",
                "payment_method": "especes",
                "status": "confirme",
                "notes": "Paiement test",
            },
            format="json",
        )
        self.assertEqual(payment_response.status_code, status.HTTP_201_CREATED)
        student_fee.refresh_from_db()
        self.assertEqual(student_fee.status, "paye")
