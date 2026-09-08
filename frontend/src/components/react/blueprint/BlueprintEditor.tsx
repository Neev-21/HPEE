import React, { useState, useCallback, useMemo } from "react";
import React, { useState, useCallback, useMemo, useEffect } from "react";
import type { Blueprint, FacilitySensor, FacilityZone, SensorType, Facility } from "@/types";
import { generateId } from "@/types";
import { generateId } from '@/types';
import { mockBlueprints } from "@/lib/mock/blueprints";
import { mockSensors } from "@/lib/mock/sensors";
import { mockZones } from "@/lib/mock/zones";
import { mockSensorTypes } from "@/lib/mock/sensorTypes";
import { BlueprintToolbar } from "./BlueprintToolbar";
import { BlueprintSidePanel } from "./BlueprintSidePanel";
import { BlueprintCanvas } from "./BlueprintCanvas";
import { BlueprintUploader } from "./BlueprintUploader";

// Normally we'd use services. For now, empty mocks or passed via props.
export interface BlueprintEditorProps {
  facilityId: string;
}

export const BlueprintEditor: React.FC<BlueprintEditorProps> = ({ facilityId }) => {
  // State
  const [activeTool, setActiveTool] = useState("select");
  const [zoom, setZoom] = useState(1);
  
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [sensors, setSensors] = useState<FacilitySensor[]>([]);
  const [zones, setZones] = useState<FacilityZone[]>([]);
  const [sensorTypes, setSensorTypes] = useState<SensorType[]>([]); // would load from service
  const [blueprint, setBlueprint] = useState<Blueprint | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('hpee-blueprints');
        if (saved) {
          const bps = JSON.parse(saved);
          if (Array.isArray(bps) && bps.length > 0) return bps[0];
        }
      } catch (e) {}
    }
    return (mockBlueprints && mockBlueprints[0]) || {
      id: 'bp-1',
      facilityId,
      name: 'Ankleshwar Plant Blueprint',
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
      width: 1200,
      height: 800
    };
  });
  const [sensors, setSensors] = useState<FacilitySensor[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('hpee-sensors');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return mockSensors;
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
  const [sensorTypes, setSensorTypes] = useState<SensorType[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('hpee-sensor-types');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return mockSensorTypes;
  });

  const [selectedSensorId, setSelectedSensorId] = useState<string | undefined>();
  const [selectedZoneId, setSelectedZoneId] = useState<string | undefined>();
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Derived state
  const selectedSensor = useMemo(() => sensors.find(s => s.id === selectedSensorId), [sensors, selectedSensorId]);
  const selectedZone = useMemo(() => zones.find(z => z.id === selectedZoneId), [zones, selectedZoneId]);
  
  // Handlers
  const handleToolChange = useCallback((tool: string) => {
    setActiveTool(tool);
    if (tool !== "select") {
      setSelectedSensorId(undefined);
      setSelectedZoneId(undefined);
    }
  }, []);

  const handleZoomIn = useCallback(() => setZoom(z => Math.min(3, z + 0.2)), []);
  const handleZoomOut = useCallback(() => setZoom(z => Math.max(0.5, z - 0.2)), []);
  const handleFit = useCallback(() => {
    setZoom(1);
    // Pan offset is handled in canvas, here we'd reset it ideally.
  }, []);

  const handleSave = useCallback(() => {
    // call service to save blueprint, zones, sensors
    if (typeof window !== 'undefined') {
      if (blueprint) localStorage.setItem('hpee-blueprints', JSON.stringify([blueprint]));
      localStorage.setItem('hpee-sensors', JSON.stringify(sensors));
      localStorage.setItem('hpee-zones', JSON.stringify(zones));
    }
    setHasUnsavedChanges(false);
    console.log("Saved blueprint configuration");
  }, []);
  }, [blueprint, sensors, zones]);

  const handleUpload = useCallback((file: File, dataUrl: string) => {
    const newBp: Blueprint = {
      id: generateId(),
      facilityId,
      name: "Main Facility Blueprint",
      imageUrl: dataUrl,
      width: 1920, // default, real implementation would read image dimensions
      height: 1080,
      originalFileName: file.name
    };
    
    // Read actual dimensions asynchronously
    const img = new Image();
    img.onload = () => {
      setBlueprint({ ...newBp, width: img.width, height: img.height });
      setHasUnsavedChanges(true);
    };
    img.src = dataUrl;
  }, [facilityId]);

  const handleSensorSelect = useCallback((id: string) => {
    if (activeTool === 'delete' && id) {
      setSensors(s => s.filter(sensor => sensor.id !== id));
      setHasUnsavedChanges(true);
      return;
    }
    setSelectedSensorId(id || undefined);
    if (id) setSelectedZoneId(undefined);
  }, [activeTool]);

  const handleZoneSelect = useCallback((id: string) => {
    if (activeTool === 'delete' && id) {
      setZones(z => z.filter(zone => zone.id !== id));
      setHasUnsavedChanges(true);
      return;
    }
    setSelectedZoneId(id || undefined);
    if (id) setSelectedSensorId(undefined);
  }, [activeTool]);

  const handleSensorMove = useCallback((id: string, position: {x: number, y: number}) => {
    setSensors(prev => prev.map(s => s.id === id ? { ...s, position } : s));
    setHasUnsavedChanges(true);
  }, []);

  const handleZoneCreate = useCallback((zoneData: Partial<FacilityZone>) => {
    const newZoneName = prompt("Enter Zone Name:", "New Zone");
    if (!newZoneName) return;

    const newZone: FacilityZone = {
      id: generateId(),
      facilityId,
      name: newZoneName,
      type: "Production",
      polygon: zoneData.polygon,
    };
    setZones(prev => [...prev, newZone]);
    setActiveTool("select");
    setSelectedZoneId(newZone.id);
    setHasUnsavedChanges(true);
  }, [facilityId]);

  const handleSensorPlace = useCallback((position: {x: number, y: number}) => {
    const code = prompt("Enter Sensor Code:", `SN-${Math.floor(Math.random()*1000)}`);
    if (!code) return;

    const newSensor: FacilitySensor = {
      id: generateId(),
      facilityId,
      sensorCode: code,
      name: `Sensor ${code}`,
      sensorTypeId: sensorTypes.length > 0 ? sensorTypes[0].id : "default",
      position,
      measurements: [],
      thresholds: [],
      status: "unknown"
    };
    
    setSensors(prev => [...prev, newSensor]);
    setActiveTool("select");
    setSelectedSensorId(newSensor.id);
    setHasUnsavedChanges(true);
  }, [facilityId, sensorTypes]);

  if (!blueprint) {
    return (
      <div className="flex-1 w-full h-full bg-white flex items-center justify-center p-8">
        <div className="max-w-xl w-full">
          <BlueprintUploader onUpload={handleUpload} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-white overflow-hidden text-slate-800">
      <BlueprintToolbar
        activeTool={activeTool}
        onToolChange={handleToolChange}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFit={handleFit}
        onSave={handleSave}
        canSave={hasUnsavedChanges}
      />
      
      <BlueprintCanvas
        blueprint={blueprint}
        sensors={sensors}
        zones={zones}
        selectedSensorId={selectedSensorId}
        selectedZoneId={selectedZoneId}
        activeTool={activeTool}
        zoom={zoom}
        onSensorSelect={handleSensorSelect}
        onZoneSelect={handleZoneSelect}
        onSensorMove={handleSensorMove}
        onZoneCreate={handleZoneCreate}
        onSensorPlace={handleSensorPlace}
      />

      {(selectedSensorId || selectedZoneId) && (
        <BlueprintSidePanel
          selectedSensor={selectedSensor}
          selectedZone={selectedZone}
          sensors={sensors}
          onClose={() => {
            setSelectedSensorId(undefined);
            setSelectedZoneId(undefined);
          }}
        />
      )}
    </div>
  );
};
