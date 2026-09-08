import React from "react";
import { X, Activity, Layers, Edit } from "lucide-react";
import type { FacilitySensor, FacilityZone, SensorType } from "@/types";
import { cn } from "@/lib/utils";

export interface BlueprintSidePanelProps {
  selectedSensor?: FacilitySensor;
  selectedZone?: FacilityZone;
  sensors: FacilitySensor[];
  sensorType?: SensorType;
  onEditSensor?: () => void;
  onEditZone?: () => void;
  onClose: () => void;
}

export const BlueprintSidePanel: React.FC<BlueprintSidePanelProps> = ({
  selectedSensor,
  selectedZone,
  sensors,
  sensorType,
  onEditSensor,
  onEditZone,
  onClose,
}) => {
  if (!selectedSensor && !selectedZone) {
    return (
      <div className="w-80 bg-white border-l border-slate-200 h-full flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-20">
        <div className="p-6 flex flex-col items-center justify-center h-full text-center text-slate-400 space-y-4">
          <MousePointer2Icon className="w-12 h-12" />
          <div>
            <p className="font-medium text-slate-600 mb-1">Select an element</p>
            <p className="text-sm">Click on a zone or sensor on the blueprint to view its details.</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-100 text-green-700 border-green-200";
      case "warning": return "bg-amber-100 text-amber-700 border-amber-200";
      case "critical": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="w-80 bg-white border-l border-slate-200 h-full flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-20">
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-800 flex items-center space-x-2">
          {selectedSensor ? (
            <><Activity className="w-4 h-4 text-blue-500" /> <span>Sensor Details</span></>
          ) : (
            <><Layers className="w-4 h-4 text-purple-500" /> <span>Zone Details</span></>
          )}
        </h2>
        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {selectedSensor && (
          <div className="space-y-6">
            <div>
              <div className="text-2xl font-mono font-bold text-slate-800 mb-2">{selectedSensor.sensorCode}</div>
              <div className="flex items-center space-x-2">
                <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wider", getStatusColor(selectedSensor.status))}>
                  {selectedSensor.status}
                </span>
                <span className="text-sm text-slate-500">{selectedSensor.name}</span>
              </div>
            </div>

            {selectedSensor.zoneId && (
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Location</h3>
                <div className="text-sm text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">
                  Zone ID: {selectedSensor.zoneId}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Measurements</h3>
              <div className="space-y-2">
                {selectedSensor.measurements.map(m => (
                  <div key={m.measurementKey} className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100">
                    <span className="text-sm font-medium text-slate-700">{m.displayName || m.measurementKey}</span>
                    <span className="text-xs text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">{m.unit}</span>
                  </div>
                ))}
              </div>
            </div>

            {onEditSensor && (
              <button onClick={onEditSensor} className="w-full mt-4 flex items-center justify-center space-x-2 py-2 border border-slate-200 rounded text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                <Edit className="w-4 h-4" />
                <span>Edit Sensor Config</span>
              </button>
            )}
          </div>
        )}

        {selectedZone && (
          <div className="space-y-6">
            <div>
              <div className="text-2xl font-bold text-slate-800 mb-1">{selectedZone.name}</div>
              {selectedZone.type && (
                <div className="text-sm text-slate-500 font-medium bg-slate-100 inline-block px-2 py-0.5 rounded">
                  Type: {selectedZone.type}
                </div>
              )}
            </div>

            {selectedZone.description && (
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded border border-slate-100">
                {selectedZone.description}
              </p>
            )}

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sensors in Zone</h3>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {sensors.filter(s => s.zoneId === selectedZone.id).length}
                </span>
              </div>
              
              <div className="space-y-2">
                {sensors.filter(s => s.zoneId === selectedZone.id).map(sensor => (
                  <div key={sensor.id} className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100">
                    <span className="text-sm font-mono font-medium text-slate-700">{sensor.sensorCode}</span>
                    <div className={cn("w-2 h-2 rounded-full", sensor.status === 'online' ? 'bg-green-500' : 'bg-slate-300')} />
                  </div>
                ))}
                {sensors.filter(s => s.zoneId === selectedZone.id).length === 0 && (
                  <div className="text-sm text-slate-400 italic text-center py-4">No sensors assigned to this zone</div>
                )}
              </div>
            </div>

            {onEditZone && (
              <button onClick={onEditZone} className="w-full mt-4 flex items-center justify-center space-x-2 py-2 border border-slate-200 rounded text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                <Edit className="w-4 h-4" />
                <span>Edit Zone Details</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Extracted simple icon for empty state to avoid extra lucide import above
const MousePointer2Icon = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z" />
  </svg>
);
