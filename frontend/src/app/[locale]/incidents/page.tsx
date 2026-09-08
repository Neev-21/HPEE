'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchPollutionEvents, type PollutionEvent } from '@/lib/api';
import { simulatePollutionSpike } from '@/lib/simulation';
import { liveSocket } from '@/lib/websocket';

const SEVERITY_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: '#ffe8e8', text: '#c94d4d', border: '#c94d4d' },
  severe: { bg: '#ffe8e8', text: '#c94d4d', border: '#c94d4d' },
  watch: { bg: '#fff4dd', text: '#d79b2b', border: '#d79b2b' },
  normal: { bg: '#e7f6ef', text: '#158363', border: '#158363' },
};

export default function IncidentsPage() {
  const t = useTranslations('Incidents');
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'en';

  const [events, setEvents] = useState<PollutionEvent[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadEvents = async () => {
    try {
      const evs = await fetchPollutionEvents();
      setEvents(evs);
    } catch (e) {
      console.error('Failed to fetch events:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();

    // 1. Subscribe to real-time WebSocket alerts
    const unsubscribe = liveSocket.subscribe((msg) => {
      if (msg.type === 'POLLUTION_ALERT') {
        showToast(`⚠ Live Alert: ${msg.severity.toUpperCase()} anomaly at ${msg.village_name}`);
        setEvents((prev) => {
          const exists = prev.some((e) => e.event_id === msg.event_id);
          const newEvent: PollutionEvent = {
            event_id: msg.event_id,
            village_name: msg.village_name,
            severity: msg.severity,
            status: 'active',
            detected_at: msg.started_at || new Date().toISOString(),
            started_at: msg.started_at || new Date().toISOString(),
            peak_pm25: msg.peak_pm25,
            peak_so2: msg.peak_so2,
          };
          if (exists) {
            return prev.map((e) => (e.event_id === msg.event_id ? newEvent : e));
          }
          return [newEvent, ...prev];
        });
      }
    });

    // 2. Continuous 30s background poll fallback
    const interval = setInterval(loadEvents, 30_000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      const result = await simulatePollutionSpike({
        severity: 'critical',
        village_name: 'Ankleshwar GIDC Phase III',
        peak_pm25: 184.5,
        peak_so2: 92.4,
      });

      if (result) {
        showToast('⚡ Live simulated spike triggered. Check live broadcast stream!');
        await loadEvents();
      }
    } catch (e) {
      console.error('Simulation error:', e);
      showToast('Simulation dispatch failed.');
    } finally {
      setIsSimulating(false);
    }
  };

  const filtered = events.filter(
    (ev) =>
      !filter ||
      ev.event_id.toLowerCase().includes(filter.toLowerCase()) ||
      ev.village_name?.toLowerCase().includes(filter.toLowerCase()) ||
      ev.severity.toLowerCase().includes(filter.toLowerCase()) ||
      ev.status.toLowerCase().includes(filter.toLowerCase())
  );

  const getSeverityLabel = (sev: string) => {
    try {
      return t(`severity.${sev.toLowerCase()}` as any);
    } catch {
      return sev.toUpperCase();
    }
  };

  const getStatusLabel = (st: string) => {
    try {
      return t(`status.${st.toLowerCase()}` as any);
    } catch {
      return st.toUpperCase();
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            right: '24px',
            bottom: '24px',
            background: '#10282d',
            color: '#ffffff',
            padding: '12px 18px',
            fontSize: '12px',
            fontWeight: 600,
            zIndex: 100,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            borderLeft: '4px solid #0d7778',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Head */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
        }}
      >
        <div>
          <div
            style={{
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: '#0d7778',
              fontSize: '10px',
              fontWeight: 800,
            }}
          >
            REGULATORY MONITORING
          </div>
          <h1
            style={{
              fontSize: '28px',
              letterSpacing: '-0.04em',
              fontWeight: 900,
              margin: '4px 0',
              color: '#09090b',
            }}
          >
            {t('title')}
          </h1>
          <div style={{ color: '#71717a', fontSize: '13px' }}>
            {t('subtitle')}
          </div>
        </div>

        <button
          onClick={handleSimulate}
          disabled={isSimulating}
          style={{
            background: '#0d7778',
            color: '#ffffff',
            border: 'none',
            padding: '11px 18px',
            fontWeight: 800,
            fontSize: '12px',
            cursor: isSimulating ? 'not-allowed' : 'pointer',
            letterSpacing: '0.5px',
          }}
        >
          {isSimulating ? t('simulating') : `⚡ ${t('simulateSpike')}`}
        </button>
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e4e4e7',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '400px' }}>
          <span style={{ color: '#a1a1aa' }}>🔍</span>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t('filterPlaceholder')}
            style={{
              border: 'none',
              outline: 'none',
              fontSize: '12px',
              width: '100%',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#71717a' }}>
          {filtered.length} / {events.length}
        </span>
      </div>

      {/* Events Table */}
      <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #09090b' }}>
              <th style={{ padding: '12px 16px', fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {t('colIncidentId')}
              </th>
              <th style={{ padding: '12px 16px', fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {t('colSite')}
              </th>
              <th style={{ padding: '12px 16px', fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {t('colReading')}
              </th>
              <th style={{ padding: '12px 16px', fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {t('colTime')}
              </th>
              <th style={{ padding: '12px 16px', fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {t('colStatus')}
              </th>
              <th style={{ padding: '12px 16px', fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {t('colSeverity')}
              </th>
              <th style={{ padding: '12px 16px', fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {t('colAction')}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#71717a' }}>
                  Loading events stream...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#71717a' }}>
                  {t('noIncidents')}
                </td>
              </tr>
            ) : (
              filtered.map((ev) => {
                const colors = SEVERITY_COLOR[ev.severity] || SEVERITY_COLOR.normal;
                const statusPill =
                  ev.status === 'active'
                    ? { bg: '#ffe8e8', text: '#dc2626', border: '#dc2626', label: getStatusLabel('active') }
                    : ev.status === 'investigate'
                    ? { bg: '#fff4dd', text: '#d79b2b', border: '#d79b2b', label: getStatusLabel('underReview') }
                    : { bg: '#e7f6ef', text: '#158363', border: '#158363', label: getStatusLabel('closed') };

                return (
                  <tr key={ev.event_id} style={{ borderBottom: '1px solid #e4e4e7' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <b style={{ fontSize: '13px', color: '#09090b', display: 'block' }}>
                        {ev.peak_pm25 && ev.peak_pm25 > 100
                          ? 'PM2.5 Chemical Surge'
                          : ev.peak_so2 && ev.peak_so2 > 80
                          ? 'SO₂ Stack Emission'
                          : 'Particulate Elevation'}
                      </b>
                      <div style={{ fontSize: '10px', color: '#71717a', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                        ID: {ev.event_id.slice(0, 13)}...
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px', fontSize: '12px' }}>
                      <strong>{ev.village_name || 'Ankleshwar GIDC'}</strong>
                      <div style={{ fontSize: '10px', color: '#71717a' }}>Monitoring Sector 04</div>
                    </td>

                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                      {ev.peak_pm25 ? (
                        <span style={{ color: ev.peak_pm25 > 60 ? '#dc2626' : '#09090b' }}>
                          PM2.5: <b>{ev.peak_pm25.toFixed(1)}</b> µg/m³
                        </span>
                      ) : null}
                      {ev.peak_so2 ? (
                        <div style={{ color: ev.peak_so2 > 40 ? '#d97706' : '#71717a', fontSize: '11px' }}>
                          SO₂: {ev.peak_so2.toFixed(1)} ppb
                        </div>
                      ) : null}
                    </td>

                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#71717a' }}>
                      {ev.detected_at ? new Date(ev.detected_at).toLocaleTimeString('en-IN') : '—'}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          background: statusPill.bg,
                          color: statusPill.text,
                          border: `1px solid ${statusPill.border}`,
                          padding: '4px 8px',
                          fontSize: '10px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                        }}
                      >
                        {statusPill.label}
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          background: colors.bg,
                          color: colors.text,
                          border: `1px solid ${colors.border}`,
                          padding: '4px 8px',
                          fontSize: '10px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                        }}
                      >
                        {getSeverityLabel(ev.severity)}
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={() => router.push(`/${locale}/reports`)}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #d4d4d8',
                          padding: '6px 10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          color: '#0d7778',
                        }}
                      >
                        {t('view')} Details →
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
