import React from 'react';
import { cn } from '@/lib/utils';
import { type DashboardConfig, type FacilitySensor, type MockSensorReading, type AlertEvent } from '@/types';
import { DashboardWidget } from './DashboardWidget';

export interface DashboardGridProps {
  config: DashboardConfig;
  sensors: FacilitySensor[];
  readings: MockSensorReading[];
  alerts: AlertEvent[];
  onAcknowledgeAlert?: (alertId: string) => void;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({
  config,
  sensors,
  readings,
  alerts,
  onAcknowledgeAlert
}) => {
  const visibleWidgets = config.widgets
    .filter(w => w.visible)
    .sort((a, b) => a.order - b.order);

  const getColSpan = (size: string) => {
    switch (size) {
      case 'small': return 'col-span-1';
      case 'medium': return 'col-span-1 md:col-span-2 lg:col-span-1';
      case 'large': return 'col-span-1 md:col-span-2';
      case 'full': return 'col-span-1 md:col-span-2 lg:col-span-4';
      default: return 'col-span-1';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-min">
      {visibleWidgets.map(widget => (
        <div key={widget.id} className={cn(getColSpan(widget.size))}>
          <DashboardWidget
            widget={widget}
            sensors={sensors}
            readings={readings}
            alerts={alerts}
            onAcknowledgeAlert={onAcknowledgeAlert}
          />
        </div>
      ))}
      {visibleWidgets.length === 0 && (
        <div className="col-span-full p-8 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-lg">
          No widgets are currently visible.
        </div>
      )}
    </div>
  );
};
