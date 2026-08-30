# HPEE System Architecture Specification
**Hyperlocal Pollution Evidence Engine**  
*Architecture Overview, Ingestion Pipelines & Intelligence Fusion*

---

## 1. High-Level Architecture Topology

```mermaid
graph TD
    subgraph Edge Layer
        Node1["ESP32 Node (Ankleshwar)"] -->|MQTT / TLS| Broker["MQTT Broker (Mosquitto)"]
        Node2["ESP32 Node (Piraman)"] -->|MQTT / TLS| Broker
        Node3["ESP32 Node (Panoli)"] -->|MQTT / TLS| Broker
        IMD["IMD / Weather Stations"] -->|REST API| WeatherIngest["Weather Ingest Worker"]
    end

    subgraph Ingestion & Backend Layer
        Broker --> MQTTWorker["MQTT Ingestion Worker (Python)"]
        MQTTWorker -->|Transforms & POSTs| IngestAPI["FastAPI Telemetry Ingest"]
        WeatherIngest --> IngestAPI
        IngestAPI -->|Raw SQL Write| RawDB[(PostgreSQL + PostGIS: sensor_readings)]
    end

    subgraph Analytical & AI Pipeline Layer
        RawDB --> AnomalyEngine["Anomaly Event Detector"]
        AnomalyEngine -->|Flags Episode| EventDB[(pollution_events & event_readings)]
        EventDB --> Classifier["ML Source Classifier (XGBoost)"]
        EventDB --> TrajectoryEngine["GIS Gaussian Plume & Back-Trajectory"]
        Classifier --> DerivedDB[(event_classifications)]
        TrajectoryEngine --> DerivedDB2[(source_attributions)]
        DerivedDB --> EvidenceEngine["Evidence Fusion Engine"]
        DerivedDB2 --> EvidenceEngine
        EvidenceEngine --> EvidenceDB[(evidence_records & snapshots)]
    end

    subgraph Presentation & Legal Workflow Layer
        EvidenceDB --> ComplaintEngine["GSPCB Form-A PDF Engine"]
        ComplaintEngine --> ComplaintDB[(complaints & documents)]
        FastAPI["FastAPI App Server"] --> NextJS["Next.js Real-Time Dashboard (SARPANCH / PUBLIC / GSPCB)"]
        FastAPI --> AlertService["WhatsApp / SMS Notification Dispatcher"]
    end
```

---

## 2. Core Architectural Guarantees

### 2.1. Raw vs. Derived Data Integrity
- **Raw Measurements**: `sensor_readings` and `weather_observations` are strictly append-only. No analytical routine, ML model, or user edit is permitted to alter raw telemetry.
- **Derived Intelligence**: All analytical artifacts (`pollution_events`, `event_classifications`, `source_attributions`, `evidence_records`, `evidence_snapshots`, and `complaints`) reference the raw observations via explicit foreign keys.

### 2.2. Reproducibility and Version Control
- All schema alterations are versioned via Alembic migrations.
- ML classifications preserve the exact model version (`model_version`) and explainability feature vectors (`features_used`).
- Evidence snapshots and PDF documents store cryptographic SHA-256 hashes (`file_hash`) to guarantee chain-of-custody and tamper-evident integrity for legal proceedings before the National Green Tribunal (NGT) or GSPCB.
