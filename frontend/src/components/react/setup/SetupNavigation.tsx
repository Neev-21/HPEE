import React from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface SetupNavigationProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onComplete?: () => void;
  canProceed: boolean;
  isLastStep: boolean;
}

export function SetupNavigation({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onComplete,
  canProceed,
  isLastStep
}: SetupNavigationProps) {
  return (
    <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-200">
      <button
        onClick={onBack}
        disabled={currentStep === 0}
        className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-4 h-4 mr-2" />
        Back
      </button>
      
      {isLastStep ? (
        <button
          onClick={onComplete}
          disabled={!canProceed}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Complete Setup
          <Check className="w-4 h-4 ml-2" />
        </button>
      ) : (
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save & Continue
          <ChevronRight className="w-4 h-4 ml-2" />
        </button>
      )}
    </div>
  );
}
