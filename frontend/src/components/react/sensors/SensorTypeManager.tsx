import React, { useState } from 'react';
import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { type SensorType } from '@/types';
import { mockSensorTypes } from '@/lib/mock/sensorTypes';
import { SensorTypeForm } from './SensorTypeForm';

export const SensorTypeManager: React.FC = () => {
  const [sensorTypes, setSensorTypes] = useState<SensorType[]>([]);
  const [sensorTypes, setSensorTypes] = useState<SensorType[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('hpee-sensor-types');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return mockSensorTypes;
  });
  const [editingType, setEditingType] = useState<SensorType | null | undefined>(undefined);

  useEffect(() => {
    try {
      localStorage.setItem('hpee-sensor-types', JSON.stringify(sensorTypes));
    } catch (e) {}
  }, [sensorTypes]);

  const isAddingOrEditing = editingType !== undefined;

  const handleSave = (type: SensorType) => {
    if (editingType) {
      setSensorTypes((prev) => prev.map((t) => (t.id === type.id ? type : t)));
    } else {
      setSensorTypes((prev) => [...prev, type]);
    }
    setEditingType(undefined);
  };

  const handleDelete = (id: string) => {
    setSensorTypes((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Sensor Types</h1>
          <p className="text-sm text-slate-500">Manage definitions for different kinds of sensors</p>
        </div>
        {!isAddingOrEditing && (
          <button
            onClick={() => setEditingType(null)}
            className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Plus className="h-4 w-4" />
            Add Sensor Type
          </button>
        )}
      </div>

      {isAddingOrEditing ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-medium text-slate-900">
            {editingType ? 'Edit Sensor Type' : 'Create Sensor Type'}
          </h2>
          <SensorTypeForm
            sensorType={editingType || undefined}
            onSave={handleSave}
            onCancel={() => setEditingType(undefined)}
          />
        </div>
      ) : (
        <>
          {sensorTypes.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 border-dashed bg-slate-50 py-12">
              <p className="mb-4 text-sm text-slate-500">No sensor types configured yet. Add your first sensor type.</p>
              <button
                onClick={() => setEditingType(null)}
                className="inline-flex items-center gap-2 rounded bg-white px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Plus className="h-4 w-4" />
                Add Sensor Type
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sensorTypes.map((type) => (
                <div key={type.id} className="flex flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">{type.name}</h3>
                      <span className="inline-block mt-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {type.category}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingType(type)}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(type.id)}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {type.description && (
                    <p className="mb-4 text-sm text-slate-600 line-clamp-2">{type.description}</p>
                  )}
                  <div className="mt-auto pt-4 border-t border-slate-100">
                    <p className="text-xs font-medium text-slate-500 mb-2">
                      {type.measurements.length} Measurement{type.measurements.length !== 1 ? 's' : ''}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {type.measurements.map((m) => (
                        <span key={m.id} className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                          {m.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
