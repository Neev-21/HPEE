import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Pencil, Trash2 } from 'lucide-react';
import { type FacilitySensor, type SensorType, type FacilityZone, type SensorStatus } from '@/types';
import { SensorStatusBadge } from './SensorStatusBadge';

interface Props {
  sensors: FacilitySensor[];
  sensorTypes: SensorType[];
  zones: FacilityZone[];
  onEdit: (sensor: FacilitySensor) => void;
  onDelete: (sensorId: string) => void;
  onAdd: () => void;
}

export const SensorTable: React.FC<Props> = ({ sensors, sensorTypes, zones, onEdit, onDelete, onAdd }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredSensors = useMemo(() => {
    return sensors.filter((s) => {
      const matchesSearch =
        !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.sensorCode.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesZone = zoneFilter === 'all' || s.zoneId === zoneFilter;
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchesSearch && matchesZone && matchesStatus;
    });
  }, [sensors, searchQuery, zoneFilter, statusFilter]);

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Sensors</h2>
          <p className="text-sm text-slate-500">{filteredSensors.length} total</p>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Plus className="h-4 w-4" />
          Add Sensor
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded border border-slate-300 py-2 pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          />
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="block w-full appearance-none rounded border border-slate-300 bg-white py-2 pl-9 pr-8 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <option value="all">All Zones</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="online">Online</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
            <option value="offline">Offline</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
      </div>

      {filteredSensors.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 border-dashed bg-slate-50 py-12">
          <p className="mb-4 text-sm text-slate-500">No sensors configured yet.</p>
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 rounded bg-white px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Add Your First Sensor
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Sensor</th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Code</th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Type</th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Zone</th>
                <th className="px-4 py-3 text-center font-medium text-slate-700">Measurements</th>
                <th className="px-4 py-3 text-center font-medium text-slate-700">Status</th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Last Update</th>
                <th className="px-4 py-3 text-right font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredSensors.map((sensor) => {
                const type = sensorTypes.find((t) => t.id === sensor.sensorTypeId);
                const zone = zones.find((z) => z.id === sensor.zoneId);
                const activeMeasurements = sensor.measurements.filter((m) => m.enabled).length;

                return (
                  <tr key={sensor.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{sensor.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">{sensor.sensorCode}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{type?.name || 'Unknown'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{zone?.name || 'Unassigned'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-center text-slate-600">{activeMeasurements}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-center">
                      <SensorStatusBadge status={sensor.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                      {sensor.lastUpdate ? new Date(sensor.lastUpdate).toLocaleString() : '--'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => onEdit(sensor)}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(sensor.id)}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
