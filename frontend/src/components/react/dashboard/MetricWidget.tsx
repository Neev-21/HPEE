import React from 'react';
import { cn } from '@/lib/utils';
import { type WidgetSize } from '@/types';

export interface MetricWidgetProps {
  title: string;
  value: number | string | null;
  unit: string;
  status?: 'normal' | 'warning' | 'critical' | 'unknown';
  size: WidgetSize;
  decimalPlaces?: number;
}

export const MetricWidget: React.FC<MetricWidgetProps> = ({
  title,
  value,
  unit,
  status = 'unknown',
  size,
  decimalPlaces = 2
}) => {
  const isNull = value === null || value === undefined;
  
  const displayValue = !isNull && typeof value === 'number'
    ? value.toFixed(decimalPlaces)
    : (value ?? '--');

  const statusColors = {
    normal: 'border-green-500 text-green-600',
    warning: 'border-amber-500 text-amber-600',
    critical: 'border-red-500 text-red-600',
    unknown: 'border-gray-300 text-gray-500'
  };

  const bgColors = {
    normal: 'bg-green-50',
    warning: 'bg-amber-50',
    critical: 'bg-red-50',
    unknown: 'bg-gray-50'
  };

  return (
    <div className={cn(
      'flex flex-col p-4 bg-white border rounded-lg shadow-sm',
      size === 'small' ? 'h-24' : 'h-32',
      `border-l-4 ${statusColors[status].split(' ')[0]}`
    )}>
      <h3 className="text-sm font-medium text-slate-500 truncate">{title}</h3>
      <div className="mt-auto flex items-baseline gap-2">
        <span className={cn(
          "font-bold text-slate-900 tracking-tight",
          size === 'small' ? 'text-2xl' : 'text-4xl'
        )}>
          {displayValue}
        </span>
        <span className="text-sm font-medium text-slate-500">{unit}</span>
      </div>
      <div className={cn('mt-2 h-1 w-full rounded-full', bgColors[status])} />
    </div>
  );
};
