"""
Tests de non-régression : failles critiques de l'audit (S1…S16) et corbeille.
Lancer : python manage.py test apps.core
"""
from datetime import timedelta
from decimal import Decimal

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.assignments.models import Assignment, AssignmentSubmission
from apps.auditoires.models import Auditoire, Filiere, Section
from apps.core.models import AuditLog, InstitutionSettings, TrashItem
from apps.core.trash import purge_expired
from apps.courses.attendance_models import AttendanceSession
from apps.courses.models import Course, CourseMaterial
from apps.grades.models import Grade, GradeCategory
from apps.notifications.models import Notification
from apps.payments.models import Fee, Payment, PaymentVoucher, StudentFee
from apps.quiz.models import Quiz, QuizAttempt
from apps.users.models import User


class BaseFixture(APITestCase):
    password = "Password123!"

    def make(self, role, email=None, **extra):
        return User.objects.create_user(
            email=email or f"{role}@test.cd", password=self.password,
            first_name=role.title(), last_name="Test", role=role, **extra,
        )

    def setUp(self):
        self.admin = self.make("pdg", is_staff=True, is_superuser=True)
        self.sga = self.make("sga")
        self.sgad = self.make("sgad")
        self.caisse = self.make("caisse")
        self.section = Section.objects.create(nom="Sciences")
        self.filiere = Filiere.objects.create(nom="Informatique", section=self.section)
        self.auditoire = Auditoire.objects.create(nom="L1 Info Jour", niveau="L1", filiere=self.filiere,
                                                  vacation="jour", annee_academique="2026-2027")
        self.other_auditoire = Auditoire.objects.create(nom="L2 Info Jour", niveau="L2", filiere=self.filiere,
                                                        vacation="jour", annee_academique="2026-2027")
        self.teacher = self.make("enseignant")
        self.other_teacher = self.make("enseignant", email="autre.prof@test.cd")
        self.course = Course.objects.create(name="Algorithmique", credits=5, auditoire=self.auditoire,
                                            titulaire=self.teacher)
        self.other_course = Course.objects.create(name="Réseaux", credits=4, auditoire=self.auditoire,
                                                  titulaire=self.other_teacher)
        self.student = self.make("etudiant", auditoire=self.auditoire, matricule="MZ-2026-000001")
        self.category = GradeCategory.objects.create(name="Examen", category_type="examen", weight=100)


class AssessmentSecurityTests(BaseFixture):
    def test_s1_student_cannot_grade_own_assignment(self):
        assignment = Assignment.objects.create(title="TP1", course=self.course, status="published",
                                               created_by=self.teacher)
        sub = AssignmentSubmission.objects.create(assignment=assignment, student=self.student, status="submitted")
        self.client.force_authenticate(self.student)
        r = self.client.post(f"/api/assignments/submissions/{sub.id}/grade/", {"score": 20}, format="json")
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(Grade.objects.filter(student=self.student).exists())

    def test_s2_student_cannot_change_quiz_score(self):
        quiz = Quiz.objects.create(title="Q1", course=self.course, status="published", created_by=self.teacher)
        attempt = QuizAttempt.objects.create(quiz=quiz, student=self.student, status="submitted")
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.patch(f"/api/quiz/attempts/{attempt.id}/", {"score": 20}, format="json")
                         .status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(self.client.post(f"/api/quiz/attempts/{attempt.id}/grade/", {"score": 20}, format="json")
                         .status_code, status.HTTP_403_FORBIDDEN)

    def test_s3_assignment_answers_hidden_from_students(self):
        from apps.assignments.models import AssignmentChoice, AssignmentQuestion
        assignment = Assignment.objects.create(title="TP2", course=self.course, status="published",
                                               created_by=self.teacher)
        q = AssignmentQuestion.objects.create(assignment=assignment, question_text="2+2 ?",
                                              question_type="multiple_choice", correct_answer="4")
        AssignmentChoice.objects.create(question=q, choice_text="4", is_correct=True)
        self.client.force_authenticate(self.student)
        r = self.client.get(f"/api/assignments/{assignment.id}/")
        self.assertEqual(r.status_code, 200)
        question = r.data["questions"][0]
        self.assertNotIn("correct_answer", question)
        self.assertNotIn("is_correct", question["choices"][0])

    def test_s7_student_cannot_close_or_delete_quiz(self):
        quiz = Quiz.objects.create(title="Q2", course=self.course, status="published", created_by=self.teacher)
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.post(f"/api/quiz/{quiz.id}/close/").status_code, 403)
        self.assertEqual(self.client.delete(f"/api/quiz/{quiz.id}/").status_code, 403)
        quiz.refresh_from_db()
        self.assertEqual(quiz.status, "published")

    def test_s10_teacher_cannot_grade_in_someone_elses_course(self):
        self.client.force_authenticate(self.other_teacher)
        r = self.client.post("/api/grades/grades/", {
            "student": self.student.id, "course": self.course.id, "category": self.category.id,
            "value": "18", "max_value": "20",
        }, format="json")
        self.assertEqual(r.status_code, 403)

    def test_teacher_grades_own_course_and_it_is_audited(self):
        self.client.force_authenticate(self.teacher)
        r = self.client.post("/api/grades/grades/", {
            "student": self.student.id, "course": self.course.id, "category": self.category.id,
            "value": "15", "max_value": "20",
        }, format="json")
        self.assertEqual(r.status_code, 201, r.data)
        self.assertTrue(AuditLog.objects.filter(action="grade").exists())

    def test_s11_student_cannot_create_attendance_session(self):
        self.client.force_authenticate(self.student)
        r = self.client.post("/api/courses/attendance-sessions/", {
            "course": self.course.id, "date": "2026-10-01", "start_time": "08:00", "end_time": "12:00",
        }, format="json")
        self.assertEqual(r.status_code, 403)
        self.assertFalse(AttendanceSession.objects.exists())

    def test_s13_teacher_cannot_create_course(self):
        self.client.force_authenticate(self.teacher)
        r = self.client.post("/api/courses/", {"name": "Hack", "auditoire": self.other_auditoire.id,
                                                       "credits": 30}, format="json")
        self.assertEqual(r.status_code, 403)

    def test_s14_private_material_hidden_and_other_courses_invisible(self):
        stranger = self.make("etudiant", email="x@test.cd", auditoire=self.other_auditoire)
        CourseMaterial.objects.create(course=self.course, title="Corrigé", material_type="document",
                                      link="https://e.x/c", is_public=False)
        CourseMaterial.objects.create(course=self.course, title="Plan", material_type="document",
                                      link="https://e.x/p", is_public=True)
        self.client.force_authenticate(self.student)
        titles = [m["title"] for m in self.client.get("/api/courses/materials/").data["results"]]
        self.assertEqual(titles, ["Plan"])
        self.client.force_authenticate(stranger)
        self.assertEqual(self.client.get("/api/courses/materials/").data["count"], 0)


class AccountSecurityTests(BaseFixture):
    def test_s8_student_cannot_move_himself_to_another_auditoire(self):
        self.client.force_authenticate(self.student)
        r = self.client.patch("/api/users/update_profile/", {
            "auditoire_id": self.other_auditoire.id, "matricule": "HACK", "status": "actif", "phone": "+243 990000000",
        }, format="json")
        self.assertEqual(r.status_code, 200)
        self.student.refresh_from_db()
        self.assertEqual(self.student.auditoire_id, self.auditoire.id)
        self.assertEqual(self.student.matricule, "MZ-2026-000001")
        self.assertEqual(self.student.phone, "+243 990000000")

    def test_s9_sga_cannot_create_pdg(self):
        self.client.force_authenticate(self.sga)
        r = self.client.post("/api/users/", {"email": "evil@test.cd", "password": "Un-Mot2Passe!Solide",
                                             "first_name": "E", "last_name": "V", "role": "pdg"}, format="json")
        self.assertEqual(r.status_code, 400)
        self.assertFalse(User.objects.filter(email="evil@test.cd").exists())

    def test_suspended_account_cannot_login(self):
        self.student.status = "suspendu"
        self.student.save()
        r = self.client.post("/api/auth/login/", {"email": self.student.email, "password": self.password},
                             format="json")
        self.assertEqual(r.status_code, 401)

    def test_s15_cashier_cannot_create_section(self):
        self.client.force_authenticate(self.caisse)
        self.assertEqual(self.client.post("/api/sections/", {"nom": "Caisse"}, format="json").status_code, 403)

    def test_s16_user_cannot_send_fake_notification(self):
        self.client.force_authenticate(self.teacher)
        r = self.client.post("/api/notifications/", {
            "recipient": self.student.id, "title": "Paiement", "message": "Envoyez 100$ au +243…",
        }, format="json")
        self.assertEqual(r.status_code, 403)
        self.assertFalse(Notification.objects.exists())


class PaymentSecurityTests(BaseFixture):
    def setUp(self):
        super().setUp()
        self.fee = Fee.objects.create(name="Minerval", amount=Decimal("500"), currency="USD", target_type="etudiant",
                                      target_student=self.student, due_date=timezone.localdate())
        self.fee.generate_student_fees()
        self.sf = StudentFee.objects.get(student=self.student)

    def test_s4_mobile_money_is_never_auto_confirmed(self):
        self.client.force_authenticate(self.student)
        r = self.client.post("/api/payments/mobile-money/", {
            "student_fee_id": self.sf.id, "amount": "500", "provider": "vodacom", "phone_number": "+243810000000",
        }, format="json")
        self.assertEqual(r.status_code, 200, r.data)
        self.sf.refresh_from_db()
        self.assertEqual(self.sf.amount_paid, 0)
        self.assertEqual(self.sf.status, "impaye")
        self.assertEqual(Payment.objects.get().status, "en_attente")

    def test_s5_student_cannot_confirm_payment_but_cashier_can(self):
        payment = Payment.objects.create(student_fee=self.sf, amount=Decimal("200"), payment_method="mobile",
                                         status="en_attente")
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.post(f"/api/payments/{payment.id}/confirm/").status_code, 403)
        self.client.force_authenticate(self.caisse)
        self.assertEqual(self.client.post(f"/api/payments/{payment.id}/confirm/").status_code, 200)
        self.sf.refresh_from_db()
        self.assertEqual(self.sf.amount_paid, Decimal("200"))
        self.assertEqual(self.sf.status, "partiel")
        # Un paiement confirmé est immuable et ne se supprime pas.
        self.assertEqual(self.client.delete(f"/api/payments/{payment.id}/").status_code, 405)
        self.assertEqual(self.client.patch(f"/api/payments/{payment.id}/", {"amount": "1"},
                                           format="json").status_code, 405)

    def test_s6_vouchers_have_no_raw_crud(self):
        voucher = PaymentVoucher.objects.create(student=self.student, student_fee=self.sf, amount=Decimal("100"),
                                                description="x", beneficiary_account="000")
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.patch(f"/api/payments/vouchers/{voucher.id}/", {"status": "paid"},
                                           format="json").status_code, 405)
        self.assertEqual(self.client.delete(f"/api/payments/vouchers/{voucher.id}/").status_code, 405)
        self.client.force_authenticate(self.teacher)
        self.assertEqual(self.client.get("/api/payments/vouchers/").data["count"], 0)

    def test_student_cannot_overpay_or_target_another_fee(self):
        other = self.make("etudiant", email="o@test.cd", auditoire=self.auditoire)
        other_sf = StudentFee.objects.create(student=other, total_amount=Decimal("100"), due_date=timezone.localdate())
        self.client.force_authenticate(self.student)
        r = self.client.post("/api/payments/vouchers/create-voucher/", {
            "student_fee_id": other_sf.id, "amount": "10", "beneficiary_account": "000"}, format="json")
        self.assertEqual(r.status_code, 403)
        r = self.client.post("/api/payments/vouchers/create-voucher/", {
            "student_fee_id": self.sf.id, "amount": "999", "beneficiary_account": "000"}, format="json")
        self.assertEqual(r.status_code, 400)


class TrashTests(BaseFixture):
    def test_delete_goes_to_trash_with_cascade_and_restores_as_a_batch(self):
        self.client.force_authenticate(self.sga)
        r = self.client.delete(f"/api/filieres/{self.filiere.id}/")
        self.assertEqual(r.status_code, 204, getattr(r, 'data', None))
        # Disparu des listes…
        self.assertFalse(Filiere.objects.filter(pk=self.filiere.pk).exists())
        self.assertFalse(Course.objects.filter(pk=self.course.pk).exists())
        # …mais toujours en base.
        self.assertTrue(Filiere.all_objects.filter(pk=self.filiere.pk).exists())
        items = self.client.get("/api/core/trash/").data
        self.assertEqual(items["count"], 1)
        root = items["results"][0]
        self.assertEqual(root["days_left"], 59)
        self.assertGreaterEqual(root["cascade_count"], 4)  # 2 auditoires + 2 cours
        r = self.client.post(f"/api/core/trash/{root['id']}/restore/")
        self.assertEqual(r.status_code, 200)
        self.assertTrue(Course.objects.filter(pk=self.course.pk).exists())
        self.assertEqual(TrashItem.objects.count(), 0)
        self.assertTrue(AuditLog.objects.filter(action="restore").exists())

    def test_cannot_restore_child_while_parent_is_in_trash(self):
        self.client.force_authenticate(self.sga)
        self.client.delete(f"/api/auditoires/{self.other_auditoire.id}/")
        self.client.delete(f"/api/filieres/{self.filiere.id}/")
        child = TrashItem.objects.get(is_root=True, object_id=str(self.other_auditoire.id),
                                      content_type__model="auditoire")
        r = self.client.post(f"/api/core/trash/{child.id}/restore/")
        self.assertEqual(r.status_code, 409)
        self.assertIn("Restaurez d'abord", r.data["detail"])

    def test_academic_records_block_deletion(self):
        Grade.objects.create(student=self.student, course=self.course, category=self.category,
                             value=12, status="validated")
        self.client.force_authenticate(self.sga)
        r = self.client.delete(f"/api/courses/{self.course.id}/")
        self.assertEqual(r.status_code, 409)
        self.assertIn("notes", r.data["detail"])
        self.assertTrue(Course.objects.filter(pk=self.course.pk).exists())

    def test_purge_after_retention_is_definitive_and_configurable(self):
        settings_obj = InstitutionSettings.load()
        settings_obj.trash_retention_days = 10
        settings_obj.save()
        self.course.delete(user=self.sga)
        self.assertEqual(purge_expired(), [])  # pas encore expiré
        purged = purge_expired(now=timezone.now() + timedelta(days=11))
        self.assertEqual(len(purged), 1)
        self.assertFalse(Course.all_objects.filter(pk=self.course.pk).exists())
        self.assertTrue(AuditLog.objects.filter(action="purge").exists())

    def test_only_pdg_changes_retention(self):
        self.client.force_authenticate(self.sga)
        self.assertEqual(self.client.patch("/api/core/settings/", {"trash_retention_days": 1},
                                           format="json").status_code, 403)
        self.client.force_authenticate(self.admin)
        r = self.client.patch("/api/core/settings/", {"trash_retention_days": 90}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(InstitutionSettings.load().trash_retention_days, 90)
        self.assertEqual(self.client.patch("/api/core/settings/", {"trash_retention_days": 0},
                                           format="json").status_code, 400)

    def test_trash_visibility_is_scoped(self):
        self.course.delete(user=self.sga)
        self.client.force_authenticate(self.sgad)
        self.assertEqual(self.client.get("/api/core/trash/").data["count"], 0)
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.get("/api/core/trash/").data["count"], 0)

    def test_deleted_user_cannot_login_and_is_restorable(self):
        staff = self.make("bibliothecaire", email="biblio@test.cd")
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.delete(f"/api/users/{staff.id}/").status_code, 204)
        self.client.force_authenticate(None)
        login = {"email": staff.email, "password": self.password}
        self.assertEqual(self.client.post("/api/auth/login/", login, format="json").status_code, 401)
        item = TrashItem.objects.get(is_root=True, content_type__model="user")
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.post(f"/api/core/trash/{item.id}/restore/").status_code, 200)
        self.client.force_authenticate(None)
        self.assertEqual(self.client.post("/api/auth/login/", login, format="json").status_code, 200)

    def test_student_with_grades_cannot_be_deleted(self):
        Grade.objects.create(student=self.student, course=self.course, category=self.category, value=10)
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.delete(f"/api/users/{self.student.id}/").status_code, 409)


class SignedMediaFieldTests(APITestCase):
    def test_public_image_and_private_file_urls(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        from apps.core.media import SignedFileField, SignedImageField
        from django.db.models.fields.files import FieldFile, ImageFieldFile
        from apps.users.models import User
        u = User.objects.create_user(email='m@m.test', password='x12345678!', role='etudiant', first_name='M', last_name='M')
        img = ImageFieldFile(u, User._meta.get_field('avatar'), 'avatars/a.png')
        self.assertTrue(SignedImageField().to_representation(img).endswith('avatars/a.png'))
        f = FieldFile(u, User._meta.get_field('avatar'), 'documents/officiels/x.pdf')
        self.assertIn('?t=', SignedFileField().to_representation(f))
