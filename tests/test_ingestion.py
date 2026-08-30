from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_ingest_telemetry():
    payload = {
        "node_id": "HPEE-TEST-999",
        "timestamp": "2026-08-15T15:52:10Z",
        "location": {
            "latitude": 21.6335,
            "longitude": 73.0162,
            "altitude": 42.5
        },
        "measurements": {
            "pm25": { "value": 84.6, "unit": "ug/m3", "quality": "valid" },
            "so2": { "value": 42.7, "unit": "ug/m3", "quality": "valid" },
            "temperature": { "value": 29.4, "unit": "celsius", "quality": "valid" },
            "humidity": { "value": 71.3, "unit": "percent", "quality": "valid" },
            "wind_speed": { "value": 4.8, "unit": "m/s", "quality": "valid" },
            "wind_direction": { "value": 135.0, "unit": "degrees", "cardinal": "SE", "quality": "valid" }
        },
        "node_health": {
            "battery_percent": 78.0,
            "signal_strength": -61,
            "status": "online"
        }
    }
    
    # Send request
    response = client.post("/api/v1/sensor/readings", json=payload)
    
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "success"
    assert data["node_id"] == "HPEE-TEST-999"

def test_ingest_telemetry_validation_error():
    # Test latitude out of bounds
    payload = {
        "node_id": "HPEE-TEST-999",
        "timestamp": "2026-08-15T15:52:10Z",
        "location": {
            "latitude": 95.0, # INVALID
            "longitude": 73.0162
        },
        "measurements": {
            "pm25": { "value": 84.6, "unit": "ug/m3", "quality": "valid" }
        },
        "node_health": {
            "battery_percent": 78.0,
            "status": "online"
        }
    }
    
    response = client.post("/api/v1/sensor/readings", json=payload)
    assert response.status_code == 422

def test_trigger_event_detection_routing():
    """
    Integration test to ensure trigger_event_detection routes correctly through the classification engine.
    """
    from backend.app.api.v1.telemetry import trigger_event_detection
    from backend.app.db.session import SessionLocal
    from backend.app.models.sensor import SensorNode, SensorReading
    import uuid
    from datetime import datetime, timezone
    from sqlalchemy import text

    db = SessionLocal()
    try:
        # 1. Setup mock node and reading
        node_id = f"TEST-ROUTING-{uuid.uuid4().hex[:6]}"
        node = SensorNode(
            node_id=node_id,
            status="online",
            battery_percent=100.0,
            signal_strength=-50,
            last_seen_at=datetime.now(timezone.utc),
            location=text("ST_SetSRID(ST_MakePoint(73.0162, 21.6335), 4326)")
        )
        db.add(node)
        db.flush()

        # Insert 3 consecutive readings to trigger persistence check
        for i in range(3):
            reading = SensorReading(
                node_id=node_id,
                recorded_at=datetime.now(timezone.utc),
                received_at=datetime.now(timezone.utc),
                location=node.location,
                pm25=250.0, # High enough to trigger anomaly
                pm25_quality="valid",
                so2=180.0, # High enough to trigger anomaly
                so2_quality="valid",
                wind_speed=3.0,
                wind_direction=140.0,
                raw_payload={
                    "measurements": {
                        "pm10": {"value": 300.0},
                        "nox": {"value": 50.0},
                        "co": {"value": 1.0}
                    }
                }
            )
            db.add(reading)
        
        db.commit()
        db.refresh(reading)

        # 2. Synchronously invoke the background task
        # It should process, create an event, classify it, and build evidence.
        trigger_event_detection(reading.reading_id, node_id)

        # 3. Verify it routed to classification and persisted
        from backend.app.models.pollution_event import PollutionEvent
        from backend.app.models.evidence import EventClassification

        # Find the event created for this reading
        event = db.query(PollutionEvent).filter(PollutionEvent.peak_pm25 >= 250.0).order_by(PollutionEvent.detected_at.desc()).first()
        assert event is not None, "Pipeline failed to create PollutionEvent"

        # Verify Classification was triggered
        classification = db.query(EventClassification).filter(EventClassification.event_id == event.event_id).first()
        assert classification is not None, "Pipeline failed to route to classification engine"
        assert classification.classification_type in ["industrial", "unknown", "vehicular", "agricultural_burning", "seasonal_inversion"]
    finally:
        db.close()
