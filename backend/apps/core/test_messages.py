"""Les erreurs renvoyées par l'API doivent être compréhensibles sans technicien."""
from datetime import date, timedelta

from rest_framework.test import APITestCase

from apps.schedules.models import AcademicYear
from apps.users.models import User


class ClearErrorMessagesTests(APITestCase):
    def setUp(self):
        self.pdg = User.objects.create_user(email='pdg@t.cd', password='x12345678!', role='pdg',
                                            first_name='P', last_name='G')
        self.client.force_authenticate(self.pdg)

    def post(self, url, data):
        r = self.client.post(url, data, format='json')
        self.assertEqual(r.status_code, 400, r.data)
        self.assertIn('message', r.data)
        return r.data['message']

    def test_year_end_before_start_cites_dates(self):
        msg = self.post('/api/schedules/academic-years/', {'name': '2030-2031', 'start_date': '2030-09-01',
                                                           'end_date': '2030-08-01'})
        self.assertIn('01/08/2030', msg)
        self.assertIn('01/09/2030', msg)
        self.assertIn('après la date de début', msg)

    def test_year_name_must_match_dates(self):
        msg = self.post('/api/schedules/academic-years/', {'name': '2030-2031', 'start_date': '2029-09-01',
                                                           'end_date': '2030-07-01'})
        self.assertIn('doit commencer en 2030', msg)

    def test_missing_fields_are_named(self):
        msg = self.post('/api/schedules/academic-years/', {})
        self.assertIn('Date de début', msg)
        self.assertIn('obligatoire', msg)

    def test_duplicate_name_is_explained(self):
        AcademicYear.objects.create(name='2031-2032', start_date=date(2031, 9, 1), end_date=date(2032, 7, 31))
        msg = self.post('/api/schedules/academic-years/', {'name': '2031-2032', 'start_date': '2031-09-01',
                                                           'end_date': '2032-07-31'})
        self.assertIn('déjà utilisée', msg)

    def test_term_outside_year(self):
        y = AcademicYear.objects.create(name='2032-2033', start_date=date(2032, 9, 1), end_date=date(2033, 7, 31))
        msg = self.post('/api/schedules/terms/', {'academic_year': y.id, 'name': 'S1', 'term_type': 'semestre',
                                                  'start_date': '2032-08-01', 'end_date': '2033-01-31'})
        self.assertIn("avant le début de l'année académique 2032-2033", msg)

    def test_reservation_in_past(self):
        from apps.schedules.models import Room
        room = Room.objects.create(name='Salle T', capacity=30)
        msg = self.post('/api/schedules/reservations/', {
            'room': room.id, 'date': (date.today() - timedelta(days=3)).isoformat(),
            'startTime': '12:00', 'endTime': '10:00', 'purpose': 'Réunion'})
        self.assertIn('déjà passée', msg)
        self.assertIn("doit être après l'heure de début", msg)


class CalendarFlowTests(APITestCase):
    def setUp(self):
        self.pdg = User.objects.create_user(email='pdg2@t.cd', password='x12345678!', role='pdg',
                                            first_name='P', last_name='G')
        self.client.force_authenticate(self.pdg)
        self.year = AcademicYear.objects.create(name='2033-2034', start_date=date(2033, 9, 1),
                                                end_date=date(2034, 7, 31))

    def test_term_with_blank_optional_dates_is_accepted(self):
        r = self.client.post('/api/schedules/terms/', {
            'academic_year': self.year.id, 'name': 'Semestre 1', 'term_type': 'semestre', 'order': 1,
            'start_date': '2033-09-15', 'end_date': '2034-02-15', 'end_courses_date': '', 'exam_start_date': '',
            'exam_end_date': '', 'rattrapage_start_date': '', 'rattrapage_end_date': '',
            'auto_generate_events': True}, format='json')
        self.assertEqual(r.status_code, 201, r.data)

    def test_order_already_taken_suggests_next(self):
        from apps.schedules.models import Term
        Term.objects.create(academic_year=self.year, name='Semestre 1', term_type='semestre', order=1,
                            start_date=date(2033, 9, 15), end_date=date(2034, 2, 15))
        r = self.client.post('/api/schedules/terms/', {
            'academic_year': self.year.id, 'name': 'Semestre 2', 'term_type': 'semestre', 'order': 1,
            'start_date': '2034-02-16', 'end_date': '2034-07-31'}, format='json')
        self.assertEqual(r.status_code, 400)
        self.assertIn("Choisissez l'ordre 2", r.data['message'])

    def test_deleting_term_removes_its_automatic_events(self):
        from apps.schedules.models import AcademicEvent
        r = self.client.post('/api/schedules/terms/', {
            'academic_year': self.year.id, 'name': 'Semestre 1', 'term_type': 'semestre', 'order': 1,
            'start_date': '2033-09-15', 'end_date': '2034-02-15', 'exam_start_date': '2034-01-10',
            'exam_end_date': '2034-01-31', 'auto_generate_events': True}, format='json')
        self.assertEqual(r.status_code, 201, r.data)
        self.assertTrue(AcademicEvent.objects.filter(term_id=r.data['id'], is_auto_generated=True).exists())
        self.assertEqual(self.client.delete(f"/api/schedules/terms/{r.data['id']}/").status_code, 204)
        self.assertFalse(AcademicEvent.objects.filter(academic_year=self.year, is_auto_generated=True).exists())
