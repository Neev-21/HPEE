# HPEE Master Documentation — Implementation Plan

## Goal

Create a single, comprehensive `MASTER_DOCUMENTATION.md` in `docs/` that covers:
- Full product vision, user roles, and multilingual UI
- Complete data flow: Sensor → MQTT → Ingestion → Data Fusion → Event Detection → Classification → Source Attribution → Notification → Complaint → Inspector Verification
- All 9 engine specs with Data-A, Data-B, Data-C inputs
- Full API contract (REST + WebSocket + OpenAPI-style)
- User journey flows for Villager, Sarpanch, Inspector, Admin
- Architecture diagram
- Database schema summary
- Build/implementation status per engine

## Proposed Changes

### [NEW] `docs/MASTER_DOCUMENTATION.md`
The new definitive master document covering every engine, every user role, every data flow, and every API.

### [MODIFY] `docs/PROJECT_ROADMAP.md`
Add a reference link at the top pointing to the new Master Doc.

## Verification Plan

- User reviews and confirms doc is accurate and complete before any implementation begins.
