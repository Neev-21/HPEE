from typing import Optional, List
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import uuid

from backend.app.models.sensor import SensorReading
from backend.app.models.pollution_event import PollutionEvent, EventReading
from backend.app.engines.event_detection.baseline import get_expected_baseline
from backend.app.engines.event_detection.features import calculate_robust_z_score, check_anomaly_persistence

def evaluate_reading(db: Session, reading: SensorReading) -> Optional[uuid.UUID]:
    """
    Evaluates a new reading against empirical baselines.
    If it's an anomaly that persists, creates a new PollutionEvent.
    Returns the event_id if an event was triggered or updated.
    """
    hour = reading.recorded_at.hour
    median_pm25, mad_pm25, median_so2, mad_so2 = get_expected_baseline(hour)
    
    # Calculate current z-scores
    current_z_pm25 = calculate_robust_z_score(reading.pm25, median_pm25, mad_pm25)
    
    # To avoid DB spam on every single reading, we need context.
    # In a real system, we'd query the last N readings for this node:
    recent_readings = db.query(SensorReading).filter(
        SensorReading.node_id == reading.node_id
    ).order_by(SensorReading.recorded_at.desc()).limit(3).all()
    
    # Sort chronological
    recent_readings.reverse()
    
    z_scores_pm25 = [
        calculate_robust_z_score(r.pm25, median_pm25, mad_pm25) for r in recent_readings
    ]
    
    # Check if this crosses threshold
    is_anomaly = check_anomaly_persistence(z_scores_pm25, threshold=3.0, required_consecutive=3)
    
    if not is_anomaly:
        return None
        
    # Check if there is already an active event for this node
    # Simplification: we just create a new one for this demo if none found recently.
    active_event = db.query(PollutionEvent).filter(
        PollutionEvent.status == "active"
    ).order_by(PollutionEvent.detected_at.desc()).first()
    
    event_id = None
    
    if active_event:
        # Update existing
        if reading.pm25 and (active_event.peak_pm25 is None or reading.pm25 > active_event.peak_pm25):
            active_event.peak_pm25 = reading.pm25
        if reading.so2 and (active_event.peak_so2 is None or reading.so2 > active_event.peak_so2):
            active_event.peak_so2 = reading.so2
        event_id = active_event.event_id
    else:
        # Create new
        new_event = PollutionEvent(
            detected_at=datetime.now(timezone.utc),
            started_at=recent_readings[0].recorded_at if recent_readings else reading.recorded_at,
            severity="high" if current_z_pm25 > 5.0 else "medium",
            peak_pm25=reading.pm25,
            peak_so2=reading.so2,
            status="active",
            description=f"Persistent PM2.5 anomaly detected (z-score > 3.0) at hour {hour}"
        )
        db.add(new_event)
        db.flush()
        event_id = new_event.event_id
        
    # Link reading to event
    er = EventReading(event_id=event_id, reading_id=reading.reading_id)
    db.add(er)
    db.commit()
    
    return event_id
