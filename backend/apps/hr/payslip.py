"""Bulletin de paie PDF (charte de l'établissement)."""
import io

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

TEAL = colors.HexColor('#0E8C9B')
INK = colors.HexColor('#1F3A40')


def _m(v, cur):
    return f"{float(v or 0):,.2f} {cur}".replace(',', ' ')


def build_payslip(p):
    from apps.core.models import InstitutionSettings
    inst = InstitutionSettings.load()
    e = p.employee
    cur = e.currency
    base = getSampleStyleSheet()
    title = ParagraphStyle('t', parent=base['Title'], textColor=TEAL, fontSize=16)
    n = ParagraphStyle('n', parent=base['Normal'], textColor=INK, fontSize=9)
    small = ParagraphStyle('s', parent=base['Normal'], textColor=colors.HexColor('#5F7A80'), fontSize=7.5)
    story = [Paragraph(inst.institution_name.upper(), title),
             Paragraph(f"BULLETIN DE PAIE — {p.period_label.upper()}"
                       + ("" if p.status in ('valide', 'paye') else " (BROUILLON — NON VALIDÉ)"), n),
             Spacer(1, 8)]
    ident = Table([
        ['Nom', e.user.get_full_name(), 'Matricule', e.employee_id],
        ['Poste', e.get_position_display(), 'Mode', e.get_prestation_type_display()],
        ['Embauche', e.hire_date.strftime('%d/%m/%Y'), 'Personnes à charge', str(e.dependents)],
        ['Jours ouvrables', str(p.jours_ouvrables), 'Absences non justifiées', str(p.jours_absence_injustifiee)],
    ], colWidths=[3.2 * cm, 5.5 * cm, 4 * cm, 4.8 * cm])
    ident.setStyle(TableStyle([('FONTSIZE', (0, 0), (-1, -1), 8.5), ('TEXTCOLOR', (0, 0), (-1, -1), INK),
                               ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#E2F3F5')),
                               ('BACKGROUND', (2, 0), (2, -1), colors.HexColor('#E2F3F5')),
                               ('GRID', (0, 0), (-1, -1), 0.4, colors.HexColor('#C9DADD'))]))
    story += [ident, Spacer(1, 10)]
    rows = [['Rubrique', 'Base / quantité', 'Gains', 'Retenues']]
    d = p.details or {}
    if e.prestation_type == 'permanent':
        rows.append(['Salaire de base', _m(d.get('salaire_mensuel_complet', 0), cur), _m(p.base_salary + p.retenue_absences, cur), ''])
        if p.retenue_absences:
            rows.append(['Absences non justifiées', f"{p.jours_absence_injustifiee} j × {_m(d.get('taux_journalier', 0), cur)}", '', _m(p.retenue_absences, cur)])
    else:
        rows.append(['Vacation / heures prestées', f"{p.heures_prestees or 0} h × {_m(e.salaire_horaire, cur)}", _m(p.base_salary, cur), ''])
    if p.montant_heures_complementaires:
        rows.append(['Heures complémentaires de cours', f"{p.heures_complementaires} h", _m(p.montant_heures_complementaires, cur), ''])
    if p.montant_heures_supplementaires:
        rows.append(['Heures supplémentaires', f"{p.heures_supplementaires} h", _m(p.montant_heures_supplementaires, cur), ''])
    if p.bonuses:
        rows.append(['Primes', '', _m(p.bonuses, cur), ''])
    rows.append(['BRUT IMPOSABLE', '', _m(p.brut_imposable, cur), ''])
    if p.indemnites:
        rows.append(['Indemnités logement / transport (non imposables)', '', _m(p.indemnites, cur), ''])
    rows.append(['INSS (part salariale)', '', '', _m(p.inss_salarie, cur)])
    rows.append(['IPR / IRPP', '', '', _m(p.ipr, cur)])
    if p.deductions:
        rows.append(['Avances et autres retenues', '', '', _m(p.deductions, cur)])
    rows.append(['NET À PAYER', '', _m(p.net_salary, cur), ''])
    t = Table(rows, colWidths=[7.2 * cm, 4.3 * cm, 3 * cm, 3 * cm])
    t.setStyle(TableStyle([('FONTSIZE', (0, 0), (-1, -1), 8.5), ('TEXTCOLOR', (0, 0), (-1, -1), INK),
                           ('BACKGROUND', (0, 0), (-1, 0), TEAL), ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                           ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
                           ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
                           ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#E2F3F5')),
                           ('GRID', (0, 0), (-1, -1), 0.4, colors.HexColor('#C9DADD'))]))
    story += [t, Spacer(1, 10)]
    emp = Table([['Charges patronales', 'INSS employeur', 'INPP', 'ONEM', 'Coût total employeur'],
                 ['', _m(p.inss_patronal, cur), _m(p.inpp, cur), _m(p.onem, cur), _m(p.cout_employeur, cur)]],
                colWidths=[4 * cm, 3.4 * cm, 3 * cm, 3 * cm, 4.1 * cm])
    emp.setStyle(TableStyle([('FONTSIZE', (0, 0), (-1, -1), 8), ('TEXTCOLOR', (0, 0), (-1, -1), INK),
                             ('GRID', (0, 0), (-1, -1), 0.4, colors.HexColor('#C9DADD'))]))
    story += [emp, Spacer(1, 14)]
    statut = p.get_status_display()
    if p.validated_at:
        statut += f" — validé le {p.validated_at:%d/%m/%Y} par {p.validated_by}"
    if p.payment_date:
        statut += f" — payé le {p.payment_date:%d/%m/%Y} ({p.payment_method or ''})"
    story.append(Paragraph(f"Statut : {statut}", n))
    story.append(Paragraph("Cotisations et barème fiscal selon les paramètres de paie de l'établissement.", small))
    buf = io.BytesIO()
    SimpleDocTemplate(buf, pagesize=A4, leftMargin=1.7 * cm, rightMargin=1.7 * cm, topMargin=1.5 * cm,
                      bottomMargin=1.5 * cm).build(story)
    return buf.getvalue()
