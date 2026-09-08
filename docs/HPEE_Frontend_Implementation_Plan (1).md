read docs and the new frontend implentation plan 
# HPEE Frontend — Implementation Plan for Antigravity

## 0. Read this first — the mockup and the repo don't agree

I pulled the `backend` branch (`Neev-21/HPEE`) and compared it against `HPEE_Full_Frontend_Mockup.html`. They're two different products:

| | Your mockup | The repo's locked spec (`docs/UI_SPECIFICATION.md`, "Status: Locked & Approved for Development") |
|---|---|---|
| Concept | A company (Apex Chemicals) monitoring **its own** plant | GSPCB (government regulator) monitoring **other people's** factories to build legal cases against them |
| Users | Plant Manager / Admin / Master | Officer / Inspector / Sarpanch (village head) |
| Visual language | Rounded cards, teal, soft shadows | Zero border-radius, monochrome + red/amber/green, Public Sans + IBM Plex Mono, "GOVERNMENT OF GUJARAT" strip, trilingual EN/HI/GU |
| Core object | A sensor pin you configure yourself | A pollution **event/incident** with an attributed **culprit industry** and a **GSPCB Form-A legal complaint** |
| Admin surfaces | Blueprint Editor, Dashboard Builder, Setup Wizard, Master Editor | None of these exist in the spec — it's a 5-view enforcement dashboard |

The actual FastAPI backend (routes, schemas, seed data — see §2) is built entirely around villages, industries, pollution events, source attribution, and complaints. It has no concept of "a company configuring its own sensor network," so the mockup's Sensor Configuration / Blueprint Editor / Dashboard Builder / Setup Wizard pages have no backend to connect to as written.

**Assumption I'm proceeding on:** keep the mockup's strongest UX ideas — the clickable blueprint/map, the live node detail panel, the events table, the dense metric cards, a builder-style admin section — but retarget them at the real domain (nodes/industries/events/complaints) and reskin them to the locked institutional design system, since that's what's "approved for development" and what the existing scaffold already partially follows. Where the mockup's admin pages (Blueprint Editor, Dashboard Builder, Setup Wizard, Master Editor) have no backend equivalent, I've folded their useful parts into Stations/Incidents/Compliance rather than building dead-end screens. Tell me if you'd rather keep those as pure front-end config surfaces (localStorage-backed) for demo purposes — that's a small addition to Phase 4 below.

---

## 1. What already exists in the repo — don't rebuild this

The `backend` branch already contains a partial Next.js 16 / React 19 / Tailwind v4 scaffold at `frontend/`, plus an official static prototype at `prototype/index.html` that matches the locked design system closely — **use that prototype as your visual reference, not the uploaded mockup.**

Scaffold inventory:
```
frontend/src/app/[locale]/
  page.tsx          (285 lines) — Overview: calls fetchNodesGeoJSON/fetchIndustriesGeoJSON/
                                   fetchPollutionEvents/fetchEventGisLayers, renders GisMap
  incidents/page.tsx (216)      — calls fetchPollutionEvents, polls every 60s
  stations/page.tsx  (144)      — calls fetchSensorNodes
  compliance/page.tsx (386)     — calls fetchPollutionEvents + fetchComplaint
  reports/page.tsx   (42)       — stub
  login/page.tsx     (185)      — calls login() from '@/lib/auth', hardcoded role hints
frontend/src/components/
  Layout/GovHeader.tsx, StatusBar.tsx (calls fetchHealth)
  Map/GisMap.tsx (199) — Leaflet wrapper
frontend/messages/{en,hi,gu}.json — Header/Nav/StatusBar/Overview/Incidents/... namespaces already keyed
```

**Critical: this scaffold does not currently build.** Every page above imports from `@/lib/api` and `@/lib/auth` — neither file exists anywhere in the pushed branch. Someone wrote the pages against an API client that was never committed. This is your actual Phase 1: reconstruct `lib/api.ts` and `lib/auth.ts` to match the function signatures the pages already call (`fetchNodesGeoJSON`, `fetchIndustriesGeoJSON`, `fetchPollutionEvents`, `fetchEventGisLayers`, `fetchComplaint`, `fetchSensorNodes`, `fetchHealth`, `login`), against the real endpoints in §2.

---

## 2. Real backend surface (verified from source, not from the docs)

`docs/API_CONTRACT.md` describes an *aspirational* contract that doesn't match what's implemented. Use this table instead — it's read from `backend/app/api/v1/*.py` and `backend/app/main.py` directly.

| Method | Path (mounted prefix + route) | Notes |
|---|---|---|
| POST | `/api/v1/sensor/readings` | Telemetry ingest. Body: `TelemetryIngestRequest` (node_id, timestamp, location{lat,lon,altitude}, measurements{pm25,so2,temperature,humidity,wind_speed,wind_direction} each `{value,unit,quality}`, node_health{battery_percent,signal_strength,status}). Returns 201 + `{status, reading_id, node_id, received_at}`. Triggers async event detection in background. |
| GET | `/api/v1/gis/nodes` | GeoJSON FeatureCollection, sensor nodes |
| GET | `/api/v1/gis/industries` | GeoJSON FeatureCollection, registered industries + consent IDs |
| GET | `/api/v1/gis/event/{event_id}/layers` | Multi-layer GeoJSON: plume cone polygon, wind vector, culprits |
| GET | `/api/v1/gis/plume-cone` | Standalone plume polygon calc |
| GET | `/api/v1/events` | List pollution events (no path suffix — mounted at bare `/api/v1/events`) |
| POST | `/api/v1/complaints/generate` | Body: `{event_id, filed_by_user_id?}` → creates Form-A draft |
| GET | `/api/v1/complaints/{complaint_id}` | Full complaint dossier |
| GET | `/api/v1/complaints/{complaint_id}/pdf` | Binary PDF stream |
| POST | `/api/v1/complaints/{complaint_id}/submit` | Marks complaint submitted |
| POST | `/api/v1/notifications/send-alert` | Multilingual SMS/WhatsApp alert (currently simulated, see gap list) |
| GET | `/api/v1/notifications/event/{event_id}` | Alerts sent for an event |
| WS | `/api/v1/ws/live` | Query param `?token=hpee-live-token` (hardcoded string check, not real auth). Server pushes `manager.broadcast(dict)` — payload shape is whatever each engine passes in; inspect `backend/app/engines/` call sites before wiring, don't assume the `POLLUTION_ALERT` shape from the docs without checking. |
| GET | `/health` | `{status: "ok"}` |

**Gaps you will hit immediately and must plan around:**
1. **No CORS middleware anywhere in `backend/app/main.py`.** The frontend (port 3100, from `package.json`) will be blocked calling the API (port 8100) from the browser until you add `CORSMiddleware`. This is a one-line backend fix — do it in Phase 1, not as a debugging surprise later.
2. **No real authentication.** `login()` in the missing `lib/auth.ts` was clearly meant to be a client-only mock (the login page hardcodes `admin@gpcb.gov.in` / `inspector.ankleshwar@gpcb.gov.in` / `sarpanch.piraman@gujarat.gov.in` credential *hints*, not real checks). The WS token is a hardcoded string. Per `docs/progress_report.md`, JWT/RBAC is explicitly "Not Started" backend-side. **Don't build against imaginary auth endpoints** — implement `login()` as a local mock that sets a role in localStorage/cookie and gates routes client-side only. Flag this as a known limitation, not something to silently paper over.
3. **No response schemas for GIS/complaints/notifications** — they return raw dicts, so shapes can shift. Hit the running backend with `curl` before writing each TypeScript type; don't trust the markdown docs.
4. Telemetry endpoint is `/api/v1/sensor/readings`, not `/api/v1/telemetry/ingest` as `API_CONTRACT.md` claims — mismatches like this exist throughout that file.
5. `requirements.txt` is reportedly missing `xgboost`/`scikit-learn`/`reportlab` — if you need to run the backend locally, `pip install` may fail until you patch it in.

---

## 3. Design system to build to (from `docs/UI_SPECIFICATION.md` + `prototype/index.html`)

- 0px border radius everywhere, no pill badges, no soft shadows.
- Colors: white `#ffffff` / slate `#f8fafc` background, black `#000000`/`#09090b` text, borders `#27272a` / `#e4e4e7`. Status: critical `#dc2626`/`#7f1d1d`, watch `#d97706`/`#fef3c7`, normal `#16a34a`/`#f0fdf4`.
- Type: Public Sans / IBM Plex Sans for UI, IBM Plex Mono / JetBrains Mono for telemetry values, hashes, coordinates, IDs.
- Header: "GOVERNMENT OF GUJARAT — OFFICIAL REGULATORY AIR MONITORING PORTAL" strip, bilingual title (`ગુજરાત પ્રદૂષણ નિયંત્રણ બોર્ડ` / Gujarat Pollution Control Board), EN | हिन्दी | ગુજરાતી switcher — `next-intl` is already wired for this, `messages/{en,hi,gu}.json` already has the key namespaces.
- Nav bar: OVERVIEW · INCIDENTS · STATIONS · COMPLIANCE · REPORTS, plus a status strip: `● SYSTEM OPERATIONAL | N ACTIVE STATIONS | N OPEN INCIDENTS | DATA UPTIME %`.
- `prototype/index.html` (637 lines, already in the repo) is a hand-built static reference implementing this exact system — read it side-by-side with the UI spec before styling any component.

Where your mockup's ideas genuinely improve on the spec (the clickable blueprint pin → live reading panel interaction, the dense multi-metric card grid, the historical mini-trend sparkline, the widget-driven layout on the builder page), port the *interaction pattern*, not the visual style — reskin to the tokens above.

---

## 4. Page-by-page mapping (mockup idea → real target page)

| Mockup page | Target | What changes |
|---|---|---|
| Overview (blueprint + node pins + detail panel) | `[locale]/page.tsx` (exists, partially wired) | Replace the abstract "floor plan with pins" with the real Leaflet map (`GisMap.tsx` already does this) showing `fetchNodesGeoJSON` + `fetchIndustriesGeoJSON`. Keep the "click a node → side panel with live readings + mini sparkline" pattern from the mockup — that's a genuine improvement over the spec's plain incident dossier. Feed the panel from the selected feature's properties, not from the event layers call (only fetch plume/wind layers once an event is active, as the existing code already does). |
| Current Events | `[locale]/incidents/page.tsx` (exists) | Table columns per spec: SEVERITY / INCIDENT ID / EVENT TIME / MONITORING SITE / PARAMETER-READING / STATUS / ACTION. Drive from `/api/v1/events`, keep the 60s poll already in place, add WS push as a stretch goal once you've confirmed the broadcast payload shape server-side. |
| Sensor Network | Fold into `stations/page.tsx` | Real sensor nodes from `fetchSensorNodes`/`/api/v1/gis/nodes`, not invented S-001..S-006. Show node health (battery/signal/status from the schema) — the mockup's node cards translate directly. |
| Sensor Configuration (ADMIN) | **No backend support** — there's no sensor-CRUD endpoint. Either drop it, or keep a read-only "sensor detail" view fed by real GIS data. Don't build create/edit forms against endpoints that don't exist. |
| Blueprint Editor (ADMIN) | **No backend support.** Drop, or repurpose as a pure map-viewing/zoom tool over the real Leaflet layers — not an editable floor-plan tool. |
| Dashboard Builder (ADMIN) | **No backend support** for persisted custom dashboards. If you want this for the demo, implement it as a client-only, localStorage-persisted widget arrangement over real metric data — call this out to the user as a cosmetic/demo feature, not a real product surface. |
| Plant Display / "kiosk" mode | Genuinely nice idea, no direct spec equivalent. Cheap to add: a `/display` route rendering large-format cards (PM2.5, SO2, active incident count, station uptime) styled per §3, meant for a lobby screen. Low risk, high demo value — good Phase 4 stretch item. |
| Visual Metrics (toggle switches) | Skip — no equivalent config surface backend-side. |
| Master Editor (company/brand identity) | Skip entirely — this app has one identity (GPCB), it's not multi-tenant. |
| Setup Wizard | Skip — there's no onboarding flow in the spec or backend. |
| Compliance / Form-A | `[locale]/compliance/page.tsx` (exists, 386 lines already) | This is the one page where the mockup has *no* equivalent at all and the spec is very specific: checklist of evidence-integrity items, `[⬇ Download Form-A PDF]` hitting `/api/v1/complaints/{id}/pdf`, `[✓ Submit to GSPCB]` hitting `/submit`. The existing page already calls `fetchComplaint` — verify it also wires the PDF download and submit action, since those weren't in the grep hits I found. |
| Reports | `[locale]/reports/page.tsx` (currently a 42-line stub) | Spec doesn't detail this beyond the nav item — treat as a lower-priority historical/export view once the core 4 views work. |

---

## 5. Phased plan (feed each phase to Antigravity as its own task/session)

### Phase 0 — Make the repo runnable
- Add `CORSMiddleware` to `backend/app/main.py` allowing `http://localhost:3100`.
- Patch `requirements.txt` if install fails (xgboost/scikit-learn/reportlab).
- `docker compose up -d`, run migrations, run `python -m database.seed.seed_data` so there's real data to point the frontend at.
- Confirm the API is live at `:8100` and `frontend` dev server starts at `:3100` (`npm run dev`).

### Phase 1 — Reconstruct the missing API/auth clients
- Build `frontend/src/lib/api.ts` exporting exactly the functions the existing pages already import (`fetchNodesGeoJSON`, `fetchIndustriesGeoJSON`, `fetchPollutionEvents`, `fetchEventGisLayers`, `fetchComplaint`, `fetchSensorNodes`, `fetchHealth`, plus whatever `compliance/page.tsx` needs for PDF/submit) — hit the real running endpoints from §2, typed from actual response payloads (curl first, don't guess from the docs).
- Build `frontend/src/lib/auth.ts`: client-side-only mock `login(email, password)` matching the three role hints already in `login/page.tsx`, storing role in a cookie/localStorage, with a simple route guard for admin-tagged pages.
- Get the app building and the Overview map rendering real nodes + industries end to end. This is your "does the wiring work" milestone.

### Phase 2 — Core 4 views to spec
- Overview: map + live node panel (port the mockup's click-to-inspect interaction) + active incident dossier + culprit card, styled per §3.
- Incidents: full table per the spec's column set, filtering/search.
- Stations: node list/grid with health status, replacing the mockup's fictional sensor table with real data.
- Compliance: verify/complete Form-A flow — evidence checklist, PDF download, submit action.

### Phase 3 — Live updates
- Inspect the actual WS broadcast payloads in `backend/app/engines/` (search for `manager.broadcast(` call sites) before assuming a shape.
- Wire `/api/v1/ws/live` into Overview/Incidents to replace/augment the 60s poll, with graceful fallback to polling if the socket drops.

### Phase 4 — Polish / stretch (only after Phase 0–3 work end to end)
- Reports page (historical/export view).
- Optional "Plant Display" kiosk route.
- Optional localStorage-only dashboard-builder demo screen, clearly labeled as a UI demo, not a persisted product feature.
- i18n pass across HI/GU using the existing `messages/*.json` scaffolding.

---

## 6. What to tell Antigravity, concretely

Give it this file plus:
- Read-only pointers: `docs/UI_SPECIFICATION.md`, `prototype/index.html`, `frontend/messages/en.json` for exact copy/keys already agreed on.
- Instruction to **verify every backend response shape by running the server and curling it**, not by trusting `API_CONTRACT.md` or `DATABASE_CONTRACT.md`, since both have already drifted from the implemented code (confirmed above for telemetry and WS paths).
- Instruction to treat `frontend/AGENTS.md`'s note seriously: this is Next.js 16 / React 19, so check `node_modules/next/dist/docs/` for anything that looks like a breaking-change API before assuming standard Next.js 14/15 conventions.
