import React from "react";
import type { FacilitySensor } from "@/types";
import { cn } from "@/lib/utils";

export interface SensorMarkerProps {
  sensor: FacilitySensor;
  isSelected: boolean;
  isDragging: boolean;
  onSelect: () => void;
  value?: { key: string; value: number; unit: string };
  showLabel: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "online":
      return "bg-green-500";
    case "warning":
      return "bg-amber-500";
    case "critical":
      return "bg-red-500";
    default:
      return "bg-slate-500";
  }
};

export const SensorMarker: React.FC<SensorMarkerProps> = ({
  sensor,
  isSelected,
  isDragging,
  onSelect,
  value,
  showLabel,
}) => {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={cn(
        "absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 transition-transform",
        isDragging ? "scale-110 opacity-80 shadow-lg cursor-grabbing" : "cursor-grab",
        "hover:z-20"
      )}
      style={{
        left: `${sensor.position.x * 100}%`,
        top: `${sensor.position.y * 100}%`,
      }}
      data-sensor-id={sensor.id}
    >
      <div
        className={cn(
          "w-4 h-4 rounded-full border-2 border-white shadow-md transition-shadow",
          getStatusColor(sensor.status),
          isSelected && "ring-4 ring-blue-500/50 ring-offset-1"
        )}
      />
      {showLabel && (
        <div className="mt-1 flex flex-col items-center">
          <span className="px-1.5 py-0.5 bg-slate-900/80 text-white text-[10px] font-mono rounded whitespace-nowrap">
            {sensor.sensorCode}
          </span>
          {value && (
            <span className="mt-0.5 px-1.5 py-0.5 bg-white/90 border border-slate-200 text-slate-800 text-[10px] rounded whitespace-nowrap shadow-sm font-medium">
              {value.key} {value.value.toFixed(1)} {value.unit}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
