import React from 'react';
import { cn } from '@/lib/utils';
import { type DisplayConfig, type FacilitySensor, type MockSensorReading, type AlertEvent } from '@/types';
import { DisplayMetricCard } from './DisplayMetricCard';
import { AlertTriangle, Info } from 'lucide-react';

export interface DisplayPreviewProps {
  config: DisplayConfig;
  sensors: FacilitySensor[];
  readings: MockSensorReading[];
  alerts: AlertEvent[];
}

export const DisplayPreview: React.FC<DisplayPreviewProps> = ({ config, sensors, readings, alerts }) => {
  const visibleWidgets = config.widgets.filter(w => w.visible);
  const activeAlerts = alerts.filter(a => !a.acknowledged);

  const getGridCols = (layout: string) => {
    switch (layout) {
      case '2x2': return 'grid-cols-2 grid-rows-2';
      case '3x2': return 'grid-cols-3 grid-rows-2';
      case '4x2': return 'grid-cols-4 grid-rows-2';
      default: return 'grid-cols-2 grid-rows-2';
    }
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border-4 border-slate-800 shadow-2xl flex flex-col scale-100 transform origin-top">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
          <span className="text-white font-bold tracking-widest text-sm">LIVE</span>
        </div>
        <div className="text-slate-400 font-mono text-sm">
          {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Grid */}
      <div className={cn("flex-1 p-4 grid gap-4", getGridCols(config.layout))}>
        {visibleWidgets.map((widget, i) => {
          const reading = readings.find(r => r.sensorId === widget.sensorId && r.measurementKey === widget.measurementKey);
          // Simplified status logic for preview
          const isAlert = activeAlerts.some(a => a.sensorId === widget.sensorId && a.measurementKey === widget.measurementKey);
          
          return (
            <div key={widget.id || i} className="min-h-0">
              <DisplayMetricCard
                title={widget.title}
                value={reading ? Number(reading.value).toFixed(1) : '--'}
                unit={widget.unit || ''}
                status={isAlert ? 'critical' : (reading ? 'normal' : 'unknown')}
              />
            </div>
          );
        })}
      </div>

      {/* Footer/Alerts */}
      {config.showAlerts && activeAlerts.length > 0 && (
        <div className="bg-red-600/90 border-t border-red-500 p-2 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
            <span className="font-bold uppercase text-sm tracking-wide">
              Critical Alert: {activeAlerts[0].message}
            </span>
          </div>
          {config.showConfidence && (
            <div className="text-xs font-mono bg-black/30 px-2 py-1 rounded">
              Conf: 94%
            </div>
          )}
        </div>
      )}
      
      {!activeAlerts.length && config.showSourceAttribution && (
        <div className="bg-slate-900 border-t border-slate-800 p-1 px-4 flex items-center gap-2 text-slate-500 text-xs">
          <Info className="w-3 h-3" />
          Powered by HPEE Engine
        </div>
      )}
    </div>
  );
};
