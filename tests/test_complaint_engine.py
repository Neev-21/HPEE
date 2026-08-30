import os
import pytest
from backend.app.engines.complaint.pdf_builder import build_gspcb_form_a_pdf
from backend.app.engines.complaint.service import (
    generate_complaint_for_event,
    get_complaint_details,
    submit_complaint_to_gspcb,
    STORAGE_DIR,
)
from backend.app.db.session import SessionLocal
from backend.app.models.pollution_event import PollutionEvent


def test_pdf_builder_creates_valid_pdf(tmp_path):
    """Verify ReportLab build_gspcb_form_a_pdf builds a non-empty, well-formed PDF file."""
    output_pdf = str(tmp_path / "test_form_a.pdf")
    data = {
        "complaint_number": "GSPCB-HPEE-2026-ANK-TEST",
        "timestamp_ist": "2026-08-30 02:00:00 IST",
        "village_name": "Piraman",
        "taluka": "Ankleshwar",
        "district": "Bharuch",
        "complainant_name": "Rameshbhai Patel (Sarpanch)",
        "complainant_contact": "+91-9879011223",
        "peak_pm25": 235.4,
        "peak_so2": 182.1,
        "wind_speed": 2.6,
        "wind_direction": 135.0,
        "evidence_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "primary_culprit": {
            "name": "Gujarat Insecticides Ltd",
            "consent_id": "GSPCB/CCA/ANK/001",
            "sector": "Agrochemicals & Pesticides",
            "declared_process": "Organophosphate synthesis",
            "probability_percent": 89.5,
            "distance_m": 1250.0,
            "match_score": 0.91,
            "shift_status": "Night Shift (22:00 - 06:00 IST)",
        },
    }

    built_path = build_gspcb_form_a_pdf(output_pdf, data)
    assert os.path.exists(built_path)
    file_size = os.path.getsize(built_path)
    assert file_size > 2000, f"Generated PDF file size ({file_size} bytes) is suspiciously small"


def test_complaint_service_lifecycle():
    """Verify complaint generation, document creation, and GSPCB submission lifecycle."""
    import uuid
    from datetime import datetime, timezone
    db = SessionLocal()
    try:
        # Create a fresh event for this test
        test_event = PollutionEvent(
            event_id=uuid.uuid4(),
            detected_at=datetime.now(timezone.utc),
            started_at=datetime.now(timezone.utc),
            severity="severe",
            peak_pm25=240.0,
            peak_so2=185.0,
            status="active",
        )
        db.add(test_event)
        db.commit()

        complaint = generate_complaint_for_event(db, str(test_event.event_id))
        assert complaint is not None
        assert complaint.complaint_number.startswith("GSPCB-HPEE-")
        assert complaint.status == "draft"


        # Verify document record
        details = get_complaint_details(db, str(complaint.complaint_id))
        assert details is not None
        assert len(details["documents"]) >= 1
        doc = details["documents"][0]
        assert doc["document_type"] == "gspcb_form_a_pdf"
        assert len(doc["file_hash"]) == 64 # SHA-256 length

        # Verify physical file existence
        pdf_path = os.path.join(STORAGE_DIR, f"{complaint.complaint_number}.pdf")
        assert os.path.exists(pdf_path)

        # Test submit
        submitted = submit_complaint_to_gspcb(db, str(complaint.complaint_id), "GSPCB-REC-9999")
        assert submitted.status == "submitted"
        assert submitted.submission_reference == "GSPCB-REC-9999"
    finally:
        db.close()
