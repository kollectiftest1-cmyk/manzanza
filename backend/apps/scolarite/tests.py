"""
Tests de bout en bout du modèle universitaire v2 : inscription annuelle & facturation,
circuit des notes, délibération LMD, publication, documents officiels vérifiables,
caisse & contre-passations, Mobile Money signé, fichiers privés, cookie de session.
"""
import hashlib
import hmac
import json
import shutil
import tempfile
from datetime import date, timedelta
from decimal import Decimal

from django.core.cache import cache
from django.core.files.base import ContentFile
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.auditoires.models import Auditoire, Filiere, Section
from apps.core.models import InstitutionSettings
from apps.courses.models import Course
from apps.grades import workflow
from apps.grades.models import Grade, GradeCategory
from apps.payments.models import BaremeFrais, FeeType, Payment, StudentFee
from apps.schedules.models import AcademicYear
from apps.users.models import User

from .models import Deliberation, DocumentOfficiel, InscriptionAnnuelle, UniteEnseignement
from .services.enrollment import create_inscription


_MEDIA = tempfile.mkdtemp(prefix='mz-test-media-')


@override_settings(MEDIA_ROOT=_MEDIA)
class ScolariteV2Tests(APITestCase):
    pwd = 'Password123!'

    def mk(self, role, email=None, **extra):
        return User.objects.create_user(email=email or f"{role}@v2.test", password=self.pwd, first_name=role.title(),
                                        last_name='V2', role=role, **extra)

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(_MEDIA, ignore_errors=True)

    def setUp(self):
        cache.clear()
        self.sga = self.mk('sga')
        self.sgad = self.mk('sgad')
        self.caisse = self.mk('caisse')
        self.comptable = self.mk('comptable')
        self.teacher = self.mk('enseignant')
        self.president = self.mk('enseignant', email='president@v2.test')
        self.secretaire = self.mk('enseignant', email='secretaire@v2.test')
        self.year = AcademicYear.objects.create(name='2026-2027', start_date=date(2026, 9, 1),
                                                end_date=date(2027, 8, 31), is_current=True)
        self.next_year = AcademicYear.objects.create(name='2027-2028', start_date=date(2027, 9, 1),
                                                     end_date=date(2028, 8, 31))
        self.section = Section.objects.create(nom='Sciences')
        self.filiere = Filiere.objects.create(nom='Informatique', section=self.section)
        self.aud = Auditoire.objects.create(nom='L1 Info Jour', niveau='L1', filiere=self.filiere, vacation='jour',
                                            annee_academique='2026-2027')
        self.ue = UniteEnseignement.objects.create(code='INF101', intitule='Fondements', filiere=self.filiere,
                                                   niveau='L1')
        self.c_a = Course.objects.create(name='Algo', credits=3, auditoire=self.aud, titulaire=self.teacher,
                                         ue=self.ue, annee_academique='2026-2027')
        self.c_b = Course.objects.create(name='Maths', credits=2, auditoire=self.aud, titulaire=self.teacher,
                                         ue=self.ue, annee_academique='2026-2027')
        self.c_c = Course.objects.create(name='Anglais', credits=5, auditoire=self.aud, titulaire=self.teacher,
                                         annee_academique='2026-2027')
        self.exam = GradeCategory.objects.create(name='Examen', category_type='examen', weight=100)
        ft = FeeType.objects.create(name='Minerval', category='scolarite', amount=100, academic_year='2026-2027')
        self.bareme = BaremeFrais.objects.create(academic_year=self.year, fee_type=ft, libelle='Minerval L1',
                                                 niveau='L1', amount=Decimal('100'), currency='USD',
                                                 due_date=date(2026, 10, 15), required_for_admin_validation=True)
        self.s1 = self.mk('etudiant', email='s1@v2.test', matricule='MZ-1', auditoire=self.aud)
        self.s2 = self.mk('etudiant', email='s2@v2.test', matricule='MZ-2', auditoire=self.aud)
        self.i1 = create_inscription(self.s1, self.aud, user=self.sga)
        self.i2 = create_inscription(self.s2, self.aud, user=self.sga)

    # --- helpers ------------------------------------------------------------
    def pay_all(self, student):
        for fee in StudentFee.objects.filter(student=student):
            Payment.objects.create(student_fee=fee, amount=fee.total_amount, payment_method='virement',
                                   status='confirme', processed_by=self.caisse)
            fee.recompute_paid()

    def grade(self, student, course, value, session=1):
        Grade.objects.create(student=student, course=course, category=self.exam, label='Examen',
                             value=Decimal(value), max_value=20, exam_session=session, session_number=1)

    def approve_all(self, session=1):
        for course in (self.c_a, self.c_b, self.c_c):
            sheet = workflow.get_sheet(course, session)
            workflow.submit(sheet, self.teacher)
            workflow.approve(sheet, self.sga)

    def make_delib(self, session=1):
        self.client.force_authenticate(self.sga)
        r = self.client.post('/api/scolarite/deliberations/', {
            'auditoire': self.aud.id, 'session': session, 'president': self.president.id,
            'secretaire': self.secretaire.id, 'membres': [self.teacher.id]}, format='json')
        self.assertEqual(r.status_code, status.HTTP_201_CREATED, r.data)
        return r.data['id']

    # --- tests --------------------------------------------------------------
    def test_annual_enrolment_bills_fees_and_gates_admin_validation(self):
        fee = StudentFee.objects.get(student=self.s1)
        self.assertEqual((fee.inscription_id, fee.bareme_id, fee.currency), (self.i1.id, self.bareme.id, 'USD'))
        self.assertEqual(InscriptionAnnuelle.objects.get(pk=self.i1.pk).ues.count(), 1)
        self.client.force_authenticate(self.sga)
        r = self.client.post(f'/api/scolarite/inscriptions/{self.i1.id}/validate-admin/')
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)  # frais requis non réglés
        self.pay_all(self.s1)
        r = self.client.post(f'/api/scolarite/inscriptions/{self.i1.id}/validate-admin/')
        self.assertEqual(r.data['statut'], 'administrative')
        r = self.client.post(f'/api/scolarite/inscriptions/{self.i1.id}/validate-peda/')
        self.assertEqual(r.data['statut'], 'pedagogique')
        # double inscription la même année interdite
        r = self.client.post('/api/scolarite/inscriptions/', {'student': self.s1.id, 'auditoire': self.aud.id},
                             format='json')
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        # un étudiant ne voit que ses inscriptions
        self.client.force_authenticate(self.s2)
        mine = self.client.get('/api/scolarite/inscriptions/')
        ids = [x['id'] for x in mine.data.get('results', mine.data)]
        self.assertEqual(ids, [self.i2.id])

    def test_grade_sheet_locks_edits_and_needs_correction_request(self):
        self.grade(self.s1, self.c_a, '12')
        g = Grade.objects.get(student=self.s1, course=self.c_a)
        self.assertEqual(g.status, 'draft')
        sheet = workflow.get_sheet(self.c_a)
        workflow.submit(sheet, self.teacher)
        self.client.force_authenticate(self.teacher)
        r = self.client.patch(f'/api/grades/grades/{g.id}/', {'value': '18'}, format='json')
        self.assertNotEqual(r.status_code, status.HTTP_200_OK)
        workflow.approve(sheet, self.sga)
        g.refresh_from_db()
        self.assertEqual(g.status, 'validated')
        r = self.client.post('/api/grades/corrections/', {'grade': g.id, 'new_value': '14',
                                                           'reason': 'Erreur de report'}, format='json')
        self.assertEqual(r.status_code, status.HTTP_201_CREATED, r.data)

    def test_full_deliberation_cycle_publication_and_documents(self):
        for s, (a, b, c) in ((self.s1, ('16', '14', '12')), (self.s2, ('8', '9', '15'))):
            self.grade(s, self.c_a, a)
            self.grade(s, self.c_b, b)
            self.grade(s, self.c_c, c)
        did = self.make_delib()
        # Ouverture refusée tant que les feuilles ne sont pas approuvées
        self.client.force_authenticate(self.president)
        r = self.client.post(f'/api/scolarite/deliberations/{did}/open/')
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.approve_all()
        # Un non-membre ne peut rien faire
        self.client.force_authenticate(self.caisse)
        self.assertEqual(self.client.post(f'/api/scolarite/deliberations/{did}/open/').status_code,
                         status.HTTP_404_NOT_FOUND)
        self.client.force_authenticate(self.president)
        r = self.client.post(f'/api/scolarite/deliberations/{did}/open/')
        self.assertEqual(r.status_code, status.HTTP_200_OK, r.data)
        res = {x['student']: x for x in self.client.get(f'/api/scolarite/deliberations/{did}/resultats/').data}
        self.assertEqual(res[self.s1.id]['decision'], 'admis')
        self.assertEqual(Decimal(res[self.s1.id]['moyenne']), Decimal('13.60'))
        self.assertEqual(res[self.s1.id]['mention'], 'satisfaction')
        self.assertEqual(res[self.s2.id]['decision'], 'ajourne')
        self.assertEqual(res[self.s2.id]['credits_obtenus'], 5)
        # Notes verrouillées pendant la délibération
        self.assertEqual(workflow.get_sheet(self.c_a).status, 'locked')
        # Décision du jury : justification obligatoire, tracée
        rid = res[self.s2.id]['id']
        self.client.force_authenticate(self.teacher)
        r = self.client.post(f'/api/scolarite/resultats/{rid}/override/', {'decision': 'admis_dette'}, format='json')
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        r = self.client.post(f'/api/scolarite/resultats/{rid}/override/',
                             {'decision': 'redouble', 'justification': 'Assiduité insuffisante'}, format='json')
        self.assertTrue(r.data['decision_modifiee'])
        # Clôture par le président : PV PDF + empreinte
        self.assertEqual(self.client.post(f'/api/scolarite/deliberations/{did}/close/').status_code,
                         status.HTTP_403_FORBIDDEN)
        self.client.force_authenticate(self.president)
        r = self.client.post(f'/api/scolarite/deliberations/{did}/close/')
        self.assertEqual(r.data['statut'], 'cloturee')
        self.assertEqual(len(r.data['pv_sha256']), 64)
        pv = self.client.get(f'/api/scolarite/deliberations/{did}/pv/')
        self.assertTrue(b''.join(pv.streaming_content).startswith(b'%PDF'))
        # Avant publication : l'étudiant ne voit rien
        self.client.force_authenticate(self.s1)
        self.assertEqual(self.client.get('/api/scolarite/resultats/me/').data, [])
        # Publication différée
        self.client.force_authenticate(self.sga)
        later = (timezone.now() + timedelta(days=1)).isoformat()
        self.client.post(f'/api/scolarite/deliberations/{did}/publish/', {'publication_date': later}, format='json')
        self.client.force_authenticate(self.s1)
        self.assertEqual(self.client.get('/api/scolarite/resultats/me/').data, [])
        Deliberation.objects.filter(pk=did).update(publication_date=timezone.now() - timedelta(minutes=1))
        # Publié mais frais impayés : résultat masqué
        mine = self.client.get('/api/scolarite/resultats/me/').data
        self.assertTrue(mine[0]['blocked'])
        self.assertIsNone(mine[0]['moyenne'])
        self.pay_all(self.s1)
        mine = self.client.get('/api/scolarite/resultats/me/').data
        self.assertEqual(mine[0]['decision'], 'admis')
        # Documents officiels : relevé vérifiable publiquement, révocable
        self.client.force_authenticate(self.sga)
        r = self.client.post('/api/scolarite/documents/issue/', {'type_document': 'releve',
                                                                 'resultat': res[self.s1.id]['id']}, format='json')
        self.assertEqual(r.status_code, status.HTTP_201_CREATED, r.data)
        self.assertTrue(r.data['numero'].startswith('RN-'))
        code = r.data['verification_code']
        r2 = self.client.post('/api/scolarite/documents/issue/', {'type_document': 'attestation_reussite',
                                                                  'resultat': res[self.s2.id]['id']}, format='json')
        self.assertEqual(r2.status_code, status.HTTP_400_BAD_REQUEST)  # non admis (et non en règle)
        self.client.force_authenticate(None)
        v = self.client.get(f'/api/scolarite/verify/{code}/')
        self.assertTrue(v.data['valid'])
        self.assertEqual(v.data['matricule'], 'MZ-1')
        self.assertEqual(self.client.get('/api/scolarite/verify/not-a-code/').status_code, 404)
        doc = DocumentOfficiel.objects.get(verification_code=code)
        self.client.force_authenticate(self.sga)
        self.client.post(f'/api/scolarite/documents/{doc.id}/revoke/', {'reason': 'Erreur'}, format='json')
        self.client.force_authenticate(None)
        self.assertFalse(self.client.get(f'/api/scolarite/verify/{code}/').data['valid'])
        # Réinscriptions : admis → L2 de l'année suivante, redoublant non traité en session 1
        self.client.force_authenticate(self.sga)
        r = self.client.post(f'/api/scolarite/deliberations/{did}/prepare-reinscriptions/',
                             {'academic_year': self.next_year.id}, format='json')
        self.assertEqual(r.data['passages'], 1)
        nxt = InscriptionAnnuelle.objects.get(student=self.s1, academic_year=self.next_year)
        self.assertEqual((nxt.niveau, nxt.type_inscription), ('L2', 'reinscription'))

    def test_second_session_replaces_exam_and_allows_credit_debt(self):
        self.grade(self.s2, self.c_a, '8')
        self.grade(self.s2, self.c_b, '9')
        self.grade(self.s2, self.c_c, '15')
        for s in (self.s1,):
            for c in (self.c_a, self.c_b, self.c_c):
                self.grade(s, c, '12')
        did = self.make_delib(1)
        self.approve_all(1)
        self.client.force_authenticate(self.president)
        self.client.post(f'/api/scolarite/deliberations/{did}/open/')
        self.client.post(f'/api/scolarite/deliberations/{did}/close/')
        self.client.force_authenticate(self.sga)
        did2 = self.make_delib(2)
        self.grade(self.s2, self.c_a, '11', session=2)
        for c in (self.c_a, self.c_b, self.c_c):
            sheet = workflow.get_sheet(c, 2)
            workflow.submit(sheet, self.teacher)
            workflow.approve(sheet, self.sga)
        self.client.force_authenticate(self.president)
        r = self.client.post(f'/api/scolarite/deliberations/{did2}/open/')
        self.assertEqual(r.status_code, status.HTTP_200_OK, r.data)
        res = self.client.get(f'/api/scolarite/deliberations/{did2}/resultats/').data
        self.assertEqual([x['student'] for x in res], [self.s2.id])  # seuls les ajournés repassent
        # UE1 = (11*3 + 9*2)/5 = 10.2 → validée : tous les crédits
        self.assertEqual(res[0]['decision'], 'admis')

    def test_cash_session_contrepassation_and_separation_of_duties(self):
        fee = StudentFee.objects.get(student=self.s1)
        self.client.force_authenticate(self.caisse)
        self.client.post('/api/payments/cash-sessions/open/', {'opening_float': {'USD': '10'}}, format='json')
        r = self.client.post('/api/payments/', {'student_fee': fee.id, 'amount': '60.00', 'payment_method': 'especes',
                                                'status': 'confirme'}, format='json')
        self.assertEqual(r.status_code, status.HTTP_201_CREATED, r.data)
        pid = r.data['id']
        session = self.client.get('/api/payments/cash-sessions/current/').data
        self.assertEqual(session['live_expected'], {'USD': 70.0})
        r = self.client.post(f"/api/payments/cash-sessions/{session['id']}/close/", {'counted': {'USD': '65'}},
                             format='json')
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)  # écart sans justification
        r = self.client.post(f"/api/payments/cash-sessions/{session['id']}/close/",
                             {'counted': {'USD': '65'}, 'justification': 'Billet abîmé'}, format='json')
        self.assertEqual(r.data['difference'], {'USD': '-5'})
        # Contre-passation : demandée par la caisse, validée par un autre (comptable)
        r = self.client.post('/api/payments/contrepassations/', {'payment': pid, 'reason': 'Doublon'}, format='json')
        self.assertEqual(r.status_code, status.HTTP_201_CREATED, r.data)
        cid = r.data['id']
        self.assertEqual(self.client.post(f'/api/payments/contrepassations/{cid}/decide/', {'approve': True},
                                          format='json').status_code, status.HTTP_403_FORBIDDEN)
        self.client.force_authenticate(self.comptable)
        r = self.client.post(f'/api/payments/contrepassations/{cid}/decide/', {'approve': True}, format='json')
        self.assertEqual(r.data['status'], 'approved')
        fee.refresh_from_db()
        self.assertEqual((fee.amount_paid, fee.status), (Decimal('0'), 'impaye'))
        self.assertEqual(Payment.objects.get(pk=pid).status, 'annule')

    @override_settings(MOBILE_MONEY_WEBHOOK_SECRET='s3cret')
    def test_mobile_money_callback_requires_valid_signature(self):
        fee = StudentFee.objects.get(student=self.s1)
        self.client.force_authenticate(self.s1)
        r = self.client.post('/api/payments/mobile-money/', {'student_fee_id': fee.id, 'amount': '100',
                                                             'provider': 'mtn', 'phone_number': '+243810000000'},
                             format='json')
        txn = r.data['transaction_id']
        self.client.force_authenticate(None)
        body = json.dumps({'transaction_id': txn, 'status': 'success', 'amount': '100.00'}).encode()
        bad = self.client.post('/api/payments/mobile-money/callback/', body, content_type='application/json',
                               HTTP_X_SIGNATURE='deadbeef')
        self.assertEqual(bad.status_code, 403)
        sig = hmac.new(b's3cret', body, hashlib.sha256).hexdigest()
        ok = self.client.post('/api/payments/mobile-money/callback/', body, content_type='application/json',
                              HTTP_X_SIGNATURE=sig)
        self.assertEqual(ok.data['status'], 'confirme')
        fee.refresh_from_db()
        self.assertEqual(fee.status, 'paye')

    def test_exam_quiz_requires_financial_clearance(self):
        from apps.scolarite.services.finance import clearance
        self.assertFalse(clearance(self.s1)['cleared'])
        self.pay_all(self.s1)
        self.assertTrue(clearance(self.s1)['cleared'])

    def test_private_media_needs_signed_url(self):
        from apps.core.media import signed_query
        from django.conf import settings
        import os
        path = 'documents/officiels/test-private.pdf'
        full = os.path.join(settings.MEDIA_ROOT, path)
        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, 'wb') as fh:
            fh.write(b'%PDF-1.4 secret')
        try:
            self.assertEqual(self.client.get(f'/media/{path}').status_code, 404)
            self.assertEqual(self.client.get(f'/media/{path}?t=1:forged').status_code, 404)
            r = self.client.get(f'/media/{path}?t={signed_query(path)}')
            self.assertEqual(r.status_code, 200)
        finally:
            os.remove(full)

    def test_web_refresh_token_lives_in_httponly_cookie(self):
        r = self.client.post('/api/auth/login/', {'email': 's1@v2.test', 'password': self.pwd}, format='json',
                             HTTP_X_AUTH_MODE='cookie')
        self.assertEqual(r.status_code, 200, r.data)
        self.assertNotIn('refresh', r.data)
        cookie = r.cookies['mz_refresh']
        self.assertTrue(cookie['httponly'])
        r2 = self.client.post('/api/auth/token/refresh/', {}, format='json', HTTP_X_AUTH_MODE='cookie')
        self.assertEqual(r2.status_code, 200)
        self.assertIn('access', r2.data)
        # mobile : refresh dans le corps
        cache.clear()
        r3 = self.client.post('/api/auth/login/', {'email': 's2@v2.test', 'password': self.pwd}, format='json')
        self.assertIn('refresh', r3.data)

    def test_kpis_are_role_scoped_and_per_currency(self):
        self.client.force_authenticate(self.sgad)
        r = self.client.get('/api/stats/kpis/')
        self.assertIn('finances', r.data)
        self.assertNotIn('academique', r.data)
        self.assertEqual(r.data['finances']['par_devise']['USD']['facture'], 200.0)
        self.client.force_authenticate(self.sga)
        r = self.client.get('/api/stats/kpis/')
        self.assertEqual(r.data['academique']['inscriptions_total'], 2)
        csv = self.client.get('/api/stats/export/inscriptions/')
        self.assertIn('MZ-1', csv.content.decode('utf-8-sig'))
        self.client.force_authenticate(self.s1)
        self.assertEqual(self.client.get('/api/stats/kpis/').status_code, 403)


class UniteEnseignementApiTests(APITestCase):
    def test_sga_attaches_courses_and_programme_follows(self):
        sga = User.objects.create_user(email='sga@ue.test', password='x12345678!', role='sga', first_name='S', last_name='G')
        year = AcademicYear.objects.create(name='2026-2027', start_date=date(2026, 9, 1), end_date=date(2027, 8, 31))
        fil = Filiere.objects.create(nom='Droit', section=Section.objects.create(nom='Sciences sociales'))
        aud = Auditoire.objects.create(nom='L1 Droit', niveau='L1', filiere=fil, vacation='jour', annee_academique='2026-2027')
        other = Auditoire.objects.create(nom='L2 Droit', niveau='L2', filiere=fil, vacation='jour', annee_academique='2026-2027')
        c1 = Course.objects.create(name='Droit civil', credits=5, auditoire=aud, titulaire=sga)
        c2 = Course.objects.create(name='Droit pénal', credits=4, auditoire=other, titulaire=sga)
        st = User.objects.create_user(email='e@ue.test', password='x12345678!', role='etudiant', first_name='E', last_name='T', auditoire=aud)
        ins = create_inscription(st, aud, user=sga, academic_year=year)
        self.client.force_authenticate(sga)
        r = self.client.post('/api/scolarite/ues/', {'code': 'DR101', 'intitule': 'Droit privé', 'filiere': fil.id, 'niveau': 'L1'}, format='json')
        self.assertEqual(r.status_code, 201, r.data)
        ue_id = r.data['id']
        self.assertTrue(ins.ues.filter(ue_id=ue_id).exists())
        cand = self.client.get(f'/api/scolarite/ues/{ue_id}/candidates/').data
        self.assertEqual([c['id'] for c in cand], [c1.id])
        bad = self.client.post(f'/api/scolarite/ues/{ue_id}/set-courses/', {'courses': [c2.id]}, format='json')
        self.assertEqual(bad.status_code, 400)
        ok = self.client.post(f'/api/scolarite/ues/{ue_id}/set-courses/', {'courses': [c1.id]}, format='json')
        self.assertEqual(ok.data['credits'], 5)


class HomeDashboardTests(APITestCase):
    def test_home_returns_real_activity_and_role_counters(self):
        from apps.notifications.models import Notification
        it = User.objects.create_user(email='it@h.test', password='x12345678!', role='service_it', first_name='I', last_name='T')
        st = User.objects.create_user(email='st@h.test', password='x12345678!', role='etudiant', first_name='S', last_name='T')
        Notification.objects.create(recipient=st, title='Résultats publiés', message='Vos résultats sont disponibles.',
                                    notification_type='cours')
        self.client.force_authenticate(st)
        r = self.client.get('/api/stats/home/')
        self.assertEqual(r.data['activity'][0]['title'], 'Résultats publiés')
        self.assertNotIn('systeme', r.data['counters'])
        self.assertIn('etudiant', r.data['counters'])
        self.client.force_authenticate(it)
        r = self.client.get('/api/stats/home/')
        self.assertEqual(r.data['counters']['systeme']['utilisateurs'], 2)


class SupportTicketTests(APITestCase):
    def test_ticket_lifecycle_and_visibility(self):
        it = User.objects.create_user(email='it@t.test', password='x12345678!', role='service_it', first_name='I', last_name='T')
        a = User.objects.create_user(email='a@t.test', password='x12345678!', role='enseignant', first_name='A', last_name='T')
        b = User.objects.create_user(email='b@t.test', password='x12345678!', role='etudiant', first_name='B', last_name='T')
        self.client.force_authenticate(a)
        r = self.client.post('/api/core/tickets/', {'title': 'Projecteur salle 12', 'description': 'Ne s\'allume pas',
                                                    'category': 'materiel', 'priority': 'haute'}, format='json')
        self.assertEqual(r.status_code, 201, r.data)
        tid = r.data['id']
        self.assertEqual(self.client.post(f'/api/core/tickets/{tid}/take/').status_code, 403)
        self.client.force_authenticate(b)
        self.assertEqual(len(self.client.get('/api/core/tickets/').data['results']), 0)
        self.client.force_authenticate(it)
        self.assertEqual(self.client.post(f'/api/core/tickets/{tid}/take/').data['status'], 'en_cours')
        self.assertEqual(self.client.post(f'/api/core/tickets/{tid}/resolve/', {}, format='json').status_code, 400)
        r = self.client.post(f'/api/core/tickets/{tid}/resolve/', {'resolution': 'Lampe remplacée'}, format='json')
        self.assertEqual(r.data['status'], 'resolu')


class AssiduiteTests(ScolariteV2Tests):
    """Règle d'assiduité : sous le seuil, l'étudiant n'est pas admis à l'examen du cours."""

    def test_low_attendance_counts_exam_as_zero(self):
        from datetime import time as t
        from apps.courses.attendance_models import Attendance, AttendanceSession
        from apps.grades.models import AcademicConfig
        cfg = AcademicConfig.load()
        cfg.min_attendance_percent = Decimal('66.67')
        cfg.save()
        sessions = [AttendanceSession.objects.create(course=self.c_c, date=date(2026, 10, d), start_time=t(8),
                                                     end_time=t(10), is_finalized=True, created_by=self.teacher)
                    for d in (5, 12, 19)]
        for i, s in enumerate(sessions):
            Attendance.objects.create(student=self.s1, course=self.c_c, session=s, date=s.date,
                                      status='present' if i == 0 else 'absent')
            Attendance.objects.create(student=self.s2, course=self.c_c, session=s, date=s.date, status='present')
        for s in (self.s1, self.s2):
            for c in (self.c_a, self.c_b, self.c_c):
                self.grade(s, c, '15')
        did = self.make_delib()
        self.approve_all()
        self.client.force_authenticate(self.president)
        self.client.post(f'/api/scolarite/deliberations/{did}/open/')
        res = {x['student']: x for x in self.client.get(f'/api/scolarite/deliberations/{did}/resultats/').data}
        anglais = lambda r: [c for u in r['details']['ues'] for c in u['cours'] if c['intitule'] == 'Anglais'][0]
        self.assertTrue(anglais(res[self.s1.id])['non_admis_examen'])
        self.assertEqual(anglais(res[self.s1.id])['note'], 0.0)
        self.assertEqual(anglais(res[self.s1.id])['assiduite'], 33.3)
        self.assertFalse(anglais(res[self.s2.id])['non_admis_examen'])
        self.assertEqual(res[self.s1.id]['decision'], 'ajourne')
        self.assertEqual(res[self.s2.id]['decision'], 'admis')


class MemoireWorkflowTests(ScolariteV2Tests):
    """TFC / mémoire : proposition → validation → dépôt PDF → programmation → note reportée."""

    def test_full_workflow(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        self.client.force_authenticate(self.s1)
        r = self.client.post('/api/scolarite/memoires/', {'titre': 'Gestion des inscriptions', 'type_travail': 'tfc',
                                                          'directeur': self.teacher.id, 'course': self.c_c.id}, format='json')
        self.assertEqual(r.status_code, 201, r.data)
        mid = r.data['id']
        self.assertEqual(r.data['statut'], 'propose')
        # doublon refusé
        r2 = self.client.post('/api/scolarite/memoires/', {'titre': 'Autre', 'directeur': self.teacher.id}, format='json')
        self.assertEqual(r2.status_code, 400)
        # l'étudiant ne valide pas lui-même
        self.assertEqual(self.client.post(f'/api/scolarite/memoires/{mid}/decide/', {'accept': True}).status_code, 403)
        # dépôt impossible avant validation
        pdf = lambda: SimpleUploadedFile('m.pdf', b'%PDF-1.4 test', content_type='application/pdf')
        self.assertEqual(self.client.post(f'/api/scolarite/memoires/{mid}/deposit/', {'fichier': pdf()}).status_code, 400)
        self.client.force_authenticate(self.sga)
        r = self.client.post(f'/api/scolarite/memoires/{mid}/decide/', {'accept': True}, format='json')
        self.assertEqual(r.data['statut'], 'valide')
        self.client.force_authenticate(self.s1)
        bad = SimpleUploadedFile('m.pdf', b'MZ not pdf', content_type='application/pdf')
        self.assertEqual(self.client.post(f'/api/scolarite/memoires/{mid}/deposit/', {'fichier': bad}).status_code, 400)
        r = self.client.post(f'/api/scolarite/memoires/{mid}/deposit/', {'fichier': pdf()})
        self.assertEqual(r.data['statut'], 'depose', r.data)
        # S2 ne voit pas le mémoire de S1
        self.client.force_authenticate(self.s2)
        self.assertEqual(self.client.get(f'/api/scolarite/memoires/{mid}/').status_code, 404)
        self.client.force_authenticate(self.sga)
        r = self.client.post(f'/api/scolarite/memoires/{mid}/schedule/', {
            'date_soutenance': '2027-07-10T09:00:00', 'salle': 'Auditorium', 'president_jury': self.president.id,
            'membres_jury': [self.secretaire.id]}, format='json')
        self.assertEqual(r.data['statut'], 'programme', r.data)
        # seul le président note
        self.client.force_authenticate(self.secretaire)
        self.assertEqual(self.client.post(f'/api/scolarite/memoires/{mid}/grade/', {'note': 15}).status_code, 403)
        self.client.force_authenticate(self.president)
        self.assertEqual(self.client.post(f'/api/scolarite/memoires/{mid}/grade/', {'note': 25}).status_code, 400)
        r = self.client.post(f'/api/scolarite/memoires/{mid}/grade/', {'note': 16}, format='json')
        self.assertEqual(r.data['statut'], 'soutenu')
        self.assertTrue(r.data['note_reportee'])
        self.assertEqual(Grade.objects.get(student=self.s1, course=self.c_c).value, Decimal('16'))
        # le jury voit ce mémoire dans sa liste
        self.client.force_authenticate(self.secretaire)
        self.assertEqual(len(self.client.get('/api/scolarite/memoires/').data['results']), 1)


class ClearanceDueDateTests(ScolariteV2Tests):
    """« En règle » = frais échus réglés ; une tranche future n'est pas exigée."""

    def test_future_instalment_not_required(self):
        from apps.payments.models import BaremeFrais, FeeType, StudentFee
        from apps.scolarite.services.finance import clearance
        ft = FeeType.objects.create(name='Minerval T2', category='scolarite', amount=300, academic_year='2026-2027')
        BaremeFrais.objects.create(academic_year=self.year, fee_type=ft, libelle='2e tranche', niveau='L1',
                                   amount=Decimal('300'), currency='USD', due_date=date(2099, 2, 15))
        ins = create_inscription(self.mk('etudiant', email='s9@v2.test', auditoire=self.aud), self.aud, user=self.sga)
        s = ins.student
        for fee in StudentFee.objects.filter(student=s, due_date__lt=date(2099, 1, 1)):
            Payment.objects.create(student_fee=fee, amount=fee.total_amount, payment_method='virement',
                                   status='confirme', processed_by=self.caisse)
            fee.recompute_paid()
        self.assertTrue(clearance(s, ins)['cleared'])
        from apps.scolarite.services.finance import paid_ratio
        self.assertEqual(paid_ratio(s, ins, as_of=date(2099, 3, 1)), Decimal('25.00'))
