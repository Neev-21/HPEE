import React from 'react';

interface FacilityHeaderProps {
  facilityName: string;
  companyName?: string;
}

export function FacilityHeader({ facilityName, companyName }: FacilityHeaderProps) {
  return (
    <div className="mb-6">
      {companyName && <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{companyName}</div>}
      <h1 className="text-2xl font-bold text-slate-900">{facilityName}</h1>
    </div>
  );
}
