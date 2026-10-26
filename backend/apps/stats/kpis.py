"""
Indicateurs de pilotage (phase 4) — chiffres réels, calculés à la demande, filtrés par rôle :
  * académique : effectifs par statut d'inscription, niveau, filière ; feuilles de notes ;
    délibérations et taux de réussite ;
  * admission : candidatures par étape du circuit ;
  * finances : facturé / encaissé / reste à recouvrer PAR DEVISE (jamais d'addition USD + CDF),
    taux de recouvrement, impayés échus, caisses ouvertes, contre-passations en attente.
Exports CSV (UTF-8 avec BOM, séparateur « ; » pour Excel FR) : inscriptions, impayés, résultats.
"""
import csv
from decimal import Decimal

from django.db.models import Count, Q, Sum
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.audit import audit
from apps.users.permissions import has_role

ACADEMIC = ('pdg', 'sga', 'directeur_general', 'chef_section', 'chef_departement', 'apparitorat')
FINANCE = ('pdg', 'sgad', 'directeur_general', 'comptable', 'caisse')


def _year(request):
    from apps.schedules.models import AcademicYear
    year_id = request.query_params.get('academic_year')
    if year_id:
        return AcademicYear.objects.filter(pk=year_id).first()
    return AcademicYear.objects.filter(is_current=True).first() or AcademicYear.objects.order_by('-start_date').first()


def academic_kpis(year):
    from apps.grades.models import GradeCorrectionRequest, GradeSheet
    from apps.scolarite.models import Deliberation, InscriptionAnnuelle
    from apps.users.models import User

    ins = InscriptionAnnuelle.objects.filter(academic_year=year) if year else InscriptionAnnuelle.objects.none()
    by_status = dict(ins.values_list('statut').annotate(n=Count('id')))
    by_level = dict(ins.exclude(statut__in=['abandon']).values_list('niveau').annotate(n=Count('id')))
    by_filiere = list(ins.exclude(statut__in=['abandon']).values('auditoire__filiere__nom')
                      .annotate(n=Count('id')).order_by('-n')[:10])
    by_sex = dict(ins.exclude(statut__in=['abandon']).values_list('student__sexe').annotate(n=Count('id')))
    sheets = dict(GradeSheet.objects.values_list('status').annotate(n=Count('id')))
    delibs = Deliberation.objects.filter(academic_year=year) if year else Deliberation.objects.none()
    results = {'total': 0, 'admis': 0}
    for d in delibs.filter(statut__in=['cloturee', 'publiee']):
        for dec in d.resultats.values_list('decision', flat=True):
            results['total'] += 1
            if dec in ('admis', 'admis_dette'):
                results['admis'] += 1
    return {
        'academic_year': year.name if year else None,
        'inscriptions_total': sum(v for k, v in by_status.items() if k != 'abandon'),
        'inscriptions_par_statut': by_status,
        'inscriptions_par_niveau': by_level,
        'inscriptions_par_filiere': [{'filiere': r['auditoire__filiere__nom'], 'effectif': r['n']} for r in by_filiere],
        'inscriptions_par_sexe': by_sex,
        'enseignants': User.objects.filter(role__in=['enseignant', 'assistant'], is_active=True).count(),
        'feuilles_notes': sheets,
        'feuilles_a_approuver': sheets.get('submitted', 0),
        'corrections_en_attente': GradeCorrectionRequest.objects.filter(status='pending').count(),
        'deliberations': dict(delibs.values_list('statut').annotate(n=Count('id'))),
        'taux_reussite': round(results['admis'] * 100 / results['total'], 1) if results['total'] else None,
    }


def admission_kpis():
    from apps.inscriptions.models import PreInscription
    pending = PreInscription.objects.filter(status='en_attente')
    return {
        'candidatures_en_cours': pending.count(),
        'pieces_a_verifier': pending.filter(dossier_status='a_verifier').count(),
        'dossiers_a_completer': pending.filter(dossier_status='a_completer').count(),
        'frais_dossier_attendus': pending.filter(dossier_status='conforme', frais_dossier_paye=False).count(),
        'en_attente_commission': pending.filter(dossier_status='conforme', frais_dossier_paye=True,
                                                commission_decision='en_attente').count(),
        'liste_attente': pending.filter(commission_decision='liste_attente').count(),
        'admis': PreInscription.objects.filter(status='validee').count(),
        'refuses': PreInscription.objects.filter(status='rejetee').count(),
    }


def finance_kpis(year):
    from apps.payments.models import CashSession, Contrepassation, Payment, StudentFee
    fees = StudentFee.objects.exclude(status='annule')
    if year:
        fees = fees.filter(Q(inscription__academic_year=year) | Q(inscription__isnull=True))
    per_currency = {}
    for row in fees.values('currency').annotate(due=Sum('total_amount'), paid=Sum('amount_paid')):
        cur = row['currency'] or 'USD'
        due, paid = row['due'] or Decimal(0), row['paid'] or Decimal(0)
        per_currency[cur] = {'facture': float(due), 'encaisse': float(paid), 'reste': float(due - paid),
                             'taux_recouvrement': round(float(paid * 100 / due), 1) if due else None}
    today = timezone.localdate()
    overdue = fees.filter(due_date__lt=today).exclude(status='paye')
    month_start = today.replace(day=1)
    month = {}
    for row in Payment.objects.filter(status='confirme', payment_date__date__gte=month_start) \
            .values('student_fee__currency').annotate(total=Sum('amount')):
        month[row['student_fee__currency'] or 'USD'] = float(row['total'] or 0)
    return {
        'par_devise': per_currency,
        'encaisse_ce_mois': month,
        'impayes_echus': overdue.count(),
        'etudiants_en_retard': overdue.values('student').distinct().count(),
        'paiements_en_attente': Payment.objects.filter(status='en_attente').count(),
        'caisses_ouvertes': CashSession.objects.filter(status='open').count(),
        'contrepassations_en_attente': Contrepassation.objects.filter(status='pending').count(),
    }


class KPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        year = _year(request)
        data = {'generated_at': timezone.now()}
        if has_role(user, *ACADEMIC):
            data['academique'] = academic_kpis(year)
        if has_role(user, 'pdg', 'sga', 'apparitorat', 'commission_admission', 'directeur_general'):
            data['admission'] = admission_kpis()
        if has_role(user, *FINANCE):
            data['finances'] = finance_kpis(year)
        if len(data) == 1:
            raise PermissionDenied("Aucun tableau de bord pour ce rôle.")
        return Response(data)


def _csv(filename, header, rows):
    resp = HttpResponse(content_type='text/csv; charset=utf-8')
    resp['Content-Disposition'] = f'attachment; filename="{filename}"'
    resp.write('﻿')
    w = csv.writer(resp, delimiter=';')
    w.writerow(header)
    for r in rows:
        w.writerow(r)
    return resp


class ExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, kind):
        user = request.user
        year = _year(request)
        stamp = timezone.localdate().isoformat()
        if kind == 'inscriptions':
            if not has_role(user, *ACADEMIC):
                raise PermissionDenied()
            from apps.scolarite.models import InscriptionAnnuelle
            qs = InscriptionAnnuelle.objects.filter(academic_year=year).select_related(
                'student', 'auditoire__filiere').order_by('auditoire__nom', 'student__last_name')
            rows = [[i.student.matricule or '', i.student.last_name, i.student.first_name, i.student.sexe or '',
                     i.auditoire.filiere.nom, i.niveau, i.auditoire.nom, i.get_type_inscription_display(),
                     i.get_statut_display()] for i in qs]
            resp = _csv(f"inscriptions_{year.name if year else ''}_{stamp}.csv",
                        ['Matricule', 'Nom', 'Prénom', 'Sexe', 'Filière', 'Niveau', 'Groupe', 'Type', 'Statut'], rows)
        elif kind == 'impayes':
            if not has_role(user, *FINANCE):
                raise PermissionDenied()
            from apps.payments.models import StudentFee
            qs = StudentFee.objects.exclude(status__in=['paye', 'annule']).select_related(
                'student', 'student__auditoire', 'fee_type', 'fee_campaign').order_by('due_date')
            rows = [[f.student.matricule or '', f.student.name, getattr(f.student.auditoire, 'nom', ''),
                     f.notes or (f.fee_type.name if f.fee_type else ''), f.currency, f.total_amount, f.amount_paid,
                     f.amount_remaining, f.due_date, 'Oui' if f.due_date < timezone.localdate() else 'Non']
                    for f in qs]
            resp = _csv(f"impayes_{stamp}.csv", ['Matricule', 'Étudiant', 'Groupe', 'Frais', 'Devise', 'Dû',
                                                 'Payé', 'Reste', 'Échéance', 'Échu'], rows)
        elif kind == 'resultats':
            from apps.scolarite.models import Deliberation
            from apps.scolarite.views import visible_deliberations
            delib = visible_deliberations(user).filter(pk=request.query_params.get('deliberation')).first()
            if delib is None:
                raise ValidationError({'deliberation': "Délibération introuvable ou non autorisée."})
            rows = [[r.rang or '', r.student.matricule or '', r.student.name, r.moyenne,
                     f"{r.credits_obtenus}/{r.credits_total}", r.get_decision_display(), r.get_mention_display()]
                    for r in delib.resultats.select_related('student').order_by('rang')]
            resp = _csv(f"resultats_{delib.auditoire.nom}_S{delib.session}.csv",
                        ['Rang', 'Matricule', 'Étudiant', 'Moyenne', 'Crédits', 'Décision', 'Mention'], rows)
        else:
            raise ValidationError({'kind': "Export inconnu (inscriptions, impayes, resultats)."})
        audit('export', None, details={'export': kind, 'annee': year.name if year else None})
        return resp
