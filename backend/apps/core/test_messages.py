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
