import React from 'react';
import { cn } from '@/lib/utils';
import { type FacilitySensor, type WidgetSize } from '@/types';

export interface StatusWidgetProps {
  sensors: FacilitySensor[];
  size: WidgetSize;
}

export const StatusWidget: React.FC<StatusWidgetProps> = ({ sensors, size }) => {
  const counts = {
    online: sensors.filter(s => s.status === 'online').length,
    warning: sensors.filter(s => s.status === 'warning').length,
    critical: sensors.filter(s => s.status === 'critical').length,
    offline: sensors.filter(s => s.status === 'offline' || s.status === 'unknown').length,
  };

  const total = sensors.length;

  return (
    <div className="flex flex-col p-4 bg-white border border-slate-200 rounded-lg shadow-sm h-full justify-between">
      <h3 className="text-sm font-medium text-slate-500">Facility Status</h3>
      
      <div className="mt-4 flex flex-col gap-3">
        <StatusRow label="Online" count={counts.online} total={total} colorClass="bg-green-500" />
        <StatusRow label="Warning" count={counts.warning} total={total} colorClass="bg-amber-500" />
        <StatusRow label="Critical" count={counts.critical} total={total} colorClass="bg-red-500" />
        <StatusRow label="Offline/Unknown" count={counts.offline} total={total} colorClass="bg-gray-400" />
      </div>
    </div>
  );
};

const StatusRow = ({ label, count, total, colorClass }: { label: string, count: number, total: number, colorClass: string }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-24 text-slate-600 font-medium truncate">{label}</div>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", colorClass)} style={{ width: `${percentage}%` }} />
      </div>
      <div className="w-8 text-right font-semibold text-slate-900">{count}</div>
    </div>
  );
};
