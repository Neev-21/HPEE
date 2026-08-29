"""Legal Complaint Generation Engine for GSPCB Form-A."""
from backend.app.engines.complaint.service import (
    generate_complaint_for_event,
    get_complaint_details,
    submit_complaint_to_gspcb,
)

__all__ = [
    "generate_complaint_for_event",
    "get_complaint_details",
    "submit_complaint_to_gspcb",
]
