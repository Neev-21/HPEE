import React from 'react';
import { Pencil, Trash2, Activity } from 'lucide-react';
import { type FacilitySensor, type SensorType } from '@/types';
import { SensorStatusBadge } from './SensorStatusBadge';

interface Props {
  sensor: FacilitySensor;
  sensorType?: SensorType;
  zoneName?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const SensorCard: React.FC<Props> = ({ sensor, sensorType, zoneName, onEdit, onDelete }) => {
  const enabledMeasurementsCount = sensor.measurements.filter((m) => m.enabled).length;

  return (
    <div className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900">{sensor.name}</h3>
            <SensorStatusBadge status={sensor.status} />
          </div>
          <p className="font-mono text-xs text-slate-500">{sensor.sensorCode}</p>
        </div>
        <div className="flex gap-1">
          {onEdit && (
            <button
              onClick={onEdit}
              className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Edit sensor"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Delete sensor"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
        <div>
          <span className="block font-medium text-slate-500">Type</span>
          {sensorType?.name || 'Unknown Type'}
        </div>
        <div>
          <span className="block font-medium text-slate-500">Zone</span>
          {zoneName || 'Unassigned'}
        </div>
      </div>
      
      <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
        <Activity className="h-3.5 w-3.5" />
        {enabledMeasurementsCount} active measurement{enabledMeasurementsCount !== 1 ? 's' : ''}
      </div>
    </div>
  );
};
