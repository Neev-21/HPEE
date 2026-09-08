import React from 'react';
import type { Facility } from '@/types';

interface FacilitySelectorProps {
  facilities: Facility[];
  selectedId: string;
  onChange: (id: string) => void;
}

export function FacilitySelector({ facilities, selectedId, onChange }: FacilitySelectorProps) {
  return (
    <select 
      value={selectedId}
      onChange={(e) => onChange(e.target.value)}
      className="p-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
    >
      {facilities.map(f => (
        <option key={f.id} value={f.id}>{f.name}</option>
      ))}
      {facilities.length === 0 && <option value="demo">Demo Facility</option>}
    </select>
  );
}
