# HPEE — Hyperlocal Pollution Evidence Engine
## Master System Documentation
**Version:** 0.1 | **Project:** MECIA HACKS 3.0 | **Status:** Active Development

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [System Overview](#2-system-overview)
3. [User Roles & Journeys](#3-user-roles--journeys)
4. [Complete Data Flow](#4-complete-data-flow)
5. [Engine Reference — All 9 Engines](#5-engine-reference)
6. [API Reference](#6-api-reference)
7. [Database Schema](#7-database-schema)
8. [Frontend & Dashboard](#8-frontend--dashboard)
9. [Technology Stack](#9-technology-stack)
10. [Repository Architecture](#10-repository-architecture)
11. [Build Status](#11-build-status)

---

## 1. Product Vision

The **Hyperlocal Pollution Evidence Engine (HPEE)** is an AI-powered environmental monitoring and legal enforcement platform built for rural communities in industrially polluted regions of India — particularly the GPCB-regulated areas of Bharuch and Ankleshwar, Gujarat.

### The Problem

Villages like Piraman, Panoli, and Ankleshwar sit within India's largest chemical industrial corridor. Residents suffer from chronic air pollution caused by industrial emissions. Communities lack:
- **Evidence** to file credible legal complaints
- **Tools** to monitor real-time air quality
- **Access** to regulatory bodies (GSPCB / GPCB)
- **Language support** (Hindi / Gujarati / English)

### The Solution

HPEE places low-cost IoT sensor nodes (ESP32-based) in villages. When a pollution spike is detected, the system:

1. Cross-references live weather data (wind direction, temperature) — **Data-B**
2. Correlates with known industrial emission schedules — **Data-C**
3. Performs spatial GIS analysis to identify the probable culprit factory
4. Generates a legally-admissible evidence dossier
5. Auto-fills a GSPCB Form-A complaint
6. Notifies the Sarpanch and villagers via **WhatsApp/SMS**
7. Alerts the GSPCB Inspector through a secure dashboard

### Impact Goals

- Provide rural communities with autonomous, evidence-based pollution monitoring
- Reduce the time from pollution event to regulatory complaint from **weeks to minutes**
- Create a legally defensible chain-of-custody evidence trail admissible before the **NGT** and GSPCB

---

## 2. System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         EDGE LAYER                                  │
│  ESP32 Node (Ankleshwar) ──┐                                        │
│  ESP32 Node (Piraman)   ──── MQTT Broker / HTTP Gateway             │
│  ESP32 Node (Panoli)    ──┘                                         │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │  Data-A
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND / INGESTION LAYER                      │
│  FastAPI Telemetry Ingest ──► PostgreSQL + PostGIS (sensor_readings)│
│  Weather Ingest Worker ────────────────────────► weather_obs table  │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │ Data-B (Weather APIs)        │
                    │ Data-C (Industrial Schedules)│
                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   ANALYTICAL / AI PIPELINE LAYER                    │
│                                                                     │
│  Event Detection Engine ──► pollution_events table                  │
│        │                                                            │
│        ▼                                                            │
│  Pollution Classification Engine ──► event_classifications          │
│        │  (Industrial / Agricultural / Vehicular / Seasonal)        │
│        │                                                            │
│        ▼  (if Industrial)                                           │
│  Evidence Fusion Engine ──────────────────────────────────────────► │
│     (Data-A + Data-B + Data-C fused)          evidence_records      │
│        │                                                            │
│        ▼                                                            │
│  Source Attribution Engine ──► source_attributions                  │
│     (Wind vector + GIS + Factory schedules → ranked culprits)       │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 PRESENTATION & LEGAL WORKFLOW LAYER                  │
│                                                                     │
│  GIS Mapping Engine ──────────────────────► Map visualization       │
│  Complaint Generation Engine ──────────────► GSPCB Form-A PDF       │
│  Notification Engine ──────────────────────► WhatsApp / SMS         │
│  Inspector Dashboard (Next.js) ─────────────► Evidence workspace    │
│  Public Website (Villager view) ────────────► AQI + alerts          │
└─────────────────────────────────────────────────────────────────────┘
```

### The Three Data Streams

| Data Stream | Source | Contents |
|---|---|---|
| **Data-A** | ESP32 Sensor Nodes | PM2.5, PM10, SO2, NOx, NO2, CO, CO2, temperature, humidity, wind speed, wind direction |
| **Data-B** | External Weather APIs (OpenMeteo, IMD, OpenWeatherMap) | Independent wind speed/direction, temp, humidity — used to cross-verify sensor readings |
| **Data-C** | Industrial Intelligence Database | Company names, locations, GSPCB consent IDs, emission types, operating shift schedules, declared processes |

---

## 3. User Roles & Journeys

HPEE serves four distinct user types. The website defaults to a **public-facing home screen** (no login required) with multilingual AQI display in **Hindi, Gujarati, and English** — single-click language switch.

### 3.1 Villager / General Public

**Access:** Public home screen — no login required
**Experience:**
- Sees live Air Quality Index (AQI) for their village
- Receives SMS/WhatsApp alerts with a link to view the event when a surge is detected
- Can view the complaint status and culprit details on the public page
- Language: Hindi / Gujarati / English toggle

**Journey:**
```
Pollution spike detected
    → Receives WhatsApp/SMS with link
    → Opens public website (Gujarati/Hindi)
    → Sees: "High pollution at 11:30 PM — likely source: Gujarat Organics Ltd"
    → Sees: AQI levels, timeline, complaint status
```

### 3.2 Sarpanch (Village Head)

**Access:** Dedicated Sarpanch login portal
**Permissions:** View events for their village, download complaint PDFs, co-sign complaints

**Journey:**
```
WhatsApp alert received (with login link)
    → Logs in via Sarpanch portal
    → Reviews event: peak PM2.5, SO2, wind direction, factory ranked #1
    → Downloads pre-filled GSPCB Form-A complaint PDF
    → Submits complaint to GSPCB inspector
```

### 3.3 GSPCB Inspector

**Access:** Inspector Dashboard (secure login)
**Permissions:** View all complaints, verify evidence, assign field inspections, resolve cases

**Dashboard capabilities:**
- **Live Map** — sensor nodes, pollution hotspot, wind vectors, factory locations
- **Evidence Workspace** — time-series sensor graphs, anomaly score, evidence dossier
- **Source Attribution View** — ranked list of probable culprit factories with probability scores, distances, wind alignment angles
- **Field Verification** — assign inspection, record findings, attach photos
- **Case Resolution** — mark complaint as verified, pending, or dismissed

**Dashboard Pages (from Figma):**
- Live Monitor, Sensor Map, Alerts, Timeline
- Industries, Factory Status, Villages, AQI
- Complaint (Generate / Analytics / History)

### 3.4 GSPCB Admin

**Access:** Admin backend (highest privilege)
**Responsibilities:**
- Add/remove/configure sensor nodes
- Register industrial sites and update GSPCB consent data
- Manage user accounts (Inspector, Sarpanch)
- Configure alert thresholds and engine parameters
- View system health, API status, database metrics
- Audit logs and compliance reports

---

## 4. Complete Data Flow

```
[1] SENSOR NODE (ESP32)
    Measures: PM2.5, PM10, SO2, NOx, NO, NO2, CO, CO2
              Temperature, Humidity
              Wind Speed, Wind Direction
              Battery %, Signal Strength
    Transmits via: MQTT / HTTPS every 15 minutes
         │
         ▼
[2] MQTT BROKER (Mosquitto / EMQX)
    Validates node credentials (HMAC token)
    Routes messages to backend consumer
         │
         ▼
[3] DATA INGESTION ENGINE (FastAPI)
    POST /api/v1/sensors/readings
    - Validates Pydantic schema
    - Auto-registers or updates node health
    - Writes raw reading to sensor_readings (append-only)
    - Returns reading_id (201 Created)
    - Triggers async pipeline: Event Detection
         │
    ┌────┴──────────────────────────────────────┐
    │                                           │
    ▼                                           ▼
[4a] WEATHER INTELLIGENCE ENGINE           [4b] INDUSTRIAL INTELLIGENCE ENGINE
     Fetches Data-B from:                       Reads Data-C:
     - OpenMeteo API                            - Factory locations (PostGIS)
     - IMD (India Met Dept)                     - Shift schedules
     - OpenWeatherMap                           - Emission profiles
     Returns: wind_speed, wind_direction,       - GSPCB consent IDs
              temperature, humidity             - Declared processes
         │                                           │
         └──────────────────┬────────────────────────┘
                            │  Data-A + Data-B + Data-C
                            ▼
[5] EVENT DETECTION ENGINE
    - Compares reading against diurnal baseline (rolling window)
    - Computes z-score / robust anomaly score
    - Applies persistence filter (must sustain for N readings)
    - Output: is_anomaly (bool), anomaly_score (0-1), event_id
    - Creates / updates pollution_events table
         │
         │ if anomaly detected
         ▼
[6] POLLUTION CLASSIFICATION ENGINE
    - Analyzes pollutant ratios: PM2.5/PM10, NOx/SO2, CO
    - Checks hour of day (diurnal context)
    - Classifies: INDUSTRIAL | AGRICULTURAL | VEHICULAR | SEASONAL | UNKNOWN
    - Writes to event_classifications table
         │
         │ if INDUSTRIAL
         ▼
[7] EVIDENCE FUSION ENGINE  ← Core Intelligence Module
    Fuses all three data streams:
    Data-A: anomaly_score, pollutant_consistency_score
    Data-B: weather_data_quality_score (freshness + wind reliability)
    Data-C: industrial_activity_score (shift overlap match)

    Output:
    {
      "evidence_score": 0.91,
      "factors": {
        "temporal": 0.89,
        "spatial": 0.84,
        "wind": 0.92,
        "pollutant": 0.81
      }
    }
    Writes: evidence_records table
         │
         ▼
[8] SOURCE ATTRIBUTION ENGINE
    - PostGIS ST_DWithin → all active industries within radius
    - For each candidate:
        Wind Alignment Score = f(source_bearing, wind_direction)
        Distance Score       = f(distance_km, max_radius_km)
        Activity Score       = shift_schedule overlap with event time
        Pollutant Match      = emission profile vs detected pollutants
    - Normalize → probabilities → top 5 ranked candidates
    Algorithms: PostGIS spatial join, bearing calc, wind cone geometry
    No LLM. Pure GIS.
         │
         ▼
[9] GIS MAPPING ENGINE
    - Renders: villages, sensor nodes, factories, wind vectors
    - Heatmap overlay, animated plume trajectory, alert zones
    - Leaflet + OpenStreetMap
         │
         ▼
[10] COMPLAINT GENERATION ENGINE
     - Auto-fills GSPCB Form-A:
       village, sensor data, peak levels, timestamps, culprit factory,
       GSPCB consent ID, evidence score, legal basis (Air Act 1981)
     - Renders: Jinja2 → HTML → PDF (ReportLab)
     - Stores PDF with SHA-256 hash for chain of custody
         │
    ┌────┴──────────────────────────────┐
    │                                   │
    ▼                                   ▼
[11] NOTIFICATION ENGINE            [12] INSPECTOR DASHBOARD
     WhatsApp + SMS (Twilio)             Next.js — Map + Evidence + Attribution
     → Sarpanch                          Inspector verifies + field action
     → Village representatives
     → GSPCB Inspector
```

---

## 5. Engine Reference

### 5.1 Data Ingestion Engine

**Owns:** `backend/app/api/v1/telemetry.py`
**Status:** ✅ Built & Tested

#### Input Schema (Data-A)
```json
{
  "node_id": "HPEE-ANK-001",
  "timestamp": "2026-08-15T15:52:10Z",
  "location": { "latitude": 21.6335, "longitude": 73.0162 },
  "measurements": {
    "pm25": { "value": 84.6, "unit": "ug/m3", "quality": "valid" },
    "pm10": { "value": 120.4, "unit": "ug/m3", "quality": "valid" },
    "so2":  { "value": 42.7, "unit": "ppb",   "quality": "valid" },
    "nox":  { "value": 31.2, "unit": "ppb",   "quality": "valid" },
    "no2":  { "value": 18.9, "unit": "ppb",   "quality": "valid" },
    "co":   { "value": 0.8,  "unit": "ppm",   "quality": "valid" },
    "temperature":    { "value": 29.4, "unit": "celsius" },
    "humidity":       { "value": 71.3, "unit": "percent" },
    "wind_speed":     { "value": 4.8,  "unit": "m/s" },
    "wind_direction": { "value": 135.0,"unit": "degrees" }
  },
  "node_health": {
    "battery_percent": 78.0,
    "signal_strength": -61,
    "status": "online"
  }
}
```

#### Output (201 Created)
```json
{
  "status": "success",
  "reading_id": 104829,
  "node_id": "HPEE-ANK-001",
  "received_at": "2026-08-15T15:52:12Z"
}
```

**Behavior:**
- Unknown nodes auto-registered as `status: "pending"`
- Nodes in `fault`, `offline`, or `disabled` state are rejected (403)
- `sensor_readings` table is strictly append-only
- After commit → fires Event Detection as async background task

---

### 5.2 Weather Intelligence Engine

**Status:** ❌ Not yet built
**Purpose:** Fetch independent Data-B from external APIs to cross-verify sensor wind/temperature readings.

**Data Sources:**
| Source | Data | API |
|---|---|---|
| OpenMeteo | Wind, temp, humidity | `api.open-meteo.com` (free) |
| IMD | Official India Met Dept data | REST |
| OpenWeatherMap | Live conditions | `api.openweathermap.org` |

**Output:**
```json
{
  "source": "openmeteo",
  "fetched_at": "2026-08-15T15:55:00Z",
  "wind_speed_ms": 4.2,
  "wind_direction_deg": 142.0,
  "temperature_c": 28.9,
  "humidity_percent": 73.1,
  "data_age_seconds": 180,
  "quality_score": 0.95
}
```

---

### 5.3 Event Detection Engine

**Owns:** `backend/app/engines/event_detection/`
**Status:** ✅ Built & Integrated

**Algorithm:**
1. Compute diurnal baseline: rolling average for same hour across last 7 days
2. Compute robust z-score: `(current - baseline) / MAD`
3. Apply persistence filter: anomaly must sustain across ≥3 readings
4. Create/update `pollution_events` record

**Output:**
```json
{
  "is_anomaly": true,
  "anomaly_score": 0.93,
  "severity": "HIGH",
  "baseline_pm25": 48.2,
  "event_id": "uuid"
}
```

---

### 5.4 Pollution Classification Engine

**Owns:** `backend/app/engines/classification/`
**Status:** ✅ Built (heuristic; ML upgrade planned)

| Type | Key Indicators |
|---|---|
| `industrial` | High SO2, elevated PM, night/shift hours |
| `agricultural_burning` | Very high PM, low SO2, harvest season, daytime |
| `vehicular` | Elevated NOx + CO, rush hours, low SO2 |
| `seasonal_inversion` | Broad area-wide PM rise, low wind, temperature inversion |
| `unknown` | Cannot attribute with confidence |

**Planned ML upgrade:** XGBoost / Random Forest
Features: Hour, Month, Wind, PM Ratio, SO2, Weekend, Festival, Rain

---

### 5.5 Evidence Fusion Engine

**Owns:** `backend/app/engines/evidence_fusion/`
**Status:** ✅ Built (Data-B integration pending)

The **core intelligence module**. Combines Data-A + Data-B + Data-C into a unified confidence assessment.

**Evidence Tracks:**
| Track | Source | Factor |
|---|---|---|
| Temporal | Data-C shift overlap | `temporal` |
| Spatial | GIS proximity | `spatial` |
| Wind | Data-B cross-verification | `wind` |
| Pollutant | Data-A signature | `pollutant` |

**Output:**
```json
{
  "evidence_score": 0.91,
  "factors": {
    "temporal": 0.89,
    "spatial": 0.84,
    "wind": 0.92,
    "pollutant": 0.81
  }
}
```

**Legal significance:** SHA-256 hashed, immutable, structured for GSPCB / NGT proceedings.

---

### 5.6 Source Attribution Engine

**Owns:** `backend/app/engines/source_attribution/`
**Status:** ✅ Built (pollutant_match_score is placeholder)

**Algorithm (Pure GIS — No LLM):**
```
1. PostGIS ST_DWithin → Find all active industries within search radius
2. For each candidate:
   - Wind Alignment Score = Gaussian decay on angular error (bearing vs wind)
   - Distance Score       = Inverse decay by distance
   - Activity Score       = 1.0 if shift overlaps event time, else 0.2
   - Pollutant Match      = Emission profile vs detected gases
3. Final Score = Wind×W1 + Distance×W2 + Activity×W3 + Pollutant×W4 + DataQuality×W5
4. Softmax normalize → probabilities → sort → top 5
```

**Output:**
```json
{
  "candidates": [
    {
      "industry_id": "IND-08",
      "name": "Gujarat Organics & Dyes Ltd - Plot 401",
      "probability": 0.87,
      "wind_alignment_score": 0.94,
      "distance_km": 1.25,
      "activity_score": 1.0,
      "explanation": "Source lies 12.3° from prevailing wind. Distance: 1.25km. Active shift: Night Batch Sulphonation."
    }
  ]
}
```

---

### 5.7 GIS Mapping Engine

**Status:** ❌ Not yet built

**Map Layers:**
| Layer | Technology |
|---|---|
| Base map | Leaflet + OpenStreetMap |
| Villages, sensor nodes, factories | GeoJSON from PostGIS |
| Pollution heatmap | Leaflet.heat |
| Wind vectors | Canvas overlay |
| Alert zones | Circle overlays |
| Animated pollution plume | Canvas animation |

---

### 5.8 Complaint Generation Engine

**Status:** ❌ Not yet built

**GSPCB Form-A Auto-Populated Fields:**
| Field | Source |
|---|---|
| Complainant Name | Sarpanch user record |
| Affected Locality | Village + district |
| Alleged Source | #1 ranked factory + GSPCB consent ID |
| Pollutants | Detected gases (SO2, PM2.5...) |
| Peak Levels | `peak_pm25`, `peak_so2` from event |
| Date & Time | `started_at` from `pollution_events` |
| Legal Basis | Air Act 1981, Section 21 |
| Evidence Attachment | SHA-256 hash + snapshot URL |

**Tech:** Jinja2 HTML template → ReportLab / WeasyPrint PDF

---

### 5.9 Notification Engine

**Status:** ❌ Not yet built

| Channel | Recipient | Trigger | Provider |
|---|---|---|---|
| WhatsApp | Sarpanch | Event confirmed (industrial, confidence > 0.7) | Twilio / WATI |
| SMS | Village representatives | Event confirmed | Twilio |
| WhatsApp | GSPCB Inspector | Complaint filed | Twilio / WATI |
| In-app | Inspector Dashboard | Real-time via WebSocket | Custom |

**WhatsApp Template (Sarpanch):**
```
🚨 HPEE Alert - Piraman Village
Time: 11:30 PM, 18 Aug 2026
PM2.5 = 194.8 µg/m³ (SEVERE)
Likely Source: Gujarat Organics Ltd (87% confidence)
Wind: NW → Your village

View Evidence: https://hpee.in/event/9b1deb4d
```

---

## 6. API Reference

Base URL: `http://localhost:8100` (dev) / `https://api.hpee.in` (prod)
Auth: **JWT Bearer Token** (except public endpoints)

### Full API Endpoint Table (from Figma)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Login — returns JWT | Public |
| `GET`  | `/api/v1/dashboard/overview` | Dashboard summary metrics | Inspector+ |
| `GET`  | `/api/v1/sensors` | List all sensor nodes | Inspector+ |
| `GET`  | `/api/v1/sensors/{id}` | Get specific node status | Inspector+ |
| `POST` | `/api/v1/sensors/readings` | **Ingest telemetry from IoT node** | Node token |
| `GET`  | `/api/v1/events` | List pollution events | Inspector+ |
| `GET`  | `/api/v1/events/{id}` | Get event details | Inspector+ |
| `GET`  | `/api/v1/events/{id}/evidence` | Get evidence dossier | Inspector+ |
| `GET`  | `/api/v1/events/{id}/attribution` | Get source attribution results | Inspector+ |
| `POST` | `/api/v1/events/{id}/generate-report` | Generate evidence report | Inspector+ |
| `POST` | `/api/v1/events/{id}/generate-complaint` | Generate GSPCB Form-A complaint | Sarpanch+ |
| `GET`  | `/api/v1/industries` | List registered industrial sites | Inspector+ |
| `GET`  | `/api/v1/weather` | Latest weather data | Inspector+ |
| `GET`  | `/api/v1/analytics` | Analytics and historical stats | Admin+ |
| `WS`   | `/api/v1/ws/live` | Live sensor stream + pollution alerts | Inspector+ |

### Mock Request/Response (from Figma)

**POST /api/v1/sensors/readings — Request:**
```json
{
  "node_id": "SNN-001",
  "timestamp": "2026-08-15T23:52:00Z",
  "latitude": 21.6734,
  "longitude": 73.0702,
  "pm25": 42.7,
  "so2": 24.1,
  "temperature": 28.4,
  "humidity": 71.2,
  "wind_direction": 135
}
```

**Response:**
```json
{
  "success": true,
  "reading_id": "SR-40837"
}
```

### WebSocket Live Event
```json
{
  "type": "POLLUTION_ALERT",
  "event_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "village_name": "Piraman",
  "severity": "SEVERE",
  "started_at": "2026-08-18T23:30:00Z",
  "peak_so2": 141.6,
  "peak_pm25": 194.8,
  "primary_culprit": {
    "name": "Gujarat Organics & Dyes Ltd - Plot 401",
    "probability_score": 0.87,
    "bearing_angle_deg": 315.0
  }
}
```

---

## 7. Database Schema

PostgreSQL + PostGIS. All migrations via **Alembic**. Raw tables are **strictly append-only**.

| Table | Type | Description |
|---|---|---|
| `users` | Auth | User accounts — Inspector, Sarpanch, Admin |
| `sensor_nodes` | Raw | IoT node registry — PostGIS location, status, battery |
| `sensor_readings` | Raw | All telemetry readings. Append-only |
| `weather_observations` | Raw | External weather API data (Data-B). Append-only |
| `industrial_sites` | Reference | Factory registry — PostGIS location, type, GSPCB consent ID |
| `industrial_activities` | Reference | Shift schedules and emission profiles (Data-C) |
| `pollution_events` | Derived | Detected pollution events with peak values |
| `event_classifications` | Derived | ML classification output per event |
| `evidence_records` | Derived | Individual evidence weights per factor |
| `source_attributions` | Derived | Ranked factory candidates per event |
| `complaints` | Legal | GSPCB Form-A complaint records |

### Key Relationships
```
sensor_nodes      (1) ──── (N) sensor_readings
pollution_events  (1) ──── (N) event_classifications
pollution_events  (1) ──── (N) evidence_records
pollution_events  (1) ──── (N) source_attributions
pollution_events  (1) ──── (1) complaints
industrial_sites  (1) ──── (N) industrial_activities
industrial_sites  (1) ──── (N) source_attributions
```

---

## 8. Frontend & Dashboard

**Framework:** Next.js (React) | **Theme:** Dark, command-center aesthetic
**Languages:** English / Hindi / Gujarati — single-click toggle
**Real-time:** WebSocket → `/api/v1/ws/live`
**Mapping:** Leaflet.js + OpenStreetMap

### Public Pages (No Login)
| Page | URL | Description |
|---|---|---|
| Home / AQI Monitor | `/` | Village AQI, live readings, recent alerts |
| Event Detail | `/events/{id}` | Public event view (linked from SMS/WhatsApp) |

### Sarpanch Portal
| Page | URL | Description |
|---|---|---|
| Login | `/auth/login` | Sarpanch / Inspector / Admin login |
| My Events | `/sarpanch/events` | Pollution events for my village |
| Complaint | `/sarpanch/complaint/{id}` | Review + download Form-A PDF |

### Inspector Dashboard (from Figma)
| Page | URL | Description |
|---|---|---|
| Live Monitor | `/dashboard/live` | Real-time map + live sensor feed |
| Sensor Map | `/dashboard/map` | All node locations + status |
| Alerts | `/dashboard/alerts` | Active + recent pollution alerts |
| Timeline | `/dashboard/timeline` | Historical event timeline |
| Industries | `/dashboard/industries` | Factory database + GSPCB consent IDs |
| Factory Status | `/dashboard/factory-status` | Operating/shutdown/fault status |
| Villages | `/dashboard/villages` | Village AQI summary |
| AQI | `/dashboard/aqi` | Air quality index dashboard |
| Complaint (Generate) | `/dashboard/complaints/generate` | Create complaint |
| Complaint (Analytics) | `/dashboard/complaints/analytics` | Complaint stats |
| Complaint (History) | `/dashboard/complaints/history` | Past complaints |
| Evidence Workspace | `/dashboard/events/{id}` | Full evidence investigation |

### Admin Backend
| Page | URL | Description |
|---|---|---|
| System Health | `/admin/health` | API + DB + background task status |
| Sensor Nodes | `/admin/sensors` | Add/configure/decommission nodes |
| Industrial Sites | `/admin/industries` | Register/update factory data |
| Users | `/admin/users` | Manage accounts |
| Configuration | `/admin/config` | Alert thresholds, engine params |
| Audit Log | `/admin/audit` | Immutable system audit trail |

---

## 9. Technology Stack

### Backend
| Layer | Technology |
|---|---|
| API Framework | **FastAPI** (Python) |
| ORM | **SQLAlchemy** + **GeoAlchemy2** |
| Database | **PostgreSQL 15** + **PostGIS** |
| Migrations | **Alembic** |
| Validation | **Pydantic v2** + **pydantic-settings** |
| MQTT | Mosquitto / EMQX |
| ML (planned) | XGBoost / Scikit-learn |
| PDF Generation | Jinja2 + ReportLab / WeasyPrint |

### Frontend
| Layer | Technology |
|---|---|
| Framework | **Next.js** (React) |
| Mapping | **Leaflet.js** + OpenStreetMap |
| i18n | next-intl (Hindi / Gujarati / English) |
| Real-time | WebSockets |
| Charts | Recharts / Chart.js |
| Theme | Dark mode, Tailwind CSS |

### Communications
| Service | Provider |
|---|---|
| WhatsApp API | Twilio / WATI |
| SMS | Twilio |

### DevOps
| Layer | Technology |
|---|---|
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Monitoring | Prometheus + Grafana |
| Logging | OpenTelemetry |

### Hardware (ESP32 Sensor Nodes)
| Component | Spec |
|---|---|
| MCU | ESP32 (WiFi + BT) |
| PM2.5 / PM10 | PMS5003 (Plantower) |
| SO2 Sensor | Electrochemical SO2 cell |
| Weather | BME280 (temp, humidity, pressure) |
| Wind Speed | Anemometer |
| Wind Direction | Wind Vane |
| Power | Solar + LiFePO4 battery |
| Protocol | MQTT over TLS |

### AI/ML Stack
| Component | Technology |
|---|---|
| Anomaly Detection | Statistical (z-score, MAD) |
| Classification | XGBoost / Random Forest (planned) |
| Evidence Fusion | Weighted multi-factor scoring |
| Source Attribution | Pure GIS — PostGIS, bearing calc, wind cone geometry. **No LLM.** |
| Report Generation | Jinja2 + ReportLab |

---

## 10. Repository Architecture

```
hpee/
├── frontend/                         # Next.js dashboard (Phase 3)
│
├── backend/
│   ├── app/
│   │   ├── api/v1/
│   │   │   └── telemetry.py          # Ingestion API
│   │   ├── engines/
│   │   │   ├── common/
│   │   │   │   ├── config.py         # Engine weights + configuration
│   │   │   │   └── types.py          # Shared type definitions (EventContext, etc.)
│   │   │   ├── event_detection/
│   │   │   │   ├── service.py        # Anomaly detection
│   │   │   │   ├── baseline.py       # Diurnal baseline
│   │   │   │   └── features.py       # Feature extraction
│   │   │   ├── classification/
│   │   │   │   ├── service.py        # Pollution type classification
│   │   │   │   └── features.py
│   │   │   ├── evidence_fusion/
│   │   │   │   ├── service.py        # Evidence fusion orchestration
│   │   │   │   └── factors.py        # Factor calculators
│   │   │   ├── source_attribution/
│   │   │   │   ├── service.py        # PostGIS candidate generation
│   │   │   │   └── ranking.py        # Wind alignment + probability ranking
│   │   │   ├── weather/              # ❌ TODO — Data-B integration
│   │   │   └── gis/                  # ❌ TODO — GIS map engine
│   │   ├── models/                   # SQLAlchemy ORM models
│   │   ├── schemas/                  # Pydantic schemas
│   │   ├── db/                       # DB session + connection
│   │   └── main.py                   # FastAPI app entry point
│
├── firmware/esp32/                   # ESP32 firmware (Phase 5)
│
├── simulator/
│   ├── run.py                        # Dataset replay simulator
│   └── loader.py                     # CSV data loader + column mapping
│
├── ml/                               # ML training pipelines (planned)
│
├── database/migrations/              # Alembic migration scripts
│
├── docs/
│   ├── MASTER_DOCUMENTATION.md      ← This document
│   ├── PROJECT_ROADMAP.md
│   ├── API_CONTRACT.md
│   ├── ENGINE_CONTRACTS.md
│   ├── DATABASE_CONTRACT.md
│   └── SYSTEM_ARCHITECTURE.md
│
└── tests/
    ├── test_ingestion.py
    └── test_evidence_fusion.py
```

---

## 11. Build Status

| Engine / Feature | Status | Notes |
|---|---|---|
| **Data Ingestion API** | ✅ Complete | `POST /api/v1/sensors/readings` — tested with CPCB dataset |
| **Database + PostGIS** | ✅ Complete | Alembic migration 0001 applied |
| **Event Detection Engine** | ✅ Complete | Detected 1 event from 20 readings in simulator test |
| **Pollution Classification Engine** | ✅ Complete | Heuristic-based; XGBoost upgrade planned |
| **Evidence Fusion Engine** | ⚠️ Partial | Data-B (external weather) not yet connected |
| **Source Attribution Engine** | ⚠️ Partial | `pollutant_match_score` is hardcoded placeholder (0.8) |
| **Dataset Simulator** | ✅ Complete | Replays `TS-PS9-2.csv` — CPCB Gujarat historical data |
| **Weather Intelligence Engine** | ❌ TODO | External weather API integration (Data-B) |
| **Industrial Intelligence Engine** | ❌ TODO | Data-C seeder/loader for company shift schedules |
| **GIS Mapping Engine** | ❌ TODO | Leaflet + PostGIS API endpoints |
| **Complaint Generation Engine** | ❌ TODO | Jinja2 + PDF generation |
| **Notification Engine** | ❌ TODO | Twilio WhatsApp/SMS integration |
| **Inspector Dashboard** | ❌ TODO | Next.js — Phase 3 |
| **Public Website** | ❌ TODO | Multilingual home screen (Hindi/Gujarati/English) |
| **WebSocket Live Push** | ❌ TODO | `WS /api/v1/ws/live` |
| **ESP32 Firmware** | ❌ TODO | Phase 5 — hardware |
| **GSPCB Form-A PDF API** | ❌ TODO | Phase 4 — legal workflow |
| **MQTT Broker** | ❌ TODO | Phase 5 — Mosquitto/EMQX setup |

---

*Last Updated: 2026-08-29 | MECIA HACKS 3.0 | HPEE Team*
