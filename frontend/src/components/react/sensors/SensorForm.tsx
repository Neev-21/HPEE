import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { type FacilitySensor, type SensorType, type FacilityZone, type ConfiguredMeasurement, type ThresholdRule, generateId } from '@/types';
import { SensorMeasurementSelector } from './SensorMeasurementSelector';
import { ThresholdEditor } from './ThresholdEditor';
import { cn } from '@/lib/utils';

interface Props {
  sensor?: FacilitySensor;
  sensorTypes: SensorType[];
  zones: FacilityZone[];
  onSave: (sensor: FacilitySensor) => void;
  onCancel: () => void;
}

const STEPS = ['Identity', 'Measurements', 'Location', 'Thresholds', 'Display Settings', 'Review'];

export const SensorForm: React.FC<Props> = ({ sensor, sensorTypes, zones, onSave, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const [name, setName] = useState(sensor?.name || '');
  const [sensorCode, setSensorCode] = useState(sensor?.sensorCode || '');
  const [sensorTypeId, setSensorTypeId] = useState(sensor?.sensorTypeId || sensorTypes[0]?.id || '');
  const [description, setDescription] = useState(sensor?.description || '');
  const [zoneId, setZoneId] = useState(sensor?.zoneId || '');
  const [measurements, setMeasurements] = useState<ConfiguredMeasurement[]>(sensor?.measurements || []);
  const [thresholds, setThresholds] = useState<ThresholdRule[]>(sensor?.thresholds || []);
  const [displaySettings, setDisplaySettings] = useState(
    sensor?.displaySettings || { showOnDashboard: true, showOnPlantDisplay: true, useInAlerts: true }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedType = useMemo(() => sensorTypes.find((t) => t.id === sensorTypeId), [sensorTypeId, sensorTypes]);
  const selectedZone = useMemo(() => zones.find((z) => z.id === zoneId), [zoneId, zones]);

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    if (step === 0) {
      if (!name.trim()) newErrors.name = 'Name is required';
      if (!sensorCode.trim()) newErrors.sensorCode = 'Sensor Code is required';
    } else if (step === 1) {
      if (measurements.filter((m) => m.enabled).length === 0) {
        newErrors.measurements = 'At least one measurement must be enabled';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === STEPS.length - 1) {
        onSave({
          id: sensor?.id || generateId(),
          facilityId: sensor?.facilityId || '',
          name,
          sensorCode,
          sensorTypeId,
          description,
          zoneId: zoneId || undefined,
          position: sensor?.position || { x: 0, y: 0 },
          measurements,
          thresholds,
          status: sensor?.status || 'unknown',
          displaySettings,
        });
      } else {
        setCurrentStep((s) => s + 1);
      }
    }
  };

  const handleBack = () => setCurrentStep((s) => Math.max(0, s - 1));

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Sensor Code <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={sensorCode}
                  onChange={(e) => setSensorCode(e.target.value)}
                  className="block w-full font-mono rounded border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                />
                {errors.sensorCode && <p className="mt-1 text-xs text-red-500">{errors.sensorCode}</p>}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Sensor Type</label>
              <select
                value={sensorTypeId}
                onChange={(e) => {
                  setSensorTypeId(e.target.value);
                  setMeasurements([]);
                  setThresholds([]);
                }}
                className="block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {sensorTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="block w-full rounded border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-900">Select Measurements</h3>
            <SensorMeasurementSelector
              availableMeasurements={selectedType?.measurements || []}
              selectedMeasurements={measurements}
              onChange={setMeasurements}
            />
            {errors.measurements && <p className="text-xs text-red-500">{errors.measurements}</p>}
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Zone</label>
              <select
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                className="block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <option value="">-- No Zone --</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>
            <div className="rounded border border-slate-200 bg-slate-50 p-6 text-center">
              <p className="mb-4 text-sm text-slate-600">You can place this sensor on the facility blueprint later.</p>
              <button disabled className="rounded bg-white border border-slate-300 px-4 py-2 text-sm font-medium text-slate-400 cursor-not-allowed">
                Place on Blueprint (Coming Soon)
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-900">Configure Thresholds</h3>
            <ThresholdEditor
              measurements={measurements}
              thresholds={thresholds}
              onChange={setThresholds}
            />
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-900">Display Settings</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={displaySettings.showOnDashboard}
                  onChange={(e) => setDisplaySettings({ ...displaySettings, showOnDashboard: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Show on Dashboard</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={displaySettings.showOnPlantDisplay}
                  onChange={(e) => setDisplaySettings({ ...displaySettings, showOnPlantDisplay: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Show on Plant Display</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={displaySettings.useInAlerts}
                  onChange={(e) => setDisplaySettings({ ...displaySettings, useInAlerts: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Use in Alerting</span>
              </label>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6 text-sm">
            <div>
              <h3 className="font-medium text-slate-900 border-b pb-1 mb-2">Summary</h3>
              <div className="grid grid-cols-2 gap-y-2">
                <div className="text-slate-500">Name:</div><div className="font-medium">{name}</div>
                <div className="text-slate-500">Code:</div><div className="font-mono">{sensorCode}</div>
                <div className="text-slate-500">Type:</div><div>{selectedType?.name}</div>
                <div className="text-slate-500">Zone:</div><div>{selectedZone?.name || 'Unassigned'}</div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-slate-900 border-b pb-1 mb-2">Measurements ({measurements.filter(m => m.enabled).length})</h3>
              <ul className="list-inside list-disc text-slate-700">
                {measurements.filter((m) => m.enabled).map((m) => (
                  <li key={m.measurementKey}>{m.displayName || m.measurementKey} {m.unit ? `(${m.unit})` : ''}</li>
                ))}
              </ul>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      {/* Steps indicator */}
      <div className="mb-6 flex items-center justify-between">
        {STEPS.map((step, idx) => (
          <div key={step} className="flex flex-col items-center flex-1">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium',
                idx < currentStep ? 'bg-blue-600 text-white' : idx === currentStep ? 'border-2 border-blue-600 bg-white text-blue-600' : 'border border-slate-300 bg-slate-50 text-slate-400'
              )}
            >
              {idx < currentStep ? <Check className="h-4 w-4" /> : idx + 1}
            </div>
            <span className={cn('mt-2 text-[10px] uppercase hidden sm:block', idx <= currentStep ? 'text-slate-900 font-medium' : 'text-slate-400')}>
              {step}
            </span>
          </div>
        ))}
      </div>

      <div className="flex-1 py-4">
        {renderStepContent()}
      </div>

      <div className="mt-8 flex justify-between border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={currentStep === 0 ? onCancel : handleBack}
          className="inline-flex items-center gap-2 rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          {currentStep === 0 ? 'Cancel' : (
            <>
              <ChevronLeft className="h-4 w-4" /> Back
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          {currentStep === STEPS.length - 1 ? 'Save Sensor' : (
            <>
              Next <ChevronRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
