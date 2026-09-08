import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { type DisplayConfig, type FacilitySensor, type MockSensorReading, type AlertEvent } from '@/types';
import { DisplayMetricCard } from './DisplayMetricCard';
import { AlertTriangle, Info } from 'lucide-react';

export interface PlantDisplayProps {
  facilityId: string;
}

export const PlantDisplay: React.FC<PlantDisplayProps> = ({ facilityId }) => {
  // In a real app, fetch config and live data here using the facilityId.
  // We mock it for the build phase.
  const [config] = useState<DisplayConfig>({
    facilityId,
    layout: '3x2',
    showAlerts: true,
    showSourceAttribution: true,
    showConfidence: true,
    widgets: [
      { id: 'w1', title: 'EXHAUST A PM2.5', sensorId: 's1', measurementKey: 'pm25', unit: 'µg/m³', visible: true },
      { id: 'w2', title: 'EXHAUST A SO2', sensorId: 's2', measurementKey: 'so2', unit: 'ppm', visible: true },
      { id: 'w3', title: 'AMBIENT VOC', sensorId: 's3', measurementKey: 'voc', unit: 'ppb', visible: true },
      { id: 'w4', title: 'ZONE B PM10', sensorId: 's4', measurementKey: 'pm10', unit: 'µg/m³', visible: true },
      { id: 'w5', title: 'FLOW RATE', sensorId: 's5', measurementKey: 'flow', unit: 'm³/s', visible: true },
      { id: 'w6', title: 'TEMPERATURE', sensorId: 's6', measurementKey: 'temp', unit: '°C', visible: true }
    ]
  });

  const [time, setTime] = useState(new Date());
  const [readings, setReadings] = useState<Record<string, number>>({});
  const [activeAlert, setActiveAlert] = useState<AlertEvent | null>(null);

  // Time ticker
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Mock data generator
  useEffect(() => {
    // Initial values
    const baselines: Record<string, number> = {
      'w1': 15.2, 'w2': 0.04, 'w3': 120, 'w4': 25.5, 'w5': 5.2, 'w6': 32.4
    };
    
    setReadings(baselines);

    const dataInterval = setInterval(() => {
      setReadings(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => {
          // fluctuate by +/- 5%
          const change = next[k] * 0.05 * (Math.random() * 2 - 1);
          next[k] = Math.max(0, next[k] + change);
        });
        
        // Randomly trigger an alert for demo
        if (Math.random() > 0.95 && config.showAlerts) {
          setActiveAlert({
            id: 'demo-alert', facilityId, sensorId: 's1', measurementKey: 'pm25',
            level: 'critical', value: next['w1'], threshold: 25.0,
            message: 'PM2.5 Exceeded Critical Threshold at Exhaust A',
            timestamp: new Date().toISOString(), acknowledged: false
          });
        } else if (Math.random() > 0.8) {
          setActiveAlert(null); // Clear alert randomly
        }
        
        return next;
      });
    }, 3000);

    return () => clearInterval(dataInterval);
  }, [config.showAlerts, facilityId]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.history.back();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getGridCols = (layout: string) => {
    switch (layout) {
      case '2x2': return 'grid-cols-2 grid-rows-2';
      case '3x2': return 'grid-cols-3 grid-rows-2';
      case '4x2': return 'grid-cols-4 grid-rows-2';
      default: return 'grid-cols-2 grid-rows-2';
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black text-white flex flex-col overflow-hidden select-none">
      
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-4 bg-slate-950 border-b-2 border-slate-900">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-red-950/40 px-4 py-2 rounded-full border border-red-900/50">
            <div className="w-5 h-5 bg-red-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(239,68,68,1)]" />
            <span className="text-red-500 font-bold tracking-[0.2em] text-lg">LIVE</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-200 tracking-wide uppercase">
            Facility Display
          </h1>
        </div>
        <div className="text-5xl font-mono font-medium text-slate-300 tabular-nums tracking-tight">
          {time.toLocaleTimeString('en-US', { hour12: false })}
        </div>
      </header>

      {/* Grid Content */}
      <main className={cn("flex-1 p-6 grid gap-6", getGridCols(config.layout))}>
        {config.widgets.filter(w => w.visible).map(widget => {
          const val = readings[widget.id];
          const isAlerting = activeAlert && activeAlert.measurementKey === widget.measurementKey;
          
          return (
            <div key={widget.id} className="min-h-0">
              <DisplayMetricCard
                title={widget.title}
                value={val ? val.toFixed(1) : '--'}
                unit={widget.unit || ''}
                status={isAlerting ? 'critical' : (val ? 'normal' : 'unknown')}
              />
            </div>
          );
        })}
      </main>

      {/* Alert Banner */}
      {activeAlert && config.showAlerts && (
        <div className="bg-red-600 border-t-4 border-red-500 p-6 flex items-center justify-between shadow-[0_-10px_30px_rgba(220,38,38,0.3)] z-50">
          <div className="flex items-center gap-6">
            <AlertTriangle className="w-16 h-16 text-white animate-pulse" />
            <div>
              <h2 className="text-3xl font-black text-white tracking-widest uppercase">
                CRITICAL EVENT DETECTED
              </h2>
              <p className="text-xl text-red-100 font-medium mt-1">
                {activeAlert.message} • Value: {activeAlert.value.toFixed(2)}
              </p>
            </div>
          </div>
          {config.showConfidence && (
            <div className="bg-black/40 px-6 py-3 rounded-lg border border-red-500/30 text-right">
              <div className="text-red-200 text-sm font-medium uppercase tracking-wider">Confidence Score</div>
              <div className="text-4xl font-mono font-bold text-white">98.5%</div>
            </div>
          )}
        </div>
      )}

      {/* Footer Attribution */}
      {!activeAlert && config.showSourceAttribution && (
        <footer className="bg-slate-950 p-3 px-8 flex justify-between items-center text-slate-600 text-sm border-t border-slate-900">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            Hyperlocal Pollution Evidence Engine
          </div>
          <div className="font-mono">
            Press ESC to exit
          </div>
        </footer>
      )}
    </div>
  );
};
