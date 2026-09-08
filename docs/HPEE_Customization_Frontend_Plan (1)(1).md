

# HPEE Frontend Customization Plan
## Scope: Sensor Configuration + Blueprint Editor + Plant Display + Setup Wizard

## 1. Objective

Build the frontend for the new B2B version of Hyperlocal Pollution Evidence Engine (HPEE) so a company can configure its own facility without any hardcoded pollution dashboard assumptions.

The frontend must be fully usable with mock/local data first and structured so the same screens can later be connected to the existing backend APIs, sensor ingestion, evidence fusion, and source attribution engine.

### Primary product idea

**Company defines what it monitors → frontend dynamically renders what the company needs.**

The frontend should NOT assume every company has PM2.5, SO2, temperature, humidity, etc. A company can choose its own sensor type, measurements, units, thresholds, zone, location, and display settings.

---

# 2. Scope of This Frontend Phase

Build only these four major areas:

1. **Sensor Configuration**
2. **Blueprint Editor**
3. **Plant Big Display Configuration + Display Mode**
4. **Facility Setup Wizard**

Do NOT build billing, CRM, subscriptions, advanced company administration, ML training, backend ingestion logic, or regulatory complaint workflows in this phase.

The frontend must expose clean contracts/interfaces for later backend integration.

---

# 3. UX Principles

## 3.1 Configuration-first B2B UX

The system should feel like industrial software, not a generic analytics SaaS template.

Prioritize:

- clear information hierarchy
- dense but readable data presentation
- industrial/technical visual language
- strong status indicators
- very clear online/offline/error states
- fast configuration flows
- minimal unnecessary forms
- drag-and-drop interactions where useful
- responsive desktop-first layout
- large-screen support for plant display

## 3.2 No hardcoded sensor assumptions

Never hardcode UI around a fixed set of measurements.

Bad:

```tsx
<Pm25Card />
<So2Card />
<TemperatureCard />
```

Preferred:

```tsx
<MetricWidget metric={configuredMetric} />
```

The dashboard, blueprint labels, sensor cards, and plant display should all read from configuration objects.

## 3.3 Configuration drives rendering

The following should be data-driven:

- sensor measurements
- units
- threshold values
- sensor location
- zone
- sensor name
- visible dashboard widgets
- visible plant-display metrics
- display layout
- alert visibility

---

# 4. Suggested Frontend Stack

Use the team's existing frontend stack where possible.

Preferred structure:

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui or existing component system
- React Hook Form for complex forms
- Zod for validation
- Zustand or existing lightweight state solution for wizard/configuration state
- SVG/canvas/absolute-positioned overlay for blueprint sensor placement
- local mock data layer for development

Do not introduce a new state-management framework or visualization library unless the existing project actually requires it.

---

# 5. Application Routes

Create the following frontend routes.

```text
/setup
/setup/company
/setup/facility
/setup/blueprint
/setup/zones
/setup/sensors
/setup/thresholds
/setup/dashboard
/setup/display
/setup/review

/facility/:facilityId/configuration
/facility/:facilityId/blueprint
/facility/:facilityId/sensors
/facility/:facilityId/dashboard-config
/facility/:facilityId/display-config
/facility/:facilityId/display
```

The exact router naming can follow the existing project conventions, but the separation of concerns must remain.

---

# 6. Core Data Model for Frontend

Create TypeScript types/interfaces first. These are frontend contracts and should later map cleanly to backend DTOs.

## 6.1 Company

```ts
interface Company {
  id: string;
  name: string;
  logoUrl?: string;
  industry?: string;
}
```

## 6.2 Facility

```ts
interface Facility {
  id: string;
  companyId: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  blueprint?: Blueprint;
  zones: FacilityZone[];
}
```

## 6.3 Blueprint

```ts
interface Blueprint {
  id: string;
  facilityId: string;
  name: string;
  imageUrl: string;
  width: number;
  height: number;
  originalFileName?: string;
}
```

The frontend should support an uploaded image representation first. PDF conversion can be handled later by backend if needed.

## 6.4 Facility Zone

```ts
interface FacilityZone {
  id: string;
  facilityId: string;
  name: string;
  type?: string;
  description?: string;
  polygon?: Array<{ x: number; y: number }>;
}
```

For the first frontend version, zone geometry can be stored in blueprint-relative coordinates.

## 6.5 Sensor Type

Sensor type should be configurable and not tied to a hardcoded vendor.

```ts
interface SensorType {
  id: string;
  name: string;
  category: string;
  description?: string;
  measurements: MeasurementDefinition[];
}
```

## 6.6 Measurement Definition

```ts
interface MeasurementDefinition {
  id: string;
  key: string;
  name: string;
  unit: string;
  dataType: "number" | "boolean" | "text";
  min?: number;
  max?: number;
  decimalPlaces?: number;
}
```

Examples can include PM2.5, SO2, VOC, CO, NO2, temperature, humidity, pH, turbidity, flow, etc., but examples must not limit the system.

## 6.7 Sensor Instance

```ts
interface FacilitySensor {
  id: string;
  facilityId: string;
  sensorCode: string;
  name: string;
  sensorTypeId: string;
  zoneId?: string;
  position: {
    x: number;
    y: number;
  };
  measurements: ConfiguredMeasurement[];
  thresholds: ThresholdRule[];
  status: "online" | "offline" | "warning" | "critical" | "unknown";
}
```

## 6.8 Configured Measurement

```ts
interface ConfiguredMeasurement {
  measurementKey: string;
  enabled: boolean;
  displayName?: string;
  unit: string;
}
```

## 6.9 Threshold Rule

```ts
interface ThresholdRule {
  id: string;
  measurementKey: string;
  level: "normal" | "warning" | "critical";
  operator: ">" | ">=" | "<" | "<=" | "=";
  value: number;
}
```

## 6.10 Dashboard Configuration

```ts
interface DashboardConfig {
  facilityId: string;
  widgets: DashboardWidget[];
}

interface DashboardWidget {
  id: string;
  type: "metric" | "sensor" | "status" | "alert" | "blueprint" | "trend";
  title?: string;
  sensorId?: string;
  measurementKey?: string;
  size: "small" | "medium" | "large" | "full";
  visible: boolean;
  order: number;
}
```

## 6.11 Plant Display Configuration

```ts
interface DisplayConfig {
  facilityId: string;
  layout: "2x2" | "3x2" | "4x2";
  widgets: DisplayWidget[];
  showAlerts: boolean;
  showSourceAttribution: boolean;
  showConfidence: boolean;
  autoRotate?: boolean;
}
```

---

# 7. Feature A — Sensor Configuration

## 7.1 Sensor management screen

Create:

```text
/facility/:facilityId/sensors
```

Screen should contain:

- page title
- sensor count
- search
- filter by zone
- filter by status
- Add Sensor button
- sensor table/grid
- edit/delete actions
- quick status indicators

Example table columns:

```text
Sensor
Code
Type
Zone
Measurements
Status
Last Update
Actions
```

## 7.2 Add Sensor flow

Clicking **Add Sensor** opens a step-by-step drawer/modal or dedicated page.

### Step 1 — Identity

Fields:

- Sensor name
- Sensor code
- Sensor type
- optional description

### Step 2 — Measurements

Show available measurements from selected sensor type.

Example:

```text
Available measurements

[x] PM2.5        µg/m³
[x] SO2          µg/m³
[x] Temperature  °C
[x] Humidity     %
```

Allow enabling/disabling measurements.

### Step 3 — Location

Select:

- facility zone
- blueprint position

Provide a **Place on Blueprint** button that switches directly to the blueprint editor/placement mode.

### Step 4 — Thresholds

For each enabled numeric measurement:

```text
Measurement       Warning        Critical
PM2.5             60             120
SO2               40             80
Temperature       40             50
```

Allow threshold creation/editing.

### Step 5 — Display Settings

Per measurement:

```text
Show on main dashboard      [ON/OFF]
Show on plant display       [ON/OFF]
Use in alerts               [ON/OFF]
```

### Step 6 — Review

Show complete sensor summary before saving.

---

# 8. Feature B — Sensor Type / Custom Measurement Configuration

Companies must be able to define the kind of sensor module they use.

Create a simple **Sensor Type Manager**.

Route:

```text
/facility/:facilityId/sensors/types
```

Functions:

- view available sensor types
- add custom sensor type
- add measurement
- define unit
- define numeric range
- define decimal precision

Example:

```text
Create Sensor Type

Name: Water Quality Module
Category: Water

Measurements

+ Add Measurement

Measurement Name    Key       Unit
pH                  ph        pH
Turbidity           turbidity NTU
Flow Rate            flow      L/min
```

The frontend should store sensor-type definitions independently from sensor instances.

Do not allow the UI to assume that every sensor is an air-quality sensor.

---

# 9. Feature C — Blueprint Editor

## 9.1 Goal

Allow a company to upload its own plant/facility blueprint and place sensors/zones directly on it.

This is a key visual differentiator.

## 9.2 Upload state

Screen:

```text
Upload Facility Blueprint

[ Drag & Drop ]

PNG / JPG supported

or

[ Upload File ]
```

After upload, show preview.

## 9.3 Blueprint editor

Use a canvas/absolute overlay approach.

Base layer:

```text
uploaded blueprint image
```

Overlay layer:

```text
zones
sensor markers
source markers (future-compatible)
labels
selection outlines
```

## 9.4 Editor toolbar

```text
[ Select ]
[ Add Zone ]
[ Add Sensor ]
[ Delete ]
[ Zoom + ]
[ Zoom - ]
[ Fit ]
[ Save ]
```

## 9.5 Sensor marker

Each sensor marker should show:

- sensor icon
- sensor code
- current status
- optional short value badge

Example:

```text
      ●
    S-004
  PM2.5 84.6
```

Status should be visually distinct.

## 9.6 Dragging

Sensors must be draggable.

Position should be stored as normalized/relative coordinates, not only raw screen pixels.

Example:

```ts
position: {
  x: 0.43,
  y: 0.67
}
```

This allows the blueprint to render correctly at different sizes.

## 9.7 Zone drawing

Allow users to create basic rectangular/polygon zones.

For the first version:

- rectangle
- polygon
- name
- optional type

The UI should clearly show the selected zone.

## 9.8 Side panel

When selecting a sensor:

```text
SENSOR S-004

Boiler Area

Status
ONLINE

Measurements
PM2.5
SO2
Temperature

[ Edit Sensor ]
```

When selecting a zone:

```text
ZONE
Boiler Area

Sensors: 3

[ Edit Zone ]
```

---

# 10. Feature D — Plant Big Display

This is a separate user-facing screen designed for a large TV/monitor inside the facility.

## 10.1 Display configuration

Route:

```text
/facility/:facilityId/display-config
```

Configuration screen should let the company control:

- layout
- visible metrics
- visible sensors
- alerts
- probable source display
- confidence display
- facility name/logo
- refresh behavior

## 10.2 Display layout selector

Show visual previews.

```text
[ 2 x 2 ]    [ 3 x 2 ]    [ 4 x 2 ]
```

User selects one.

## 10.3 Metric selection

```text
Visible Plant Metrics

[x] PM2.5
[x] SO2
[x] Temperature
[x] Humidity
[ ] VOC
```

These should be generated from configured sensors/measurements.

## 10.4 Display preview

The page should include a live preview that updates as configuration changes.

Example:

```text
┌────────────────────────────────────────────┐
│ ANKLESHWAR PLANT                 ● LIVE     │
├────────────────────────────────────────────┤
│                                            │
│ PM2.5             SO2            TEMP      │
│ 84.6              42.7           29.4°C    │
│                                            │
│ HUMIDITY          WIND           STATUS    │
│ 71%               4.8 m/s        WARNING   │
│                                            │
├────────────────────────────────────────────┤
│              ⚠ EVENT DETECTED              │
│                                            │
│        PROBABLE SOURCE: BOILER AREA        │
│                 CONFIDENCE 87%             │
└────────────────────────────────────────────┘
```

The values can be mock/live-simulated during frontend development.

## 10.5 Display mode

Create:

```text
/facility/:facilityId/display
```

This screen must:

- hide normal application chrome
- run full-screen style
- use large typography
- have high contrast
- be readable from a distance
- update values dynamically
- show major alerts prominently
- support keyboard escape/back to exit preview during development

It should look appropriate on a 1080p or larger TV.

---

# 11. Feature E — Setup Wizard

The setup wizard is the main onboarding experience.

## 11.1 Wizard flow

```text
Company
  ↓
Facility
  ↓
Blueprint
  ↓
Zones
  ↓
Sensors
  ↓
Thresholds
  ↓
Dashboard
  ↓
Plant Display
  ↓
Review
  ↓
Complete
```

## 11.2 Persistent progress bar

Top of wizard:

```text
1 Company — 2 Facility — 3 Blueprint — 4 Zones — 5 Sensors — 6 Rules — 7 Dashboard — 8 Display — 9 Review
```

Current step should be highlighted.

Completed steps should be clickable.

## 11.3 Navigation

Every step:

```text
[ Back ]                         [ Save & Continue ]
```

Auto-save local wizard state after significant changes.

## 11.4 Step validation

Do not allow completion if mandatory data is missing.

Examples:

Company:

- company name required

Facility:

- facility name required

Blueprint:

- blueprint required for blueprint-based placement flow

Sensors:

- at least one configured sensor for demo completion

## 11.5 Final Review

Show:

```text
FACILITY READY

Company
ABC Industries

Facility
Ankleshwar Plant

Blueprint
Uploaded

Zones
5

Sensors
12

Measurements
26

Alert Rules
8

Plant Display
Configured

[ Complete Setup ]
```

After completion, navigate to the facility dashboard/configuration page.

---

# 12. Dynamic Dashboard Preview

Although the full live operational dashboard is outside this phase, the customization experience needs a dashboard preview.

Route:

```text
/facility/:facilityId/dashboard-config
```

Allow the user to:

- show/hide widgets
- choose metric cards
- choose sensor widgets
- reorder widgets
- choose widget size
- preview the dashboard

Example widget configuration UI:

```text
Available Widgets

☑ PM2.5
☑ SO2
☑ Temperature
☑ Humidity
☑ Sensor Status
☑ Facility Blueprint
☑ Alerts

Drag to reorder
```

The preview must use the same widget components later used by the real dashboard.

---

# 13. Mock Data Layer

Before backend integration, create realistic mock repositories/services.

Example:

```text
src/
  mock/
    companies.ts
    facilities.ts
    blueprints.ts
    zones.ts
    sensorTypes.ts
    sensors.ts
    dashboardConfigs.ts
    displayConfigs.ts
```

Create service interfaces:

```ts
interface FacilityService {
  getFacility(id: string): Promise<Facility>;
  updateFacility(data: Facility): Promise<Facility>;
}

interface SensorService {
  listSensors(facilityId: string): Promise<FacilitySensor[]>;
  createSensor(data: FacilitySensor): Promise<FacilitySensor>;
  updateSensor(data: FacilitySensor): Promise<FacilitySensor>;
  deleteSensor(id: string): Promise<void>;
}
```

Initially these functions can use mock/local storage.

Later replace implementation with API calls without changing UI components.

---

# 14. Backend Integration Boundary

The frontend must NOT access the database directly.

Use a clean service/API layer.

Future calls will conceptually look like:

```text
Frontend
   ↓
API Client
   ↓
FastAPI
   ↓
Backend Services
   ↓
PostgreSQL/PostGIS
```

Keep API-specific logic out of visual components.

Bad:

```tsx
fetch('/api/...')
```

inside every component.

Preferred:

```ts
sensorService.listSensors(facilityId)
```

and the service internally calls the API.

---

# 15. Future Backend Mapping

The frontend should be designed to later map onto backend concepts similar to:

```text
companies
facilities
facility_zones
sensors / sensor_nodes
sensor_types
sensor_measurements
threshold_rules
monitoring_rules
configuration
```

Do not assume exact backend table names in UI code.

Use TypeScript domain models and an adapter/mapping layer.

---

# 16. Reusable Component Architecture

Create reusable components rather than page-specific implementations.

Suggested components:

```text
components/
  facility/
    FacilityHeader
    FacilitySelector

  sensors/
    SensorTable
    SensorCard
    SensorStatusBadge
    SensorForm
    SensorMeasurementSelector
    ThresholdEditor
    SensorTypeForm

  blueprint/
    BlueprintCanvas
    BlueprintToolbar
    SensorMarker
    ZoneShape
    BlueprintSidePanel
    BlueprintUploader

  dashboard/
    DashboardGrid
    DashboardWidget
    MetricWidget
    SensorWidget
    StatusWidget
    AlertWidget

  display/
    DisplayConfigPanel
    DisplayPreview
    DisplayMetricCard
    PlantDisplay

  setup/
    SetupWizard
    SetupProgress
    SetupStep
    SetupNavigation
    SetupReview
```

---

# 17. Visual Design Direction

The product should feel:

**industrial + premium + technical + calm + trustworthy**

Avoid:

- excessive gradients
- excessive rounded cards
- generic AI/SaaS illustrations
- meaningless decorative charts
- over-animated interfaces
- too many colors

Use color primarily for meaning:

- neutral = normal
- amber/yellow = warning
- red = critical
- muted/gray = offline/unknown

The interface should work well in both normal control-room viewing and presentation/demo conditions.

---

# 18. Responsive Behavior

Primary target:

- desktop/laptop: 1280px+
- large monitor/TV: 1920×1080+

Secondary:

- tablet

The plant display should specifically optimize for 16:9 large displays.

The blueprint editor should preserve aspect ratio and support zoom/pan.

---

# 19. State Handling

Maintain separate state categories.

### Server/domain state

Facilities, sensors, zones, configs.

### UI state

Selected sensor, active modal, current tab, zoom level.

### Wizard state

Unsaved setup progress.

### Display preview state

Selected layout and widgets.

Do not mix all of these into one giant global state object.

---

# 20. Validation and Error States

Every configurable screen must include:

- loading state
- empty state
- validation state
- save success state
- save failure state
- unsaved changes warning

Examples:

```text
No sensors configured yet.

[ Add Your First Sensor ]
```

```text
Unsaved changes

[ Discard ] [ Save Changes ]
```

```text
Unable to save sensor configuration.

Please retry.
```

---

# 21. Accessibility

Minimum requirements:

- keyboard accessible forms
- visible focus states
- labels for all controls
- accessible modal/drawer behavior
- sufficient contrast
- status not communicated by color alone

---

# 22. Demo Scenario

The frontend must ship with a realistic seeded demo company.

Example:

```text
Company: ABC Industries
Facility: Ankleshwar Plant

Zones:
- Production Unit A
- Boiler Area
- Storage Area
- Waste Treatment
- Boundary

Sensors:
- S-001 PM2.5 / SO2 / Temperature
- S-002 PM2.5 / SO2
- S-003 Temperature / Humidity
- S-004 VOC / Temperature
```

Demo user should be able to:

1. enter setup
2. view blueprint
3. drag sensor markers
4. edit sensor measurements
5. edit thresholds
6. configure dashboard
7. configure plant display
8. open full-screen display

---

# 23. Definition of Done

This frontend phase is complete when:

### Sensor configuration

- company can create/edit/delete sensors
- company can choose sensor type
- company can choose measurements
- company can define units and thresholds
- company can assign sensor to a zone
- company can place the sensor on the blueprint

### Blueprint

- company can upload blueprint
- blueprint renders correctly
- sensors can be placed and dragged
- sensor positions persist locally
- zones can be created and edited
- sensor side-panel details work

### Dashboard customization

- widgets are generated from configuration
- widgets can be shown/hidden
- widgets can be reordered
- widgets can have different sizes
- preview updates immediately

### Plant display

- company can configure layout
- company can choose visible metrics
- company can choose alert visibility
- preview updates immediately
- full-screen display mode works
- display uses large readable typography

### Setup wizard

- all steps work end-to-end
- progress persists during the session
- validation works
- final review works
- setup completion redirects to the facility area

### Backend readiness

- UI does not directly access database
- API/service layer exists
- domain models are typed
- mock services can later be replaced with FastAPI calls
- no hardcoded PM2.5/SO2 dependency in core components

---

# 24. Z.AI Generation Instructions

When generating this frontend, build the product as a **real configurable B2B industrial platform**, not as a static landing page or hackathon mockup.

Important instructions:

1. Use TypeScript throughout.
2. Build reusable components.
3. Use seeded mock data so every page works immediately.
4. Keep data models separate from UI components.
5. Keep API/service abstraction separate from UI.
6. Make all sensor measurements configuration-driven.
7. Make the blueprint editor functional, not just visually decorative.
8. Make the setup wizard functional end-to-end.
9. Make the plant display genuinely fullscreen-friendly.
10. Make dashboard widgets reusable between preview and future live dashboard.
11. Preserve normalized blueprint coordinates for sensor placement.
12. Do not hardcode PM2.5/SO2 as mandatory measurements.
13. Do not create fake backend endpoints inside individual components.
14. Do not build unnecessary SaaS billing/accounting features.
15. Include realistic loading, empty, validation, error, and success states.
16. Keep the implementation modular so the existing FastAPI backend can be connected afterward.

---

# 25. Recommended Build Order in Z.AI

Build in this exact order:

```text
PHASE 1
Domain types + mock data + service layer

↓
PHASE 2
Sensor Type Manager

↓
PHASE 3
Sensor Configuration UI

↓
PHASE 4
Blueprint Upload + Blueprint Editor

↓
PHASE 5
Zone + Sensor Placement

↓
PHASE 6
Dashboard Configuration + Preview

↓
PHASE 7
Plant Display Configuration

↓
PHASE 8
Fullscreen Plant Display

↓
PHASE 9
Setup Wizard integration

↓
PHASE 10
Polish, validation, responsive behavior, integration readiness
```

Do not jump directly to the final dashboard before the underlying configuration models exist.

---

# 26. Final Product Mental Model

The frontend should communicate one simple concept:

```text
              COMPANY
                 │
              FACILITY
                 │
        ┌────────┼─────────┐
        │        │         │
     BLUEPRINT  ZONES    SENSORS
        │        │         │
        └────────┼─────────┘
                 │
       MEASUREMENTS + RULES
                 │
        ┌────────┴────────┐
        │                 │
   DASHBOARD         PLANT DISPLAY
        │                 │
        └────────┬────────┘
                 │
          LIVE MONITORING
```

The company configures the system once. The rest of the UI is rendered from that configuration.
