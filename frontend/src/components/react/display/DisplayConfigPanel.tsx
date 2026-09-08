import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { type DisplayConfig, type DisplayLayout, type FacilitySensor, type MockSensorReading, type AlertEvent } from '@/types';
import { DisplayPreview } from './DisplayPreview';
import { Layout, Settings, ExternalLink, Monitor } from 'lucide-react';

export interface DisplayConfigPanelProps {
  facilityId: string;
}

export const DisplayConfigPanel: React.FC<DisplayConfigPanelProps> = ({ facilityId }) => {
  const [sensors] = useState<FacilitySensor[]>([
    {
      id: 's1', facilityId, sensorCode: 'AQ-01', name: 'Main Exhaust', sensorTypeId: 't1', status: 'online', position: { x: 0, y: 0 },
      measurements: [{ measurementKey: 'pm25', enabled: true, unit: 'µg/m³', displayName: 'PM2.5' }],
      thresholds: []
    }
  ]);
  
  const [config, setConfig] = useState<DisplayConfig>({
    facilityId,
    layout: '2x2',
    showAlerts: true,
    showSourceAttribution: true,
    showConfidence: true,
    autoRotate: false,
    widgets: [
      { id: 'w1', title: 'Main Exhaust PM2.5', sensorId: 's1', measurementKey: 'pm25', unit: 'µg/m³', visible: true }
    ]
  });

  const [readings, setReadings] = useState<MockSensorReading[]>([]);
  const [alerts] = useState<AlertEvent[]>([
    // Mock alert for preview purposes
    {
      id: 'a1', facilityId, sensorId: 's1', measurementKey: 'pm25', level: 'critical',
      value: 55.4, threshold: 50.0, message: 'PM2.5 exceeded critical limit',
      timestamp: new Date().toISOString(), acknowledged: false
    }
  ]);

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setReadings([{
        sensorId: 's1',
        measurementKey: 'pm25',
        value: 45 + Math.random() * 15, // High enough to trigger alert occasionally in real life
        unit: 'µg/m³',
        timestamp: new Date().toISOString(),
        quality: 'valid'
      }]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const updateConfig = (updates: Partial<DisplayConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const layouts: { id: DisplayLayout; name: string; grid: string }[] = [
    { id: '2x2', name: '2×2 Grid', grid: 'grid-cols-2 grid-rows-2' },
    { id: '3x2', name: '3×2 Grid', grid: 'grid-cols-3 grid-rows-2' },
    { id: '4x2', name: '4×2 Grid', grid: 'grid-cols-4 grid-rows-2' }
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full p-4 overflow-hidden">
      
      {/* Left Column: Settings */}
      <div className="w-full lg:w-1/3 flex flex-col gap-6 overflow-y-auto pr-2">
        
        {/* Layout Selection */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Layout className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-800">Grid Layout</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {layouts.map(l => (
              <button
                key={l.id}
                onClick={() => updateConfig({ layout: l.id })}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-md border-2 transition-all",
                  config.layout === l.id 
                    ? "border-blue-500 bg-blue-50 text-blue-700" 
                    : "border-slate-200 hover:border-slate-300 text-slate-600"
                )}
              >
                <div className={cn("grid gap-1 mb-2 w-12 h-8", l.grid)}>
                  {Array.from({ length: parseInt(l.id[0]) * 2 }).map((_, i) => (
                    <div key={i} className={cn(
                      "bg-current rounded-[1px]",
                      config.layout === l.id ? "opacity-60" : "opacity-30"
                    )} />
                  ))}
                </div>
                <span className="text-xs font-medium">{l.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Display Options */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-800">Display Options</h3>
          </div>
          <div className="space-y-4">
            <Toggle label="Show Alerts Banner" checked={config.showAlerts} onChange={(c) => updateConfig({ showAlerts: c })} />
            <Toggle label="Show Source Attribution" checked={config.showSourceAttribution} onChange={(c) => updateConfig({ showSourceAttribution: c })} />
            <Toggle label="Show Confidence Score" checked={config.showConfidence} onChange={(c) => updateConfig({ showConfidence: c })} />
            <Toggle label="Auto-rotate Widgets" checked={!!config.autoRotate} onChange={(c) => updateConfig({ autoRotate: c })} />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto flex flex-col gap-3">
          <button 
            disabled={!hasChanges}
            onClick={() => { setHasChanges(false); alert("Saved"); }}
            className="w-full py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Save Configuration
          </button>
          <a 
            href={`/facility/${facilityId}/display`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 bg-slate-800 text-white rounded-md font-medium hover:bg-slate-900 transition-colors flex items-center justify-center gap-2"
          >
            Launch Display Mode <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Right Column: Preview */}
      <div className="w-full lg:w-2/3 flex flex-col bg-slate-50 rounded-lg border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-6 text-slate-600">
          <Monitor className="w-5 h-5" />
          <h3 className="font-medium">Live Preview</h3>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-4xl">
            <DisplayPreview 
              config={config} 
              sensors={sensors} 
              readings={readings} 
              alerts={alerts} 
            />
          </div>
        </div>
        
        <p className="mt-6 text-center text-sm text-slate-400">
          This is a scaled-down preview. The actual display will run fullscreen on your target monitor.
        </p>
      </div>

    </div>
  );
};

function Toggle({ label, checked, onChange }: { label: string, checked: boolean, onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-sm text-slate-700 font-medium">{label}</span>
      <div className="relative">
        <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className={cn(
          "block w-10 h-6 rounded-full transition-colors",
          checked ? "bg-blue-600" : "bg-slate-300"
        )}></div>
        <div className={cn(
          "absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform",
          checked ? "transform translate-x-4" : ""
        )}></div>
      </div>
    </label>
  );
}
