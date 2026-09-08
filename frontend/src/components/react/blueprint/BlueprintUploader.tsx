import React, { useState, useRef } from "react";
import { UploadCloud, FileImage, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BlueprintUploaderProps {
  onUpload: (file: File, dataUrl: string) => void;
  currentImageUrl?: string;
}

export const BlueprintUploader: React.FC<BlueprintUploaderProps> = ({
  onUpload,
  currentImageUrl,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/png") && !file.type.startsWith("image/jpeg")) {
      setError("Invalid file type. Please upload a PNG or JPG image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && typeof e.target.result === "string") {
        onUpload(file, e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  if (currentImageUrl) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-6 border rounded-lg bg-slate-50">
        <img
          src={currentImageUrl}
          alt="Blueprint Preview"
          className="max-h-64 object-contain rounded border border-slate-200 shadow-sm"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 rounded shadow-sm hover:bg-slate-50 text-slate-700 text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Replace Blueprint</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg"
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl transition-colors",
        isDragging
          ? "border-blue-500 bg-blue-50"
          : "border-slate-300 bg-slate-50 hover:bg-slate-100"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <UploadCloud
        className={cn(
          "w-16 h-16 mb-4",
          isDragging ? "text-blue-500" : "text-slate-400"
        )}
      />
      <h3 className="text-lg font-medium text-slate-800 mb-1">
        Drag & Drop your facility blueprint
      </h3>
      <p className="text-sm text-slate-500 mb-4">PNG / JPG supported</p>
      
      <div className="flex items-center space-x-4 w-full max-w-xs mb-4">
        <div className="flex-1 border-t border-slate-300"></div>
        <span className="text-slate-400 text-sm">or</span>
        <div className="flex-1 border-t border-slate-300"></div>
      </div>

      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 font-medium transition-colors"
      >
        <FileImage className="w-4 h-4" />
        <span>Upload File</span>
      </button>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg"
        className="hidden"
      />

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </div>
  );
};
