// ──────────────────────────────────────────────────
// HPEE B2B Customization Frontend — Domain Types
// All sensor measurements are configuration-driven.
// Nothing is hardcoded to PM2.5/SO2/etc.
// ──────────────────────────────────────────────────

// ─── Company & Facility ───

export interface Company {
  id: string;
  name: string;
  logoUrl?: string;
  industry?: string;
}

export interface Facility {
  id: string;
  companyId: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  blueprint?: Blueprint;
  zones: FacilityZone[];
}

export interface Blueprint {
  id: string;
  facilityId: string;
  name: string;
  imageUrl: string;
  width: number;
  height: number;
  originalFileName?: string;
}

export interface FacilityZone {
  id: string;
  facilityId: string;
  name: string;
  type?: string;
  description?: string;
  polygon?: Array<{ x: number; y: number }>;
}

// ─── Dynamic Sensors & Measurements ───

export interface SensorType {
  id: string;
  name: string;
  category: string;
  description?: string;
  measurements: MeasurementDefinition[];
}

export interface MeasurementDefinition {
  id: string;
  key: string;
  name: string;
  unit: string;
  dataType: "number" | "boolean" | "text";
  min?: number;
  max?: number;
  decimalPlaces?: number;
}

export interface FacilitySensor {
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
  status: SensorStatus;
  description?: string;
  lastUpdate?: string;
  displaySettings?: SensorDisplaySettings;
}

export type SensorStatus = "online" | "offline" | "warning" | "critical" | "unknown";

export interface ConfiguredMeasurement {
  measurementKey: string;
  enabled: boolean;
  displayName?: string;
  unit: string;
}

export interface ThresholdRule {
  id: string;
  measurementKey: string;
  level: "normal" | "warning" | "critical";
  operator: ">" | ">=" | "<" | "<=" | "=";
  value: number;
}

export interface SensorDisplaySettings {
  showOnDashboard: boolean;
  showOnPlantDisplay: boolean;
  useInAlerts: boolean;
}

// ─── Dashboard Configuration ───

export interface DashboardConfig {
  facilityId: string;
  widgets: DashboardWidget[];
}

export interface DashboardWidget {
  id: string;
  type: "metric" | "sensor" | "status" | "alert" | "blueprint" | "trend";
  title?: string;
  sensorId?: string;
  measurementKey?: string;
  size: WidgetSize;
  visible: boolean;
  order: number;
}

export type WidgetSize = "small" | "medium" | "large" | "full";

// ─── Plant Display Configuration ───

export interface DisplayConfig {
  facilityId: string;
  layout: DisplayLayout;
  widgets: DisplayWidget[];
  showAlerts: boolean;
  showSourceAttribution: boolean;
  showConfidence: boolean;
  autoRotate?: boolean;
}

export type DisplayLayout = "2x2" | "3x2" | "4x2";

export interface DisplayWidget {
  id: string;
  title: string;
  measurementKey: string;
  sensorId?: string;
  unit?: string;
  visible: boolean;
}

// ─── Mock Telemetry (for live simulation) ───

export interface MockSensorReading {
  sensorId: string;
  measurementKey: string;
  value: number;
  unit: string;
  timestamp: string;
  quality: "valid" | "estimated" | "suspect" | "invalid";
}

export interface AlertEvent {
  id: string;
  facilityId: string;
  sensorId: string;
  measurementKey: string;
  level: "warning" | "critical";
  value: number;
  threshold: number;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

// ─── Service Interfaces ───

export interface CompanyService {
  getCompany(id: string): Promise<Company>;
  updateCompany(data: Partial<Company> & { id: string }): Promise<Company>;
}

export interface FacilityService {
  getFacility(id: string): Promise<Facility>;
  updateFacility(data: Partial<Facility> & { id: string }): Promise<Facility>;
  createFacility(data: Omit<Facility, "id">): Promise<Facility>;
}

export interface BlueprintService {
  getBlueprint(facilityId: string): Promise<Blueprint | null>;
  uploadBlueprint(facilityId: string, file: File): Promise<Blueprint>;
  updateBlueprint(data: Partial<Blueprint> & { id: string }): Promise<Blueprint>;
  deleteBlueprint(id: string): Promise<void>;
}

export interface ZoneService {
  listZones(facilityId: string): Promise<FacilityZone[]>;
  createZone(data: Omit<FacilityZone, "id">): Promise<FacilityZone>;
  updateZone(data: Partial<FacilityZone> & { id: string }): Promise<FacilityZone>;
  deleteZone(id: string): Promise<void>;
}

export interface SensorTypeService {
  listSensorTypes(): Promise<SensorType[]>;
  createSensorType(data: Omit<SensorType, "id">): Promise<SensorType>;
  updateSensorType(data: Partial<SensorType> & { id: string }): Promise<SensorType>;
  deleteSensorType(id: string): Promise<void>;
}

export interface SensorService {
  listSensors(facilityId: string): Promise<FacilitySensor[]>;
  getSensor(id: string): Promise<FacilitySensor>;
  createSensor(data: Omit<FacilitySensor, "id">): Promise<FacilitySensor>;
  updateSensor(data: Partial<FacilitySensor> & { id: string }): Promise<FacilitySensor>;
  deleteSensor(id: string): Promise<void>;
}

export interface DashboardConfigService {
  getConfig(facilityId: string): Promise<DashboardConfig>;
  updateConfig(data: DashboardConfig): Promise<DashboardConfig>;
}

export interface DisplayConfigService {
  getConfig(facilityId: string): Promise<DisplayConfig>;
  updateConfig(data: DisplayConfig): Promise<DisplayConfig>;
}

// ─── Wizard State ───

export interface WizardState {
  currentStep: number;
  completedSteps: number[];
  company: Partial<Company>;
  facility: Partial<Facility>;
  blueprint: Blueprint | null;
  zones: FacilityZone[];
  sensors: FacilitySensor[];
  sensorTypes: SensorType[];
  dashboardConfig: DashboardConfig | null;
  displayConfig: DisplayConfig | null;
}

export const WIZARD_STEPS = [
  "Company",
  "Facility",
  "Blueprint",
  "Zones",
  "Sensors",
  "Rules",
  "Dashboard",
  "Display",
  "Review",
] as const;

export type WizardStepName = (typeof WIZARD_STEPS)[number];

// ─── Utility types ───

export function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : 
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}
