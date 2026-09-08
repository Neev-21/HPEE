import React from 'react';
import { cn } from '@/lib/utils';
import { type SensorStatus } from '@/types';

export const SensorStatusBadge: React.FC<{ status: SensorStatus; className?: string }> = ({ status, className }) => {
  const statusConfig: Record<SensorStatus, { dot: string; bg: string; text: string; label: string }> = {
    online: { dot: 'bg-green-500', bg: 'bg-green-100', text: 'text-green-800', label: 'Online' },
    warning: { dot: 'bg-amber-500', bg: 'bg-amber-100', text: 'text-amber-800', label: 'Warning' },
    critical: { dot: 'bg-red-500', bg: 'bg-red-100', text: 'text-red-800', label: 'Critical' },
    offline: { dot: 'bg-gray-500', bg: 'bg-gray-100', text: 'text-gray-800', label: 'Offline' },
    unknown: { dot: 'bg-gray-300', bg: 'bg-gray-50', text: 'text-gray-500', label: 'Unknown' },
  };

  const config = statusConfig[status] || statusConfig.unknown;

  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium', config.bg, config.text, className)}
      aria-label={`Status: ${config.label}`}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} aria-hidden="true" />
      {config.label}
    </span>
  );
};
