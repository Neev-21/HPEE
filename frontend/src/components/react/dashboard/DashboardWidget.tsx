import React from 'react';
import { DashboardWidget as IDashboardWidget, type FacilitySensor, type MockSensorReading, type AlertEvent } from '@/types';
import type { DashboardWidget as IDashboardWidget, FacilitySensor, MockSensorReading, AlertEvent } from '@/types';
import { MetricWidget } from './MetricWidget';
import { SensorWidget } from './SensorWidget';
import { StatusWidget } from './StatusWidget';
import { AlertWidget } from './AlertWidget';

export interface DashboardWidgetProps {
  widget: IDashboardWidget;
  sensors: FacilitySensor[];
  readings: MockSensorReading[];
  alerts: AlertEvent[];
  onAcknowledgeAlert?: (alertId: string) => void;
}

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({ 
  widget, 
  sensors, 
  readings, 
  alerts,
  onAcknowledgeAlert
}) => {
  if (!widget.visible) return null;

  switch (widget.type) {
    case 'metric': {
      const sensor = sensors.find(s => s.id === widget.sensorId);
      const measurement = sensor?.measurements.find(m => m.measurementKey === widget.measurementKey);
      const reading = readings.find(r => r.sensorId === widget.sensorId && r.measurementKey === widget.measurementKey);
      
      let status: 'normal' | 'warning' | 'critical' | 'unknown' = 'unknown';
      if (sensor && reading) {
        // Evaluate threshold rules if needed, or just use sensor status
        // Simplification for now: map sensor status
        status = sensor.status === 'online' ? 'normal' : sensor.status;
      }

      return (
        <MetricWidget
          title={widget.title || measurement?.displayName || widget.measurementKey || 'Metric'}
          value={reading?.value ?? null}
          unit={measurement?.unit || ''}
          status={status}
          size={widget.size}
        />
      );
    }
    case 'sensor': {
      const sensor = sensors.find(s => s.id === widget.sensorId);
      if (!sensor) return <div className="p-4 border border-dashed rounded text-sm text-slate-400">Sensor not found</div>;
      
      const sensorReadings = readings.filter(r => r.sensorId === sensor.id);
      return <SensorWidget sensor={sensor} readings={sensorReadings} size={widget.size} />;
    }
    case 'status':
      return <StatusWidget sensors={sensors} size={widget.size} />;
    case 'alert':
      return <AlertWidget alerts={alerts} size={widget.size} onAcknowledge={onAcknowledgeAlert} />;
    case 'blueprint':
      return (
        <div className="flex items-center justify-center bg-slate-100 border border-slate-200 rounded-lg h-full text-slate-400 min-h-[200px]">
          Blueprint View Placeholder
        </div>
      );
    case 'trend':
      return (
        <div className="flex items-center justify-center bg-slate-100 border border-slate-200 rounded-lg h-full text-slate-400 min-h-[200px]">
          Trend Chart Placeholder
        </div>
      );
    default:
      return null;
  }
};
