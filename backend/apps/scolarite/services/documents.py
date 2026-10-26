"""
Documents officiels (PDF) : procès-verbal de délibération, relevé de notes, attestations,
diplôme. Chaque document émis est numéroté, figé (snapshot) et vérifiable publiquement
par QR code (/verifier/<code>).
"""
import io

import qrcode
from django.conf import settings
from django.core.files.base import ContentFile
from django.db import transaction
from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from rest_framework.exceptions import ValidationError

from apps.core.audit import audit

TEAL = colors.HexColor('#0E8C9B')
TEAL_LIGHT = colors.HexColor('#E2F3F5')
INK = colors.HexColor('#1F3A40')


def _institution():
    from apps.core.models import InstitutionSettings
    return InstitutionSettings.load()


def _styles():
    base = getSampleStyleSheet()
    return {
        'title': ParagraphStyle('t', parent=base['Title'], textColor=TEAL, fontSize=17, spaceAfter=6),
        'sub': ParagraphStyle('s', parent=base['Normal'], textColor=INK, fontSize=10, alignment=TA_CENTER),
        'h': ParagraphStyle('h', parent=base['Heading3'], textColor=INK, fontSize=11, spaceBefore=8),
        'n': ParagraphStyle('n', parent=base['Normal'], textColor=INK, fontSize=9.5, leading=13),
        'small': ParagraphStyle('sm', parent=base['Normal'], textColor=colors.HexColor('#5F7A80'), fontSize=8),
        'big': ParagraphStyle('b', parent=base['Normal'], textColor=INK, fontSize=13, leading=20,
                              alignment=TA_CENTER),
    }


def _qr(data, size=3.0):
    img = qrcode.make(data)
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    return Image(buf, width=size * cm, height=size * cm)


def _header(story, st, title, subtitle=''):
    inst = _institution()
    story.append(Paragraph(f"RÉPUBLIQUE DÉMOCRATIQUE DU CONGO — ENSEIGNEMENT SUPÉRIEUR ET UNIVERSITAIRE", st['small']))
    story.append(Spacer(1, 4))
    story.append(Paragraph(inst.institution_name.upper(), st['title']))
    story.append(Paragraph(title, st['sub']))
    if subtitle:
        story.append(Paragraph(subtitle, st['sub']))
    story.append(Spacer(1, 10))


def _table(rows, widths, header=True):
    t = Table(rows, colWidths=widths, repeatRows=1 if header else 0)
    style = [
        ('FONTSIZE', (0, 0), (-1, -1), 8.5),
        ('TEXTCOLOR', (0, 0), (-1, -1), INK),
        ('GRID', (0, 0), (-1, -1), 0.4, colors.HexColor('#C9DADD')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]
    if header:
        style += [('BACKGROUND', (0, 0), (-1, 0), TEAL), ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                  ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold')]
    t.setStyle(TableStyle(style))
    return t


def _render(story, pagesize=A4):
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=pagesize, leftMargin=1.6 * cm, rightMargin=1.6 * cm,
                            topMargin=1.4 * cm, bottomMargin=1.4 * cm)
    doc.build(story)
    return buf.getvalue()


def build_pv_pdf(deliberation):
    st = _styles()
    story = []
    _header(story, st, f"PROCÈS-VERBAL DE DÉLIBÉRATION — {deliberation.get_session_display().upper()}",
            f"{deliberation.auditoire.nom} · Année académique {deliberation.auditoire.annee_academique}")
    members = ', '.join(str(m) for m in deliberation.membres.all()) or '—'
    story.append(Paragraph(f"<b>Président :</b> {deliberation.president} &nbsp; <b>Secrétaire :</b> "
                           f"{deliberation.secretaire}<br/><b>Membres :</b> {members}", st['n']))
    story.append(Paragraph(f"Ouverte le {deliberation.opened_at:%d/%m/%Y %H:%M} — clôturée le "
                           f"{(deliberation.closed_at or timezone.now()):%d/%m/%Y %H:%M}", st['small']))
    story.append(Spacer(1, 8))
    rows = [['Rang', 'Matricule', 'Étudiant', 'Moyenne /20', 'Crédits', 'Décision', 'Mention']]
    for r in deliberation.resultats.select_related('student').order_by('rang'):
        rows.append([r.rang or '', r.student.matricule or '', str(r.student), f"{r.moyenne}",
                     f"{r.credits_obtenus}/{r.credits_total}",
                     r.get_decision_display() + (' *' if r.decision_modifiee else ''), r.get_mention_display()])
    story.append(_table(rows, [1.2 * cm, 3 * cm, 6 * cm, 2.2 * cm, 2 * cm, 4.5 * cm, 4 * cm]))
    modified = deliberation.resultats.filter(decision_modifiee=True)
    if modified.exists():
        story.append(Paragraph("<b>* Décisions du jury différentes du calcul :</b>", st['h']))
        for r in modified:
            story.append(Paragraph(f"{r.student} : {r.get_decision_calculee_display()} → "
                                   f"{r.get_decision_display()}. Motif : {r.justification}", st['n']))
    story.append(Spacer(1, 18))
    story.append(_table([['Le Président du jury', 'Le Secrétaire du jury'],
                         [str(deliberation.president), str(deliberation.secretaire)]],
                        [12 * cm, 11 * cm], header=False))
    return _render(story, landscape(A4))


def _verify_url(doc):
    base = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173').rstrip('/')
    return f"{base}/verifier/{doc.verification_code}"


def _footer(story, st, doc):
    story.append(Spacer(1, 16))
    inst = _institution()
    sign = Table([[
        _qr(_verify_url(doc)),
        Paragraph(f"Fait à {inst.institution_city}, le {doc.issued_at:%d/%m/%Y}<br/><br/>"
                  f"<b>Le Secrétaire Général Académique</b><br/>{inst.sga_name or ''}", st['n']),
    ]], colWidths=[4 * cm, 13 * cm])
    sign.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'MIDDLE')]))
    story.append(sign)
    story.append(Paragraph(f"Document n° {doc.numero} — authenticité vérifiable en scannant le QR code "
                           f"ou sur {_verify_url(doc)}", st['small']))


def _student_block(st, student, inscription=None):
    rows = [['Nom complet', str(student)], ['Matricule', student.matricule or '—']]
    if inscription:
        rows += [['Filière', inscription.auditoire.filiere.nom], ['Niveau', inscription.get_niveau_display()],
                 ['Année académique', inscription.academic_year.name]]
    t = Table(rows, colWidths=[4.5 * cm, 12.5 * cm])
    t.setStyle(TableStyle([('FONTSIZE', (0, 0), (-1, -1), 9.5), ('TEXTCOLOR', (0, 0), (-1, -1), INK),
                           ('BACKGROUND', (0, 0), (0, -1), TEAL_LIGHT),
                           ('GRID', (0, 0), (-1, -1), 0.4, colors.HexColor('#C9DADD'))]))
    return t


def _build_document_pdf(doc):
    st = _styles()
    story = []
    snap = doc.snapshot
    student = doc.student
    ins = doc.inscription or (doc.resultat.inscription if doc.resultat_id else None)
    if doc.type_document == 'releve':
        _header(story, st, "RELEVÉ DE NOTES", snap.get('session_label', ''))
        story.append(_student_block(st, student, ins))
        story.append(Spacer(1, 8))
        rows = [['UE / Cours', 'Crédits', 'Note /20', 'Résultat']]
        for ue in snap.get('ues', []):
            rows.append([f"{ue['ue_code']} — {ue['intitule']}", ue['credits'],
                         '' if ue['note'] is None else f"{ue['note']:.2f}",
                         'Compensée' if ue.get('compensee') else ('Validée' if ue['validee'] else 'Non validée')])
            for c in ue.get('cours', []):
                rows.append([f"    {c['intitule']}", c['credits'] or '',
                             '' if c['note'] is None else f"{c['note']:.2f}", ''])
        story.append(_table(rows, [10 * cm, 2 * cm, 2.2 * cm, 2.8 * cm]))
        story.append(Spacer(1, 6))
        story.append(Paragraph(f"<b>Moyenne :</b> {snap.get('moyenne')}/20 — <b>Crédits capitalisés :</b> "
                               f"{snap.get('credits_obtenus')}/{snap.get('credits_total')} — <b>Décision :</b> "
                               f"{snap.get('decision_label')} {snap.get('mention_label') or ''}", st['n']))
    elif doc.type_document == 'attestation_inscription':
        _header(story, st, "ATTESTATION D'INSCRIPTION")
        story.append(Paragraph(
            f"Le Secrétaire Général Académique atteste que <b>{student}</b>, matricule "
            f"<b>{student.matricule or '—'}</b>, est régulièrement inscrit(e) en <b>{snap.get('niveau_label')}</b>, "
            f"filière <b>{snap.get('filiere')}</b>, pour l'année académique <b>{snap.get('annee')}</b>.",
            st['big']))
    elif doc.type_document == 'attestation_reussite':
        _header(story, st, "ATTESTATION DE RÉUSSITE")
        story.append(Paragraph(
            f"Il est attesté que <b>{student}</b>, matricule <b>{student.matricule or '—'}</b>, a satisfait aux "
            f"épreuves de <b>{snap.get('niveau_label')}</b> ({snap.get('filiere')}) de l'année académique "
            f"<b>{snap.get('annee')}</b> avec la décision <b>{snap.get('decision_label')}</b>"
            f"{(' et la mention <b>' + snap['mention_label'] + '</b>') if snap.get('mention_label') else ''} "
            f"(moyenne {snap.get('moyenne')}/20).", st['big']))
    elif doc.type_document == 'diplome':
        _header(story, st, "DIPLÔME")
        story.append(Spacer(1, 20))
        story.append(Paragraph(
            f"Vu les procès-verbaux des délibérations du jury, le diplôme de <b>{snap.get('grade')}</b> en "
            f"<b>{snap.get('filiere')}</b> est conféré à<br/><br/><font size=18><b>{student}</b></font><br/><br/>"
            f"matricule {student.matricule or '—'}, avec la mention <b>{snap.get('mention_label') or 'Satisfaction'}</b>, "
            f"au titre de l'année académique {snap.get('annee')}.", st['big']))
    _footer(story, st, doc)
    return _render(story)


@transaction.atomic
def issue_document(type_document, student, user, resultat=None, inscription=None, check_clearance=True):
    from ..models import DocumentOfficiel
    from .finance import clearance
    from apps.core.models import InstitutionSettings

    if check_clearance and InstitutionSettings.load().results_require_clearance:
        status = clearance(student, inscription or (resultat.inscription if resultat else None))
        if not status['cleared']:
            raise ValidationError({'detail': f"Document refusé : frais réglés à {status['paid_percent']} % "
                                             f"(minimum {status['required_percent']} %)."})
    snap = {}
    if type_document in ('releve', 'attestation_reussite', 'diplome'):
        if resultat is None:
            raise ValidationError({'detail': "Un résultat de délibération publié est requis."})
        if resultat.deliberation.statut not in ('cloturee', 'publiee'):
            raise ValidationError({'detail': "La délibération n'est pas clôturée."})
        if type_document in ('attestation_reussite', 'diplome') and resultat.decision not in ('admis', 'admis_dette'):
            raise ValidationError({'detail': "L'étudiant n'est pas admis."})
        aud = resultat.deliberation.auditoire
        snap = {
            'ues': resultat.details.get('ues', []), 'moyenne': str(resultat.moyenne),
            'credits_obtenus': resultat.credits_obtenus, 'credits_total': resultat.credits_total,
            'decision_label': resultat.get_decision_display(), 'mention_label': resultat.get_mention_display()
            if resultat.mention else '', 'session_label': resultat.deliberation.get_session_display(),
            'filiere': aud.filiere.nom, 'niveau_label': aud.get_niveau_display(), 'annee': aud.annee_academique,
            'grade': 'Licence' if aud.niveau == 'L3' else ('Master' if aud.niveau == 'M2' else aud.get_niveau_display()),
        }
        if type_document == 'diplome' and aud.niveau not in ('L3', 'M2'):
            raise ValidationError({'detail': "Le diplôme n'est délivré qu'en fin de cycle (L3 ou M2)."})
        inscription = inscription or resultat.inscription
    elif type_document == 'attestation_inscription':
        if inscription is None or inscription.statut not in ('administrative', 'pedagogique'):
            raise ValidationError({'detail': "L'inscription doit être validée administrativement."})
        snap = {'filiere': inscription.auditoire.filiere.nom, 'niveau_label': inscription.get_niveau_display(),
                'annee': inscription.academic_year.name}
    doc = DocumentOfficiel.objects.create(type_document=type_document, student=student, resultat=resultat,
                                          inscription=inscription, issued_by=user, snapshot=snap,
                                          academic_year=inscription.academic_year if inscription else None)
    pdf = _build_document_pdf(doc)
    doc.pdf_file.save(f"{doc.numero}.pdf", ContentFile(pdf), save=False)
    super(DocumentOfficiel, doc).save(update_fields=['pdf_file'])
    audit('inscription', doc, user=user, details={'action': 'document_emis', 'type': type_document,
                                                  'numero': doc.numero})
    return doc
