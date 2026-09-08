import React, { useRef, useState, useEffect, useCallback } from "react";
import type { Blueprint, FacilitySensor, FacilityZone } from "@/types";
import { ZoneShape } from "./ZoneShape";
import { SensorMarker } from "./SensorMarker";
import { cn } from "@/lib/utils";

export interface BlueprintCanvasProps {
  blueprint: Blueprint | null;
  sensors: FacilitySensor[];
  zones: FacilityZone[];
  selectedSensorId?: string;
  selectedZoneId?: string;
  activeTool: string;
  zoom: number;
  onSensorSelect: (id: string) => void;
  onZoneSelect: (id: string) => void;
  onSensorMove: (id: string, position: { x: number; y: number }) => void;
  onZoneCreate: (zone: Partial<FacilityZone>) => void;
  onSensorPlace: (position: { x: number; y: number }) => void;
}

export const BlueprintCanvas: React.FC<BlueprintCanvasProps> = ({
  blueprint,
  sensors,
  zones,
  selectedSensorId,
  selectedZoneId,
  activeTool,
  zoom,
  onSensorSelect,
  onZoneSelect,
  onSensorMove,
  onZoneCreate,
  onSensorPlace,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // Interaction state
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Drawing zone state
  const [isDrawingZone, setIsDrawingZone] = useState(false);
  const [drawStartPos, setDrawStartPos] = useState<{x: number, y: number} | null>(null);
  const [drawCurrentPos, setDrawCurrentPos] = useState<{x: number, y: number} | null>(null);

  // Dragging sensor state
  const [draggingSensorId, setDraggingSensorId] = useState<string | null>(null);

  // Measure container
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [blueprint]); // Remeasure if blueprint changes

  const getNormalizedPos = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    
    // Account for pan and zoom to get coordinates relative to the original image center
    // Math:
    // displayed_x = rect.left + panOffset.x + (x * rect.width) * zoom
    // However, to keep things simple with relative overlay, we assume the wrapper scales.
    
    const x = (clientX - rect.left - panOffset.x) / (rect.width * zoom);
    const y = (clientY - rect.top - panOffset.y) / (rect.height * zoom);
    
    // Clamp to 0-1
    return {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
    };
  }, [panOffset, zoom, dimensions]);

  // Handle pointer events
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle click or Alt+click for pan
      setIsPanning(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      containerRef.current?.setPointerCapture(e.pointerId);
      return;
    }

    if (e.button !== 0) return; // Only left click for tools

    const normPos = getNormalizedPos(e.clientX, e.clientY);

    if (activeTool === "addZone") {
      setIsDrawingZone(true);
      setDrawStartPos(normPos);
      setDrawCurrentPos(normPos);
      containerRef.current?.setPointerCapture(e.pointerId);
    } else if (activeTool === "addSensor") {
      onSensorPlace(normPos);
    } else if (activeTool === "select") {
      // Background click deselects
      if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === "IMG") {
        onSensorSelect("");
        onZoneSelect("");
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      return;
    }

    const normPos = getNormalizedPos(e.clientX, e.clientY);

    if (isDrawingZone && drawStartPos) {
      setDrawCurrentPos(normPos);
    } else if (draggingSensorId) {
      // Move sensor visually (we update the parent on mouse up for persistence, but we could update continuously too)
      // For performance, we might just update local state or let parent handle it if it's fast enough.
      // Assuming parent updates fast enough:
      onSensorMove(draggingSensorId, normPos);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    containerRef.current?.releasePointerCapture(e.pointerId);
    setIsPanning(false);

    if (isDrawingZone && drawStartPos && drawCurrentPos) {
      setIsDrawingZone(false);
      // Create rectangle polygon
      const minX = Math.min(drawStartPos.x, drawCurrentPos.x);
      const maxX = Math.max(drawStartPos.x, drawCurrentPos.x);
      const minY = Math.min(drawStartPos.y, drawCurrentPos.y);
      const maxY = Math.max(drawStartPos.y, drawCurrentPos.y);

      // Only create if area > some threshold
      if (maxX - minX > 0.01 && maxY - minY > 0.01) {
        onZoneCreate({
          name: "New Zone",
          polygon: [
            { x: minX, y: minY },
            { x: maxX, y: minY },
            { x: maxX, y: maxY },
            { x: minX, y: maxY },
          ],
        });
      }
      setDrawStartPos(null);
      setDrawCurrentPos(null);
    }

    if (draggingSensorId) {
      setDraggingSensorId(null);
    }
  };

  // Sensor dragging logic specific for sensors
  const handleSensorPointerDown = (e: React.PointerEvent, id: string) => {
    if (activeTool === "select") {
      e.stopPropagation();
      onSensorSelect(id);
      setDraggingSensorId(id);
      containerRef.current?.setPointerCapture(e.pointerId);
    } else if (activeTool === "delete") {
      e.stopPropagation();
      // Handle delete - wait for parent implementation or add callback
      console.log("Delete sensor", id);
    }
  };

  if (!blueprint) {
    return (
      <div className="flex-1 bg-slate-100 flex items-center justify-center relative overflow-hidden"
        style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        <div className="text-slate-400 bg-white/80 px-6 py-4 rounded-lg shadow-sm border border-slate-200">
          No blueprint uploaded
        </div>
      </div>
    );
  }

  // Calculate container dimensions based on blueprint aspect ratio to fit inside
  const aspect = blueprint.width / blueprint.height;
  
  // Transform style for pan/zoom
  const transformStyle = {
    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
    transformOrigin: "center",
  };

  return (
    <div 
      className={cn("flex-1 overflow-hidden relative bg-slate-100 cursor-crosshair select-none", 
        isPanning ? "cursor-grabbing" : (activeTool === "select" ? "cursor-default" : "cursor-crosshair")
      )}
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}
    >
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-out"
        style={transformStyle}
      >
        <div 
          className="relative shadow-xl"
          style={{ 
            width: dimensions.width > 0 ? (aspect > dimensions.width/dimensions.height ? dimensions.width * 0.9 : dimensions.height * 0.9 * aspect) : '800px',
            aspectRatio: `${blueprint.width}/${blueprint.height}`
          }}
        >
          {/* Base Image */}
          <img 
            src={blueprint.imageUrl} 
            alt="Blueprint" 
            className="w-full h-full object-contain select-none pointer-events-none"
            draggable={false}
          />

          {/* Zones Overlay (SVG) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <g className="pointer-events-auto">
              {zones.map((zone, i) => (
                <ZoneShape
                  key={zone.id}
                  zone={zone}
                  index={i}
                  isSelected={zone.id === selectedZoneId}
                  containerWidth={1} // Use 1 for percentage-based if parent wrapper has width 100%? No, ZoneShape assumes containerWidth is pixel size. 
                  // Wait, actually if SVG viewBox is 0 0 1 1, it matches normalized coords!
                  // Let's modify ZoneShape call or SVG viewBox.
                  containerHeight={1}
                  onSelect={() => {
                    if (activeTool === "select") onZoneSelect(zone.id);
                  }}
                />
              ))}
              {/* Drawing temporary zone */}
              {isDrawingZone && drawStartPos && drawCurrentPos && (
                <polygon
                  points={`${drawStartPos.x},${drawStartPos.y} ${drawCurrentPos.x},${drawStartPos.y} ${drawCurrentPos.x},${drawCurrentPos.y} ${drawStartPos.x},${drawCurrentPos.y}`}
                  className="fill-blue-500/20 stroke-blue-500 stroke-2 border-dashed stroke-dasharray-[4_4]"
                />
              )}
            </g>
          </svg>

          {/* Sensors Overlay (HTML Absolute) */}
          {sensors.map((sensor) => (
            <div 
              key={sensor.id} 
              onPointerDown={(e) => handleSensorPointerDown(e, sensor.id)}
              className="absolute left-0 top-0 w-full h-full pointer-events-none"
            >
              <div className="pointer-events-auto">
                <SensorMarker
                  sensor={sensor}
                  isSelected={sensor.id === selectedSensorId}
                  isDragging={draggingSensorId === sensor.id}
                  showLabel={zoom > 0.7}
                  onSelect={() => {
                    if (activeTool === "select") onSensorSelect(sensor.id);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
