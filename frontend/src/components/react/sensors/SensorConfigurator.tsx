import React, { useState, useEffect } from 'react';
import type { FacilitySensor, SensorType, FacilityZone } from '@/types';
import { mockSensors } from '@/lib/mock/sensors';
import { mockSensorTypes } from '@/lib/mock/sensorTypes';
import { mockZones } from '@/lib/mock/zones';
import { SensorTable } from './SensorTable';
import { SensorForm } from './SensorForm';
import { SlidersHorizontal, Plus } from 'lucide-react';

export interface SensorConfiguratorProps {
  facilityId?: string;
}

export const SensorConfigurator: React.FC<SensorConfiguratorProps> = ({ facilityId = 'demo' }) => {
  const [sensors, setSensors] = useState<FacilitySensor[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('hpee-sensors');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return mockSensors;
  });

  const [sensorTypes, setSensorTypes] = useState<SensorType[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('hpee-sensor-types');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return mockSensorTypes;
  });

  const [zones, setZones] = useState<FacilityZone[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('hpee-zones');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return mockZones;
  });

  const [editingSensor, setEditingSensor] = useState<FacilitySensor | null | undefined>(undefined);
  const isFormOpen = editingSensor !== undefined;

  useEffect(() => {
    try {
      localStorage.setItem('hpee-sensors', JSON.stringify(sensors));
    } catch (e) {}
  }, [sensors]);

  const handleSaveSensor = (sensor: FacilitySensor) => {
    if (editingSensor) {
      setSensors((prev) => prev.map((s) => (s.id === sensor.id ? sensor : s)));
    } else {
      setSensors((prev) => [...prev, { ...sensor, facilityId }]);
    }
    setEditingSensor(undefined);
  };

  const handleDeleteSensor = (sensorId: string) => {
    if (confirm('Are you sure you want to delete this sensor node?')) {
      setSensors((prev) => prev.filter((s) => s.id !== sensorId));
    }
  };

  return (
    <div className="space-y-6">
      {isFormOpen ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="mb-6 pb-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {editingSensor ? `Edit Sensor: ${editingSensor.sensorCode}` : 'Configure New Sensor Node'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Define dynamic measurement channels, sampling intervals, and threshold limits.
              </p>
            </div>
          </div>
          <SensorForm
            sensor={editingSensor || undefined}
            sensorTypes={sensorTypes}
            zones={zones}
            onSave={handleSaveSensor}
            onCancel={() => setEditingSensor(undefined)}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <SensorTable
            sensors={sensors}
            sensorTypes={sensorTypes}
            zones={zones}
            onAdd={() => setEditingSensor(null)}
            onEdit={(sensor) => setEditingSensor(sensor)}
            onDelete={handleDeleteSensor}
          />
        </div>
      )}
    </div>
  );
};

