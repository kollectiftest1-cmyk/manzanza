"""
Utility functions for payment processing
"""
import io
import qrcode
from django.core.files.base import ContentFile
from django.utils import timezone
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib import colors
from reportlab.pdfgen import canvas


def generate_qr_code(data, size=10):
    """
    Generate a QR code image from data.

    Args:
        data (str): Data to encode in QR code
        size (int): Size of the QR code (box_size parameter)

    Returns:
        ContentFile: Image file suitable for Django FileField
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=size,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    # Save to bytes
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)

    return ContentFile(buffer.read(), name='qrcode.png')


def generate_payment_voucher_pdf(voucher):
    """
    Generate a PDF for a payment voucher (bon de paiement).

    Args:
        voucher (PaymentVoucher): The voucher instance

    Returns:
        ContentFile: PDF file suitable for Django FileField
    """
    buffer = io.BytesIO()

    # Create the PDF document
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []

    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1a237e'),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#1a237e'),
        spaceAfter=12,
        fontName='Helvetica-Bold'
    )
    normal_style = styles['Normal']

    # Header
    elements.append(Paragraph("BON DE PAIEMENT", title_style))
    elements.append(Spacer(1, 0.2*inch))

    # Voucher info box
    voucher_data = [
        ['Numéro du bon:', voucher.voucher_number],
        ['Date d\'émission:', voucher.issue_date.strftime('%d/%m/%Y %H:%M')],
        ['Statut:', voucher.get_status_display()],
    ]

    voucher_table = Table(voucher_data, colWidths=[2.5*inch, 3.5*inch])
    voucher_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e3f2fd')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(voucher_table)
    elements.append(Spacer(1, 0.3*inch))

    # Student information
    elements.append(Paragraph("INFORMATIONS ÉTUDIANT", heading_style))
    student_data = [
        ['Nom complet:', voucher.student.get_full_name()],
        ['Matricule:', voucher.student.matricule or 'N/A'],
        ['Email:', voucher.student.email],
        ['Téléphone:', voucher.student.phone or 'N/A'],
    ]

    student_table = Table(student_data, colWidths=[2.5*inch, 3.5*inch])
    student_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f5f5f5')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(student_table)
    elements.append(Spacer(1, 0.3*inch))

    # Payment details
    elements.append(Paragraph("DÉTAILS DU PAIEMENT", heading_style))
    payment_data = [
        ['Type de frais:', voucher.student_fee.fee_type.name if voucher.student_fee.fee_type else 'N/A'],
        ['Description:', voucher.description],
        ['Montant à payer:', f"{voucher.amount:,.2f} {getattr(getattr(voucher.student_fee, 'fee_campaign', None), 'currency', None) or 'USD'}"],
    ]

    payment_table = Table(payment_data, colWidths=[2.5*inch, 3.5*inch])
    payment_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f5f5f5')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-2, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -2), 'Helvetica'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -2), 10),
        ('FONTSIZE', (0, -1), (-1, -1), 14),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#4caf50')),
        ('TEXTCOLOR', (0, -1), (-1, -1), colors.white),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(payment_table)
    elements.append(Spacer(1, 0.3*inch))

    # Banking information
    elements.append(Paragraph("INFORMATIONS BANCAIRES", heading_style))
    bank_data = [
        ['Bénéficiaire:', voucher.beneficiary_name],
        ['Numéro de compte:', voucher.beneficiary_account],
    ]

    bank_table = Table(bank_data, colWidths=[2.5*inch, 3.5*inch])
    bank_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#fff3e0')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(bank_table)
    elements.append(Spacer(1, 0.5*inch))

    # Footer note
    note_style = ParagraphStyle(
        'Note',
        parent=normal_style,
        fontSize=9,
        textColor=colors.grey,
        alignment=TA_CENTER,
        italic=True
    )
    elements.append(Paragraph(
        "Veuillez présenter ce bon lors du paiement à la banque.<br/>Conservez votre bordereau bancaire pour validation.",
        note_style
    ))

    # Build PDF
    doc.build(elements)
    buffer.seek(0)

    return ContentFile(buffer.read(), name=f'bon_{voucher.voucher_number}.pdf')


def generate_payment_receipt_pdf(receipt):
    """
    Generate a PDF receipt with QR code.

    Args:
        receipt (PaymentReceipt): The receipt instance

    Returns:
        ContentFile: PDF file suitable for Django FileField
    """
    buffer = io.BytesIO()

    # Create the PDF document
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []

    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=26,
        textColor=colors.HexColor('#2e7d32'),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#2e7d32'),
        spaceAfter=12,
        fontName='Helvetica-Bold'
    )

    # Header
    elements.append(Paragraph("REÇU DE PAIEMENT", title_style))
    elements.append(Paragraph("✓ PAIEMENT VALIDÉ", ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.HexColor('#4caf50'),
        alignment=TA_CENTER,
        spaceAfter=20
    )))
    elements.append(Spacer(1, 0.2*inch))

    # Receipt info
    receipt_data = [
        ['Numéro de reçu:', receipt.receipt_number],
        ['Date de paiement:', receipt.payment_date.strftime('%d/%m/%Y %H:%M')],
        ['Numéro de bon:', receipt.voucher.voucher_number],
    ]

    receipt_table = Table(receipt_data, colWidths=[2.5*inch, 3.5*inch])
    receipt_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e8f5e9')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#4caf50')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(receipt_table)
    elements.append(Spacer(1, 0.3*inch))

    # Student information
    elements.append(Paragraph("INFORMATIONS ÉTUDIANT", heading_style))
    student_data = [
        ['Nom complet:', receipt.student.get_full_name()],
        ['Matricule:', receipt.student.matricule or 'N/A'],
        ['Email:', receipt.student.email],
    ]

    student_table = Table(student_data, colWidths=[2.5*inch, 3.5*inch])
    student_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f5f5f5')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(student_table)
    elements.append(Spacer(1, 0.3*inch))

    # Payment details
    elements.append(Paragraph("DÉTAILS DU PAIEMENT", heading_style))
    payment_data = [
        ['Type de frais:', receipt.fee_type_name],
        ['Méthode de paiement:', receipt.payment_method],
        ['N° Bordereau bancaire:', receipt.bank_slip_number or '—'],
        ['Date bordereau:', receipt.bank_slip_date.strftime('%d/%m/%Y') if receipt.bank_slip_date else '—'],
        ['Montant payé:', f"{receipt.amount_paid:,.2f} {getattr(getattr(receipt.voucher.student_fee, 'fee_campaign', None), 'currency', None) or 'USD'}"],
    ]

    if receipt.transaction_reference:
        payment_data.append(['Référence transaction:', receipt.transaction_reference])

    payment_table = Table(payment_data, colWidths=[2.5*inch, 3.5*inch])
    payment_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f5f5f5')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-2, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -2), 'Helvetica'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -2), 10),
        ('FONTSIZE', (0, -1), (-1, -1), 14),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#4caf50')),
        ('TEXTCOLOR', (0, -1), (-1, -1), colors.white),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(payment_table)
    elements.append(Spacer(1, 0.4*inch))

    # QR Code section
    elements.append(Paragraph("CODE DE VÉRIFICATION", heading_style))

    # Check if QR code exists, if not generate it
    if not receipt.qr_code:
        qr_data = receipt.verification_url
        qr_image_file = generate_qr_code(qr_data)
        receipt.qr_code.save(f'qr_{receipt.receipt_number}.png', qr_image_file, save=True)

    # Add QR code image to PDF
    if receipt.qr_code:
        qr_img = Image(receipt.qr_code.path, width=2*inch, height=2*inch)
        qr_img.hAlign = 'CENTER'
        elements.append(qr_img)
        elements.append(Spacer(1, 0.1*inch))

    # QR code instruction
    qr_note = ParagraphStyle(
        'QRNote',
        parent=styles['Normal'],
        fontSize=9,
        alignment=TA_CENTER,
        textColor=colors.grey
    )
    elements.append(Paragraph(
        f"Scannez ce code QR pour vérifier l'authenticité du reçu<br/>Code: {receipt.verification_code}",
        qr_note
    ))

    elements.append(Spacer(1, 0.5*inch))

    # Footer
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.grey,
        alignment=TA_CENTER,
        italic=True
    )
    elements.append(Paragraph(
        "Ce document est un reçu officiel de paiement.<br/>Conservez-le précieusement.",
        footer_style
    ))

    # Build PDF
    doc.build(elements)
    buffer.seek(0)

    return ContentFile(buffer.read(), name=f'recu_{receipt.receipt_number}.pdf')
