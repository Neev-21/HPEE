# HPEE API Contract Specification
**Hyperlocal Pollution Evidence Engine**  
*Protocols: REST (FastAPI) & WebSockets | Data Contract: JSON / GeoJSON | Version: v0.1*

---

## 1. Overview and Ingestion Principles

1. **Decoupled Architecture**: ESP32 sensing hardware, Next.js frontend, and ML inference pipelines interact solely through standardized REST and WebSocket endpoints. No client or engine queries the database directly.
2. **Normalized Sensor Ingestion**: Sensor hardware variants (e.g. PMS5003 vs Plantower SPS30 vs EC SO2 cells) translate measurements to a normalized payload schema before transmission.
3. **UTC Timestamps**: All request/response payloads use ISO 8601 UTC timestamps (e.g., `2026-08-15T15:52:10Z`).

---

## 2. Sensor Telemetry Ingestion Contract

### `POST /api/v1/telemetry/ingest`
Receives normalized telemetry from ESP32 edge nodes or MQTT bridge services.

#### Request Payload:
```json
{
  "node_id": "HPEE-ANK-001",
  "timestamp": "2026-08-15T15:52:10Z",
  "location": {
    "latitude": 21.6335,
    "longitude": 73.0162
  },
  "measurements": {
    "pm25": {
      "value": 84.6,
      "unit": "ug/m3",
      "quality": "valid"
    },
    "so2": {
      "value": 42.7,
      "unit": "ug/m3",
      "quality": "valid"
    },
    "temperature": {
      "value": 29.4,
      "unit": "celsius",
      "quality": "valid"
    },
    "humidity": {
      "value": 71.3,
      "unit": "percent",
      "quality": "valid"
    },
    "wind_speed": {
      "value": 4.8,
      "unit": "m/s",
      "quality": "valid"
    },
    "wind_direction": {
      "value": 135.0,
      "unit": "degrees",
      "quality": "valid"
    }
  },
  "node_health": {
    "battery_percent": 78.0,
    "signal_strength": -61,
    "status": "online"
  }
}
```

#### Response (201 Created):
```json
{
  "status": "success",
  "reading_id": 104829,
  "node_id": "HPEE-ANK-001",
  "received_at": "2026-08-15T15:52:12Z"
}
```

---

## 3. Real-Time Telemetry & Pollution Event WebSockets

### `WS /api/v1/ws/live-stream`
Pushes live sensor telemetry packets and real-time anomaly alerts to the Next.js frontend map.

#### Event Broadcast Payload:
```json
{
  "type": "POLLUTION_ALERT",
  "event_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "village_name": "Piraman",
  "severity": "severe",
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

## 4. Evidence & Source Attribution Endpoints

### `GET /api/v1/events/{event_id}/evidence-dossier`
Fetches the fused evidence dossier, Gaussian plume dispersion modeling, and ranked culprits.

#### Response (200 OK):
```json
{
  "event_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "village": {
    "name": "Piraman",
    "district": "Bharuch"
  },
  "duration": {
    "started_at": "2026-08-18T23:30:00Z",
    "ended_at": "2026-08-19T04:30:00Z",
    "hours": 5.0
  },
  "classification": {
    "type": "industrial",
    "confidence": 0.94,
    "model_version": "hpee_multisensor_classifier_v1.4"
  },
  "culprits": [
    {
      "rank": 1,
      "name": "Gujarat Organics & Dyes Ltd - Plot 401",
      "industry_type": "Dyes & Intermediates",
      "probability": 0.87,
      "gspcb_consent_id": "GSPCB/CCA-BH-10492/2024",
      "distance_meters": 1250.0,
      "declared_shift": "Night Batch Sulphonation - Reactor 3"
    },
    {
      "rank": 2,
      "name": "Narmada Synthetic Chemicals Pvt Ltd",
      "industry_type": "Specialty Chemicals",
      "probability": 0.13,
      "distance_meters": 1680.0
    }
  ],
  "evidence_snapshots": [
    {
      "snapshot_type": "composite_dossier",
      "url": "/static/evidence/snapshots/2026-08-19_piraman_industrial_event_dossier.png",
      "file_hash_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    }
  ]
}
```

---

## 5. GSPCB Complaint Workflow Endpoints

### `POST /api/v1/complaints/generate-form-a`
Pre-fills GSPCB Form-A compliant structure using verified evidence data for Sarpanch review.

#### Request Payload:
```json
{
  "event_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "filed_by_user_id": "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f"
}
```

#### Response (200 OK):
```json
{
  "complaint_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "complaint_number": "GSPCB-HPEE-2026-ANK-0001",
  "status": "draft",
  "gspcb_form_data": {
    "complainant": "Sureshbhai Patel (Sarpanch Piraman)",
    "affected_locality": "Piraman Village, Bharuch District",
    "alleged_source": "Gujarat Organics & Dyes Ltd - Plot 401",
    "pollutants": ["Sulphur Dioxide (SO2)", "Particulate Matter (PM2.5)"],
    "peak_levels": "SO2: 141.6 ug/m3, PM2.5: 194.8 ug/m3",
    "legal_basis": "Air (Prevention and Control of Pollution) Act, 1981 Section 21"
  },
  "pdf_download_url": "/api/v1/complaints/f47ac10b-58cc-4372-a567-0e02b2c3d479/export-pdf"
}
```
