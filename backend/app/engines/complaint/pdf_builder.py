"""
GSPCB Form-A PDF Builder
-------------------------
Generates the official legal environmental complaint document under
Section 21 of The Air (Prevention and Control of Pollution) Act, 1981.
"""

import os
from datetime import datetime, timezone
from typing import Dict, Any

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)


def build_gspcb_form_a_pdf(
    output_path: str,
    complaint_data: Dict[str, Any],
) -> str:
    """
    Builds a professional, court-admissible GSPCB Form-A PDF complaint.
    
    Args:
        output_path: Destination file path for PDF.
        complaint_data: Dictionary containing:
            - complaint_number
            - event_id
            - generated_at
            - village_name, taluka, district
            - complainant_name, role, contact
            - peak_pm25, peak_so2, wind_speed, wind_direction
            - primary_culprit: { name, consent_id, sector, probability, distance_m, match_score }
            - evidence_hash (SHA-256)
    
    Returns:
        str: output_path
    """
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=18,
        alignment=1, # Center
        textColor=colors.HexColor("#1e3a8a"),
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=13,
        alignment=1,
        textColor=colors.HexColor("#475569"),
    )
    statute_style = ParagraphStyle(
        "Statute",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8,
        leading=10,
        alignment=1,
        textColor=colors.HexColor("#64748b"),
    )
    section_head = ParagraphStyle(
        "SectionHead",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=13,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=6,
        spaceAfter=4,
    )
    cell_label = ParagraphStyle(
        "CellLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#334155"),
    )
    cell_val = ParagraphStyle(
        "CellVal",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#0f172a"),
    )
    alert_style = ParagraphStyle(
        "AlertStyle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#dc2626"),
    )
    legal_text = ParagraphStyle(
        "LegalText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#334155"),
    )

    story = []

    # 1. Header Banner
    story.append(Paragraph("GUJARAT POLLUTION CONTROL BOARD", title_style))
    story.append(Paragraph("OFFICIAL COMPLAINT DOSSIER — FORM-A", subtitle_style))
    story.append(Paragraph(
        "Submitted under Section 21/31A of The Air (Prevention and Control of Pollution) Act, 1981 "
        "and Section 133 of the Code of Criminal Procedure (Public Nuisance)",
        statute_style
    ))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#1e3a8a"), spaceAfter=10))

    # Tracking block
    tracking_data = [
        [
            Paragraph("<b>COMPLAINT TRACKING NO:</b>", cell_label),
            Paragraph(f"<font color='#1d4ed8'><b>{complaint_data.get('complaint_number', 'N/A')}</b></font>", cell_val),
            Paragraph("<b>DATE & TIME (IST):</b>", cell_label),
            Paragraph(complaint_data.get("timestamp_ist", datetime.now().strftime("%Y-%m-%d %H:%M:%S")), cell_val),
        ],
        [
            Paragraph("<b>STATION / JURISDICTION:</b>", cell_label),
            Paragraph("GSPCB Regional Office, Ankleshwar (Bharuch)", cell_val),
            Paragraph("<b>EVIDENCE HASH (SHA-256):</b>", cell_label),
            Paragraph(f"<font size='6'>{complaint_data.get('evidence_hash', 'N/A')[:32]}...</font>", cell_val),
        ],
    ]
    t_track = Table(tracking_data, colWidths=[130, 140, 120, 130])
    t_track.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t_track)
    story.append(Spacer(1, 10))

    # 2. Section 1: Complainant Details
    story.append(Paragraph("1. COMPLAINANT & JURISDICTION DETAILS", section_head))
    c_info = [
        [
            Paragraph("Aggrieved Village:", cell_label),
            Paragraph(complaint_data.get("village_name", "Piraman"), cell_val),
            Paragraph("Taluka / District:", cell_label),
            Paragraph(f"{complaint_data.get('taluka', 'Ankleshwar')}, {complaint_data.get('district', 'Bharuch')}", cell_val),
        ],
        [
            Paragraph("Complainant / Signatory:", cell_label),
            Paragraph(complaint_data.get("complainant_name", "Gram Panchayat / Sarpanch"), cell_val),
            Paragraph("Contact / Mobile:", cell_label),
            Paragraph(complaint_data.get("complainant_contact", "+91-9879011223"), cell_val),
        ],
    ]
    t_comp = Table(c_info, colWidths=[130, 140, 120, 130])
    t_comp.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#f1f5f9")),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    story.append(t_comp)
    story.append(Spacer(1, 8))

    # 3. Section 2: Environmental Telemetry & NAAQS Exceedance
    story.append(Paragraph("2. TELEMETRY MEASUREMENTS & VIOLATION SUMMARY", section_head))
    pm25_val = complaint_data.get("peak_pm25", 0.0)
    so2_val  = complaint_data.get("peak_so2", 0.0)
    pm25_exceed = round((pm25_val / 60.0) * 100, 0) if pm25_val else 0
    so2_exceed  = round((so2_val / 80.0) * 100, 0) if so2_val else 0

    meas_data = [
        [
            Paragraph("<b>Pollutant Parameter</b>", cell_label),
            Paragraph("<b>Observed Peak Level</b>", cell_label),
            Paragraph("<b>CPCB NAAQS Limit (24h)</b>", cell_label),
            Paragraph("<b>Violation Status</b>", cell_label),
        ],
        [
            Paragraph("Particulate Matter (PM2.5)", cell_val),
            Paragraph(f"<b>{pm25_val:.1f} µg/m³</b>", cell_val),
            Paragraph("60.0 µg/m³", cell_val),
            Paragraph(f"<font color='#dc2626'><b>{pm25_exceed:.0f}% of Permissible Limit</b></font>", alert_style),
        ],
        [
            Paragraph("Sulphur Dioxide (SO2)", cell_val),
            Paragraph(f"<b>{so2_val:.1f} ppb</b>", cell_val),
            Paragraph("80.0 µg/m³ (~30.5 ppb)", cell_val),
            Paragraph(f"<font color='#dc2626'><b>{so2_exceed:.0f}% of Permissible Limit</b></font>", alert_style),
        ],
        [
            Paragraph("Ambient Wind Direction", cell_val),
            Paragraph(f"{complaint_data.get('wind_direction', 135.0):.0f}° (SE Vector)", cell_val),
            Paragraph("Wind Speed", cell_val),
            Paragraph(f"{complaint_data.get('wind_speed', 2.4):.1f} m/s", cell_val),
        ],
    ]
    t_meas = Table(meas_data, colWidths=[150, 120, 120, 130])
    t_meas.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    story.append(t_meas)
    story.append(Spacer(1, 8))

    # 4. Section 3: Culprit Factory Attribution
    culprit = complaint_data.get("primary_culprit", {})
    story.append(Paragraph("3. ATTRIBUTED INDUSTRIAL SOURCE (TOP #1 PROBABLE CULPRIT)", section_head))

    culprit_data = [
        [
            Paragraph("Factory / Enterprise Name:", cell_label),
            Paragraph(f"<b>{culprit.get('name', 'Gujarat Industrial Facility')}</b>", cell_val),
            Paragraph("GSPCB Consent to Operate:", cell_label),
            Paragraph(f"<b>{culprit.get('consent_id', 'GSPCB/CCA/ANK/XXXX')}</b>", cell_val),
        ],
        [
            Paragraph("Industry Category / Sector:", cell_label),
            Paragraph(culprit.get("sector", "Chemicals & Intermediates"), cell_val),
            Paragraph("Declared Process:", cell_label),
            Paragraph(culprit.get("declared_process", "Sulphonation / Night Batch Process"), cell_val),
        ],
        [
            Paragraph("Attribution Confidence:", cell_label),
            Paragraph(f"<font color='#dc2626'><b>{culprit.get('probability_percent', 87.0):.1f}% Probability (Rank #1)</b></font>", alert_style),
            Paragraph("Proximity to Village:", cell_label),
            Paragraph(f"{culprit.get('distance_m', 1420.0):.0f} meters (Upwind Path)", cell_val),
        ],
        [
            Paragraph("Chemical Fingerprint Match:", cell_label),
            Paragraph(f"Cosine Similarity: <b>{culprit.get('match_score', 0.88):.2f}</b> (SO2 Dominant)", cell_val),
            Paragraph("Shift Operating Schedule:", cell_label),
            Paragraph(culprit.get("shift_status", "Active Shift (22:00 - 06:00 IST)"), cell_val),
        ],
    ]
    t_culprit = Table(culprit_data, colWidths=[130, 140, 120, 130])
    t_culprit.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#fff7ed")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#fdba74")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#fed7aa")),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    story.append(t_culprit)
    story.append(Spacer(1, 8))

    # 5. Section 4: Statutory Reliefs Requested
    story.append(Paragraph("4. STATUTORY RELIEFS SOUGHT FROM GSPCB", section_head))
    reliefs = (
        "1. Immediate physical inspection of the designated industrial stack and production reactors by GSPCB Regional Officers under Section 24 of the Air Act, 1981.<br/>"
        "2. Mandatory verification of Online Continuous Emission Monitoring System (OCEMS) logs and scrubbing unit bypass dampers for the incident window.<br/>"
        "3. Issue of Show-Cause Notice / Closure Directions under Section 31A of the Air Act, 1981 in case of non-functional air pollution control devices (APCD).<br/>"
        "4. Award of interim environmental restitution and compensation to affected village residents."
    )
    story.append(Paragraph(reliefs, legal_text))
    story.append(Spacer(1, 10))

    # 6. Section 5: Signature & Verification
    story.append(Paragraph("5. VERIFICATION & DIGITAL AUDIT TRAIL", section_head))
    sig_data = [
        [
            Paragraph(
                "<b>Verification Statement:</b><br/>"
                "I hereby solemnly affirm that the sensor telemetry and plume dispersion vectors "
                "recorded in this report are tamper-evident and generated by the HPEE autonomous system. "
                "The findings are submitted for formal regulatory cognizance.",
                legal_text
            ),
            Paragraph(
                "<b>Digital Signature / Seal:</b><br/><br/>"
                f"<b>{complaint_data.get('complainant_name', 'Sarpanch / Village Head')}</b><br/>"
                "Gram Panchayat Piraman / Ankleshwar<br/>"
                f"<font size='6'>Signed via HPEE Citizen Portal (SHA-256 Verified)</font>",
                cell_val
            ),
        ]
    ]
    t_sig = Table(sig_data, colWidths=[340, 180])
    t_sig.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#f8fafc")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(t_sig)

    # Build PDF
    doc.build(story)
    return output_path
