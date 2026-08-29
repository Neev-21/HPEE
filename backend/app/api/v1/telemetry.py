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
    Full intelligence pipeline triggered asynchronously after telemetry ingestion:
    1. Event Detection (anomaly z-score on PM2.5 + SO2)
    2. Classification (XGBoost or rule-based fallback)
    3. Weather fetch (Data-B from OpenMeteo)
    4. Evidence Fusion + Source Attribution (Data-A + Data-B + Data-C)
    """
    logger.info("Intelligence pipeline triggered for reading_id=%s node_id=%s", reading_id, node_id)

    try:
        from backend.app.db.session import SessionLocal
        from backend.app.models.sensor import SensorReading, SensorNode
        from backend.app.engines.event_detection.service import evaluate_reading
        from backend.app.engines.classification.service import classify_event
        from backend.app.engines.weather.service import fetch_weather
        from backend.app.engines.common.types import EventContext
        from backend.app.engines.evidence_fusion.service import run_evidence_fusion_and_attribution

        db = SessionLocal()

        # -----------------------------------------------------------------------
        # 1. Fetch the reading + node location
        # -----------------------------------------------------------------------
        reading = db.query(SensorReading).filter(SensorReading.reading_id == reading_id).first()
        if not reading:
            return

        # Get node coordinates for weather API call
        node = db.query(SensorNode).filter(SensorNode.node_id == node_id).first()
        node_lat = 21.6320  # Default: Ankleshwar area
        node_lon = 73.0150
        if node and node.location is not None:
            # PostGIS: extract lat/lon from location geometry
            try:
                from sqlalchemy import text as sa_text
                result = db.execute(
                    sa_text("SELECT ST_Y(location::geometry), ST_X(location::geometry) "
                            "FROM sensor_nodes WHERE node_id = :nid"),
                    {"nid": node_id}
                ).fetchone()
                if result:
                    node_lat, node_lon = float(result[0]), float(result[1])
            except Exception:
                pass

        # -----------------------------------------------------------------------
        # 2. Event Detection Engine (real diurnal baseline + multi-pollutant)
        # -----------------------------------------------------------------------
        event_id = evaluate_reading(db, reading)

        if not event_id:
            return  # No anomaly — pipeline ends here

        logger.info("Event detected/updated! Event ID: %s", event_id)

        from backend.app.models.pollution_event import PollutionEvent
        event = db.query(PollutionEvent).filter(PollutionEvent.event_id == event_id).first()

        # -----------------------------------------------------------------------
        # 3. Classification Engine (XGBoost → fallback rules)
        # -----------------------------------------------------------------------
        raw  = reading.raw_payload or {}
        meas = raw.get("measurements", {})

        pm10_val = meas.get("pm10", {}).get("value") if isinstance(meas.get("pm10"), dict) else None
        nox_val  = meas.get("nox",  {}).get("value") if isinstance(meas.get("nox"),  dict) else None
        no2_val  = meas.get("no2",  {}).get("value") if isinstance(meas.get("no2"),  dict) else None
        co_val   = meas.get("co",   {}).get("value") if isinstance(meas.get("co"),   dict) else None

        ts = reading.recorded_at
        classify_event(
            db=db,
            event_id=str(event_id),
            peak_pm25=event.peak_pm25,
            peak_pm10=pm10_val,
            peak_so2=event.peak_so2,
            peak_nox=nox_val,
            peak_co=co_val,
            hour_of_day=ts.hour,
            peak_no2=no2_val,
            wind_speed=reading.wind_speed,
            temperature=reading.temperature,
            humidity=reading.humidity,
            month=ts.month,
            day_of_week=ts.weekday(),
            is_weekend=(ts.weekday() >= 5),
        )

        # -----------------------------------------------------------------------
        # 4. Weather Intelligence Engine (Data-B) — fetch real wind direction
        # -----------------------------------------------------------------------
        weather = fetch_weather(
            lat=node_lat,
            lon=node_lon,
            sensor_wind_speed=reading.wind_speed,
            sensor_wind_direction=reading.wind_direction,
            sensor_temperature=reading.temperature,
            sensor_humidity=reading.humidity,
        )
        logger.info(
            "Weather (Data-B): source=%s wind=%.1f m/s dir=%.0f deg quality=%.2f",
            weather.source, weather.wind_speed_ms, weather.wind_direction_deg, weather.quality_score
        )

        # -----------------------------------------------------------------------
        # 5. Build detected_pollutants dict for pollutant match scoring
        # -----------------------------------------------------------------------
        detected_pollutants = {
            "pm25": event.peak_pm25,
            "so2":  event.peak_so2,
            "nox":  nox_val,
            "no2":  no2_val,
            "co":   co_val,
        }

        # -----------------------------------------------------------------------
        # 6. Evidence Fusion + Source Attribution (Data-A + Data-B + Data-C)
        # -----------------------------------------------------------------------
        context = EventContext(
            event_id=event_id,
            start_time=event.started_at,
            node_ids=[node_id],
            centroid_lat=node_lat,
            centroid_lon=node_lon,
        )

        run_evidence_fusion_and_attribution(
            db=db,
            context=context,
            wind_direction=weather.wind_direction_deg,
            weather_observation_time=weather.fetched_at,
            peak_pm25=event.peak_pm25,
            peak_so2=event.peak_so2,
            detected_pollutants=detected_pollutants,
        )
        logger.info("Full intelligence pipeline completed for event %s", event_id)

        # -----------------------------------------------------------------------
        # 7. Legal Complaint Auto-Generation (GSPCB Form-A PDF)
        # -----------------------------------------------------------------------
        from backend.app.models.evidence import SourceAttribution
        top_culprit = (
            db.query(SourceAttribution)
            .filter(SourceAttribution.event_id == event_id)
            .order_by(SourceAttribution.rank.asc())
            .first()
        )

        if top_culprit and top_culprit.probability_score >= 0.70:
            logger.info("High confidence attribution (%.2f). Auto-generating GSPCB Form-A complaint...", top_culprit.probability_score)
            try:
                from backend.app.engines.complaint.service import generate_complaint_for_event
                complaint = generate_complaint_for_event(db=db, event_id=str(event_id))
                logger.info("Auto-generated complaint: %s (Status: %s)", complaint.complaint_number, complaint.status)
            except Exception as ce:
                logger.error("Failed to auto-generate complaint: %s", ce, exc_info=True)

            # -----------------------------------------------------------------------
            # 8. Multilingual Alert Dispatch (WhatsApp/SMS to Sarpanch & Citizens)
            # -----------------------------------------------------------------------
            try:
                from backend.app.engines.notification.service import dispatch_pollution_alert
                alerts = dispatch_pollution_alert(
                    db=db,
                    event_id=str(event_id),
                    channel="whatsapp",
                    lang="gu", # Default Gujarat rural locale
                )
                logger.info("Dispatched %d automated multilingual alerts for event %s", len(alerts), event_id)
            except Exception as ne:
                logger.error("Failed to dispatch alert notifications: %s", ne, exc_info=True)

    except Exception as e:
        logger.error("Error in async intelligence pipeline: %s", e, exc_info=True)
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
        raw_payload=payload.model_dump(mode="json")
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
