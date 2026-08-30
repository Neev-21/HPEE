'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { fetchPollutionEvents, type PollutionEvent } from '@/lib/api';

const SEVERITY_DOT: Record<string, string> = {
  critical: '#dc2626',
  severe: '#dc2626',
  watch: '#d97706',
  normal: '#16a34a',
};

export default function IncidentsPage() {
  const t = useTranslations('Incidents');
  const tCommon = useTranslations('Common');
  const [events, setEvents] = useState<PollutionEvent[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewingEvent, setViewingEvent] = useState<PollutionEvent | null>(null);

  useEffect(() => {
    fetchPollutionEvents()
      .then(setEvents)
      .catch(() => { /* backend offline */ })
      .finally(() => setLoading(false));

    // Auto-refresh every 60s
    const id = setInterval(() => {
      fetchPollutionEvents().then(setEvents).catch(() => {});
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const filtered = events.filter((e) =>
    !filter ||
    e.event_id.includes(filter) ||
    (e.village_name?.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <div style={{ padding: '0', overflowY: 'auto', height: 'calc(100vh - 118px)' }}>
      {/* Panel header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #e4e4e7',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
            {t('title')}
          </h2>
          <p style={{ fontSize: '11px', color: '#71717a', margin: '2px 0 0' }}>{t('subtitle')}</p>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#71717a' }}>
          FEED / {String(events.length).padStart(2, '0')} OPEN
        </span>
      </div>

      {/* Filter row */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #e4e4e7', display: 'flex', gap: 8 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          border: '1px solid #e4e4e7', padding: '5px 10px', flex: 1,
        }}>
          <span style={{ color: '#71717a', fontSize: 13 }}>🔍</span>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t('filterPlaceholder')}
            style={{
              border: 'none', outline: 'none', fontFamily: 'inherit',
              fontSize: '12px', width: '100%', background: 'transparent',
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#fdfbf7] border-b-2 border-[#d6d3d1]">
              {[
                t('colSeverity'), t('colIncidentId'), t('colTime'),
                t('colSite'), t('colReading'), t('colStatus'), t('colAction'),
              ].map((col) => (
                <th key={col} style={{
                  padding: '8px 12px', fontSize: '10px', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.6px',
                  color: '#71717a', whiteSpace: 'nowrap',
                }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#71717a' }}>
                  {tCommon('loading')}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#71717a' }}>
                  {t('noIncidents')}
                </td>
              </tr>
            ) : (
              filtered.map((ev) => {
                const sev = ev.severity === 'severe' ? 'critical' : ev.severity;
                const dotColor = SEVERITY_DOT[sev] || '#71717a';
                return (
                  <tr key={ev.event_id} style={{ borderBottom: '1px solid #f4f4f5' }}>
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          className={sev === 'critical' ? 'severity-pulse' : ''}
                          style={{ display: 'inline-block', width: 8, height: 8, background: dotColor }}
                        />
                        <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                          {sev === 'critical' ? t('severity.critical') : sev === 'watch' ? t('severity.watch') : t('severity.normal')}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                      {ev.event_id.substring(0, 8).toUpperCase()}
                    </td>
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: '11px', whiteSpace: 'nowrap' }}>
                      {new Date(ev.detected_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <strong style={{ fontSize: '12px', display: 'block' }}>{ev.village_name}</strong>
                    </td>
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                      {ev.peak_pm25 ? `PM2.5 ${ev.peak_pm25.toFixed(0)} µg/m³` : '—'}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 6px',
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        background: ev.status === 'active' ? '#fef2f2' : '#f4f4f5',
                        color: ev.status === 'active' ? '#dc2626' : '#52525b',
                        border: `1px solid ${ev.status === 'active' ? '#dc2626' : '#e4e4e7'}`,
                        textTransform: 'uppercase',
                      }}>
                        {ev.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <button 
                        onClick={() => setViewingEvent(ev)}
                        style={{
                          background: '#2c2c2c',
                          color: '#fffff0',
                          border: 'none',
                          padding: '6px 12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          borderRadius: '6px'
                        }}
                      >
                        {t('view')}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* View Modal */}
      {viewingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[#fffff0] border border-[#d6d3d1] rounded-lg shadow-xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold mb-4 text-[#2c2c2c]">Incident Details</h3>
            <div className="space-y-3 text-sm text-stone-700">
              <p><strong>ID:</strong> {viewingEvent.event_id}</p>
              <p><strong>Location:</strong> {viewingEvent.village_name}</p>
              <p><strong>Status:</strong> <span className="uppercase font-bold text-amber-600">{viewingEvent.status}</span></p>
              <p><strong>Severity:</strong> <span className="uppercase font-bold text-red-600">{viewingEvent.severity}</span></p>
              <p><strong>Detected At:</strong> {new Date(viewingEvent.detected_at).toLocaleString('en-IN')}</p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-3 bg-[#fdfbf7] border border-stone-200 rounded-md">
                  <div className="text-xs font-bold text-stone-500 uppercase">PM2.5 Peak</div>
                  <div className="text-lg font-mono text-red-600">{viewingEvent.peak_pm25 ?? '—'} µg/m³</div>
                </div>
                <div className="p-3 bg-[#fdfbf7] border border-stone-200 rounded-md">
                  <div className="text-xs font-bold text-stone-500 uppercase">SO2 Peak</div>
                  <div className="text-lg font-mono text-red-600">{viewingEvent.peak_so2 ?? '—'} ppb</div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setViewingEvent(null)}
                className="bg-[#2c2c2c] text-[#fffff0] px-4 py-2 rounded-md font-bold text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
