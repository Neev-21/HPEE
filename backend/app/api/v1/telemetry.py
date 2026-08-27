import logging
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timezone

from backend.app.schemas.telemetry import TelemetryIngestRequest, TelemetryIngestResponse
from backend.app.db.session import get_db
from backend.app.models.sensor import SensorNode, SensorReading

logger = logging.getLogger(__name__)
router = APIRouter()

import uuid
from backend.app.engines.common.types import EventContext
from backend.app.engines.evidence_fusion.service import run_evidence_fusion_and_attribution

def trigger_event_detection(reading_id: int, node_id: str):
    """
    Simulates Event Detection and triggers Evidence Fusion & Source Attribution asynchronously.
    """
    logger.info(f"Event Detection Engine triggered for reading_id={reading_id}, node_id={node_id}")
    
    # In a real pipeline, Event Detection would analyze the rolling window and create a PollutionEvent.
    # For now, we simulate an event context and trigger the Fusion Engine directly.
    try:
        from backend.app.db.session import SessionLocal
        from backend.app.models.sensor import SensorReading
        from backend.app.engines.event_detection.service import evaluate_reading
        from backend.app.engines.classification.service import classify_event
        from backend.app.engines.common.types import EventContext
        from backend.app.engines.evidence_fusion.service import run_evidence_fusion_and_attribution
        
        db = SessionLocal()
        
        # 1. Fetch the reading
        reading = db.query(SensorReading).filter(SensorReading.reading_id == reading_id).first()
        if not reading:
            return
            
        # 2. Event Detection Engine
        event_id = evaluate_reading(db, reading)
        
        if event_id:
            logger.info(f"Event detected/updated! Event ID: {event_id}")
            
            # Fetch the updated event
            from backend.app.models.pollution_event import PollutionEvent
            event = db.query(PollutionEvent).filter(PollutionEvent.event_id == event_id).first()
            
            # 3. Classification Engine
            raw = reading.raw_payload or {}
            meas = raw.get("measurements", {})
            
            # Extract additional pollutants if present in raw payload for classification
            pm10 = meas.get("pm10", {}).get("value") if isinstance(meas.get("pm10"), dict) else None
            nox = meas.get("nox", {}).get("value") if isinstance(meas.get("nox"), dict) else None
            co = meas.get("co", {}).get("value") if isinstance(meas.get("co"), dict) else None

            classify_event(
                db=db,
                event_id=str(event_id),
                peak_pm25=event.peak_pm25,
                peak_pm10=pm10,
                peak_so2=event.peak_so2,
                peak_nox=nox,
                peak_co=co,
                hour_of_day=reading.recorded_at.hour
            )
            
            # 4. Evidence Fusion & Source Attribution Engine
            context = EventContext(
                event_id=event_id,
                start_time=event.started_at,
                node_ids=[node_id],
                centroid_lat=21.6734, # Ideally from node location
                centroid_lon=73.0102
            )
            
            run_evidence_fusion_and_attribution(
                db=db,
                context=context,
                wind_direction=reading.wind_direction or 135.0,
                weather_observation_time=datetime.now(timezone.utc),
                peak_pm25=event.peak_pm25,
                peak_so2=event.peak_so2
            )
            logger.info(f"Full intelligence pipeline completed for event {event_id}")
            
    except Exception as e:
        logger.error(f"Error in async intelligence pipeline: {e}")
    finally:
        db.close()


@router.post("/readings", response_model=TelemetryIngestResponse, status_code=status.HTTP_201_CREATED)
def ingest_telemetry(payload: TelemetryIngestRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Verify or auto-register node
    node = db.query(SensorNode).filter(SensorNode.node_id == payload.node_id).first()
    
    if not node:
        # Auto-register node with pending status
        node = SensorNode(
            node_id=payload.node_id,
            status="pending",
            battery_percent=payload.node_health.battery_percent,
            signal_strength=payload.node_health.signal_strength,
            last_seen_at=datetime.now(timezone.utc),
            location=text("ST_SetSRID(ST_MakePoint(0, 0), 4326)")
        )
        db.add(node)
        db.flush()
    else:
        # Explicit validation: Reject ingestion if node is faulty or offline explicitly by admin policy?
        # The document says "must be active for ingestion".
        if node.status in ["fault", "offline", "disabled"]:
            raise HTTPException(status_code=403, detail=f"Node {node.node_id} is in {node.status} state and cannot ingest telemetry.")

        # Update existing node health
        node.battery_percent = payload.node_health.battery_percent
        node.signal_strength = payload.node_health.signal_strength
        if node.status != "pending":
            node.status = payload.node_health.status
        node.last_seen_at = datetime.now(timezone.utc)

    # Extract measurements
    m = payload.measurements
    pm25_val = m.pm25.value if m.pm25 else None
    pm25_qual = m.pm25.quality if m.pm25 else "valid"
    
    so2_val = m.so2.value if m.so2 else None
    so2_qual = m.so2.quality if m.so2 else "valid"
    
    temp_val = m.temperature.value if m.temperature else None
    hum_val = m.humidity.value if m.humidity else None
    ws_val = m.wind_speed.value if m.wind_speed else None
    wd_val = m.wind_direction.value if m.wind_direction else None

    # Construct Location for SensorReading
    wkt_location = None
    if payload.location:
        wkt_location = text(f"ST_SetSRID(ST_MakePoint({payload.location.longitude}, {payload.location.latitude}), 4326)")

    # Create reading
    received_time = datetime.now(timezone.utc)
    reading = SensorReading(
        node_id=payload.node_id,
        recorded_at=payload.timestamp,
        received_at=received_time,
        location=wkt_location,
        pm25=pm25_val,
        pm25_quality=pm25_qual,
        so2=so2_val,
        so2_quality=so2_qual,
        temperature=temp_val,
        humidity=hum_val,
        wind_speed=ws_val,
        wind_direction=wd_val,
        raw_payload=payload.model_dump()
    )
    
    db.add(reading)
    db.commit()
    db.refresh(reading)

    # Trigger Event Detection asynchronously
    background_tasks.add_task(trigger_event_detection, reading.reading_id, reading.node_id)

    return TelemetryIngestResponse(
        status="success",
        reading_id=reading.reading_id,
        node_id=reading.node_id,
        received_at=reading.received_at
    )
