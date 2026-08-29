from typing import Optional
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import uuid

from backend.app.models.sensor import SensorReading
from backend.app.models.pollution_event import PollutionEvent, EventReading
from backend.app.engines.event_detection.baseline import get_expected_baseline
from backend.app.engines.event_detection.features import (
    calculate_robust_z_score,
    check_anomaly_persistence,
    check_multi_pollutant_anomaly,
)


def _severity_label(composite_score: float) -> str:
    if composite_score >= 0.75:
        return "severe"
    if composite_score >= 0.50:
        return "high"
    if composite_score >= 0.30:
        return "medium"
    return "low"


def evaluate_reading(db: Session, reading: SensorReading) -> Optional[uuid.UUID]:
    """
    Evaluates a new sensor reading against empirical diurnal baselines (real CPCB data).

    Detection logic:
    1. Get per-hour (median, MAD) for PM2.5 and SO2 from baseline_data.json
    2. Compute robust z-scores for PM2.5 and SO2
    3. Check persistence: last 3 readings must ALL exceed threshold (no false spikes)
    4. Multi-pollutant check: OR-gate (strong single) OR AND-gate (moderate both)
    5. If anomaly detected, create/update PollutionEvent

    Returns the event_id UUID if an event was triggered or updated, else None.
    """
    hour = reading.recorded_at.hour
    median_pm25, mad_pm25, median_so2, mad_so2 = get_expected_baseline(hour)

    # -----------------------------------------------------------------------
    # Step 1: Compute z-scores for this reading
    # -----------------------------------------------------------------------
    z_pm25 = calculate_robust_z_score(reading.pm25, median_pm25, mad_pm25)
    z_so2  = calculate_robust_z_score(reading.so2,  median_so2,  mad_so2)

    # -----------------------------------------------------------------------
    # Step 2: Persistence check — last 3 readings for this node
    # -----------------------------------------------------------------------
    recent_readings = (
        db.query(SensorReading)
        .filter(SensorReading.node_id == reading.node_id)
        .order_by(SensorReading.recorded_at.desc())
        .limit(3)
        .all()
    )
    recent_readings.reverse()  # Chronological order

    z_scores_pm25 = [
        calculate_robust_z_score(r.pm25, median_pm25, mad_pm25)
        for r in recent_readings
    ]
    z_scores_so2 = [
        calculate_robust_z_score(r.so2, median_so2, mad_so2)
        for r in recent_readings
    ]

    pm25_persistent = check_anomaly_persistence(z_scores_pm25, threshold=3.0, required_consecutive=3)
    so2_persistent  = check_anomaly_persistence(z_scores_so2,  threshold=2.5, required_consecutive=3)

    # -----------------------------------------------------------------------
    # Step 3: Multi-pollutant check on current reading
    # -----------------------------------------------------------------------
    is_anomaly, composite_score = check_multi_pollutant_anomaly(z_pm25, z_so2)

    # Require at least one pollutant to be persistent (not just a spike)
    if not (pm25_persistent or so2_persistent):
        is_anomaly = False

    if not is_anomaly:
        return None

    severity = _severity_label(composite_score)

    # -----------------------------------------------------------------------
    # Step 4: Check for an already-active event for any node (simplification:
    # in production, scope this per-node or per-cluster)
    # -----------------------------------------------------------------------
    active_event = (
        db.query(PollutionEvent)
        .filter(PollutionEvent.status == "active")
        .order_by(PollutionEvent.detected_at.desc())
        .first()
    )

    event_id = None

    if active_event:
        # Update peak values if this reading is worse
        if reading.pm25 and (active_event.peak_pm25 is None or reading.pm25 > active_event.peak_pm25):
            active_event.peak_pm25 = reading.pm25
        if reading.so2 and (active_event.peak_so2 is None or reading.so2 > active_event.peak_so2):
            active_event.peak_so2 = reading.so2
        event_id = active_event.event_id
    else:
        # Create a new event
        new_event = PollutionEvent(
            detected_at=datetime.now(timezone.utc),
            started_at=(
                recent_readings[0].recorded_at
                if recent_readings
                else reading.recorded_at
            ),
            severity=severity,
            peak_pm25=reading.pm25,
            peak_so2=reading.so2,
            status="active",
            description=(
                f"Multi-pollutant anomaly: PM2.5 z={z_pm25:.1f}, SO2 z={z_so2:.1f} "
                f"at hour {hour:02d}. Composite score: {composite_score:.2f}."
            ),
        )
        db.add(new_event)
        db.flush()
        event_id = new_event.event_id

    # -----------------------------------------------------------------------
    # Step 5: Link this reading to the event
    # -----------------------------------------------------------------------
    er = EventReading(event_id=event_id, reading_id=reading.reading_id)
    db.add(er)
    db.commit()

    return event_id
