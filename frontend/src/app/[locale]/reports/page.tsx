'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { fetchPollutionEvents, type PollutionEvent } from '@/lib/api';

export default function ReportsPage() {
  const t = useTranslations('Header');
  const [events, setEvents] = useState<PollutionEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPollutionEvents()
      .then(setEvents)
      .catch(() => {
        setEvents([]);
      })
      .finally(() => setLoading(false));

    const id = setInterval(() => {
      fetchPollutionEvents().then(setEvents).catch(() => {});
    }, 30_000);

    return () => clearInterval(id);
  }, []);

  const stats = useMemo(() => {
    const activeCount = events.filter((event) => event.status === 'active').length;
    const severeCount = events.filter((event) => ['critical', 'severe'].includes(event.severity)).length;
    const avgPeakPm25 = events.filter((event) => typeof event.peak_pm25 === 'number').reduce((sum, event) => sum + (event.peak_pm25 ?? 0), 0) / Math.max(1, events.filter((event) => typeof event.peak_pm25 === 'number').length);

    return [
      {
        title: 'Total Incidents',
        value: String(events.length),
        sub: 'Live event count from backend',
        color: 'text-amber-600',
      },
      {
        title: 'Active Alerts',
        value: String(activeCount),
        sub: 'Events currently in active state',
        color: 'text-red-600',
      },
      {
        title: 'Avg PM2.5',
        value: `${avgPeakPm25 ? avgPeakPm25.toFixed(0) : '0'} µg/m³`,
        sub: `${severeCount} severe events flagged`,
        color: 'text-stone-600',
      },
    ];
  }, [events]);

  return (
    <div className="p-6 md:p-8 h-[calc(100vh-118px)] overflow-y-auto bg-[#fffff0]">
      <h2 className="text-xl font-bold uppercase tracking-wide mb-2 text-[#2c2c2c]">
        Compliance & Analytics Reports
      </h2>
      <p className="text-sm text-stone-600 mb-8 max-w-2xl">
        Live environmental compliance summary for the {t('title')} monitoring network.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.title} className="bg-[#fdfbf7] border border-stone-200 p-5 rounded-lg shadow-sm">
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">{stat.title}</h3>
            <div className={`text-3xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
            <p className="text-xs text-stone-400 mt-2">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#fdfbf7] border border-stone-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#2c2c2c] mb-4">Recent events</h3>

        {loading ? (
          <p className="text-sm text-stone-500">Loading event data…</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-stone-500">No upstream events available yet.</p>
        ) : (
          <div className="space-y-3">
            {events.slice(0, 5).map((event) => (
              <div key={event.event_id} className="flex items-center justify-between border border-stone-200 rounded-md px-3 py-2">
                <div>
                  <div className="text-xs uppercase tracking-wide text-stone-500">{event.village_name}</div>
                  <div className="text-sm font-medium text-stone-700">{event.severity.toUpperCase()} • {event.status}</div>
                </div>
                <div className="text-right text-xs text-stone-500 font-mono">
                  <div>PM2.5 {event.peak_pm25 ?? '—'}</div>
                  <div>SO2 {event.peak_so2 ?? '—'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
