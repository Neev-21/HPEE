from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.pollution_event import PollutionEvent

router = APIRouter()

@router.get("", summary="List pollution events")
def list_events(db: Session = Depends(get_db)):
    events = db.query(PollutionEvent).order_by(PollutionEvent.detected_at.desc()).limit(50).all()
    result = []
    for ev in events:
        # Resolve village name if available
        village_name = "Unknown"
        if ev.village:
            village_name = ev.village.name
        
        result.append({
            "event_id": str(ev.event_id),
            "village_name": village_name,
            "severity": ev.severity,
            "status": ev.status,
            "detected_at": ev.detected_at.isoformat() if ev.detected_at else None,
            "started_at": ev.started_at.isoformat() if ev.started_at else None,
            "peak_pm25": float(ev.peak_pm25) if ev.peak_pm25 else None,
            "peak_so2": float(ev.peak_so2) if ev.peak_so2 else None,
        })
    return result
