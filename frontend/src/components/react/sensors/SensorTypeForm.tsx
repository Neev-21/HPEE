import React, { useState } from 'react';
import { type SensorType, type MeasurementDefinition, generateId } from '@/types';
import { MeasurementDefinitionEditor } from './MeasurementDefinitionEditor';

interface Props {
  sensorType?: SensorType;
  onSave: (type: SensorType) => void;
  onCancel: () => void;
}

export const SensorTypeForm: React.FC<Props> = ({ sensorType, onSave, onCancel }) => {
  const [name, setName] = useState(sensorType?.name || '');
  const [category, setCategory] = useState(sensorType?.category || 'Air');
  const [description, setDescription] = useState(sensorType?.description || '');
  const [measurements, setMeasurements] = useState<MeasurementDefinition[]>(
    sensorType?.measurements || []
  );
  const [errors, setErrors] = useState<{ name?: string; measurements?: string }>({});

  const handleSave = () => {
    const newErrors: { name?: string; measurements?: string } = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (measurements.length === 0) newErrors.measurements = 'At least one measurement is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      id: sensorType?.id || generateId(),
      name,
      category,
      description,
      measurements,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="name" className="text-sm font-medium text-slate-700">Name <span className="text-red-500">*</span></label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
            }}
            className="block w-full rounded border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            placeholder="e.g. Ambient Air Quality Monitor"
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
        </div>
        <div className="space-y-1">
          <label htmlFor="category" className="text-sm font-medium text-slate-700">Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="block w-full rounded border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 bg-white"
          >
            <option value="Air">Air</option>
            <option value="Water">Water</option>
            <option value="Industrial">Industrial</option>
            <option value="Environmental">Environmental</option>
            <option value="Custom">Custom</option>
          </select>
        </div>
      </div>
      
      <div className="space-y-1">
        <label htmlFor="description" className="text-sm font-medium text-slate-700">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="block w-full rounded border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        />
      </div>

      <div className="pt-2 border-t border-slate-200">
        <MeasurementDefinitionEditor
          measurements={measurements}
          onChange={(m) => {
            setMeasurements(m);
            if (errors.measurements && m.length > 0) setErrors((e) => ({ ...e, measurements: undefined }));
          }}
        />
        {errors.measurements && <p className="mt-1 text-xs text-red-500">{errors.measurements}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Save
        </button>
      </div>
    </div>
  );
};
