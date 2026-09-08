import React, { useState, useEffect } from 'react';
import { SetupProgress } from './SetupProgress';
import { SetupNavigation } from './SetupNavigation';
import { SetupStep } from './SetupStep';
import { SetupReview } from './SetupReview';
import type { Company, Facility, Blueprint, FacilityZone, FacilitySensor, DashboardConfig, DisplayConfig, SensorType } from '@/types';
import { generateId } from '@/types';
import { BlueprintUploader } from '../blueprint/BlueprintUploader';
import type {
  Company,
  Facility,
  Blueprint,
  FacilityZone,
  FacilitySensor,
  DashboardConfig,
  DisplayConfig,
  SensorType,
  ThresholdRule,
  ConfiguredMeasurement,
  DisplayLayout
} from '@/types';
import { generateId, WIZARD_STEPS } from '@/types';
import { mockSensorTypes } from '@/lib/mock/sensorTypes';
import { mockZones } from '@/lib/mock/zones';
import { Plus, Trash2, Cpu, Sliders, Layout, Monitor } from 'lucide-react';

const STEPS = [
  'Company', 'Facility', 'Blueprint', 'Zones', 'Sensors', 'Rules', 'Dashboard', 'Display', 'Review'
];
const STEPS = [...WIZARD_STEPS];

export function SetupWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  

  // State
  const [company, setCompany] = useState<Partial<Company>>({ name: '', industry: 'Manufacturing' });
  const [facility, setFacility] = useState<Partial<Facility>>({ name: '', address: '' });
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [zones, setZones] = useState<FacilityZone[]>([]);
  const [sensors, setSensors] = useState<FacilitySensor[]>([]);
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig | null>(null);
  const [displayConfig, setDisplayConfig] = useState<DisplayConfig | null>(null);
  const [company, setCompany] = useState<Partial<Company>>({
    id: 'company-1',
    name: 'ABC Industries',
    industry: 'Chemical'
  });
  const [facility, setFacility] = useState<Partial<Facility>>({
    id: 'facility-demo',
    companyId: 'company-1',
    name: 'Ankleshwar Plant',
    address: 'Plot 401, GIDC Industrial Estate, Ankleshwar, Gujarat 393002'
  });
  const [blueprint, setBlueprint] = useState<Blueprint | null>({
    id: 'bp-demo',
    facilityId: 'facility-demo',
    name: 'Ankleshwar Plant Floorplan',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
    width: 1200,
    height: 800
  });
  const [zones, setZones] = useState<FacilityZone[]>(mockZones);
  const [sensorTypes] = useState<SensorType[]>(mockSensorTypes);
  const [sensors, setSensors] = useState<FacilitySensor[]>([
    {
      id: 'sensor-1',
      facilityId: 'facility-demo',
      sensorCode: 'S-001',
      name: 'Stack Monitor 1',
      sensorTypeId: mockSensorTypes[0].id,
      zoneId: mockZones[0]?.id,
      position: { x: 0.35, y: 0.4 },
      measurements: mockSensorTypes[0].measurements.map((m) => ({
        measurementKey: m.key,
        enabled: true,
        displayName: m.name,
        unit: m.unit
      })),
      thresholds: [
        { id: 't-1', measurementKey: 'pm25', level: 'warning', operator: '>', value: 60 },
        { id: 't-2', measurementKey: 'pm25', level: 'critical', operator: '>', value: 120 },
        { id: 't-3', measurementKey: 'so2', level: 'warning', operator: '>', value: 40 },
        { id: 't-4', measurementKey: 'so2', level: 'critical', operator: '>', value: 80 }
      ],
      status: 'online'
    }
  ]);

  const [sensorTypes] = useState<SensorType[]>([]);
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig | null>({
    facilityId: 'facility-demo',
    widgets: [
      { id: 'w-1', type: 'metric', title: 'PM2.5 Realtime', sensorId: 'sensor-1', measurementKey: 'pm25', size: 'medium', visible: true, order: 1 },
      { id: 'w-2', type: 'metric', title: 'SO2 Realtime', sensorId: 'sensor-1', measurementKey: 'so2', size: 'medium', visible: true, order: 2 },
      { id: 'w-3', type: 'status', title: 'Facility Health', size: 'small', visible: true, order: 3 },
      { id: 'w-4', type: 'alert', title: 'Critical Exceedance Alerts', size: 'large', visible: true, order: 4 }
    ]
  });

  const [displayConfig, setDisplayConfig] = useState<DisplayConfig | null>({
    facilityId: 'facility-demo',
    layout: '3x2',
    widgets: [
      { id: 'dw-1', title: 'PM2.5', measurementKey: 'pm25', sensorId: 'sensor-1', unit: 'ug/m³', visible: true },
      { id: 'dw-2', title: 'SO2', measurementKey: 'so2', sensorId: 'sensor-1', unit: 'ug/m³', visible: true },
      { id: 'dw-3', title: 'Temperature', measurementKey: 'temperature', sensorId: 'sensor-1', unit: '°C', visible: true },
      { id: 'dw-4', title: 'Humidity', measurementKey: 'humidity', sensorId: 'sensor-1', unit: '%', visible: true }
    ],
    showAlerts: true,
    showSourceAttribution: true,
    showConfidence: true,
    autoRotate: true
  });

  // Load from session storage
  useEffect(() => {
    const saved = sessionStorage.getItem('setup_wizard');
    if (saved) {
      try {
    try {
      const saved = sessionStorage.getItem('hpee_setup_wizard_state');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.currentStep !== undefined) setCurrentStep(data.currentStep);
        if (data.completedSteps) setCompletedSteps(data.completedSteps);
        if (data.company) setCompany(data.company);
        if (data.facility) setFacility(data.facility);
        if (data.blueprint) setBlueprint(data.blueprint);
        if (data.zones) setZones(data.zones);
        if (data.sensors) setSensors(data.sensors);
        if (data.dashboardConfig) setDashboardConfig(data.dashboardConfig);
        if (data.displayConfig) setDisplayConfig(data.displayConfig);
      } catch (e) {}
      }
    } catch (e) {
      console.error('Failed to load session storage for wizard', e);
    }
  }, []);

  // Save to session storage
  useEffect(() => {
    sessionStorage.setItem('setup_wizard', JSON.stringify({
      currentStep, completedSteps, company, facility, blueprint, zones, sensors, dashboardConfig, displayConfig
    }));
    try {
      sessionStorage.setItem(
        'hpee_setup_wizard_state',
        JSON.stringify({
          currentStep,
          completedSteps,
          company,
          facility,
          blueprint,
          zones,
          sensors,
          dashboardConfig,
          displayConfig
        })
      );
    } catch (e) {
      console.error('Failed to save session storage for wizard', e);
    }
  }, [currentStep, completedSteps, company, facility, blueprint, zones, sensors, dashboardConfig, displayConfig]);

  const canProceed = () => {
    if (currentStep === 0) return company.name ? company.name.length > 0 : false;
    if (currentStep === 1) return facility.name ? facility.name.length > 0 : false;
    if (currentStep === 0) return Boolean(company.name && company.name.trim().length > 0);
    if (currentStep === 1) return Boolean(facility.name && facility.name.trim().length > 0);
    if (currentStep === 4) return sensors.length > 0;
    return true;
  };

  const handleNext = () => {
    if (canProceed()) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      setCurrentStep(Math.min(currentStep + 1, STEPS.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep(Math.max(currentStep - 1, 0));
  };

  const handleStepClick = (step: number) => {
    if (completedSteps.includes(step) || step === currentStep) {
      setCurrentStep(step);
    }
  };

  const handleComplete = () => {
    window.location.href = '/facility/demo/sensors';
    // Save to localStorage demo data
    try {
      localStorage.setItem('hpee-companies', JSON.stringify([company]));
      localStorage.setItem('hpee-facilities', JSON.stringify([facility]));
      if (blueprint) localStorage.setItem('hpee-blueprints', JSON.stringify([blueprint]));
      localStorage.setItem('hpee-zones', JSON.stringify(zones));
      localStorage.setItem('hpee-sensors', JSON.stringify(sensors));
      if (dashboardConfig) localStorage.setItem('hpee-dashboard-config', JSON.stringify(dashboardConfig));
      if (displayConfig) localStorage.setItem('hpee-display-config', JSON.stringify(displayConfig));
    } catch (e) {
      console.warn('Unable to persist setup wizard into localStorage', e);
    }
    window.location.href = '/facility/demo/configuration';
  };

  const addZone = () => {
    const newZone: FacilityZone = {
      id: generateId(),
      facilityId: facility.id || 'facility-demo',
      name: `Zone ${zones.length + 1}`,
      type: 'Production',
      polygon: [
        { x: 0.1, y: 0.1 },
        { x: 0.4, y: 0.1 },
        { x: 0.4, y: 0.4 },
        { x: 0.1, y: 0.4 }
      ]
    };
    setZones([...zones, newZone]);
  };

  const addSensor = () => {
    const selectedType = sensorTypes[0] || mockSensorTypes[0];
    const newSensor: FacilitySensor = {
      id: generateId(),
      facilityId: facility.id || 'facility-demo',
      sensorCode: `S-00${sensors.length + 1}`,
      name: `Sensor Node ${sensors.length + 1}`,
      sensorTypeId: selectedType.id,
      zoneId: zones[0]?.id,
      position: { x: 0.5, y: 0.5 },
      measurements: selectedType.measurements.map((m) => ({
        measurementKey: m.key,
        enabled: true,
        displayName: m.name,
        unit: m.unit
      })),
      thresholds: [],
      status: 'online'
    };
    setSensors([...sensors, newSensor]);
  };

  const updateSensorType = (sensorIndex: number, typeId: string) => {
    const selectedType = sensorTypes.find((t) => t.id === typeId);
    if (!selectedType) return;
    const updated = [...sensors];
    updated[sensorIndex] = {
      ...updated[sensorIndex],
      sensorTypeId: typeId,
      measurements: selectedType.measurements.map((m) => ({
        measurementKey: m.key,
        enabled: true,
        displayName: m.name,
        unit: m.unit
      }))
    };
    setSensors(updated);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <SetupProgress 
        steps={STEPS} 
        currentStep={currentStep} 
        completedSteps={completedSteps} 
        onStepClick={handleStepClick} 
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Facility Onboarding & Configuration Wizard</h1>
        <p className="text-sm text-slate-500 mt-1">Configure your industrial plant without any hardcoded pollution assumptions.</p>
      </div>

      <SetupProgress
        steps={STEPS}
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
      />
      
      <div className="min-h-[400px] mt-6">

      <div className="min-h-[460px] mt-8">
        {/* Step 0: Company */}
        {currentStep === 0 && (
          <SetupStep title="Company Details" description="Tell us about your organization" isValid={canProceed()}>
            <div className="space-y-4 max-w-md">
          <SetupStep title="Company Details" description="Establish the organization profile and industry taxonomy" isValid={canProceed()}>
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company Name *</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                <label className="block text-sm font-medium text-slate-700 mb-1">Company / Enterprise Name *</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                  value={company.name || ''}
                  onChange={(e) => setCompany({...company, name: e.target.value})}
                  placeholder="e.g. Acme Corp"
                  onChange={(e) => setCompany({ ...company, name: e.target.value })}
                  placeholder="e.g. ABC Industries Ltd"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Industry</label>
                <select 
                  className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={company.industry || 'Manufacturing'}
                  onChange={(e) => setCompany({...company, industry: e.target.value})}
                <label className="block text-sm font-medium text-slate-700 mb-1">Industry Sector</label>
                <select
                  className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                  value={company.industry || 'Chemical'}
                  onChange={(e) => setCompany({ ...company, industry: e.target.value })}
                >
                  {['Manufacturing', 'Chemical', 'Pharmaceutical', 'Textile', 'Power', 'Mining', 'Other'].map(ind => (
                  {['Chemical', 'Dyes & Intermediates', 'Pharmaceutical', 'Agrochemicals', 'Manufacturing', 'Petrochemical', 'Textile', 'Power', 'Waste Treatment', 'Other'].map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company Logo URL (Optional)</label>
                <input
                  type="url"
                  className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                  value={company.logoUrl || ''}
                  onChange={(e) => setCompany({ ...company, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>
          </SetupStep>
        )}

        {/* Step 1: Facility */}
        {currentStep === 1 && (
          <SetupStep title="Facility Details" description="Information about the primary facility" isValid={canProceed()}>
            <div className="space-y-4 max-w-md">
          <SetupStep title="Facility Location & Profile" description="Define the manufacturing site or plant boundary" isValid={canProceed()}>
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Facility Name *</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                <label className="block text-sm font-medium text-slate-700 mb-1">Facility / Plant Name *</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                  value={facility.name || ''}
                  onChange={(e) => setFacility({...facility, name: e.target.value})}
                  placeholder="e.g. North Plant"
                  onChange={(e) => setFacility({ ...facility, name: e.target.value })}
                  placeholder="e.g. Ankleshwar Chemical Unit 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <textarea 
                  className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                <label className="block text-sm font-medium text-slate-700 mb-1">Physical Address</label>
                <textarea
                  className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                  value={facility.address || ''}
                  onChange={(e) => setFacility({...facility, address: e.target.value})}
                  placeholder="Full facility address"
                  onChange={(e) => setFacility({ ...facility, address: e.target.value })}
                  placeholder="Plot number, industrial estate, city, postal code"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-mono"
                    value={facility.latitude || 21.626}
                    onChange={(e) => setFacility({ ...facility, latitude: parseFloat(e.target.value) || undefined })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-mono"
                    value={facility.longitude || 72.9925}
                    onChange={(e) => setFacility({ ...facility, longitude: parseFloat(e.target.value) || undefined })}
                  />
                </div>
              </div>
            </div>
          </SetupStep>
        )}

        {/* Step 2: Blueprint */}
        {currentStep === 2 && (
          <SetupStep title="Blueprint Upload" description="Upload the floor plan or map for your facility" isValid={canProceed()}>
            <div className="p-8 border-2 border-dashed border-slate-300 rounded-lg text-center">
              <p className="text-slate-500 mb-4">Blueprint uploading functionality will go here.</p>
              <button 
                className="px-4 py-2 bg-blue-50 text-blue-600 rounded font-medium hover:bg-blue-100"
                onClick={() => setBlueprint({ id: generateId(), name: 'Floor Plan A', imageUrl: '/placeholder.jpg', width: 800, height: 600, scale: 1, facilityId: 'demo' })}
              >
                {blueprint ? 'Uploaded (Click to replace)' : 'Mock Upload'}
              </button>
          <SetupStep title="Blueprint & Cadastral Overlay" description="Upload your plant layout diagram, drone orthomosaic, or architectural map" isValid={canProceed()}>
            <div className="space-y-4">
              <BlueprintUploader
                onUpload={(file, dataUrl) => {
                  setBlueprint({
                    id: generateId(),
                    facilityId: facility.id || 'facility-demo',
                    name: file.name || 'Uploaded Blueprint',
                    imageUrl: dataUrl,
                    width: 1200,
                    height: 800,
                    originalFileName: file.name
                  });
                }}
                currentImageUrl={blueprint?.imageUrl}
              />
              {blueprint && (
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded text-sm">
                  <span className="font-medium text-slate-700">{blueprint.name}</span>
                  <span className="text-xs text-slate-500">{blueprint.width} × {blueprint.height} px</span>
                </div>
              )}
            </div>
          </SetupStep>
        )}

        {/* Step 3: Zones */}
        {currentStep === 3 && (
          <SetupStep title="Define Zones" description="Create specific areas within your facility" isValid={canProceed()}>
          <SetupStep title="Facility Zoning & Boundaries" description="Define internal production sectors, emission stacks, storage, and fence lines" isValid={canProceed()}>
            <div className="space-y-4">
              <button 
                onClick={() => setZones([...zones, { id: generateId(), name: \`Zone \${zones.length + 1}\`, facilityId: 'demo' }])}
                className="px-4 py-2 bg-blue-50 text-blue-600 rounded font-medium hover:bg-blue-100"
              >
                + Add Zone
              </button>
              <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">{zones.length} Configured Zones</span>
                <button
                  type="button"
                  onClick={addZone}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition"
                >
                  <Plus className="w-4 h-4" /> Add Zone
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {zones.map((zone, idx) => (
                  <div key={zone.id} className="p-3 border border-slate-200 rounded flex justify-between items-center">
                    <input 
                      className="p-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={zone.name}
                      onChange={(e) => {
                        const newZones = [...zones];
                        newZones[idx].name = e.target.value;
                        setZones(newZones);
                      }}
                    />
                    <button 
                      onClick={() => setZones(zones.filter(z => z.id !== zone.id))}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  <div key={zone.id} className="p-3 border border-slate-200 rounded-md bg-slate-50 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <input
                        className="p-1.5 border border-slate-300 rounded text-sm font-semibold w-2/3 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={zone.name}
                        placeholder="Zone Name"
                        onChange={(e) => {
                          const updated = [...zones];
                          updated[idx].name = e.target.value;
                          setZones(updated);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setZones(zones.filter((z) => z.id !== zone.id))}
                        className="text-red-500 hover:text-red-700 p-1 rounded"
                        title="Delete Zone"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-slate-500">Zone Type</label>
                        <select
                          className="w-full mt-1 p-1 border border-slate-300 rounded bg-white"
                          value={zone.type || 'Production'}
                          onChange={(e) => {
                            const updated = [...zones];
                            updated[idx].type = e.target.value;
                            setZones(updated);
                          }}
                        >
                          <option value="Production">Production</option>
                          <option value="Boiler Area">Boiler Area</option>
                          <option value="Storage Area">Storage Area</option>
                          <option value="Waste Treatment">Waste Treatment</option>
                          <option value="Boundary">Boundary Fence</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-slate-500">Description</label>
                        <input
                          className="w-full mt-1 p-1 border border-slate-300 rounded bg-white"
                          placeholder="Optional notes"
                          value={zone.description || ''}
                          onChange={(e) => {
                            const updated = [...zones];
                            updated[idx].description = e.target.value;
                            setZones(updated);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SetupStep>
        )}

        {/* Step 4: Sensors */}
        {currentStep === 4 && (
          <SetupStep title="Configure Sensors" description="Add sensors to your facility" isValid={canProceed()}>
          <SetupStep title="Sensor Ingestion Configuration" description="Add physical sensor hardware nodes and associate dynamic measurements" isValid={canProceed()}>
            <div className="space-y-4">
              <button 
                onClick={() => setSensors([...sensors, { 
                  id: generateId(), 
                  facilityId: 'demo', 
                  typeId: 'type1', 
                  name: \`Sensor \${sensors.length + 1}\`, 
                  code: \`S\${sensors.length + 1}\`,
                  measurements: [],
                  position: null,
                  status: 'online',
                  lastReading: new Date().toISOString()
                }])}
                className="px-4 py-2 bg-blue-50 text-blue-600 rounded font-medium hover:bg-blue-100"
              >
                + Add Sensor
              </button>
              <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">{sensors.length} Configured Sensor Nodes</span>
                <button
                  type="button"
                  onClick={addSensor}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition"
                >
                  <Plus className="w-4 h-4" /> Add Sensor
                </button>
              </div>

              <div className="space-y-3">
                {sensors.map((sensor, idx) => (
                  <div key={sensor.id} className="p-3 border border-slate-200 rounded flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2 w-full max-w-sm">
                        <input 
                          className="p-1 border border-slate-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={sensor.name}
                          placeholder="Sensor Name"
                          onChange={(e) => {
                            const newSensors = [...sensors];
                            newSensors[idx].name = e.target.value;
                            setSensors(newSensors);
                          }}
                        />
                        <input 
                          className="p-1 border border-slate-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={sensor.code}
                          placeholder="Sensor Code"
                          onChange={(e) => {
                            const newSensors = [...sensors];
                            newSensors[idx].code = e.target.value;
                            setSensors(newSensors);
                          }}
                        />
                  <div key={sensor.id} className="p-4 border border-slate-200 rounded-md bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="grid grid-cols-3 gap-3 flex-1">
                        <div>
                          <label className="text-xs font-medium text-slate-600">Sensor Code</label>
                          <input
                            className="w-full mt-1 p-1.5 border border-slate-300 rounded font-mono text-sm bg-white"
                            value={sensor.sensorCode}
                            placeholder="S-001"
                            onChange={(e) => {
                              const updated = [...sensors];
                              updated[idx].sensorCode = e.target.value;
                              setSensors(updated);
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600">Friendly Name</label>
                          <input
                            className="w-full mt-1 p-1.5 border border-slate-300 rounded text-sm bg-white"
                            value={sensor.name}
                            placeholder="Boiler Stack Probe"
                            onChange={(e) => {
                              const updated = [...sensors];
                              updated[idx].name = e.target.value;
                              setSensors(updated);
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600">Hardware / Module Type</label>
                          <select
                            className="w-full mt-1 p-1.5 border border-slate-300 rounded text-sm bg-white"
                            value={sensor.sensorTypeId}
                            onChange={(e) => updateSensorType(idx, e.target.value)}
                          >
                            {sensorTypes.map((st) => (
                              <option key={st.id} value={st.id}>{st.name} ({st.category})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSensors(sensors.filter(s => s.id !== sensor.id))}
                        className="text-red-500 hover:text-red-700 text-sm ml-4"
                      <button
                        type="button"
                        onClick={() => setSensors(sensors.filter((s) => s.id !== sensor.id))}
                        className="text-red-500 hover:text-red-700 p-2 mt-4"
                        title="Remove Sensor"
                      >
                        Remove
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200 text-xs text-slate-600">
                      <span className="font-medium">Assigned Zone:</span>
                      <select
                        className="p-1 border border-slate-300 rounded bg-white text-xs"
                        value={sensor.zoneId || ''}
                        onChange={(e) => {
                          const updated = [...sensors];
                          updated[idx].zoneId = e.target.value;
                          setSensors(updated);
                        }}
                      >
                        <option value="">-- No Zone --</option>
                        {zones.map((z) => (
                          <option key={z.id} value={z.id}>{z.name}</option>
                        ))}
                      </select>

                      <span className="ml-4 font-medium">Active Channels:</span>
                      <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {sensor.measurements.filter((m) => m.enabled).map((m) => m.displayName || m.measurementKey).join(', ')}
                      </span>
                    </div>
                  </div>
                ))}
                {sensors.length === 0 && <p className="text-sm text-slate-500 italic">No sensors added yet. At least one is required.</p>}
              </div>
            </div>
          </SetupStep>
        )}

        {/* Step 5: Rules & Thresholds */}
        {currentStep === 5 && (
          <SetupStep title="Alert Rules" description="Set thresholds for your sensors" isValid={canProceed()}>
            <p className="text-slate-500">Threshold Editor placeholder. Select rules for the configured sensors.</p>
          <SetupStep title="Alert Rules & Thresholds" description="Establish normal, warning, and critical concentration safety limits" isValid={canProceed()}>
            <div className="space-y-6">
              {sensors.map((sensor, sensorIdx) => (
                <div key={sensor.id} className="p-4 border border-slate-200 rounded-md bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-800">
                      {sensor.name} <span className="font-mono text-xs text-slate-500">({sensor.sensorCode})</span>
                    </span>
                    <span className="text-xs text-slate-500">{sensor.thresholds.length} active thresholds</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-600 uppercase border-b border-slate-200">
                        <tr>
                          <th className="p-2">Measurement</th>
                          <th className="p-2">Unit</th>
                          <th className="p-2">Warning Level (&gt;)</th>
                          <th className="p-2">Critical Level (&gt;)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {sensor.measurements.filter((m) => m.enabled).map((m) => {
                          const warningRule = sensor.thresholds.find((t) => t.measurementKey === m.measurementKey && t.level === 'warning');
                          const criticalRule = sensor.thresholds.find((t) => t.measurementKey === m.measurementKey && t.level === 'critical');

                          return (
                            <tr key={m.measurementKey}>
                              <td className="p-2 font-medium text-slate-800">{m.displayName || m.measurementKey}</td>
                              <td className="p-2 text-slate-500">{m.unit}</td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  placeholder="e.g. 50"
                                  className="w-24 p-1 border border-slate-300 rounded font-mono"
                                  value={warningRule?.value ?? ''}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    const updated = [...sensors];
                                    const filtered = sensor.thresholds.filter(
                                      (t) => !(t.measurementKey === m.measurementKey && t.level === 'warning')
                                    );
                                    if (!isNaN(val)) {
                                      filtered.push({
                                        id: generateId(),
                                        measurementKey: m.measurementKey,
                                        level: 'warning',
                                        operator: '>',
                                        value: val
                                      });
                                    }
                                    updated[sensorIdx].thresholds = filtered;
                                    setSensors(updated);
                                  }}
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  placeholder="e.g. 100"
                                  className="w-24 p-1 border border-slate-300 rounded font-mono"
                                  value={criticalRule?.value ?? ''}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    const updated = [...sensors];
                                    const filtered = sensor.thresholds.filter(
                                      (t) => !(t.measurementKey === m.measurementKey && t.level === 'critical')
                                    );
                                    if (!isNaN(val)) {
                                      filtered.push({
                                        id: generateId(),
                                        measurementKey: m.measurementKey,
                                        level: 'critical',
                                        operator: '>',
                                        value: val
                                      });
                                    }
                                    updated[sensorIdx].thresholds = filtered;
                                    setSensors(updated);
                                  }}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </SetupStep>
        )}

        {/* Step 6: Dashboard */}
        {currentStep === 6 && (
          <SetupStep title="Dashboard Config" description="Choose what appears on the dashboard" isValid={canProceed()}>
             <p className="text-slate-500">Dashboard configuration placeholder.</p>
          <SetupStep title="Operator Dashboard Layout" description="Select and prioritize widgets for live operational intelligence" isValid={canProceed()}>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-md">
                <span className="text-sm font-semibold text-slate-800 mb-2 block">Visible Dashboard Modules</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  {['PM2.5 Telemetry', 'SO2 Telemetry', 'Plant Health Summary', 'Critical Alerts', 'Blueprint Radar', 'Attribution Matrix'].map((mod, i) => (
                    <label key={mod} className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600" />
                      <span className="font-medium text-slate-700">{mod}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </SetupStep>
        )}

        {/* Step 7: Plant Display */}
        {currentStep === 7 && (
          <SetupStep title="Plant Display" description="Configure the public plant display" isValid={canProceed()}>
          <SetupStep title="Plant Big Display Configuration" description="Configure high-contrast large-screen display for the factory floor or control room" isValid={canProceed()}>
            <div className="space-y-4">
              <label className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  checked={!!displayConfig}
                  onChange={(e) => setDisplayConfig(e.target.checked ? { id: generateId(), facilityId: 'demo', layout: '2x2', showAlerts: true, widgets: [], theme: 'dark' } : null)}
                  className="rounded border-slate-300"
                />
                <span className="text-sm font-medium text-slate-700">Enable Plant Display</span>
              </label>
              {displayConfig && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded space-y-4">
                   <p className="text-sm text-slate-600">Layout Selection:</p>
                   <div className="flex gap-4">
                     {['2x2', '3x2', '4x2'].map(layout => (
                       <label key={layout} className="flex items-center space-x-1">
                         <input 
                           type="radio" 
                           name="layout" 
                           value={layout}
                           checked={displayConfig.layout === layout}
                           onChange={(e) => setDisplayConfig({...displayConfig, layout: e.target.value as any})}
                         />
                         <span className="text-sm">{layout}</span>
                       </label>
                     ))}
                   </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-3">
                <label className="text-sm font-semibold text-slate-800 block">Display Grid Layout</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['2x2', '3x2', '4x2'] as DisplayLayout[]).map((layout) => (
                    <button
                      key={layout}
                      type="button"
                      onClick={() => displayConfig && setDisplayConfig({ ...displayConfig, layout })}
                      className={`p-3 border rounded-lg text-center transition font-semibold text-sm ${
                        displayConfig?.layout === layout
                          ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Layout className="w-5 h-5 mx-auto mb-1 text-slate-500" />
                      {layout} Matrix
                    </button>
                  ))}
                </div>
              )}

                <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={displayConfig?.showAlerts ?? true}
                      onChange={(e) => displayConfig && setDisplayConfig({ ...displayConfig, showAlerts: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <span className="font-medium text-slate-700">Display Live Pollution Alerts</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={displayConfig?.showSourceAttribution ?? true}
                      onChange={(e) => displayConfig && setDisplayConfig({ ...displayConfig, showSourceAttribution: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <span className="font-medium text-slate-700">Show Attributed Sources</span>
                  </label>
                </div>
              </div>
            </div>
          </SetupStep>
        )}

        {/* Step 8: Review */}
        {currentStep === 8 && (
          <SetupStep title="Review Setup" description="Confirm your facility configuration" isValid={canProceed()}>
            <SetupReview 
          <SetupStep title="Configuration Review & Activation" description="Review all facility telemetry parameters before activation" isValid={canProceed()}>
            <SetupReview
              company={company}
              facility={facility}
              blueprint={blueprint}
              zones={zones}
              sensors={sensors}
              dashboardConfig={dashboardConfig}
              displayConfig={displayConfig}
            />
          </SetupStep>
        )}
      </div>

      <SetupNavigation 
      <SetupNavigation
        currentStep={currentStep}
        totalSteps={STEPS.length}
        onBack={handleBack}
        onNext={handleNext}
        onComplete={handleComplete}
        canProceed={canProceed()}
        isLastStep={currentStep === STEPS.length - 1}
      />
    </div>
  );
}
