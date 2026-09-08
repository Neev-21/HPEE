import React from 'react';
import { CheckCircle, Building, MapPin, Map, Grid, Cpu, Activity, Bell, Monitor } from 'lucide-react';
import type { Company, Facility, Blueprint, FacilityZone, FacilitySensor, DashboardConfig, DisplayConfig } from '@/types';

interface SetupReviewProps {
  company: Partial<Company>;
  facility: Partial<Facility>;
  blueprint: Blueprint | null;
  zones: FacilityZone[];
  sensors: FacilitySensor[];
  dashboardConfig: DashboardConfig | null;
  displayConfig: DisplayConfig | null;
}

export function SetupReview({
  company,
  facility,
  blueprint,
  zones,
  sensors,
  dashboardConfig,
  displayConfig
}: SetupReviewProps) {
  
  const enabledMeasurements = sensors.reduce((acc, sensor) => {
    return acc + sensor.measurements.filter(m => m.enabled).length;
  }, 0);
  
  const totalThresholds = sensors.reduce((acc, sensor) => {
    return acc + sensor.measurements.reduce((mAcc, m) => mAcc + (m.thresholds?.length || 0), 0);
    return acc + (sensor.thresholds?.length || 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center p-6 bg-green-50 rounded-lg border border-green-200">
        <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
        <h2 className="text-2xl font-bold text-green-800">FACILITY READY</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm flex items-start space-x-3">
          <Building className="w-5 h-5 text-slate-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-slate-500">Company</h3>
            <p className="font-semibold text-slate-900">{company.name || 'Not set'}</p>
            <p className="text-xs text-slate-500">{company.industry || 'No industry'}</p>
          </div>
        </div>
        
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm flex items-start space-x-3">
          <MapPin className="w-5 h-5 text-slate-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-slate-500">Facility</h3>
            <p className="font-semibold text-slate-900">{facility.name || 'Not set'}</p>
            <p className="text-xs text-slate-500 truncate" title={facility.address}>{facility.address || 'No address'}</p>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm flex items-start space-x-3">
          <Map className="w-5 h-5 text-slate-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-slate-500">Blueprint</h3>
            <p className="font-semibold text-slate-900">{blueprint ? 'Uploaded' : 'Not uploaded'}</p>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm flex items-start space-x-3">
          <Grid className="w-5 h-5 text-slate-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-slate-500">Zones</h3>
            <p className="font-semibold text-slate-900">{zones.length}</p>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm flex items-start space-x-3">
          <Cpu className="w-5 h-5 text-slate-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-slate-500">Sensors</h3>
            <p className="font-semibold text-slate-900">{sensors.length}</p>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm flex items-start space-x-3">
          <Activity className="w-5 h-5 text-slate-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-slate-500">Measurements</h3>
            <p className="font-semibold text-slate-900">{enabledMeasurements} enabled</p>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm flex items-start space-x-3">
          <Bell className="w-5 h-5 text-slate-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-slate-500">Alert Rules</h3>
            <p className="font-semibold text-slate-900">{totalThresholds}</p>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm flex items-start space-x-3">
          <Monitor className="w-5 h-5 text-slate-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-slate-500">Plant Display</h3>
            <p className="font-semibold text-slate-900">{displayConfig ? 'Configured' : 'Not configured'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
