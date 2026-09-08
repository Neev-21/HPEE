import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface SetupProgressProps {
  steps: string[];
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
}

export function SetupProgress({ steps, currentStep, completedSteps, onStepClick }: SetupProgressProps) {
  return (
    <div className="w-full flex items-center justify-between mb-8 overflow-x-auto pb-4">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(index);
        const isCurrent = currentStep === index;
        return (
          <div key={index} className="flex items-center">
            <div className="flex flex-col items-center">
              <button
                disabled={!isCompleted && !isCurrent}
                onClick={() => onStepClick(index)}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  isCompleted ? "bg-green-500 text-white cursor-pointer" : 
                  isCurrent ? "bg-blue-600 text-white cursor-pointer" : "bg-slate-200 text-slate-500 cursor-not-allowed"
                )}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
              </button>
              <span className={cn(
                "text-xs mt-2 hidden sm:block whitespace-nowrap",
                isCurrent ? "font-bold text-slate-900" : "font-medium text-slate-500"
              )}>
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={cn(
                "h-1 w-8 sm:w-16 mx-2 rounded",
                isCompleted || (isCurrent && completedSteps.includes(index + 1)) ? "bg-green-500" : "bg-slate-200"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
