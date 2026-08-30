"""Legal Complaints & GSPCB Form-A API endpoints."""
import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Optional
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.engines.complaint.service import (
    generate_complaint_for_event,
    get_complaint_details,
    submit_complaint_to_gspcb,
    STORAGE_DIR,
)

router = APIRouter()


class GenerateComplaintRequest(BaseModel):
    event_id: str = Field(..., description="UUID of the pollution event")
    filed_by_user_id: Optional[str] = Field(None, description="UUID of the filing Sarpanch or citizen")


class SubmitComplaintRequest(BaseModel):
    submission_reference: Optional[str] = Field(None, description="External GSPCB acknowledgement receipt number")


@router.post("/generate", status_code=status.HTTP_201_CREATED, summary="Auto-generate GSPCB Form-A complaint dossier")
def create_complaint(payload: GenerateComplaintRequest, db: Session = Depends(get_db)):
    try:
        complaint = generate_complaint_for_event(
            db=db,
            event_id=payload.event_id,
            filed_by_user_id=payload.filed_by_user_id,
        )
        return get_complaint_details(db, str(complaint.complaint_id))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Complaint generation error: {e}")


@router.get("/{complaint_id}", summary="Get complaint details by UUID or tracking number")
def get_complaint(complaint_id: str, db: Session = Depends(get_db)):
    details = get_complaint_details(db, complaint_id)
    if not details:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Complaint {complaint_id} not found")
    return details


@router.get("/{complaint_id}/pdf", summary="Download official GSPCB Form-A PDF")
def download_complaint_pdf(complaint_id: str, db: Session = Depends(get_db)):
    details = get_complaint_details(db, complaint_id)
    if not details:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Complaint {complaint_id} not found")

    complaint_num = details["complaint_number"]
    pdf_path = os.path.join(STORAGE_DIR, f"{complaint_num}.pdf")

    if not os.path.exists(pdf_path):
        from backend.app.engines.complaint.pdf_builder import build_gspcb_form_a_pdf
        form_data = details.get("gspcb_form_data") or {"complaint_number": complaint_num}
        try:
            build_gspcb_form_a_pdf(pdf_path, form_data)
        except Exception as pe:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to generate PDF: {pe}")

    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=f"{complaint_num}_FormA.pdf",
    )



@router.post("/{complaint_id}/submit", summary="Submit draft complaint to GSPCB")
def submit_complaint(complaint_id: str, payload: SubmitComplaintRequest = None, db: Session = Depends(get_db)):
    ref = payload.submission_reference if payload else None
    try:
        complaint = submit_complaint_to_gspcb(db, complaint_id, submission_reference=ref)
        return get_complaint_details(db, str(complaint.complaint_id))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
