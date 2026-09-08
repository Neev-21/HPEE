import React from 'react';
import { type MeasurementDefinition, type ConfiguredMeasurement } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  availableMeasurements: MeasurementDefinition[];
  selectedMeasurements: ConfiguredMeasurement[];
  onChange: (measurements: ConfiguredMeasurement[]) => void;
}

export const SensorMeasurementSelector: React.FC<Props> = ({
  availableMeasurements,
  selectedMeasurements,
  onChange,
}) => {
  const toggleMeasurement = (def: MeasurementDefinition) => {
    const isSelected = selectedMeasurements.some((m) => m.measurementKey === def.key);
    
    if (isSelected) {
      onChange(selectedMeasurements.filter((m) => m.measurementKey !== def.key));
    } else {
      onChange([
        ...selectedMeasurements,
        {
          measurementKey: def.key,
          enabled: true,
          displayName: def.name,
          unit: def.unit,
        },
      ]);
    }
  };

  if (availableMeasurements.length === 0) {
    return (
      <div className="rounded border border-slate-200 border-dashed p-4 text-center text-sm text-slate-500">
        No measurements available for this sensor type.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {availableMeasurements.map((def) => {
        const isSelected = selectedMeasurements.some((m) => m.measurementKey === def.key);
        return (
          <label
            key={def.id}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded border p-3 transition-colors',
              isSelected
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            )}
          >
            <div className="flex h-5 items-center">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleMeasurement(def)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-1 flex-col">
              <span className="text-sm font-medium text-slate-900">{def.name}</span>
              <span className="text-xs text-slate-500">Key: {def.key} {def.unit ? `• Unit: ${def.unit}` : ''} • Type: {def.dataType}</span>
            </div>
          </label>
        );
      })}
    </div>
  );
};
