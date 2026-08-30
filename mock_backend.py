from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import uvicorn
from datetime import datetime, timezone
import uuid

app = FastAPI(title="HPEE Backend & Scenario Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Scenario Catalog -----------------
SCENARIOS = {
    "ankleshwar_so2": {
        "id": "ankleshwar_so2",
        "name": "GIDC Ankleshwar — SO₂ Acid Gas Night Dump",
        "category": "industrial",
        "badge": "CRITICAL INDUSTRIAL SURGE",
        "badge_color": "#dc2626",
        "chemical": "SO₂ (Sulfur Dioxide) + Acid Aerosols",
        "events": [
            {
                "event_id": "EVT-ANK-SO2-001",
                "village_name": "Piraman",
                "severity": "critical",
                "status": "active",
                "detected_at": datetime.now(timezone.utc).isoformat(),
                "started_at": datetime.now(timezone.utc).isoformat(),
                "peak_pm25": 145.2,
                "peak_so2": 184.6
            }
        ],
        "nodes": {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [73.0162, 21.6335]},
                    "properties": {
                        "node_id": "HPEE-ANK-001",
                        "name": "Piraman Primary School",
                        "aqi": "Severe (Hazardous)",
                        "aqi_color": "#dc2626",
                        "pm25": 145.2,
                        "so2": 184.6,
                        "battery_percent": 88,
                        "signal_strength": -62,
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
                        "aqi": "Poor",
                        "aqi_color": "#dc2626",
                        "pm25": 110.0,
                        "so2": 135.0,
                        "battery_percent": 95,
                        "signal_strength": -55,
                        "status": "online",
                        "last_reading_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            ]
        },
        "industries": {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [73.0180, 21.6380]},
                    "properties": {
                        "industry_id": "IND-001",
                        "name": "Gujarat Organics & Dyes Ltd",
                        "gspcb_consent_id": "GSPCB-ANK-8842",
                        "declared_process": "Synthetic Dye & Acid Nitration",
                        "emission_profile": {"so2": 0.95, "pm25": 0.72}
                    }
                }
            ]
        },
        "plume_cone": {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[73.0180, 21.6380], [73.0060, 21.6230], [73.0280, 21.6210], [73.0180, 21.6380]]]
            },
            "properties": {"source": "Gujarat Organics & Dyes Ltd", "confidence": 0.94}
        },
        "wind_vector": {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": [[73.0180, 21.6380], [73.0162, 21.6335]]
            },
            "properties": {"speed_kmh": 18.5, "direction_deg": 195}
        },
        "complaint": {
            "complaint_id": "CMP-ANK-2026-001",
            "complaint_number": "GPCB-A17-2026-8891",
            "status": "draft",
            "gspcb_form_data": {
                "complainant": "Rameshbhai Patel (Sarpanch, Piraman)",
                "affected_locality": "Piraman Village",
                "alleged_source": "Gujarat Organics & Dyes Ltd (Plot 44/A)",
                "pollutants": ["SO₂ (184.6 ppb)", "PM2.5 (145.2 µg/m³)"],
                "peak_levels": "SO₂: 184.6 ppb (230% of CPCB limit), PM2.5: 145.2 µg/m³",
                "legal_basis": "Air (Prevention and Control of Pollution) Act 1981, Section 21"
            },
            "documents": [{"file_hash": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08", "document_type": "evidence_dossier"}]
        }
    },

    "navsari_solvent": {
        "id": "navsari_solvent",
        "name": "GIDC Navsari / Vapi — Petrochem Solvent Spike",
        "category": "industrial",
        "badge": "SEVERE SOLVENT SPIKE",
        "badge_color": "#991b1b",
        "chemical": "VOCs & PM2.5 Solvent Fumes",
        "events": [
            {
                "event_id": "EVT-NAV-VOC-002",
                "village_name": "Navsari Rural Cluster",
                "severity": "severe",
                "status": "active",
                "detected_at": datetime.now(timezone.utc).isoformat(),
                "started_at": datetime.now(timezone.utc).isoformat(),
                "peak_pm25": 218.4,
                "peak_so2": 98.2
            }
        ],
        "nodes": {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [73.0162, 21.6335]},
                    "properties": {
                        "node_id": "HPEE-NAV-001",
                        "name": "Navsari Border Node 1",
                        "aqi": "Hazardous (Solvents)",
                        "aqi_color": "#dc2626",
                        "pm25": 218.4,
                        "so2": 98.2,
                        "battery_percent": 91,
                        "signal_strength": -58,
                        "status": "online",
                        "last_reading_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            ]
        },
        "industries": {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [73.0210, 21.6420]},
                    "properties": {
                        "industry_id": "IND-002",
                        "name": "Navsari Petrochem & Resins Ltd",
                        "gspcb_consent_id": "GSPCB-NAV-5510",
                        "declared_process": "Specialty Polymer Solvent Stripping",
                        "emission_profile": {"so2": 0.75, "pm25": 0.91}
                    }
                }
            ]
        },
        "plume_cone": {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[73.0210, 21.6420], [73.0100, 21.6260], [73.0260, 21.6240], [73.0210, 21.6420]]]
            },
            "properties": {"source": "Navsari Petrochem & Resins Ltd", "confidence": 0.91}
        },
        "wind_vector": {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": [[73.0210, 21.6420], [73.0162, 21.6335]]
            },
            "properties": {"speed_kmh": 22.0, "direction_deg": 210}
        },
        "complaint": {
            "complaint_id": "CMP-NAV-2026-002",
            "complaint_number": "GPCB-A17-2026-9014",
            "status": "draft",
            "gspcb_form_data": {
                "complainant": "Kishorebhai Desai (Sarpanch, Navsari)",
                "affected_locality": "Navsari Rural Cluster",
                "alleged_source": "Navsari Petrochem & Resins Ltd (Plot 18/C)",
                "pollutants": ["PM2.5 (218.4 µg/m³)", "SO₂ (98.2 ppb)", "Solvent VOCs"],
                "peak_levels": "PM2.5: 218.4 µg/m³ (364% of Limit), SO₂: 98.2 ppb",
                "legal_basis": "Air Act 1981 Sec 21 & Hazardous Chemicals Rules"
            },
            "documents": [{"file_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", "document_type": "evidence_dossier"}]
        }
    },

    "farmer_stubble": {
        "id": "farmer_stubble",
        "name": "Farmer Crop Stubble Combustion (Agricultural)",
        "category": "agricultural",
        "badge": "BIOMASS SMOKE (NON-INDUSTRIAL)",
        "badge_color": "#d97706",
        "chemical": "Pure PM2.5 Biomass Smoke (Zero SO₂)",
        "events": [
            {
                "event_id": "EVT-AGRI-BIO-003",
                "village_name": "Piraman Outer Farmland",
                "severity": "watch",
                "status": "active",
                "detected_at": datetime.now(timezone.utc).isoformat(),
                "started_at": datetime.now(timezone.utc).isoformat(),
                "peak_pm25": 168.5,
                "peak_so2": 14.1
            }
        ],
        "nodes": {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [73.0162, 21.6335]},
                    "properties": {
                        "node_id": "HPEE-ANK-001",
                        "name": "Piraman Primary School",
                        "aqi": "Poor (Biomass Smoke)",
                        "aqi_color": "#d97706",
                        "pm25": 168.5,
                        "so2": 14.1,
                        "battery_percent": 85,
                        "signal_strength": -64,
                        "status": "online",
                        "last_reading_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            ]
        },
        "industries": {"type": "FeatureCollection", "features": []},
        "plume_cone": None,
        "wind_vector": {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": [[73.0300, 21.6200], [73.0162, 21.6335]]
            },
            "properties": {"speed_kmh": 8.0, "direction_deg": 45}
        },
        "complaint": None
    },

    "weather_inversion": {
        "id": "weather_inversion",
        "name": "High Wind & Meteorological Inversion Shift",
        "category": "weather",
        "badge": "WEATHER / INVERSION DISPERSION",
        "badge_color": "#0284c7",
        "chemical": "Atmospheric Dust Dispersion",
        "events": [
            {
                "event_id": "EVT-MET-WIND-004",
                "village_name": "Ankleshwar Corridor",
                "severity": "normal",
                "status": "active",
                "detected_at": datetime.now(timezone.utc).isoformat(),
                "started_at": datetime.now(timezone.utc).isoformat(),
                "peak_pm25": 72.0,
                "peak_so2": 18.0
            }
        ],
        "nodes": {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [73.0162, 21.6335]},
                    "properties": {
                        "node_id": "HPEE-ANK-001",
                        "name": "Piraman Primary School",
                        "aqi": "Moderate (High Wind)",
                        "aqi_color": "#d97706",
                        "pm25": 72.0,
                        "so2": 18.0,
                        "battery_percent": 88,
                        "signal_strength": -60,
                        "status": "online",
                        "last_reading_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            ]
        },
        "industries": {"type": "FeatureCollection", "features": []},
        "plume_cone": None,
        "wind_vector": {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": [[73.0000, 21.6500], [73.0300, 21.6100]]
            },
            "properties": {"speed_kmh": 48.0, "direction_deg": 315}
        },
        "complaint": None
    },

    "baseline_normal": {
        "id": "baseline_normal",
        "name": "Normal Baseline (All Green)",
        "category": "baseline",
        "badge": "ALL NODES NORMAL",
        "badge_color": "#16a34a",
        "chemical": "Clean Air Baseline",
        "events": [],
        "nodes": {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [73.0162, 21.6335]},
                    "properties": {
                        "node_id": "HPEE-ANK-001",
                        "name": "Piraman Primary School",
                        "aqi": "Good (Clean)",
                        "aqi_color": "#16a34a",
                        "pm25": 24.5,
                        "so2": 12.3,
                        "battery_percent": 96,
                        "signal_strength": -52,
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
                        "aqi": "Good (Clean)",
                        "aqi_color": "#16a34a",
                        "pm25": 28.0,
                        "so2": 15.0,
                        "battery_percent": 91,
                        "signal_strength": -58,
                        "status": "online",
                        "last_reading_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            ]
        },
        "industries": {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [73.0180, 21.6350]},
                    "properties": {
                        "industry_id": "IND-001",
                        "name": "Gujarat Organics & Dyes Ltd",
                        "gspcb_consent_id": "GSPCB-1234",
                        "declared_process": "Standard Day Shift",
                        "emission_profile": {"so2": 0.1, "pm25": 0.1}
                    }
                }
            ]
        },
        "plume_cone": None,
        "wind_vector": {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": [[73.0100, 21.6300], [73.0250, 21.6380]]
            },
            "properties": {"speed_kmh": 12.0, "direction_deg": 60}
        },
        "complaint": None
    }
}

active_scenario_id = "ankleshwar_so2"

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/v1/scenario")
def get_current_scenario():
    return SCENARIOS.get(active_scenario_id, SCENARIOS["ankleshwar_so2"])

@app.post("/api/v1/scenario/set")
async def set_scenario(request: Request):
    global active_scenario_id
    body = await request.json()
    sc_id = body.get("scenario_id")
    if sc_id in SCENARIOS:
        active_scenario_id = sc_id
        return {"status": "success", "active": active_scenario_id}
    return {"status": "error", "message": "Scenario not found"}

@app.get("/api/v1/events")
def get_events():
    sc = SCENARIOS.get(active_scenario_id, SCENARIOS["ankleshwar_so2"])
    return sc["events"]

@app.get("/api/v1/gis/nodes")
def get_nodes():
    sc = SCENARIOS.get(active_scenario_id, SCENARIOS["ankleshwar_so2"])
    return sc["nodes"]

@app.get("/api/v1/gis/industries")
def get_industries():
    sc = SCENARIOS.get(active_scenario_id, SCENARIOS["ankleshwar_so2"])
    return sc["industries"]

@app.get("/api/v1/gis/event/{event_id}/layers")
def get_event_layers(event_id: str):
    sc = SCENARIOS.get(active_scenario_id, SCENARIOS["ankleshwar_so2"])
    layers = {}
    if sc.get("plume_cone"):
        layers["plume_cone"] = sc["plume_cone"]
    if sc.get("wind_vector"):
        layers["wind_vector"] = sc["wind_vector"]
    return {"layers": layers}

@app.get("/api/v1/complaints/{complaint_id}")
def get_complaint(complaint_id: str):
    sc = SCENARIOS.get(active_scenario_id, SCENARIOS["ankleshwar_so2"])
    if sc.get("complaint"):
        return sc["complaint"]
    return {
        "complaint_id": complaint_id,
        "complaint_number": "GPCB-A17-2026-AUTO",
        "status": "draft",
        "gspcb_form_data": {
            "complainant": "Sarpanch Office",
            "affected_locality": "Piraman Village",
            "alleged_source": "Attributed Industrial Source",
            "pollutants": ["PM2.5", "SO₂"],
            "peak_levels": "PM2.5: 145.2 µg/m³, SO₂: 184.6 ppb",
            "legal_basis": "Air Act 1981 Sec 21"
        },
        "documents": [{"file_hash": "hash_sample_dossier", "document_type": "evidence_dossier"}]
    }

@app.post("/api/v1/complaints/generate")
def generate_complaint(payload: dict):
    sc = SCENARIOS.get(active_scenario_id, SCENARIOS["ankleshwar_so2"])
    if sc.get("complaint"):
        return sc["complaint"]
    return {
        "complaint_id": str(uuid.uuid4()),
        "complaint_number": "GPCB-2026-A17-01",
        "status": "draft",
        "gspcb_form_data": {
            "complainant": "Sarpanch Office",
            "affected_locality": "Piraman",
            "alleged_source": "Gujarat Organics & Dyes Ltd",
            "pollutants": ["PM2.5", "SO2"],
            "peak_levels": "PM2.5: 145.2, SO2: 184.6",
            "legal_basis": "Air Act 1981 Sec 21"
        },
        "documents": [{"file_hash": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08", "document_type": "evidence_dossier"}]
    }

@app.post("/api/v1/complaints/{complaint_id}/submit")
def submit_complaint(complaint_id: str):
    return {
        "complaint_id": complaint_id,
        "complaint_number": "GPCB-SUBMITTED-ACK",
        "status": "submitted",
        "gspcb_form_data": {
            "complainant": "Sarpanch Office",
            "affected_locality": "Piraman",
            "alleged_source": "Gujarat Organics & Dyes Ltd",
            "pollutants": ["PM2.5", "SO2"],
            "peak_levels": "PM2.5: 145.2, SO2: 184.6",
            "legal_basis": "Air Act 1981 Sec 21"
        },
        "documents": [{"file_hash": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08", "document_type": "evidence_dossier"}]
    }

# ----------------- External Mobile Remote Soundboard Web App -----------------
@app.get("/remote", response_class=HTMLResponse)
def remote_soundboard():
    return """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>HPEE Scenario Soundboard (Presenter Remote)</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; -webkit-tap-highlight-color: transparent; }
    body { background: #0f172a; color: #f8fafc; padding: 16px; min-height: 100vh; display: flex; flex-direction: column; }
    .header { text-align: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #334155; }
    .header h1 { font-size: 19px; font-weight: 800; letter-spacing: 0.5px; color: #38bdf8; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .header p { font-size: 12px; color: #94a3b8; margin-top: 4px; }
    .status-card { background: #1e293b; border: 1px solid #475569; border-radius: 12px; padding: 12px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; }
    .status-left { display: flex; flex-direction: column; }
    .status-label { font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase; }
    .active-name { font-size: 13px; font-weight: 700; color: #f8fafc; margin-top: 2px; }
    .live-dot { width: 10px; height: 10px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 10px #22c55e; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } }
    
    .grid { display: grid; grid-template-columns: 1fr; gap: 12px; flex: 1; }
    .pad { border-radius: 14px; padding: 14px; text-align: left; border: 2px solid transparent; cursor: pointer; transition: all 0.15s ease; position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; min-height: 90px; }
    .pad:active { transform: scale(0.97); }
    .pad.active { border-color: #ffffff; box-shadow: 0 0 20px rgba(255,255,255,0.4); }
    .pad-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
    .pad-icon { font-size: 22px; }
    .pad-badge { font-size: 9px; font-weight: 800; padding: 3px 6px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; background: rgba(0,0,0,0.3); }
    .pad-title { font-size: 14px; font-weight: 800; line-height: 1.2; }
    .pad-sub { font-size: 11px; opacity: 0.85; margin-top: 4px; }
    
    .pad-red { background: linear-gradient(135deg, #b91c1c, #dc2626); color: #fff; }
    .pad-purple { background: linear-gradient(135deg, #6b21a8, #9333ea); color: #fff; }
    .pad-amber { background: linear-gradient(135deg, #b45309, #d97706); color: #fff; }
    .pad-sky { background: linear-gradient(135deg, #0369a1, #0284c7); color: #fff; }
    .pad-green { background: linear-gradient(135deg, #15803d, #16a34a); color: #fff; }

    .toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%) translateY(100px); background: #38bdf8; color: #0f172a; padding: 10px 18px; border-radius: 30px; font-weight: 800; font-size: 12px; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); opacity: 0; pointer-events: none; z-index: 100; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .toast.show { transform: translateX(-50%) translateY(0); opacity: 1; }
  </style>
</head>
<body>
  <div class="header">
    <h1><span>🎮</span> HPEE Stage Remote</h1>
    <p>Tap a soundboard pad to inject telemetry live to laptop</p>
  </div>

  <div class="status-card">
    <div class="status-left">
      <span class="status-label">Active Scenario on Stage:</span>
      <span class="active-name" id="active-title">Loading...</span>
    </div>
    <div class="live-dot"></div>
  </div>

  <div class="grid">
    <!-- Pad 1 -->
    <button class="pad pad-red" onclick="trigger('ankleshwar_so2', '🏭 GIDC Ankleshwar SO₂ Surge')">
      <div class="pad-top">
        <span class="pad-icon">🏭</span>
        <span class="pad-badge">CRITICAL INDUSTRIAL</span>
      </div>
      <div>
        <div class="pad-title">GIDC Ankleshwar — SO₂ Night Dump</div>
        <div class="pad-sub">Gujarat Organics · 184 ppb SO₂ · Plume to Piraman</div>
      </div>
    </button>

    <!-- Pad 2 -->
    <button class="pad pad-purple" onclick="trigger('navsari_solvent', '⚗️ GIDC Navsari Solvent Spike')">
      <div class="pad-top">
        <span class="pad-icon">⚗️</span>
        <span class="pad-badge">SEVERE CHEMICAL</span>
      </div>
      <div>
        <div class="pad-title">GIDC Navsari — Petrochem Solvent Spike</div>
        <div class="pad-sub">Navsari Resins · 218 µg/m³ PM2.5 + VOCs</div>
      </div>
    </button>

    <!-- Pad 3 -->
    <button class="pad pad-amber" onclick="trigger('farmer_stubble', '🌾 Farmer Stubble (AI Filtered)')">
      <div class="pad-top">
        <span class="pad-icon">🌾</span>
        <span class="pad-badge">NON-INDUSTRIAL FILTER</span>
      </div>
      <div>
        <div class="pad-title">Farmer Crop Stubble Combustion</div>
        <div class="pad-sub">Biomass PM2.5 · Zero SO₂ · False Alarm Suppressed</div>
      </div>
    </button>

    <!-- Pad 4 -->
    <button class="pad pad-sky" onclick="trigger('weather_inversion', '🌪️ High Wind & Dispersion')">
      <div class="pad-top">
        <span class="pad-icon">🌪️</span>
        <span class="pad-badge">METEOROLOGY</span>
      </div>
      <div>
        <div class="pad-title">High Wind & Dispersion Vector</div>
        <div class="pad-sub">48 km/h Gale · Ambient Inversion · Natural Shift</div>
      </div>
    </button>

    <!-- Pad 5 -->
    <button class="pad pad-green" onclick="trigger('baseline_normal', '🟢 Normal Clean Baseline')">
      <div class="pad-top">
        <span class="pad-icon">🟢</span>
        <span class="pad-badge">ALL GREEN</span>
      </div>
      <div>
        <div class="pad-title">Clean Baseline Atmosphere</div>
        <div class="pad-sub">All 24 Nodes Green · Compliant CPCB Baseline</div>
      </div>
    </button>
  </div>

  <div id="toast" class="toast">⚡ Injected Live!</div>

  <script>
    let activeId = "";

    async function checkActive() {
      try {
        const res = await fetch('/api/v1/scenario');
        const data = await res.json();
        activeId = data.id;
        document.getElementById('active-title').innerText = data.name;
        document.querySelectorAll('.pad').forEach(p => p.classList.remove('active'));
      } catch (e) {}
    }

    async function trigger(id, name) {
      if (navigator.vibrate) navigator.vibrate(60);
      try {
        await fetch('/api/v1/scenario/set', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenario_id: id })
        });
        document.getElementById('active-title').innerText = name;
        const toast = document.getElementById('toast');
        toast.innerText = "⚡ Injected: " + name;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
      } catch (e) {
        alert("Could not trigger. Ensure backend is running.");
      }
    }

    checkActive();
    setInterval(checkActive, 3000);
  </script>
</body>
</html>
    """

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

