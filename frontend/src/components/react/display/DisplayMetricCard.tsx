import React from 'react';
import { cn } from '@/lib/utils';
import { Activity } from 'lucide-react';

export interface DisplayMetricCardProps {
  title: string;
  value: number | string;
  unit: string;
  status?: 'normal' | 'warning' | 'critical' | 'unknown';
}

export const DisplayMetricCard: React.FC<DisplayMetricCardProps> = ({
  title,
  value,
  unit,
  status = 'unknown'
}) => {
  const statusColors = {
    normal: 'border-green-500',
    warning: 'border-amber-500',
    critical: 'border-red-500',
    unknown: 'border-slate-600'
  };

  const statusDots = {
    normal: 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]',
    warning: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
    critical: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]',
    unknown: 'bg-slate-500'
  };

  return (
    <div className={cn(
      'flex flex-col p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-lg h-full',
      `border-l-8 ${statusColors[status]}`
    )}>
      <div className="flex justify-between items-center mb-auto">
        <h3 className="text-2xl font-medium text-slate-300 tracking-wide uppercase">{title}</h3>
        <div className={cn("w-3 h-3 rounded-full", statusDots[status])} />
      </div>
      
      <div className="mt-8 flex items-baseline gap-3">
        <span className="text-6xl md:text-7xl lg:text-8xl font-bold text-white tracking-tighter">
          {value}
        </span>
        <span className="text-3xl text-slate-400 font-medium">{unit}</span>
      </div>
      
      {/* Decorative background element */}
      <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none overflow-hidden rounded-br-xl">
        <Activity className="w-48 h-48 -mb-12 -mr-12" />
      </div>
    </div>
  );
};
