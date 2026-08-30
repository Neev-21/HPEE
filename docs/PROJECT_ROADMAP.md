# HPEE Project Master Roadmap

This document serves as the single source of truth for the phased development and delivery of the Hyperlocal Pollution Enforcement Engine (HPEE).

---

## 🏗️ Phase 1 — Foundation
*Status: Completed*
- [x] **Database Architecture & Models** (PostgreSQL + PostGIS with temporal partitioning)
- [x] **Ingestion API** (`POST /api/v1/sensor/readings` with Pydantic validation & strict node policies)
- [x] **Evidence Fusion Engine Core** (Multi-factor evidence weighting with graceful degradation)
- [x] **Source Attribution Engine** (PostGIS spatial candidate generation, angular wind alignment & probabilistic ranking)

---

## 🧠 Phase 2 — Intelligence Activation
*Status: Completed & Integrated*
- [x] **Event Detection Engine** (Empirical diurnal baselines, robust z-score, persistence filtering)
- [x] **Event Classification Engine** (Multi-pollutant ratios $PM_{2.5}/PM_{10}$, $NO_x/SO_2$, diurnal context)
- [x] **Dataset Simulator** (Replays real historical CPCB/GPCB Gujarat time-series `TS-PS9-2.csv`)
- [x] **Pipeline Integration & Engine Contracts** (`docs/ENGINE_CONTRACTS.md` frozen, async background cascade)

---

## 🖥️ Phase 3 — Product & UI (Inspector Dashboard)
*Status: Ready for Implementation*
- [ ] **Inspector Dashboard Overview** (Real-time alert feed, active pollution episodes)
- [ ] **Live Map Visualization** (PostGIS spatial layers, sensor heatmaps, active plume overlays)
- [ ] **Evidence Investigation Workspace** (Inspect time series, sensor spikes, and explainability factors)
- [ ] **Source Attribution Visualization** (Top-ranked candidate industrial sites, wind vector roses, distance breakdowns)
- [ ] **WebSocket Live Push** (`/ws/v1/live` for real-time alerting without polling)

---

## 🏛️ Phase 4 — Government & Legal Workflow
*Status: Scheduled*
- [ ] **Form-A Legal Notice Generation** (Automated PDF generation with cryptographic timestamp & SHA-256 evidence snapshot)
- [ ] **Citizen Complaint Submission & Triangulation** (Community complaint correlation with sensor spikes)
- [ ] **Official Inspection Workflow** (Inspector field assignment, evidence attachment, case resolution)
- [ ] **Immutable Audit Trail** (Legal chain-of-custody logging)

---

## 📡 Phase 5 — Physical System & Hardware
*Status: In Progress*
- [ ] **ESP32 Node Firmware** (C++/Arduino/ESP-IDF with NTP time sync and power management)
- [ ] **Sensor Interfacing** (PMS5003 for PM2.5/PM10, Electrochemical SO2, BME280)
- [ ] **Anemometer & Wind Vane Integration** (Wind speed & cardinal direction drivers)
- [ ] **Power Management System** (Solar + LiFePO4 battery monitoring & telemetry)
- [x] **MQTT Ingestion Broker** (Local Mosquitto container added with a Serial-to-MQTT testing bridge)
- [x] **MQTT Consumer** (Background ingestion worker implemented and containerized)
- [ ] **Field Deployment Guide** (Mounting, geolocation calibration, village association)

---

## 🚀 Phase 6 — Productionization & Ops
*Status: In Progress*
- [x] **Container Orchestration Core** (Multi-container `docker-compose` for API, DB, MQTT, and Ingestion Worker)
- [ ] **Container Orchestration Frontend** (Add Next.js & Redis to Docker)
- [ ] **Cloud Deployment & CI/CD** (Automated testing, container registry, staging/production environments)
- [ ] **Security Hardening** (TLS everywhere, node HMAC / token authentication, rate limiting)
- [ ] **Monitoring & Telemetry** (Prometheus, Grafana, OpenTelemetry)
- [ ] **Structured Logging & Diagnostics**
- [ ] **Automated Backup Strategy** (PostgreSQL WAL archiving, PostGIS snapshot backups)
- [ ] **Load & Stress Testing** (1,000+ simultaneous simulated sensor nodes)
- [ ] **Final Hardware-Software Integration Validation**
