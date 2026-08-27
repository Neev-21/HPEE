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
