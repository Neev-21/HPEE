import React, { useEffect } from "react";
import { MousePointer2, Square, MapPin, Trash2, ZoomIn, ZoomOut, Maximize2, Save } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BlueprintToolbarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onSave: () => void;
  canSave: boolean;
}

export const BlueprintToolbar: React.FC<BlueprintToolbarProps> = ({
  activeTool,
  onToolChange,
  zoom,
  onZoomIn,
  onZoomOut,
  onFit,
  onSave,
  canSave,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key.toLowerCase()) {
        case "s":
          onToolChange("select");
          break;
        case "z":
          onToolChange("addZone");
          break;
        case "n":
          onToolChange("addSensor");
          break;
        case "delete":
        case "backspace":
          onToolChange("delete");
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onToolChange]);

  const ToolButton = ({ icon: Icon, tool, label }: { icon: React.ElementType, tool: string, label: string }) => (
    <button
      onClick={() => onToolChange(tool)}
      className={cn(
        "p-3 flex items-center justify-center rounded-lg transition-colors group relative",
        activeTool === tool
          ? "bg-blue-600 text-white"
          : "text-slate-300 hover:bg-slate-700 hover:text-white"
      )}
      title={label}
    >
      <Icon className="w-5 h-5" />
    </button>
  );

  return (
    <div className="w-16 bg-slate-800 flex flex-col items-center py-4 border-r border-slate-700 h-full flex-shrink-0 z-20">
      <div className="flex flex-col space-y-2 w-full px-2">
        <ToolButton icon={MousePointer2} tool="select" label="Select (S)" />
        <ToolButton icon={Square} tool="addZone" label="Add Zone (Z)" />
        <ToolButton icon={MapPin} tool="addSensor" label="Add Sensor (N)" />
        <ToolButton icon={Trash2} tool="delete" label="Delete (Del)" />
      </div>

      <div className="w-8 h-px bg-slate-700 my-4" />

      <div className="flex flex-col space-y-2 w-full px-2">
        <button
          onClick={onZoomIn}
          className="p-3 flex items-center justify-center rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <div className="text-center text-[10px] text-slate-400 font-mono select-none">
          {Math.round(zoom * 100)}%
        </div>
        <button
          onClick={onZoomOut}
          className="p-3 flex items-center justify-center rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={onFit}
          className="p-3 flex items-center justify-center rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          title="Fit to screen"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-auto flex flex-col w-full px-2 pb-4 space-y-4">
        <div className="w-8 h-px bg-slate-700 mx-auto" />
        <button
          onClick={onSave}
          disabled={!canSave}
          className={cn(
            "p-3 flex items-center justify-center rounded-lg transition-colors",
            canSave
              ? "bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20"
              : "bg-slate-700 text-slate-500 cursor-not-allowed"
          )}
          title={canSave ? "Save Changes" : "No changes to save"}
        >
          <Save className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
