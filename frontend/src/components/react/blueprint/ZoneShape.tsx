import React, { useMemo } from "react";
import type { FacilityZone } from "@/types";
import { cn } from "@/lib/utils";

export interface ZoneShapeProps {
  zone: FacilityZone;
  isSelected: boolean;
  containerWidth: number;
  containerHeight: number;
  onSelect: () => void;
  index: number;
}

const ZONE_COLORS = [
  { fill: "fill-blue-500/20", stroke: "stroke-blue-500" },
  { fill: "fill-purple-500/20", stroke: "stroke-purple-500" },
  { fill: "fill-teal-500/20", stroke: "stroke-teal-500" },
  { fill: "fill-orange-500/20", stroke: "stroke-orange-500" },
  { fill: "fill-pink-500/20", stroke: "stroke-pink-500" },
];

export const ZoneShape: React.FC<ZoneShapeProps> = ({
  zone,
  isSelected,
  containerWidth,
  containerHeight,
  onSelect,
  index,
}) => {
  if (!zone.polygon || zone.polygon.length < 3) return null;

  const points = useMemo(() => {
    return zone.polygon!
      .map((p) => `${p.x * containerWidth},${p.y * containerHeight}`)
      .join(" ");
  }, [zone.polygon, containerWidth, containerHeight]);

  const centroid = useMemo(() => {
    let cx = 0, cy = 0;
    zone.polygon!.forEach((p) => {
      cx += p.x;
      cy += p.y;
    });
    const len = zone.polygon!.length;
    return { x: cx / len, y: cy / len };
  }, [zone.polygon]);

  const colors = ZONE_COLORS[index % ZONE_COLORS.length];

  return (
    <g onClick={(e) => { e.stopPropagation(); onSelect(); }} className="cursor-pointer group">
      <polygon
        points={points}
        className={cn(
          "transition-all",
          colors.fill,
          colors.stroke,
          isSelected ? "stroke-[3px] fill-opacity-40" : "stroke-2 hover:fill-opacity-30",
          isSelected && colors.fill.replace("/20", "/40")
        )}
      />
      <text
        x={centroid.x * containerWidth}
        y={centroid.y * containerHeight}
        textAnchor="middle"
        dominantBaseline="middle"
        className={cn(
          "text-xs font-semibold select-none pointer-events-none fill-slate-800",
          isSelected ? "font-bold" : "opacity-80 group-hover:opacity-100"
        )}
        style={{ textShadow: "1px 1px 2px white, -1px -1px 2px white, 1px -1px 2px white, -1px 1px 2px white" }}
      >
        {zone.name}
      </text>
    </g>
  );
};
