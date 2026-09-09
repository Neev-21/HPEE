'use client';

import React from 'react';
import { appStore, type BlueprintZone, type BlueprintPin } from '@/lib/store';

interface FacilityBlueprintProps {
  selectedPinId?: string;
  onSelectPin?: (pin: BlueprintPin) => void;
  editable?: boolean;
}

export default function FacilityBlueprint({
  selectedPinId,
  onSelectPin,
  editable = false,
}: FacilityBlueprintProps) {
  const [zones, setZones] = React.useState<BlueprintZone[]>([]);
  const [pins, setPins] = React.useState<BlueprintPin[]>([]);

  React.useEffect(() => {
    setZones(appStore.getZones());
    setPins(appStore.getPins());
    return appStore.subscribe(() => {
      setZones(appStore.getZones());
      setPins(appStore.getPins());
    });
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '560px',
        height: '100%',
        overflow: 'hidden',
        background:
          'linear-gradient(90deg, rgba(13, 119, 120, 0.06) 1px, transparent 1px), linear-gradient(rgba(13, 119, 120, 0.06) 1px, transparent 1px), #fcfdfd',
        backgroundSize: '32px 32px',
        border: '1px solid #e4e4e7',
      }}
    >
      {/* Floor boundaries */}
      <div
        style={{
          position: 'absolute',
          left: '5%',
          right: '5%',
          top: '6%',
          bottom: '8%',
          border: '2px solid #52525b',
          background: 'rgba(255, 255, 255, 0.85)',
        }}
      >
        {/* Render Zones */}
        {zones.map((zone) => (
          <div
            key={zone.id}
            style={{
              position: 'absolute',
              left: zone.left,
              top: zone.top,
              width: zone.width,
              height: zone.height,
              border: '2px dashed #94a3b8',
              background: 'rgba(226, 232, 240, 0.45)',
              padding: '8px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#334155',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'flex-start',
              userSelect: 'none',
            }}
          >
            {zone.name}
          </div>
        ))}

        {/* Industrial Piping Connectors */}
        <div
          style={{
            position: 'absolute',
            left: '39%',
            top: '25%',
            height: '4px',
            width: '7%',
            background: '#64748b',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '71%',
            top: '24%',
            height: '4px',
            width: '8%',
            background: '#64748b',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '45%',
            top: '70%',
            height: '4px',
            width: '9%',
            background: '#64748b',
          }}
        />

        {/* Interactive Sensor Pins */}
        {pins.map((pin, idx) => {
          const isSelected = selectedPinId === pin.id || selectedPinId === pin.sensorId;
          const pinNumber = idx + 1;
          return (
            <button
              key={pin.id}
              onClick={() => onSelectPin?.(pin)}
              style={{
                position: 'absolute',
                left: pin.left,
                top: pin.top,
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: isSelected ? '#d97706' : '#0d7778',
                border: '4px solid #ffffff',
                boxShadow: isSelected
                  ? '0 0 0 3px rgba(217, 119, 6, 0.4), 0 8px 16px rgba(217, 119, 6, 0.3)'
                  : '0 0 0 3px rgba(13, 119, 120, 0.2), 0 8px 16px rgba(13, 119, 120, 0.25)',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                zIndex: 10,
                transform: isSelected ? 'scale(1.12)' : 'scale(1)',
                transition: 'all 0.15s ease-in-out',
              }}
              title={`${pin.sensorId} (${pin.zone})`}
            >
              S{pinNumber}
            </button>
          );
        })}
      </div>

      {/* Legend strip */}
      <div
        style={{
          position: 'absolute',
          left: '16px',
          bottom: '14px',
          background: '#ffffff',
          border: '1px solid #d4d4d8',
          padding: '6px 12px',
          display: 'flex',
          gap: '14px',
          fontSize: '11px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          zIndex: 12,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#0d7778',
              display: 'inline-block',
            }}
          />
          Installed Sensor
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span
            style={{
              width: '10px',
              height: '10px',
              border: '1px dashed #64748b',
              background: '#e2e8f0',
              display: 'inline-block',
            }}
          />
          Facility Zone
        </span>
        <span style={{ color: '#71717a' }}>Click any sensor node for live telemetry</span>
      </div>
    </div>
  );
}
