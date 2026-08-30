# GSPCB — Hyperlocal Pollution Evidence Engine (HPEE)
## Official Frontend UI/UX Architecture & Implementation Specification
**Document Date:** August 30, 2026  
**Status:** Locked & Approved for Development  
**Live References:**
- **Local Interactive Prototype:** [`prototype/index.html`](file:///c:/Users/HP/Desktop/HPEE/prototype/index.html)
- **Deployed Production Vercel Prototype:** [https://gpcb-monitor-hpee.vercel.app/](https://gpcb-monitor-hpee.vercel.app/)

---

## 🏛️ 1. Core Visual Design System & Aesthetics

### Non-Negotiable Design Rules
1. **Strict 0px Border Radius (`rounded-none`):** No rounded corners, bubbly pill badges, or floating cards. Official institutional look.
2. **Monochrome + Functional Status Colors:**
   - **Background:** Pure White (`#ffffff`) and Slate White (`#f8fafc`).
   - **Foreground & Text:** True Black (`#000000`) and Zinc 950 (`#09090b`).
   - **Borders:** Crisp solid borders (`1px solid #27272a` and `1px solid #e4e4e7`).
   - **Status Accents:** Pure Functional Semantic Colors only:
     - `CRITICAL / SEVERE`: Deep Red (`#dc2626` / `#7f1d1d`)
     - `WATCH / MODERATE`: Amber (`#d97706` / `#fef3c7`)
     - `NORMAL / GOOD`: Forest Green (`#16a34a` / `#f0fdf4`)
3. **Typography:**
   - **Interface & Headings:** `Public Sans` / `IBM Plex Sans` / `-apple-system`.
   - **Telemetry, Hashes, Coordinates, Identifiers:** `IBM Plex Mono` / `JetBrains Mono` (`font-mono`).
4. **Header & Gov Standards:**
   - Top Gov Strip: `GOVERNMENT OF GUJARAT — OFFICIAL REGULATORY AIR MONITORING PORTAL`.
   - Bilingual / Trilingual Titles: `ગુજરાત પ્રદૂષણ નિયંત્રણ બોર્ડ` & `Gujarat Pollution Control Board`.
   - Instant 1-Click Language Selector: `EN | हिन्दी | ગુજરાતી`.

---

## 🖥️ 2. Primary Navigation & Workspaces

The frontend interface comprises 5 core functional views:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [Emblem] GOVERNMENT OF GUJARAT — Gujarat Pollution Control Board   [EN | हिन्दी | ગુજરાતી] │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [OVERVIEW]  [INCIDENTS]  [STATIONS]  [COMPLIANCE / FORM-A]  [REPORTS]   (OFFICER / GPCB)│
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ● SYSTEM OPERATIONAL | 13 ACTIVE STATIONS | 01 OPEN INCIDENT | DATA UPTIME: 99.8%      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### View A: Overview & Live Incident Workspace
- **Left Panel (60%):** Interactive High-Contrast Leaflet / Carto-Positron Map
  - Real-time station telemetry dots with CPCB AQI status colors.
  - Upwind plume dispersion cone overlay (`GET /api/v1/gis/plume-cone`).
  - Attributed culprit factory marker (`GET /api/v1/gis/event/{id}/layers`).
- **Right Panel (40%):** Active Incident Dossier & Verification Queue
  - Incident ID & timestamp (`GPCB-26-0841 · 08:41:52 IST`).
  - Live sensor measurements (`PM2.5: 230.5 µg/m³`, `SO2: 195.2 ppb`, `Wind: 2.4 m/s @ 135° SE`).
  - Machine Learning Classification: `INDUSTRIAL (XGBoost 99.8% Confidence)`.
  - Attributed Source: `Gujarat Insecticides Ltd` (89.5% Probability, Cosine Sim 0.91).

### View B: Legal Compliance & GSPCB Form-A Desk
- Pre-filled GSPCB Form-A legal complaint under Section 21 of The Air Act, 1981.
- Complainant (Sarpanch / Aggrieved Citizen) digital identification.
- Evidence Integrity verification checkbox list:
  - `[x] Continuous telemetry stream verified`
  - `[x] Independent OpenMeteo weather vector cross-checked`
  - `[x] Factory shift operating schedule matched`
  - `[x] SHA-256 evidence payload hash verified`
- One-Click Actions:
  - `[⬇ Download Form-A PDF]` -> Streams binary PDF from `/api/v1/complaints/{id}/pdf`.
  - `[✓ Submit to GSPCB]` -> Dispatches formal regulatory submission via `/api/v1/complaints/{id}/submit`.

### View C: Live Incident Stream & Historical Feed
- High-density tabular grid with search and status filtering:
  - `SEVERITY` | `INCIDENT ID` | `EVENT TIME` | `MONITORING SITE` | `PARAMETER / READING` | `STATUS` | `ACTION`

---

## 🔗 3. Backend API Route Mapping (FastAPI Integration)

The frontend connects directly to our verified, live backend services (`http://127.0.0.1:8000`):

| UI Component | Backend API Endpoint | HTTP Method | Data Payload / Output |
|---|---|---|---|
| **Monitoring Network Map** | `/api/v1/gis/nodes` | `GET` | GeoJSON FeatureCollection of 13 sensor nodes with live AQI |
| **Industrial GIS Overlay** | `/api/v1/gis/industries` | `GET` | GeoJSON FeatureCollection of 14 factories with consent IDs & profiles |
| **Event Plume & Wind Vector** | `/api/v1/gis/event/{event_id}/layers` | `GET` | Multi-layer GeoJSON (plume cone polygon, wind vector, culprits) |
| **Dynamic Plume Cone** | `/api/v1/gis/plume-cone` | `GET` | Geodesic upwind dispersion polygon based on live wind direction |
| **Complaint Dossier View** | `/api/v1/complaints/{complaint_id}` | `GET` | Full structured Form-A JSON payload and evidence metadata |
| **Download Legal PDF** | `/api/v1/complaints/{complaint_id}/pdf` | `GET` | Court-admissible ReportLab PDF binary stream (`application/pdf`) |
| **Submit Formal Complaint** | `/api/v1/complaints/{complaint_id}/submit` | `POST` | Updates complaint status to `submitted` with ACK reference |
| **Citizen WhatsApp/SMS Alert**| `/api/v1/notifications/send-alert` | `POST` | Dispatches localized alert in Gujarati, Hindi, or English |
| **System Health Bar** | `/health` | `GET` | System heartbeat & database operational check |

---

## 🌐 4. Multilingual (i18n) Key Matrix

| Key | Gujarati (`gu`) | Hindi (`hi`) | English (`en`) |
|---|---|---|---|
| `header.title` | ગુજરાત પ્રદૂષણ નિયંત્રણ બોર્ડ | गुजरात प्रदूषण नियंत्रण बोर्ड | Gujarat Pollution Control Board |
| `header.sub` | હાયપરલોકલ પ્રદૂષણ પુરાવા એન્જિન | हाइपरलोकल प्रदूषण साक्ष्य इंजन | Hyperlocal Pollution Evidence Engine |
| `status.alert` | તીવ્ર રાસાયણિક પ્રદૂષણ ચેતવણી સક્રિય | गंभीर रासायनिक उत्सर्जन चेतावनी सक्रिय | Critical Chemical Surge Active |
| `telemetry.title` | લાઈવ સેન્સર ટેલિમેટ્રી | लाइव सेंसर टेलीमेट्री | Live Sensor Telemetry |
| `culprit.title` | શંકાસ્પદ ઔદ્યોગિક સ્ત્રોત | संदिग्ध औद्योगिक स्रोत | Attributed Industrial Source |
| `compliance.title`| કાનૂની અમલીકરણ અને ફોર્મ-A ફરિયાદ | कानूनी प्रवर्तन और फॉर्म-A शिकायत | Legal Enforcement & GSPCB Form-A |
| `button.download` | ⬇ ડાઉનલોડ ફોર્મ-A PDF | ⬇ फॉर्म-A PDF डाउनलोड करें | ⬇ Download Form-A PDF |
| `button.submit` | ✓ GSPCB માં ફરિયાદ સબમિટ કરો | ✓ GSPCB में शिकायत दर्ज करें | ✓ Submit to GSPCB |

---

## 🚀 5. Next Steps for Tomorrow's Session

1. **Scaffold Next.js / Vite React App** with Tailwind CSS (`rounded-none` configuration, zinc/slate monochrome tokens).
2. **Mount Leaflet / Mapbox GIS View** connecting to `http://127.0.0.1:8000/api/v1/gis/`.
3. **Integrate Real-Time Telemetry & PDF Download** from the running backend.
4. **Deploy production bundle to Vercel** syncing with the backend container.
