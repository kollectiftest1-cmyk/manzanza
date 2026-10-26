"""
Jeu de données de démonstration complet et cohérent (formation, démonstration, vidéo).

    python manage.py seed_demo            # base vide uniquement
    python manage.py seed_demo --force    # ajoute même si des données existent

Tout passe par les services métier réels (inscription, facturation, circuit des notes,
délibération, réinscription, paie), de sorte que les chiffres affichés sont exactement
ceux que produirait l'utilisation normale de l'application.

Scénario :
  * 2025-2026 : L1 Génie Informatique terminée — notes, 1re et 2e session, PV publiés,
    réinscriptions automatiques en L2 (admis, admis avec dette) ou redoublement.
  * 2026-2027 (année en cours, fin octobre) : admissions en L1, inscriptions et paiements,
    horaires, appels de présence, premières notes, paie de septembre payée et d'octobre
    en brouillon, TFC de L3, bibliothèque, assistance informatique.
Mot de passe de tous les comptes : Demo12345!
"""
import random
from datetime import date, datetime, time, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

PWD = 'Demo12345!'
DOMAIN = 'demo.mazanza.cd'

FIRST_M = ['Glody', 'Patrick', 'David', 'Junior', 'Hervé', 'Fiston', 'Christian', 'Merveil', 'Jonathan', 'Prince',
           'Exaucé', 'Dieumerci', 'Josué', 'Cédric', 'Héritier', 'Benjamin', 'Joël', 'Samuel']
FIRST_F = ['Grâce', 'Sarah', 'Esther', 'Divine', 'Ruth', 'Merveille', 'Nathalie', 'Rebecca', 'Plamedie', 'Gloire',
           'Christelle', 'Bénédicte', 'Naomie', 'Déborah', 'Chancelle', 'Rachel', 'Ornella', 'Precious']
LAST = ['Mukendi', 'Kalala', 'Nsimba', 'Mwamba', 'Kasongo', 'Lumbala', 'Ngalula', 'Bokele', 'Tshibanda', 'Kabila',
        'Mbuyi', 'Ilunga', 'Kanku', 'Mutombo', 'Kabeya', 'Lusamba', 'Ndombe', 'Makiese', 'Nzuzi', 'Mavungu',
        'Kiala', 'Lukusa', 'Matondo', 'Bayala', 'Nkiambi', 'Luzolo', 'Mbala', 'Tshala', 'Kapinga', 'Mpiana']

# Programme de L1 et L2 Génie Informatique : (code UE, intitulé, semestre, type, [(cours, crédits, CM, TD, TP)])
PROGRAMME = {
    'L1': [
        ('GI101', 'Fondements de la programmation', 1, 'fondamentale',
         [('Algorithmique', 4, 30, 15, 15), ('Programmation en C', 4, 30, 0, 30)]),
        ('GI102', "Mathématiques pour l'informaticien", 1, 'fondamentale',
         [('Analyse mathématique', 4, 40, 20, 0), ('Algèbre linéaire', 4, 40, 20, 0)]),
        ('GI103', 'Architecture des ordinateurs', 1, 'fondamentale',
         [('Électronique numérique', 5, 45, 15, 15), ('Architecture des ordinateurs', 5, 45, 15, 15)]),
        ('GI104', 'Langues et communication', 1, 'transversale',
         [('Anglais technique', 2, 15, 15, 0), ('Expression écrite et orale', 2, 15, 15, 0)]),
        ('GI105', 'Structures de données et objets', 2, 'fondamentale',
         [('Structures de données', 5, 40, 15, 20), ('Programmation orientée objet', 5, 35, 10, 30)]),
        ('GI106', 'Bases de données', 2, 'fondamentale', [('Bases de données relationnelles', 6, 45, 15, 30)]),
        ('GI107', 'Réseaux', 2, 'fondamentale', [('Introduction aux réseaux', 5, 40, 15, 20)]),
        ('GI108', 'Probabilités et statistique', 2, 'complementaire', [('Probabilités et statistique', 4, 40, 20, 0)]),
        ('GI109', 'Ouverture et méthodologie', 2, 'transversale',
         [('Initiation à la recherche', 3, 30, 15, 0), ('Éthique et déontologie', 2, 30, 0, 0)]),
    ],
    'L2': [
        ('GI201', 'Génie logiciel', 1, 'fondamentale',
         [('Génie logiciel', 5, 40, 15, 20), ('Développement web', 5, 30, 10, 35)]),
        ('GI202', "Systèmes d'exploitation", 1, 'fondamentale', [("Systèmes d'exploitation", 6, 45, 15, 30)]),
        ('GI203', 'Mathématiques appliquées', 1, 'fondamentale',
         [('Recherche opérationnelle', 5, 40, 20, 15), ('Analyse numérique', 5, 40, 20, 15)]),
        ('GI204', 'Anglais professionnel', 1, 'transversale', [('Anglais professionnel', 4, 30, 30, 0)]),
        ('GI205', 'Réseaux avancés', 2, 'fondamentale', [('Administration réseaux', 6, 40, 15, 35)]),
        ('GI206', 'Données', 2, 'fondamentale',
         [('Bases de données avancées', 5, 40, 15, 20), ('Introduction à la science des données', 5, 35, 10, 30)]),
        ('GI207', 'Projet tutoré', 2, 'complementaire', [('Projet tutoré', 6, 0, 30, 60)]),
        ('GI208', 'Entrepreneuriat', 2, 'transversale', [("Entrepreneuriat et gestion de projet", 8, 60, 30, 0)]),
    ],
}


def aware(d, h=9, m=0):
    return timezone.make_aware(datetime.combine(d, time(h, m)))


class Command(BaseCommand):
    help = "Crée une université de démonstration complète (données cohérentes, services métier réels)."

    def add_arguments(self, parser):
        parser.add_argument('--force', action='store_true', help="Ajouter même si la base contient déjà des données.")

    def handle(self, *args, **opts):
        from apps.users.models import User
        if User.objects.filter(email__endswith='@' + DOMAIN).exists():
            raise CommandError("Les données de démonstration existent déjà.")
        if User.objects.exists() and not opts['force']:
            raise CommandError("La base contient déjà des utilisateurs : relancez avec --force pour ajouter la démo.")
        random.seed(2026)
        self.used_names = set()
        with transaction.atomic():
            self.setup_institution()
            self.setup_people()
            self.setup_structure()
            self.setup_finance_rules()
            self.past_year()
            self.current_year()
            self.hr()
            self.memoires()
            self.services()
        self.stdout.write(self.style.SUCCESS(
            f"Démo prête. Comptes : <rôle>@{DOMAIN} (ex. pdg@{DOMAIN}, sga@{DOMAIN}, "
            f"etudiant@{DOMAIN}) — mot de passe {PWD}"))

    # ------------------------------------------------------------------ outils
    def user(self, role, local, first, last, **kw):
        from apps.users.models import User
        u = User.objects.create_user(email=f"{local}@{DOMAIN}", password=PWD, first_name=first, last_name=last,
                                     role=role, **kw)
        return u

    def random_name(self, sexe=None):
        while True:
            sexe_ = sexe or random.choice('MF')
            first = random.choice(FIRST_M if sexe_ == 'M' else FIRST_F)
            last = random.choice(LAST)
            post = random.choice(LAST)
            if (first, last) not in self.used_names and post != last:
                self.used_names.add((first, last))
                return first, last, post, sexe_

    def courses_for(self, auditoire, niveau, year_label, teachers):
        from apps.courses.models import Course
        from apps.scolarite.models import UniteEnseignement
        out = []
        for i, (code, intitule, sem, typ, cours) in enumerate(PROGRAMME[niveau]):
            ue, _ = UniteEnseignement.objects.get_or_create(
                code=code, defaults=dict(intitule=intitule, filiere=self.gi, niveau=niveau, semestre=sem, type_ue=typ))
            for j, (name, cr, cm, td, tp) in enumerate(cours):
                t = teachers[(i * 2 + j) % len(teachers)]
                c = Course.objects.create(
                    name=name, code=f"{code}.{j + 1}-{year_label[2:4]}", credits=cr, volume_cm=cm, volume_td=td, volume_tp=tp,
                    auditoire=auditoire, ue=ue, titulaire=t, annee_academique=year_label,
                    semester=f"Semestre {sem}", description=f"Élément constitutif de l'UE {code} — {intitule}.")
                if tp and self.assistants:
                    c.assistants.add(self.assistants[(i + j) % len(self.assistants)])
                out.append(c)
        return out

    def students(self, n, auditoire, year_label):
        from apps.inscriptions.views import generate_matricule
        out = []
        for _ in range(n):
            first, last, post, sexe = self.random_name()
            local = f"{first}.{last}".lower().translate(str.maketrans('éèêëàâîïôöûüç', 'eeeeaaiioouuc'))
            from apps.users.models import User
            k = 1
            base = local
            while User.all_objects.filter(email=f"{local}@{DOMAIN}").exists():
                k += 1
                local = f"{base}{k}"
            s = self.user('etudiant', local, first, last, post_nom=post, sexe=sexe, auditoire=auditoire,
                          matricule=generate_matricule(year_label), phone=f"+24381{random.randint(1000000, 9999999)}",
                          date_naissance=date(random.randint(2003, 2008), random.randint(1, 12), random.randint(1, 28)))
            out.append(s)
        return out

    def pay(self, fee, amount, method, when, session=None):
        from apps.payments.models import Payment
        p = Payment.objects.create(student_fee=fee, amount=Decimal(amount), payment_method=method, status='confirme',
                                   processed_by=self.caisse, cash_session=session,
                                   mobile_money_provider=random.choice(['vodacom', 'airtel', 'orange']) if method == 'mobile' else None,
                                   mobile_money_number=f"+24381{random.randint(1000000, 9999999)}" if method == 'mobile' else None)
        type(p).objects.filter(pk=p.pk).update(payment_date=aware(when, random.randint(8, 15), random.randint(0, 59)),
                                               created_at=aware(when))
        fee.recompute_paid()
        return p

    # ------------------------------------------------------------- institution
    def setup_institution(self):
        from apps.core.models import InstitutionSettings
        from apps.grades.models import AcademicConfig, GradeCategory
        s = InstitutionSettings.load()
        s.institution_name = 'Université MAZANZA'
        s.institution_city = 'Kinshasa'
        s.rector_name = 'Prof. Albert Mabiala Nzuzi'
        s.sga_name = 'Prof. Aline Kabongo'
        s.exam_min_paid_percent = 100
        s.save()
        cfg = AcademicConfig.load()
        cfg.max_grade, cfg.passing_grade = 20, 10
        cfg.allow_compensation = True
        cfg.compensation_threshold = 8
        cfg.min_credits_ratio_passage = 75
        cfg.credits_per_year = 60
        cfg.hours_per_credit = 15
        cfg.min_attendance_percent = Decimal('70')
        cfg.current_academic_year = '2026-2027'
        cfg.save()
        self.cat_interro = GradeCategory.objects.create(name='Interrogation', category_type='interro', weight=20,
                                                        description='Interrogations écrites en cours de semestre')
        self.cat_tp = GradeCategory.objects.create(name='Travaux pratiques', category_type='tp_td', weight=20,
                                                   description='TP / TD notés')
        self.cat_exam = GradeCategory.objects.create(name='Examen', category_type='examen', weight=60,
                                                     description="Examen de fin de semestre")

    def setup_people(self):
        self.pdg = self.user('pdg', 'pdg', 'Albert', 'Mabiala', post_nom='Nzuzi', sexe='M', is_staff=True)
        self.dg = self.user('directeur_general', 'dg', 'Henriette', 'Kapinga', post_nom='Mujinga', sexe='F')
        self.sga = self.user('sga', 'sga', 'Aline', 'Kabongo', post_nom='Mwika', sexe='F')
        self.sgad = self.user('sgad', 'sgad', 'Paul', 'Mbuyi', post_nom='Kalonji', sexe='M')
        self.appariteur = self.user('apparitorat', 'apparitorat', 'Odette', 'Bayala', sexe='F')
        self.caisse = self.user('caisse', 'caisse', 'Rose', 'Ilunga', post_nom='Kaseya', sexe='F')
        self.comptable = self.user('comptable', 'comptable', 'Jacques', 'Lumbu', post_nom='Nzau', sexe='M')
        self.biblio = self.user('bibliothecaire', 'bibliotheque', 'Sylvie', 'Mavungu', sexe='F')
        self.it = self.user('service_it', 'informatique', 'Trésor', 'Nkiambi', sexe='M')
        self.jury_ext = self.user('jury', 'jury', 'Dieudonné', 'Kayembe', post_nom='Mulumba', sexe='M')
        self.chef_section = self.user('chef_section', 'chef.section', 'Georges', 'Matondo', post_nom='Luzolo', sexe='M')
        self.chef_filiere = self.user('chef_departement', 'chef.filiere', 'Patrick', 'Kabeya', post_nom='Ntumba', sexe='M')
        self.teachers = [
            self.user('enseignant', 'enseignant', 'Jean-Pierre', 'Lukusa', post_nom='Mbala', sexe='M'),
            self.user('enseignant', 'marie.tshala', 'Marie', 'Tshala', post_nom='Kanku', sexe='F'),
            self.user('enseignant', 'christian.mutombo', 'Christian', 'Mutombo', post_nom='Ilunga', sexe='M'),
            self.user('enseignant', 'beatrice.nsimba', 'Béatrice', 'Nsimba', post_nom='Lusamba', sexe='F'),
            self.user('enseignant', 'joseph.kalonji', 'Joseph', 'Kalonji', post_nom='Mbuyi', sexe='M'),
            self.chef_filiere,
        ]
        self.assistants = [self.user('assistant', 'assistant', 'Ruth', 'Mpiana', sexe='F'),
                           self.user('assistant', 'fiston.bosenge', 'Fiston', 'Bosenge', sexe='M')]

    def setup_structure(self):
        from apps.auditoires.models import Auditoire, Filiere, Section
        from apps.schedules.models import AcademicEvent, AcademicYear, Room, Term, TimeSlot
        from apps.scolarite.models import AffectationRole
        self.st = Section.objects.create(nom='Sciences et Technologies', chef_section=self.chef_section)
        self.seg = Section.objects.create(nom='Sciences Économiques et de Gestion')
        self.gi = Filiere.objects.create(nom='Génie Informatique', section=self.st, chef_filiere=self.chef_filiere)
        Filiere.objects.create(nom='Réseaux et Télécommunications', section=self.st)
        Filiere.objects.create(nom='Gestion financière', section=self.seg)
        Filiere.objects.create(nom='Économie du développement', section=self.seg)
        for u, f in ((self.chef_section, None), (self.chef_filiere, self.gi)):
            u.section = self.st
            u.filiere = f
            u.save()
        AffectationRole.objects.create(user=self.chef_section, role='chef_section', section=self.st,
                                       start_date=date(2025, 9, 1), motif='Arrêté de nomination 2025/014')
        AffectationRole.objects.create(user=self.chef_filiere, role='chef_departement', filiere=self.gi,
                                       start_date=date(2025, 9, 1), motif='Arrêté de nomination 2025/015')
        AffectationRole.objects.create(user=self.teachers[1], role='commission_admission',
                                       start_date=date(2026, 7, 1), end_date=date(2026, 12, 31),
                                       motif="Commission d'admission 2026-2027")
        self.y_prev = AcademicYear.objects.create(name='2025-2026', start_date=date(2025, 9, 1),
                                                  end_date=date(2026, 8, 31), is_published=True)
        self.y_cur = AcademicYear.objects.create(name='2026-2027', start_date=date(2026, 9, 1),
                                                 end_date=date(2027, 8, 31), is_current=True, is_published=True)
        self.s1 = Term.objects.create(academic_year=self.y_cur, name='Semestre 1', term_type='semestre', order=1,
                                      start_date=date(2026, 9, 21), end_date=date(2027, 2, 13),
                                      end_courses_date=date(2027, 1, 16), exam_start_date=date(2027, 1, 25),
                                      exam_end_date=date(2027, 2, 6), auto_generate_events=False)
        Term.objects.create(academic_year=self.y_cur, name='Semestre 2', term_type='semestre', order=2,
                            start_date=date(2027, 2, 22), end_date=date(2027, 7, 31),
                            end_courses_date=date(2027, 6, 19), exam_start_date=date(2027, 6, 28),
                            exam_end_date=date(2027, 7, 10), rattrapage_start_date=date(2027, 8, 16),
                            rattrapage_end_date=date(2027, 8, 28), auto_generate_events=False)
        for name, typ, a, b in [
            ('Rentrée académique solennelle', 'rentree', date(2026, 9, 21), date(2026, 9, 21)),
            ("Fête de l'indépendance (rattrapage des cours)", 'ferie', date(2026, 6, 30), date(2026, 6, 30)),
            ('Vacances de Noël et Nouvel An', 'vacance', date(2026, 12, 21), date(2027, 1, 3)),
            ('Examens du 1er semestre', 'examen', date(2027, 1, 25), date(2027, 2, 6)),
            ('Délibération du 1er semestre', 'autre', date(2027, 2, 15), date(2027, 2, 19)),
            ('Examens du 2e semestre', 'examen', date(2027, 6, 28), date(2027, 7, 10)),
            ('Session de rattrapage', 'rattrapage', date(2027, 8, 16), date(2027, 8, 28)),
            ('Collation des grades', 'ceremonie', date(2027, 8, 30), date(2027, 8, 30)),
        ]:
            AcademicEvent.objects.create(name=name, event_type=typ, academic_year=self.y_cur, start_date=a, end_date=b)
        self.rooms = [Room.objects.create(name='Auditorium A', building='Bâtiment central', capacity=180, room_type='amphitheatre'),
                      Room.objects.create(name='Salle 104', building='Bâtiment B', capacity=60, room_type='salle'),
                      Room.objects.create(name='Labo informatique 1', building='Bâtiment B', capacity=40, room_type='laboratoire')]
        self.slots = [TimeSlot.objects.create(label='08h00 – 10h00', start_time=time(8), end_time=time(10), order=1),
                      TimeSlot.objects.create(label='10h15 – 12h15', start_time=time(10, 15), end_time=time(12, 15), order=2),
                      TimeSlot.objects.create(label='13h00 – 15h00', start_time=time(13), end_time=time(15), order=3),
                      TimeSlot.objects.create(label='15h15 – 17h15', start_time=time(15, 15), end_time=time(17, 15), order=4),
                      TimeSlot.objects.create(label='17h30 – 19h30', start_time=time(17, 30), end_time=time(19, 30),
                                              vacation_type='soir', order=5)]
        self.l1_prev = Auditoire.objects.create(nom='L1 Génie Informatique Jour', niveau='L1', filiere=self.gi,
                                                vacation='jour', annee_academique='2025-2026', academic_year=self.y_prev,
                                                capacite_max=120)
        self.l1_cur = Auditoire.objects.create(nom='L1 Génie Informatique Jour', niveau='L1', filiere=self.gi,
                                               vacation='jour', annee_academique='2026-2027', academic_year=self.y_cur,
                                               capacite_max=120)

    def setup_finance_rules(self):
        from apps.payments.models import BaremeFrais, FeeType
        ft_ins = FeeType.objects.create(name="Frais d'inscription", category='inscription', amount=50)
        ft_min = FeeType.objects.create(name='Minerval', category='scolarite', amount=600)
        ft_con = FeeType.objects.create(name='Frais connexes', category='autre', amount=75000)
        for year, start in ((self.y_prev, 2025), (self.y_cur, 2026)):
            BaremeFrais.objects.create(academic_year=year, fee_type=ft_ins, libelle="Frais d'inscription",
                                       amount=50, currency='USD', due_date=date(start, 10, 10),
                                       required_for_admin_validation=True, created_by=self.sgad)
            BaremeFrais.objects.create(academic_year=year, fee_type=ft_min, libelle='Minerval — 1re tranche',
                                       amount=300, currency='USD', due_date=date(start, 11, 15), created_by=self.sgad)
            BaremeFrais.objects.create(academic_year=year, fee_type=ft_min, libelle='Minerval — 2e tranche',
                                       amount=300, currency='USD', due_date=date(start + 1, 2, 15), created_by=self.sgad)
            BaremeFrais.objects.create(academic_year=year, fee_type=ft_con,
                                       libelle='Frais connexes (carte, bibliothèque, assurance)', amount=75000,
                                       currency='CDF', due_date=date(start, 12, 15), created_by=self.sgad)

    # --------------------------------------------------------------- 2025-2026
    def past_year(self):
        from apps.courses.attendance_models import Attendance, AttendanceSession
        from apps.grades import workflow
        from apps.grades.models import CourseGradeWeight, Grade
        from apps.payments.models import StudentFee
        from apps.scolarite.models import Deliberation
        from apps.scolarite.services import deliberation as D
        from apps.scolarite.services.documents import issue_document
        from apps.scolarite.services.enrollment import create_inscription, prepare_reinscriptions, validate_admin, validate_peda

        courses = self.courses_for(self.l1_prev, 'L1', '2025-2026', self.teachers)
        prog_c = next(c for c in courses if c.name == 'Programmation en C')
        for cat, w in ((self.cat_interro, 10), (self.cat_tp, 40), (self.cat_exam, 50)):
            CourseGradeWeight.objects.create(course=prog_c, category=cat, weight=w)
        studs = self.students(12, self.l1_prev, '2025-2026')
        self.prev_students = studs
        for s in studs:
            ins = create_inscription(s, self.l1_prev, user=self.sga, academic_year=self.y_prev)
            for fee in StudentFee.objects.filter(inscription=ins):
                self.pay(fee, fee.total_amount, random.choice(['especes', 'mobile', 'virement']),
                         fee.due_date - timedelta(days=random.randint(1, 20)))
            validate_admin(ins, self.sga)
            validate_peda(ins, self.chef_filiere)

        # Profils : niveau de l'étudiant (note moyenne visée sur 20)
        levels = [16.5, 15.2, 14.1, 13.4, 12.8, 12.1, 11.6, 11.0, 10.4, 9.0, 8.1, 7.0]
        random.shuffle(levels)
        self.levels = dict(zip([s.id for s in studs], levels))
        weak_course = next(c for c in courses if c.name == 'Électronique numérique')
        absent = studs[levels.index(10.4)] if 10.4 in levels else studs[0]
        # Appels : un cours avec contrôle d'assiduité (8 séances), un étudiant très souvent absent
        d0 = date(2025, 10, 6)
        for k in range(8):
            ses = AttendanceSession.objects.create(course=weak_course, date=d0 + timedelta(weeks=k), start_time=time(8),
                                                   end_time=time(10), title=f'Séance {k + 1}', is_finalized=True,
                                                   created_by=weak_course.titulaire)
            for s in studs:
                st = 'absent' if (s == absent and k % 3 != 0) else random.choice(['present'] * 9 + ['retard'])
                Attendance.objects.create(student=s, course=weak_course, session=ses, date=ses.date, status=st,
                                          recorded_by=weak_course.titulaire)

        def g(level, spread=2.2):
            return Decimal(str(round(max(2, min(19.5, random.gauss(level, spread))) * 2) / 2))

        for c in courses:
            for s in studs:
                lv = self.levels[s.id]
                Grade.objects.create(student=s, course=c, category=self.cat_interro, label='Interrogation 1',
                                     session_number=1, value=g(lv + 0.5), max_value=20)
                Grade.objects.create(student=s, course=c, category=self.cat_tp, label='TP noté',
                                     session_number=1, value=g(lv + 1), max_value=20)
                Grade.objects.create(student=s, course=c, category=self.cat_exam, label='Examen',
                                     session_number=1, value=g(lv - 0.3), max_value=20)
            sheet = workflow.get_sheet(c)
            workflow.submit(sheet, c.titulaire)
            workflow.approve(sheet, self.sga if c.titulaire == self.chef_filiere else self.chef_filiere)

        d1 = Deliberation.objects.create(auditoire=self.l1_prev, academic_year=self.y_prev, session=1,
                                         president=self.teachers[0], secretaire=self.teachers[1], created_by=self.sga)
        d1.membres.set([self.teachers[2], self.chef_filiere])
        D.open_deliberation(d1, self.teachers[0])
        D.close_deliberation(d1, self.teachers[0])
        D.publish(d1, self.sga, publication_date=aware(date(2026, 7, 20), 10))

        # 2e session : rattrapage des cours non validés pour les ajournés
        ajournes = list(d1.resultats.filter(decision__in=['ajourne', 'defaillant']))
        for res in ajournes:
            s = res.student
            lv = self.levels[s.id]
            for ue in res.details['ues']:
                if ue['validee']:
                    continue
                for cr in ue['cours']:
                    if cr['note'] is not None and cr['note'] >= 10:
                        continue
                    boost = 2.8 if lv >= 9 else 1.0
                    Grade.objects.create(student=s, course_id=cr['course_id'], category=self.cat_exam,
                                         label='Examen de rattrapage', session_number=1, exam_session=2,
                                         value=g(lv + boost, 1.2), max_value=20)
        for c in courses:
            sheet = workflow.get_sheet(c, 2)
            workflow.submit(sheet, c.titulaire)
            workflow.approve(sheet, self.sga if c.titulaire == self.chef_filiere else self.chef_filiere)
        d2 = Deliberation.objects.create(auditoire=self.l1_prev, academic_year=self.y_prev, session=2,
                                         president=self.teachers[0], secretaire=self.teachers[1], created_by=self.sga)
        d2.membres.set([self.teachers[2], self.chef_filiere])
        D.open_deliberation(d2, self.teachers[0])
        D.close_deliberation(d2, self.teachers[0])
        D.publish(d2, self.sga, publication_date=aware(date(2026, 9, 5), 10))
        self.d1, self.d2 = d1, d2

        prepare_reinscriptions(d1, self.y_cur, self.sga)
        prepare_reinscriptions(d2, self.y_cur, self.sga)
        for res in d1.resultats.filter(decision='admis').select_related('student')[:3]:
            issue_document('releve', res.student, self.sga, resultat=res, check_clearance=False)
        best = d1.resultats.order_by('rang').first()
        if best:
            issue_document('attestation_reussite', best.student, self.sga, resultat=best, check_clearance=False)

    # --------------------------------------------------------------- 2026-2027
    def current_year(self):
        from apps.auditoires.models import Auditoire
        from apps.courses.attendance_models import Attendance, AttendanceSession
        from apps.grades import workflow
        from apps.grades.models import Grade
        from apps.inscriptions.models import PreInscription
        from apps.payments.models import CashSession, StudentFee
        from apps.schedules.models import Schedule
        from apps.scolarite.models import InscriptionAnnuelle
        from apps.scolarite.services.enrollment import create_inscription, validate_admin, validate_peda

        today = timezone.localdate()
        self.l2_cur = Auditoire.objects.filter(filiere=self.gi, niveau='L2', academic_year=self.y_cur).first()
        if self.l2_cur is None:
            self.l2_cur = Auditoire.objects.filter(filiere=self.gi, niveau='L2', annee_academique='2026-2027').first()
        self.l2_cur.capacite_max = 100
        self.l2_cur.save()
        c_l1 = self.courses_for(self.l1_cur, 'L1', '2026-2027', self.teachers)
        c_l2 = self.courses_for(self.l2_cur, 'L2', '2026-2027', list(reversed(self.teachers)))
        self.l1_courses, self.l2_courses = c_l1, c_l2

        # Admissions L1 : candidats admis (comptes créés) + dossiers encore en cours
        admitted = self.students(14, self.l1_cur, '2026-2027')
        PreInscription.objects.filter(email__in=[s.email for s in admitted]).delete()
        stages = [('a_verifier', False, 'en_attente', ''), ('a_verifier', False, 'en_attente', ''),
                  ('a_completer', False, 'en_attente', 'Diplôme d\'État manquant : déposer la copie certifiée.'),
                  ('conforme', False, 'en_attente', ''), ('conforme', True, 'en_attente', ''),
                  ('conforme', True, 'en_attente', ''), ('conforme', True, 'liste_attente', '')]
        for dossier, paid, decision, comment in stages:
            first, last, post, sexe = self.random_name()
            PreInscription.objects.create(
                first_name=first, last_name=last, post_nom=post, sexe=sexe, email=f"{first}.{last}.candidat@gmail.com".lower()
                .translate(str.maketrans('éèêëàâîïôöûüç', 'eeeeaaiioouuc')),
                phone=f"+24382{random.randint(1000000, 9999999)}", date_naissance=date(2007, random.randint(1, 12), 12),
                lieu_naissance='Kinshasa', nationalite='Congolaise', adresse='Kinshasa, commune de Lemba',
                filiere=self.gi, niveau='L1', vacation='jour', academic_year='2026-2027',
                points_diplome_etat=random.randint(55, 78), etablissement_origine='Complexe scolaire Mont-Amba',
                bulletin_5='documents/demo/bulletin.pdf', bulletin_6='documents/demo/bulletin.pdf',
                diplome_etat='documents/demo/diplome.pdf', dossier_status=dossier, dossier_comment=comment,
                dossier_verified_by=self.appariteur if dossier != 'a_verifier' else None,
                frais_dossier_paye=paid, frais_dossier_reference=f"REC-DOS-{random.randint(10000, 99999)}" if paid else '',
                frais_dossier_enregistre_par=self.caisse if paid else None, commission_decision=decision)
        for s in admitted:
            PreInscription.objects.create(
                first_name=s.first_name, last_name=s.last_name, post_nom=s.post_nom, sexe=s.sexe, email=s.email,
                phone=s.phone, date_naissance=s.date_naissance, nationalite='Congolaise', adresse='Kinshasa',
                filiere=self.gi, niveau='L1', vacation='jour', academic_year='2026-2027',
                points_diplome_etat=random.randint(60, 82), bulletin_5='documents/demo/bulletin.pdf',
                bulletin_6='documents/demo/bulletin.pdf', diplome_etat='documents/demo/diplome.pdf',
                dossier_status='conforme', dossier_verified_by=self.appariteur, frais_dossier_paye=True,
                frais_dossier_reference=f"REC-DOS-{random.randint(10000, 99999)}", frais_dossier_enregistre_par=self.caisse,
                commission_decision='admis', status='validee', decided_by=self.sga)
            create_inscription(s, self.l1_cur, user=self.sga, academic_year=self.y_cur)

        # Caisse : une session clôturée hier, une session ouverte aujourd'hui
        closed = CashSession.objects.create(cashier=self.caisse, status='closed', opening_float={'USD': 50, 'CDF': 0})
        CashSession.objects.filter(pk=closed.pk).update(opened_at=aware(today - timedelta(days=1), 8),
                                                        closed_at=aware(today - timedelta(days=1), 16))
        self.open_session = CashSession.objects.create(cashier=self.caisse, status='open', opening_float={'USD': 50, 'CDF': 0})

        all_ins = InscriptionAnnuelle.objects.filter(academic_year=self.y_cur).select_related('student')
        for i, ins in enumerate(all_ins):
            fees = {f.notes: f for f in StudentFee.objects.filter(inscription=ins)}
            profile = i % 7  # 0-3 : à jour sur la 1re tranche ; 4-5 : partiel ; 6 : rien payé
            if profile == 6:
                continue
            when = date(2026, 9, random.randint(2, 28))
            self.pay(fees["Frais d'inscription"], 50, random.choice(['especes', 'mobile']), when)
            validate_admin(ins, self.sga)
            if profile <= 3:
                self.pay(fees['Minerval — 1re tranche'], 300, random.choice(['especes', 'mobile', 'virement']),
                         date(2026, 10, random.randint(1, 23)))
                self.pay(fees['Frais connexes (carte, bibliothèque, assurance)'], 75000, 'especes',
                         date(2026, 10, random.randint(1, 23)))
            elif profile in (4, 5):
                self.pay(fees['Minerval — 1re tranche'], 150, 'mobile', date(2026, 10, random.randint(5, 23)))
            if i % 9 != 8:
                validate_peda(ins, self.chef_filiere)
        # Encaissements d'hier (session clôturée, petit écart justifié) et du jour (session ouverte)
        for ins in list(all_ins)[3:7]:
            fee = StudentFee.objects.filter(inscription=ins, notes='Minerval — 2e tranche').first()
            if fee:
                self.pay(fee, 100, 'especes', today - timedelta(days=1), session=closed)
        exp = {'USD': float(50 + sum(p.amount for p in closed.payments.all())),
               'CDF': 0.0}
        CashSession.objects.filter(pk=closed.pk).update(
            expected=exp, counted={'USD': exp['USD'] - 5, 'CDF': 0.0}, difference={'USD': -5.0, 'CDF': 0.0},
            justification='Erreur de rendu de monnaie constatée à la clôture (5 USD).')
        for ins in list(all_ins)[:3]:
            fee = StudentFee.objects.filter(inscription=ins, notes='Minerval — 2e tranche').first()
            if fee:
                self.pay(fee, 100, 'especes', today, session=self.open_session)

        # Horaire hebdomadaire (semestre 1)
        days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
        day_idx = {d: i for i, d in enumerate(days)}
        self.schedule = {}
        for courses, room_shift in ((c_l1, 0), (c_l2, 1)):
            s1 = [c for c in courses if c.semester == 'Semestre 1']
            for k, c in enumerate(s1):
                day = days[(k + room_shift) % 6]
                slot = self.slots[(k // 6 + room_shift) % 4]
                Schedule.objects.create(course=c, auditoire=c.auditoire, room=self.rooms[(k + room_shift) % 3],
                                        teacher=c.titulaire, term=self.s1, day_of_week=day, timeslot=slot,
                                        start_time=slot.start_time, end_time=slot.end_time)
                self.schedule[c.id] = (day_idx[day], slot)

        # Appels de présence depuis la rentrée (21/09) jusqu'à hier
        start = date(2026, 9, 21)
        for c in c_l1 + c_l2:
            if c.id not in self.schedule:
                continue
            wd, slot = self.schedule[c.id]
            studs = [i.student for i in InscriptionAnnuelle.objects.filter(auditoire=c.auditoire)
                     .exclude(statut='en_attente').select_related('student')]
            d = start + timedelta(days=(wd - start.weekday()) % 7)
            n = 0
            while d < today:
                n += 1
                ses = AttendanceSession.objects.create(course=c, date=d, start_time=slot.start_time,
                                                       end_time=slot.end_time, title=f'Séance {n}', is_finalized=True,
                                                       created_by=c.titulaire)
                for s in studs:
                    r = random.random()
                    st = 'present' if r < 0.86 else 'retard' if r < 0.92 else 'absent' if r < 0.98 else 'excuse'
                    if s == studs[-1] and c == c_l1[0] and n % 2 == 0:
                        st = 'absent'
                    Attendance.objects.create(student=s, course=c, session=ses, date=d, status=st,
                                              recorded_by=c.titulaire)
                d += timedelta(weeks=1)

        # Séances de TP tenues par les assistants (comptent dans leurs heures prestées)
        for c in c_l1 + c_l2:
            if c.id not in self.schedule or not c.assistants.exists():
                continue
            a = c.assistants.first()
            studs = [i.student for i in InscriptionAnnuelle.objects.filter(auditoire=c.auditoire, statut='pedagogique')]
            for k, d in enumerate([date(2026, 9, 26), date(2026, 10, 3), date(2026, 10, 10), date(2026, 10, 17)]):
                if AttendanceSession.objects.filter(course=c, date=d).exists():
                    d = d - timedelta(days=1)
                ses = AttendanceSession.objects.create(course=c, date=d, start_time=time(13), end_time=time(16),
                                                       title=f'TP {k + 1}', is_finalized=True, created_by=a)
                for s in studs:
                    Attendance.objects.create(student=s, course=c, session=ses, date=d,
                                              status='present' if random.random() < 0.9 else 'absent', recorded_by=a)

        # Premières notes : interrogation 1 dans les cours du S1 ; une feuille soumise, une approuvée
        for courses in (c_l1, c_l2):
            s1 = [c for c in courses if c.semester == 'Semestre 1']
            for k, c in enumerate(s1[:4]):
                studs = [i.student for i in InscriptionAnnuelle.objects.filter(auditoire=c.auditoire,
                                                                              statut='pedagogique')]
                for s in studs:
                    Grade.objects.create(student=s, course=c, category=self.cat_interro, label='Interrogation 1',
                                         session_number=1, value=Decimal(str(random.randint(8, 18))), max_value=20)
                sheet = workflow.get_sheet(c)
                if k == 0:
                    workflow.submit(sheet, c.titulaire)
                    workflow.approve(sheet, self.sga if c.titulaire == self.chef_filiere else self.chef_filiere)
                elif k == 1:
                    workflow.submit(sheet, c.titulaire)

    # -------------------------------------------------------------------- RH
    def hr(self):
        from apps.hr import payroll as P
        from apps.hr.models import Contract, Employee, Leave, Payroll, StaffAttendance
        today = timezone.localdate()
        staff = [  # (user, poste, type, salaire mensuel USD, taux horaire, logement, transport, charges, charge statutaire h/mois)
            (self.dg, 'direction', 'permanent', 2200, 0, 400, 150, 3, 0),
            (self.sga, 'direction', 'permanent', 1800, 0, 300, 120, 4, 0),
            (self.sgad, 'direction', 'permanent', 1600, 0, 300, 120, 2, 0),
            (self.chef_section, 'chef_section', 'permanent', 1500, 18, 250, 100, 5, 24),
            (self.chef_filiere, 'chef_departement', 'permanent', 1400, 18, 250, 100, 3, 24),
            (self.teachers[0], 'professeur', 'permanent', 1300, 16, 200, 100, 4, 24),
            (self.teachers[1], 'professeur', 'permanent', 1200, 16, 200, 100, 2, 24),
            (self.teachers[2], 'professeur', 'charge_horaire', 0, 20, 0, 0, 1, 0),
            (self.teachers[3], 'professeur', 'charge_horaire', 0, 20, 0, 0, 0, 0),
            (self.teachers[4], 'professeur', 'permanent', 1100, 15, 150, 80, 6, 24),
            (self.assistants[0], 'assistant', 'permanent', 650, 10, 100, 60, 1, 0),
            (self.assistants[1], 'assistant', 'charge_horaire', 0, 10, 0, 0, 0, 0),
            (self.appariteur, 'appariteur', 'permanent', 550, 0, 80, 50, 3, 0),
            (self.caisse, 'comptable', 'permanent', 600, 0, 80, 50, 2, 0),
            (self.comptable, 'comptable', 'permanent', 900, 0, 120, 60, 2, 0),
            (self.biblio, 'bibliothecaire', 'permanent', 520, 0, 80, 50, 1, 0),
            (self.it, 'technicien_it', 'permanent', 800, 0, 100, 60, 0, 0),
        ]
        self.employees = []
        for n, (u, pos, typ, sal, rate, log, tr, dep, stat) in enumerate(staff, start=1):
            e = Employee.objects.create(
                user=u, employee_id=f"EMP-{n:04d}", position=pos, department='Génie Informatique' if rate else 'Administration',
                hire_date=date(2019 + n % 6, 9, 1), prestation_type=typ, base_monthly_salary=sal, salaire_horaire=rate,
                housing_allowance=log, transport_allowance=tr, dependents=dep, statutory_teaching_hours=stat,
                extra_hour_rate=rate, currency='USD', payment_account=f"Rawbank 05100-0{n:04d}",
                emergency_contact='Conjoint(e)', emergency_phone=f"+24381{random.randint(1000000, 9999999)}")
            Contract.objects.create(employee=e, contract_type='CDI' if typ == 'permanent' else 'vacation',
                                    start_date=e.hire_date, salary=sal or rate, hours_per_week=40 if typ == 'permanent' else None)
            self.employees.append(e)
        # Pointage du personnel administratif (septembre et octobre)
        admin_emps = [e for e in self.employees if e.prestation_type == 'permanent' and not e.statutory_teaching_hours]
        d = date(2026, 9, 1)
        late_guy = admin_emps[-1]
        while d < today:
            if d.weekday() < 6:
                for e in admin_emps:
                    r = random.random()
                    if e == late_guy and d.day in (8, 15, 29):
                        status, cin, cout = 'absent_injustifie', None, None
                    elif r < 0.85:
                        status, cin, cout = 'present', time(7, random.randint(45, 59)), time(15, random.randint(30, 50))
                    elif r < 0.95:
                        status, cin, cout = 'retard', time(8, random.randint(20, 55)), time(16, random.randint(0, 20))
                    else:
                        status, cin, cout = 'absent_justifie', None, None
                    if d.weekday() == 5:  # samedi : demi-journée, parfois heures supplémentaires
                        cout = time(13, 0) if cin else None
                    if e == self.employees[14] and d.day in (24, 25, 26) and d.month == 9:  # comptable : clôture
                        cout = time(19, 30)
                    StaffAttendance.objects.create(employee=e, date=d, status=status, check_in=cin, check_out=cout,
                                                   recorded_by=self.sgad)
            d += timedelta(days=1)
        Leave.objects.create(employee=self.employees[15], leave_type='conge_annuel', start_date=date(2026, 11, 9),
                             end_date=date(2026, 11, 20), reason='Congé annuel', status='en_attente')
        Leave.objects.create(employee=self.employees[12], leave_type='conge_maladie', start_date=date(2026, 10, 12),
                             end_date=date(2026, 10, 13), reason='Certificat médical déposé', status='approuve',
                             approved_by=self.sgad)
        # Paie : septembre validée puis payée, octobre en brouillon
        P.generate_month(9, 2026)
        now = timezone.now()
        Payroll.objects.filter(mois=9, annee=2026).update(status='valide', validated_by=self.sgad, validated_at=now)
        Payroll.objects.filter(mois=9, annee=2026).update(status='paye', paid_by=self.comptable,
                                                          payment_date=date(2026, 10, 2), payment_method='virement')
        P.generate_month(10, 2026)

    # ---------------------------------------------------------------- mémoires
    def memoires(self):
        from apps.auditoires.models import Auditoire
        from apps.courses.models import Course
        from apps.scolarite.models import Memoire
        from apps.scolarite.services.enrollment import create_inscription, validate_admin, validate_peda
        l3 = Auditoire.objects.create(nom='L3 Génie Informatique Jour', niveau='L3', filiere=self.gi, vacation='jour',
                                      annee_academique='2026-2027', academic_year=self.y_cur, capacite_max=80)
        tfc = Course.objects.create(name='Travail de fin de cycle (TFC)', code='GI310-1', credits=10, volume_cm=0,
                                    volume_td=30, volume_tp=120, auditoire=l3, titulaire=self.chef_filiere,
                                    annee_academique='2026-2027', semester='Semestre 2')
        studs = self.students(6, l3, '2026-2027')
        subjects = [
            ("Conception d'une application mobile de paiement des frais académiques", 'valide'),
            ('Système de gestion des stocks pour une PME de Kinshasa', 'propose'),
            ("Détection de fraude dans les transactions Mobile Money par apprentissage automatique", 'depose'),
            ("Plateforme de suivi des patients pour un centre de santé", 'programme'),
            ("Application web de gestion des inscriptions universitaires", 'soutenu'),
            ("Réseau informatique sécurisé pour une administration provinciale", 'refuse'),
        ]
        now = timezone.now()
        for s, (titre, statut) in zip(studs, subjects):
            ins = create_inscription(s, l3, user=self.sga, academic_year=self.y_cur)
            validate_admin(ins, self.sga, force=True)
            validate_peda(ins, self.chef_filiere)
            m = Memoire.objects.create(
                student=s, inscription=ins, type_travail='tfc', titre=titre,
                resume="Problématique, objectifs, méthodologie et résultats attendus.",
                directeur=random.choice(self.teachers[:5]), encadreur=self.assistants[0], course=tfc, statut=statut,
                motif_refus="Sujet trop large : préciser le périmètre (une institution, un réseau)." if statut == 'refuse' else '')
            if statut in ('depose', 'programme', 'soutenu'):
                m.depose_le = now - timedelta(days=12)
            if statut in ('programme', 'soutenu'):
                m.date_soutenance = now + timedelta(days=6) if statut == 'programme' else now - timedelta(days=3)
                m.salle = 'Auditorium A'
                m.president_jury = self.teachers[0]
            if statut == 'soutenu':
                m.note = Decimal('15.5')
                m.observations = "Travail rigoureux, bonne maîtrise technique. Corriger les références bibliographiques."
            m.save()
            if statut in ('programme', 'soutenu'):
                m.membres_jury.set([self.jury_ext, m.directeur])

    # ------------------------------------------------------------- services
    def services(self):
        from apps.core.models import SupportTicket
        from apps.library.models import Book, BookLoan
        from apps.users.models import User
        books = [
            ('Introduction à l\'algorithmique', 'Thomas H. Cormen', 'mathematiques', 4),
            ('Le langage C', 'Brian Kernighan, Dennis Ritchie', 'autre', 3),
            ('Bases de données : concepts et pratique', 'Georges Gardarin', 'autre', 2),
            ('Réseaux informatiques', 'Andrew Tanenbaum', 'autre', 3),
            ('Analyse mathématique I', 'Jean-Marie Monier', 'mathematiques', 5),
            ('Comptabilité générale OHADA', 'Collectif', 'comptabilite', 4),
            ('Droit des affaires OHADA', 'Collectif', 'droit', 2),
            ('Gestion de projet', 'Vincent Drouin', 'gestion', 2),
        ]
        objs = [Book.objects.create(title=t, author=a, category=c, quantity=q, available_quantity=q, language='Français',
                                    location=f"Rayon {chr(65 + i)}", added_by=self.biblio, borrowable=True)
                for i, (t, a, c, q) in enumerate(books)]
        today = timezone.now()
        borrowers = list(User.objects.filter(role='etudiant', email__endswith=DOMAIN)[:4])
        for k, (b, u) in enumerate(zip(objs, borrowers)):
            due = today + timedelta(days=7) if k else today - timedelta(days=5)
            BookLoan.objects.create(book=b, borrower=u, due_date=due, status='en_cours' if k else 'en_retard',
                                    librarian=self.biblio)
            b.available_quantity -= 1
            b.save()
        for title, cat, prio, st, by, loc in [
            ("Projecteur de l'Auditorium A en panne", 'materiel', 'haute', 'en_cours', self.teachers[0], 'Auditorium A'),
            ('Mot de passe oublié — compte étudiant', 'compte', 'normale', 'ouvert', borrowers[0], ''),
            ('Wi-Fi instable au Labo informatique 1', 'reseau', 'haute', 'ouvert', self.assistants[0], 'Labo informatique 1'),
            ("Installer Python et PostgreSQL sur les postes du labo", 'logiciel', 'normale', 'resolu', self.chef_filiere,
             'Labo informatique 1'),
        ]:
            SupportTicket.objects.create(title=title, description=title + '.', category=cat, priority=prio, status=st,
                                         created_by=by, location=loc, assigned_to=self.it if st != 'ouvert' else None,
                                         resolution='Logiciels installés sur les 40 postes.' if st == 'resolu' else '',
                                         resolved_at=today if st == 'resolu' else None)
        # Corbeille : une salle désaffectée supprimée par erreur, restaurable pendant 60 jours
        from apps.core.trash import soft_delete
        from apps.schedules.models import Room
        old = Room.objects.create(name='Salle 012', building='Ancien bâtiment', capacity=45, room_type='salle')
        soft_delete(old, user=self.pdg, reason='Salle désaffectée (travaux de toiture)')
        # Un compte étudiant « parlant » pour la démonstration : etudiant@demo.mazanza.cd
        from apps.scolarite.models import InscriptionAnnuelle
        demo = InscriptionAnnuelle.objects.filter(auditoire=self.l2_cur, statut='pedagogique').select_related(
            'student').first()
        if demo:
            demo.student.email = f"etudiant@{DOMAIN}"
            demo.student.save()
