import React, { useState, useEffect } from 'react';
import { generateId, type DashboardConfig, type FacilitySensor, type MockSensorReading, type AlertEvent, type DashboardWidget, type WidgetSize } from '@/types';
import { DashboardGrid } from './DashboardGrid';
import { Eye, EyeOff, GripVertical, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DashboardConfigPanelProps {
  facilityId: string;
}

export const DashboardConfigPanel: React.FC<DashboardConfigPanelProps> = ({ facilityId }) => {
  // Mock data for this component since services aren't wired up here
  const [sensors] = useState<FacilitySensor[]>([
    {
      id: 's1', facilityId, sensorCode: 'AQ-01', name: 'Main Exhaust', sensorTypeId: 't1', status: 'online', position: { x: 0, y: 0 },
      measurements: [{ measurementKey: 'pm25', enabled: true, unit: 'µg/m³', displayName: 'PM2.5' }],
      thresholds: []
    }
  ]);
  
  const [config, setConfig] = useState<DashboardConfig>({
    facilityId,
    widgets: [
      { id: 'w1', type: 'status', size: 'medium', visible: true, order: 0 },
      { id: 'w2', type: 'alert', size: 'medium', visible: true, order: 1 },
      { id: 'w3', type: 'metric', title: 'Main Exhaust PM2.5', sensorId: 's1', measurementKey: 'pm25', size: 'small', visible: true, order: 2 },
    ]
  });

  const [readings, setReadings] = useState<MockSensorReading[]>([]);
  const [alerts] = useState<AlertEvent[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Generate mock readings for preview
    const interval = setInterval(() => {
      setReadings([{
        sensorId: 's1',
        measurementKey: 'pm25',
        value: 12 + Math.random() * 5,
        unit: 'µg/m³',
        timestamp: new Date().toISOString(),
        quality: 'valid'
      }]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleVisibility = (id: string) => {
    setConfig(prev => ({
      ...prev,
      widgets: prev.widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w)
    }));
    setHasChanges(true);
  };

  const handleSizeChange = (id: string, size: WidgetSize) => {
    setConfig(prev => ({
      ...prev,
      widgets: prev.widgets.map(w => w.id === id ? { ...w, size } : w)
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    setHasChanges(false);
    // Call service to save here
    alert("Configuration saved");
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
        <h2 className="text-lg font-semibold text-slate-800">Dashboard Configuration</h2>
        <div className="flex items-center gap-3">
          {hasChanges && <span className="text-sm text-amber-600 font-medium">Unsaved changes</span>}
          <button 
            onClick={handleSave}
            disabled={!hasChanges}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar: Widget list */}
        <div className="w-1/3 border-r border-slate-200 flex flex-col bg-slate-50/50">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
            <h3 className="font-medium text-slate-700">Widgets</h3>
            <button className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Add Widget">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {config.widgets.map((widget, index) => (
              <div 
                key={widget.id} 
                className={cn(
                  "bg-white border rounded-md p-3 flex flex-col gap-2 shadow-sm transition-opacity",
                  !widget.visible && "opacity-60"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-slate-400 cursor-grab" />
                    <span className="font-medium text-sm text-slate-700 capitalize">{widget.title || widget.type}</span>
                  </div>
                  <button 
                    onClick={() => handleToggleVisibility(widget.id)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    {widget.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                
                <div className="flex items-center gap-2 pl-6">
                  <span className="text-xs text-slate-500">Size:</span>
                  <select 
                    value={widget.size}
                    onChange={(e) => handleSizeChange(widget.id, e.target.value as WidgetSize)}
                    className="text-xs border-slate-200 rounded px-1.5 py-1 text-slate-700 bg-slate-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="full">Full Width</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Right side: Live Preview */}
        <div className="w-2/3 bg-slate-100 p-6 overflow-y-auto">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Live Preview</h3>
          </div>
          <DashboardGrid 
            config={config} 
            sensors={sensors} 
            readings={readings} 
            alerts={alerts} 
          />
        </div>
      </div>
    </div>
  );
};
