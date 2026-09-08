import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { type MeasurementDefinition, generateId } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  measurements: MeasurementDefinition[];
  onChange: (measurements: MeasurementDefinition[]) => void;
}

export const MeasurementDefinitionEditor: React.FC<Props> = ({ measurements, onChange }) => {
  const handleAdd = () => {
    onChange([
      ...measurements,
      {
        id: generateId(),
        key: '',
        name: '',
        unit: '',
        dataType: 'number',
      },
    ]);
  };

  const handleChange = (id: string, field: keyof MeasurementDefinition, value: any) => {
    onChange(
      measurements.map((m) =>
        m.id === id ? { ...m, [field]: value } : m
      )
    );
  };

  const handleDelete = (id: string) => {
    onChange(measurements.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-900">Measurements</h3>
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Plus className="h-4 w-4" />
          Add Measurement
        </button>
      </div>

      {measurements.length === 0 ? (
        <div className="rounded border border-slate-200 border-dashed p-8 text-center text-sm text-slate-500">
          No measurements configured. Click Add Measurement to begin.
        </div>
      ) : (
        <div className="space-y-3">
          {measurements.map((m) => (
            <div key={m.id} className="flex flex-wrap items-start gap-3 rounded border border-slate-200 bg-slate-50 p-3">
              <div className="flex-1 space-y-3 min-w-[200px]">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Key</label>
                    <input
                      type="text"
                      value={m.key}
                      onChange={(e) => handleChange(m.id, 'key', e.target.value)}
                      className="block w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      placeholder="e.g. pm25"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Name</label>
                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => handleChange(m.id, 'name', e.target.value)}
                      className="block w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      placeholder="e.g. PM2.5"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Unit</label>
                    <input
                      type="text"
                      value={m.unit}
                      onChange={(e) => handleChange(m.id, 'unit', e.target.value)}
                      className="block w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      placeholder="e.g. µg/m³"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Data Type</label>
                    <select
                      value={m.dataType}
                      onChange={(e) => handleChange(m.id, 'dataType', e.target.value)}
                      className="block w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="text">Text</option>
                    </select>
                  </div>
                </div>
                {m.dataType === 'number' && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">Min Value</label>
                      <input
                        type="number"
                        value={m.min ?? ''}
                        onChange={(e) => handleChange(m.id, 'min', e.target.value ? Number(e.target.value) : undefined)}
                        className="block w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">Max Value</label>
                      <input
                        type="number"
                        value={m.max ?? ''}
                        onChange={(e) => handleChange(m.id, 'max', e.target.value ? Number(e.target.value) : undefined)}
                        className="block w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">Decimal Places</label>
                      <input
                        type="number"
                        value={m.decimalPlaces ?? ''}
                        onChange={(e) => handleChange(m.id, 'decimalPlaces', e.target.value ? Number(e.target.value) : undefined)}
                        className="block w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        min="0"
                        max="4"
                      />
                    </div>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(m.id)}
                className="mt-6 inline-flex items-center justify-center rounded p-1.5 text-slate-400 hover:bg-slate-200 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Delete measurement"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
