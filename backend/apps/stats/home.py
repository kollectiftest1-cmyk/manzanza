"""
Accueil des tableaux de bord : activité récente RÉELLE (notifications de l'utilisateur et,
pour l'administration, journal d'audit), agenda réel (événements du calendrier académique,
délibérations, réservations) et compteurs propres à chaque rôle. Remplace les données
de démonstration codées en dur dans l'interface.
"""
import os
from datetime import timedelta

from django.conf import settings
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.permissions import has_role

AUDIT_READERS = ('pdg', 'directeur_general', 'sga', 'sgad', 'service_it')
ACTION_TYPE = {'login': 'user', 'login_failed': 'alert', 'grade': 'award', 'payment': 'check',
               'inscription': 'user', 'trash': 'file', 'restore': 'check', 'purge': 'file',
               'settings': 'file', 'role': 'user', 'create': 'check', 'update': 'file',
               'export': 'file', 'security': 'alert'}


def _activity(user, limit=8):
    from apps.notifications.models import Notification
    items = []
    for n in Notification.objects.filter(recipient=user).order_by('-created_at')[:limit]:
        items.append({'id': f"n{n.id}", 'type': 'check' if n.is_read else 'user', 'title': n.title,
                      'description': (n.message or '')[:140], 'at': n.created_at})
    if has_role(user, *AUDIT_READERS):
        from apps.core.models import AuditLog
        qs = AuditLog.objects.exclude(action__in=['login']).order_by('-timestamp')
        if not has_role(user, 'pdg', 'directeur_general', 'service_it'):
            qs = qs.filter(actor=user)
        for a in qs[:limit]:
            items.append({'id': f"a{a.id}", 'type': ACTION_TYPE.get(a.action, 'file'),
                          'title': a.get_action_display(),
                          'description': f"{a.object_repr or ''} — {a.actor_repr or 'Système'}".strip(' —'),
                          'at': a.timestamp})
    items.sort(key=lambda x: x['at'], reverse=True)
    return items[:limit]


def _agenda(user, limit=6):
    from apps.schedules.models import AcademicEvent
    today = timezone.localdate()
    out = []
    for e in AcademicEvent.objects.filter(end_date__gte=today).order_by('start_date')[:limit]:
        out.append({'title': e.name, 'description': e.get_event_type_display(),
                    'date': e.start_date.isoformat(), 'end': e.end_date.isoformat(),
                    'badge': e.get_event_type_display(), 'kind': 'event'})
    try:
        from apps.scolarite.models import Deliberation
        from apps.scolarite.views import visible_deliberations
        for d in visible_deliberations(user).filter(statut__in=['preparation', 'ouverte']) \
                .select_related('auditoire')[:limit]:
            out.append({'title': f"Délibération {d.auditoire.nom}", 'description': d.get_session_display(),
                        'date': (d.opened_at or d.created_at).date().isoformat(), 'badge': d.get_statut_display(),
                        'kind': 'deliberation'})
    except Exception:
        pass
    try:
        from apps.scolarite.models import Memoire
        qs = Memoire.objects.filter(statut='programme', date_soutenance__date__gte=today)
        if user.role == 'etudiant':
            qs = qs.filter(student=user)
        elif not has_role(user, 'sga', 'directeur_general'):
            qs = qs.filter(Q(directeur=user) | Q(president_jury=user) | Q(membres_jury=user)).distinct()
        for m in qs.select_related('student').order_by('date_soutenance')[:limit]:
            out.append({'title': f"Soutenance — {m.student.name}", 'description': m.titre[:80],
                        'date': m.date_soutenance.date().isoformat(), 'badge': m.salle or 'Soutenance',
                        'kind': 'soutenance'})
    except Exception:
        pass
    out.sort(key=lambda x: x['date'])
    return out[:limit]


def _dir_size_mb(path):
    total = 0
    for root, _dirs, files in os.walk(path):
        for f in files:
            try:
                total += os.path.getsize(os.path.join(root, f))
            except OSError:
                pass
    return round(total / 1024 / 1024, 1)


def _counters(user):
    from apps.users.models import User
    now = timezone.now()
    day_ago = now - timedelta(hours=24)
    c = {}
    if has_role(user, 'pdg', 'service_it'):
        from apps.core.models import AuditLog, InstitutionSettings, TrashItem
        users = User.objects.all()
        last_purge = AuditLog.objects.filter(action='purge').order_by('-timestamp').first()
        c['systeme'] = {
            'utilisateurs': users.count(),
            'actifs_24h': users.filter(last_login__gte=day_ago).count(),
            'comptes_inactifs': users.filter(Q(is_active=False) | ~Q(status='actif')).count(),
            'echecs_connexion_24h': AuditLog.objects.filter(action='login_failed', timestamp__gte=day_ago).count(),
            'evenements_audit_24h': AuditLog.objects.filter(timestamp__gte=day_ago).count(),
            'elements_corbeille': TrashItem.objects.count(),
            'retention_jours': InstitutionSettings.load().trash_retention_days,
            'derniere_purge': last_purge.timestamp if last_purge else None,
            'stockage_fichiers_mo': _dir_size_mb(settings.MEDIA_ROOT),
            'base_de_donnees': settings.DATABASES['default']['ENGINE'].rsplit('.', 1)[-1],
            'par_role': dict(users.filter(is_active=True).values_list('role').annotate(n=Count('id'))),
            'nouveaux_comptes_7j': users.filter(date_joined__gte=now - timedelta(days=7)).count(),
        }
    if has_role(user, 'apparitorat'):
        from apps.inscriptions.models import PreInscription
        from apps.scolarite.models import DocumentOfficiel, InscriptionAnnuelle
        from apps.schedules.models import RoomReservation
        c['apparitorat'] = {
            'pieces_a_verifier': PreInscription.objects.filter(status='en_attente', dossier_status='a_verifier').count(),
            'dossiers_a_completer': PreInscription.objects.filter(status='en_attente', dossier_status='a_completer').count(),
            'inscriptions_a_valider': InscriptionAnnuelle.objects.filter(statut='en_attente').count(),
            'documents_emis_30j': DocumentOfficiel.objects.filter(issued_at__gte=now - timedelta(days=30)).count(),
            'reservations_en_attente': RoomReservation.objects.filter(status='pending').count(),
        }
    if has_role(user, 'bibliothecaire'):
        from apps.library.models import Book, BookLoan, BookReservation
        loans = BookLoan.objects.all()
        c['bibliotheque'] = {
            'ouvrages': Book.objects.filter(is_active=True).count(),
            'exemplaires_disponibles': sum(Book.objects.filter(is_active=True).values_list('available_quantity', flat=True)),
            'emprunts_en_cours': loans.filter(status='en_cours').count(),
            'retards': loans.filter(Q(status='en_retard') | Q(status='en_cours', due_date__lt=now)).count(),
            'retours_30j': loans.filter(return_date__gte=now - timedelta(days=30)).count(),
            'reservations_en_attente': BookReservation.objects.filter(status='en_attente').count(),
        }
    if has_role(user, 'jury') or user.jurys.exists() or \
            user.role in ('enseignant', 'assistant', 'chef_section', 'chef_departement'):
        from apps.scolarite.models import Deliberation
        mine = Deliberation.objects.filter(Q(president=user) | Q(secretaire=user) | Q(membres=user)).distinct()
        if mine.exists() or has_role(user, 'jury'):
            c['jury'] = {
                'deliberations': mine.count(),
                'en_preparation': mine.filter(statut='preparation').count(),
                'ouvertes': mine.filter(statut='ouverte').count(),
                'cloturees': mine.filter(statut__in=['cloturee', 'publiee']).count(),
                'presidees': mine.filter(president=user).count(),
            }
    if user.role in ('caisse', 'comptable', 'sgad'):
        try:
            c['caisse'] = _cash_summary(user)
        except Exception:
            pass
    if user.role == 'etudiant':
        try:
            c['etudiant'] = _student_summary(user)
        except Exception:
            pass
    if user.role in ('chef_section', 'chef_departement'):
        try:
            c['filiere'] = _filiere_summary(user)
        except Exception:
            pass
    try:
        from apps.scolarite.models import Memoire
        mm = Memoire.objects.filter(Q(directeur=user) | Q(president_jury=user) | Q(membres_jury=user)).distinct()
        if mm.exists():
            c['memoires'] = {
                'diriges': mm.filter(directeur=user).exclude(statut__in=['soutenu', 'refuse']).count(),
                'soutenances_a_venir': mm.filter(statut='programme', date_soutenance__gte=now).count(),
                'a_noter': mm.filter(statut='programme', president_jury=user).count(),
            }
    except Exception:
        pass
    return c


def _student_summary(user):
    """Situation réelle de l'étudiant : inscription en cours, cours, notes publiées, assiduité, frais."""
    from apps.courses.models import Course
    from apps.scolarite.models import InscriptionAnnuelle, ResultatDeliberation
    from apps.scolarite.services.assiduite import attendance_rate
    from apps.scolarite.services.deliberation import course_score
    from apps.scolarite.services.finance import clearance
    ins = InscriptionAnnuelle.objects.filter(student=user).select_related('auditoire', 'academic_year') \
        .order_by('-academic_year__start_date').first()
    last = ResultatDeliberation.objects.filter(student=user, deliberation__statut='publiee') \
        .select_related('deliberation__academic_year').order_by('-deliberation__academic_year__start_date',
                                                                '-deliberation__session').first()
    cours = []
    if ins and ins.auditoire_id:
        for course in Course.objects.filter(auditoire=ins.auditoire, is_active=True).select_related('titulaire', 'ue') \
                .order_by('semester', 'name'):
            score, _missing = course_score(user, course, 1)
            rate = attendance_rate(user, course)
            cours.append({'id': course.id, 'nom': course.name, 'code': course.code, 'credits': course.credits,
                          'semestre': course.semester, 'ue': course.ue.code if course.ue_id else '',
                          'titulaire': course.titulaire.name if course.titulaire_id else '',
                          'note_publiee': float(score) if score is not None else None,
                          'assiduite': float(rate) if rate is not None else None})
    rates = [x['assiduite'] for x in cours if x['assiduite'] is not None]
    fin = clearance(user, ins) if ins else None
    return {
        'annee': ins.academic_year.name if ins and ins.academic_year_id else None,
        'niveau': ins.niveau if ins else None,
        'groupe': ins.auditoire.nom if ins and ins.auditoire_id else None,
        'statut': ins.get_statut_display() if ins else None,
        'credits_annee': sum(x['credits'] or 0 for x in cours),
        'nb_cours': len(cours),
        'notes_publiees': sum(1 for x in cours if x['note_publiee'] is not None),
        'assiduite_moyenne': round(sum(rates) / len(rates), 1) if rates else None,
        'derniere_moyenne': float(last.moyenne) if last and last.moyenne is not None else None,
        'derniere_decision': last.get_decision_display() if last else None,
        'derniere_session': f"{last.deliberation.academic_year.name if last.deliberation.academic_year_id else ''} — "
                            f"{last.deliberation.get_session_display()}" if last else None,
        'credits_capitalises': last.credits_obtenus if last else None,
        'frais_payes_pourcent': float(fin['paid_percent']) if fin else None,
        'en_regle': fin['cleared'] if fin else None,
        'cours': cours,
    }


def _cash_summary(user):
    """Caisse / comptabilité : encaissements réels par devise (jamais additionnées)."""
    from apps.payments.models import CashSession, Contrepassation, Payment, StudentFee
    from apps.scolarite.services.finance import totals_by_currency
    today = timezone.localdate()
    ok = Payment.objects.filter(status='confirme')
    session = CashSession.objects.filter(cashier=user, status='open').first()
    return {
        'session_ouverte': bool(session),
        'session_depuis': session.opened_at if session else None,
        'session_encaissements': session.payments.filter(status='confirme').count() if session else 0,
        'session_totaux': totals_by_currency(session.payments.filter(status='confirme')) if session else {},
        'aujourdhui': totals_by_currency(ok.filter(payment_date__date=today)),
        'aujourdhui_nb': ok.filter(payment_date__date=today).count(),
        'mois': totals_by_currency(ok.filter(payment_date__year=today.year, payment_date__month=today.month)),
        'en_attente': Payment.objects.filter(status='en_attente').count(),
        'contrepassations': Contrepassation.objects.filter(status='pending').count(),
        'impayes_echus': StudentFee.objects.filter(due_date__lt=today).exclude(status__in=['paye', 'annule'])
                         .values('student').distinct().count(),
    }


def _filiere_summary(user):
    """Chef de section / de filière : chiffres réels du périmètre (année en cours)."""
    from apps.auditoires.models import Auditoire, Filiere
    from apps.courses.models import Course
    from apps.grades.models import GradeSheet
    from apps.schedules.models import AcademicYear
    from apps.scolarite.models import InscriptionAnnuelle, Memoire
    from apps.scolarite.views import _scope_filieres
    scope = _scope_filieres(user)
    year = AcademicYear.objects.filter(is_current=True).first()
    auds = Auditoire.objects.all() if scope is None else Auditoire.objects.filter(filiere_id__in=scope)
    if year:
        auds = auds.filter(Q(academic_year=year) | Q(academic_year__isnull=True, annee_academique=year.name))
    ins = InscriptionAnnuelle.objects.filter(auditoire__in=auds)
    courses = Course.objects.filter(auditoire__in=auds, is_active=True)
    teachers = set(courses.exclude(titulaire__isnull=True).values_list('titulaire_id', flat=True))
    teachers |= set(courses.values_list('assistants', flat=True)) - {None}
    names = list(Filiere.objects.filter(id__in=scope).values_list('nom', flat=True)) if scope else []
    return {
        'perimetre': ', '.join(names) if names else 'Toutes les filières',
        'groupes': auds.count(),
        'inscrits': ins.exclude(statut__in=['abandon', 'suspendue']).count(),
        'a_valider_pedagogiquement': ins.filter(statut='administrative').count(),
        'en_attente_administrative': ins.filter(statut='en_attente').count(),
        'cours': courses.count(),
        'enseignants': len(teachers),
        'feuilles_a_approuver': GradeSheet.objects.filter(course__in=courses, status='submitted').count(),
        'sujets_tfc_a_valider': Memoire.objects.filter(inscription__auditoire__in=auds, statut='propose').count(),
    }


class HomeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({'activity': _activity(request.user), 'agenda': _agenda(request.user),
                         'counters': _counters(request.user), 'generated_at': timezone.now()})
