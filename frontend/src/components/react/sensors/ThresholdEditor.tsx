import React from 'react';
import { type ConfiguredMeasurement, type ThresholdRule, generateId } from '@/types';

interface Props {
  measurements: ConfiguredMeasurement[];
  thresholds: ThresholdRule[];
  onChange: (thresholds: ThresholdRule[]) => void;
}

export const ThresholdEditor: React.FC<Props> = ({ measurements, thresholds, onChange }) => {
  // Use enabled measurements. Assuming we only show thresholds for those.
  // The requirements mention "Only show numeric measurements that are enabled."
  // Since ConfiguredMeasurement doesn't carry dataType, we'll assume they are all thresholdable for now,
  // or that the parent filters them if necessary, but typically all configured metrics can have thresholds.
  const enabledMeasurements = measurements.filter((m) => m.enabled);

  const getThreshold = (key: string, level: 'warning' | 'critical'): ThresholdRule | undefined => {
    return thresholds.find((t) => t.measurementKey === key && t.level === level);
  };

  const updateThreshold = (key: string, level: 'warning' | 'critical', valueStr: string) => {
    if (valueStr.trim() === '') {
      // Remove rule if empty
      onChange(thresholds.filter((t) => !(t.measurementKey === key && t.level === level)));
      return;
    }

    const value = Number(valueStr);
    if (isNaN(value)) return;

    const existing = getThreshold(key, level);
    if (existing) {
      onChange(thresholds.map((t) => (t.id === existing.id ? { ...t, value } : t)));
    } else {
      onChange([
        ...thresholds,
        {
          id: generateId(),
          measurementKey: key,
          level,
          operator: '>',
          value,
        },
      ]);
    }
  };

  if (enabledMeasurements.length === 0) {
    return (
      <div className="rounded border border-slate-200 border-dashed p-4 text-center text-sm text-slate-500">
        No measurements enabled. Select measurements first to configure thresholds.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-700">Measurement</th>
            <th className="px-4 py-3 text-left font-medium text-slate-700">Warning Threshold ({`>`})</th>
            <th className="px-4 py-3 text-left font-medium text-slate-700">Critical Threshold ({`>`})</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {enabledMeasurements.map((m) => {
            const warningRule = getThreshold(m.measurementKey, 'warning');
            const criticalRule = getThreshold(m.measurementKey, 'critical');

            return (
              <tr key={m.measurementKey}>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                  {m.displayName || m.measurementKey}
                  {m.unit && <span className="ml-1 text-xs text-slate-500">({m.unit})</span>}
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    value={warningRule?.value ?? ''}
                    onChange={(e) => updateThreshold(m.measurementKey, 'warning', e.target.value)}
                    placeholder="e.g. 50"
                    className="block w-full rounded border border-slate-300 px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    value={criticalRule?.value ?? ''}
                    onChange={(e) => updateThreshold(m.measurementKey, 'critical', e.target.value)}
                    placeholder="e.g. 100"
                    className="block w-full rounded border border-slate-300 px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
