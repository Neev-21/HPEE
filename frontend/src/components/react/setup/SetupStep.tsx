import React from 'react';
import { AlertCircle } from 'lucide-react';

interface SetupStepProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  isValid?: boolean;
}

export function SetupStep({ title, description, children, isValid = true }: SetupStepProps) {
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
        </div>
        {!isValid && (
          <div className="flex items-center text-amber-600 bg-amber-50 px-3 py-1 rounded-md text-sm">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span>Missing required fields</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        {children}
      </div>
    </div>
  );
}
