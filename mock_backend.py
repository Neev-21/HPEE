from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from datetime import datetime, timezone
import uuid

app = FastAPI(title="Mock HPEE Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/v1/events")
def get_events():
    return [
        {
            "event_id": "evt-001",
            "village_name": "Piraman",
            "severity": "critical",
            "status": "active",
            "detected_at": datetime.now(timezone.utc).isoformat(),
            "started_at": datetime.now(timezone.utc).isoformat(),
            "peak_pm25": 145.2,
            "peak_so2": 85.1
        },
        {
            "event_id": "evt-002",
            "village_name": "Ankleshwar GIDC",
            "severity": "watch",
            "status": "resolved",
            "detected_at": "2026-08-29T10:00:00Z",
            "started_at": "2026-08-29T09:30:00Z",
            "peak_pm25": 85.0,
            "peak_so2": 40.0
        }
    ]

@app.get("/api/v1/gis/nodes")
def get_nodes():
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [73.0162, 21.6335]},
                "properties": {
                    "node_id": "HPEE-ANK-001",
                    "name": "Piraman Primary School",
                    "aqi": "Poor",
                    "aqi_color": "#dc2626",
                    "pm25": 145.2,
                    "so2": 85.1,
                    "battery_percent": 82,
                    "signal_strength": -65,
                    "status": "online",
                    "last_reading_at": datetime.now(timezone.utc).isoformat()
                }
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [73.0200, 21.6400]},
                "properties": {
                    "node_id": "HPEE-ANK-002",
                    "name": "GIDC Main Gate",
                    "aqi": "Moderate",
                    "aqi_color": "#d97706",
                    "pm25": 65.0,
                    "so2": 35.0,
                    "battery_percent": 95,
                    "signal_strength": -55,
                    "status": "online",
                    "last_reading_at": datetime.now(timezone.utc).isoformat()
                }
            }
        ]
    }

@app.get("/api/v1/gis/industries")
def get_industries():
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [73.0180, 21.6350]},
                "properties": {
                    "industry_id": "IND-001",
                    "name": "Gujarat Organics & Dyes Ltd",
                    "gspcb_consent_id": "GSPCB-1234",
                    "declared_process": "Dyes",
                    "emission_profile": {"so2": 0.8, "pm25": 0.6}
                }
            }
        ]
    }

@app.get("/api/v1/gis/event/{event_id}/layers")
def get_event_layers(event_id: str):
    return {
        "layers": {
            "plume_cone": {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[73.0180, 21.6350], [73.0100, 21.6300], [73.0120, 21.6400], [73.0180, 21.6350]]]
                },
                "properties": {}
            }
        }
    }

@app.get("/api/v1/gis/plume-cone")
def get_plume_cone():
    return {
        "type": "Feature",
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[73.0180, 21.6350], [73.0100, 21.6300], [73.0120, 21.6400], [73.0180, 21.6350]]]
        },
        "properties": {}
    }

@app.get("/api/v1/complaints/{complaint_id}")
def get_complaint(complaint_id: str):
    return {
        "complaint_id": complaint_id,
        "complaint_number": "GPCB-2026-001",
        "status": "draft",
        "gspcb_form_data": {
            "complainant": "Admin User",
            "affected_locality": "Piraman",
            "alleged_source": "Gujarat Organics & Dyes Ltd",
            "pollutants": ["PM2.5", "SO2"],
            "peak_levels": "PM2.5: 145.2, SO2: 85.1",
            "legal_basis": "Air Act 1981 Sec 21"
        },
        "documents": [
            {"file_hash": "abc123def456", "document_type": "evidence_dossier"}
        ]
    }

@app.post("/api/v1/complaints/generate")
def generate_complaint(payload: dict):
    return {
        "complaint_id": str(uuid.uuid4()),
        "complaint_number": "GPCB-2026-002",
        "status": "draft",
        "gspcb_form_data": {
            "complainant": "Admin User",
            "affected_locality": "Piraman",
            "alleged_source": "Gujarat Organics & Dyes Ltd",
            "pollutants": ["PM2.5", "SO2"],
            "peak_levels": "PM2.5: 145.2, SO2: 85.1",
            "legal_basis": "Air Act 1981 Sec 21"
        },
        "documents": [
            {"file_hash": "abc123def456", "document_type": "evidence_dossier"}
        ]
    }

@app.post("/api/v1/complaints/{complaint_id}/submit")
def submit_complaint(complaint_id: str):
    return {
        "complaint_id": complaint_id,
        "complaint_number": "GPCB-2026-002",
        "status": "submitted",
        "gspcb_form_data": {
            "complainant": "Admin User",
            "affected_locality": "Piraman",
            "alleged_source": "Gujarat Organics & Dyes Ltd",
            "pollutants": ["PM2.5", "SO2"],
            "peak_levels": "PM2.5: 145.2, SO2: 85.1",
            "legal_basis": "Air Act 1981 Sec 21"
        },
        "documents": [
            {"file_hash": "abc123def456", "document_type": "evidence_dossier"}
        ]
    }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
