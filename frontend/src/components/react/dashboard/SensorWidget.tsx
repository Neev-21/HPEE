import React from 'react';
import { cn } from '@/lib/utils';
import { type FacilitySensor, type MockSensorReading, type WidgetSize } from '@/types';
import { Activity, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

export interface SensorWidgetProps {
  sensor: FacilitySensor;
  readings?: MockSensorReading[];
  size: WidgetSize;
}

export const SensorWidget: React.FC<SensorWidgetProps> = ({ sensor, readings = [], size }) => {
  const statusIcons = {
    online: <CheckCircle className="w-4 h-4 text-green-600" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-600" />,
    critical: <AlertTriangle className="w-4 h-4 text-red-600" />,
    offline: <HelpCircle className="w-4 h-4 text-gray-400" />,
    unknown: <HelpCircle className="w-4 h-4 text-gray-400" />
  };

  const statusBg = {
    online: 'bg-green-50 border-green-200',
    warning: 'bg-amber-50 border-amber-200',
    critical: 'bg-red-50 border-red-200',
    offline: 'bg-gray-50 border-gray-200',
    unknown: 'bg-gray-50 border-gray-200'
  };

  return (
    <div className="flex flex-col p-4 bg-white border border-slate-200 rounded-lg shadow-sm h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-900">{sensor.name}</h3>
          <p className="text-xs text-slate-500 font-mono">{sensor.sensorCode}</p>
        </div>
        <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium capitalize", statusBg[sensor.status])}>
          {statusIcons[sensor.status]}
          <span className="text-slate-700">{sensor.status}</span>
        </div>
      </div>
      
      <div className={cn(
        "grid gap-3 mt-auto",
        size === 'small' ? 'grid-cols-1' : 'grid-cols-2'
      )}>
        {sensor.measurements.filter(m => m.enabled).map(measurement => {
          const reading = readings.find(r => r.measurementKey === measurement.measurementKey);
          return (
            <div key={measurement.measurementKey} className="flex flex-col bg-slate-50 p-2 rounded border border-slate-100">
              <span className="text-xs text-slate-500">{measurement.displayName || measurement.measurementKey}</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-semibold text-slate-900">
                  {reading ? Number(reading.value).toFixed(2) : '--'}
                </span>
                <span className="text-xs text-slate-500">{measurement.unit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
