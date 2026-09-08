import React from 'react';
import { cn } from '@/lib/utils';
import { type AlertEvent, type WidgetSize } from '@/types';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

export interface AlertWidgetProps {
  alerts: AlertEvent[];
  size: WidgetSize;
  onAcknowledge?: (alertId: string) => void;
}

export const AlertWidget: React.FC<AlertWidgetProps> = ({ alerts, size, onAcknowledge }) => {
  const activeAlerts = alerts.filter(a => !a.acknowledged);

  return (
    <div className="flex flex-col bg-white border border-slate-200 rounded-lg shadow-sm h-full overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 className="text-sm font-medium text-slate-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Active Alerts
        </h3>
        <span className="bg-red-100 text-red-700 py-0.5 px-2 rounded-full text-xs font-bold">
          {activeAlerts.length}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {activeAlerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6">
            <CheckCircle className="w-8 h-8 mb-2 text-green-400" />
            <p className="text-sm">No active alerts</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeAlerts.map(alert => (
              <div 
                key={alert.id} 
                className={cn(
                  "p-3 rounded-md border text-sm flex items-start gap-3",
                  alert.level === 'critical' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                )}
              >
                <div className="mt-0.5">
                  <AlertTriangle className={cn(
                    "w-4 h-4",
                    alert.level === 'critical' ? 'text-red-600' : 'text-amber-600'
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-slate-900 truncate pr-2">
                      {alert.message}
                    </span>
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {alert.measurementKey} on {alert.sensorId}: {alert.value} (Threshold: {alert.threshold})
                  </p>
                </div>
                {onAcknowledge && (
                  <button 
                    onClick={() => onAcknowledge(alert.id)}
                    className="text-xs bg-white border border-slate-300 hover:bg-slate-50 px-2 py-1 rounded shadow-sm text-slate-700 whitespace-nowrap transition-colors"
                  >
                    Ack
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
