'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchPollutionEvents, type PollutionEvent } from '@/lib/api';

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: '#ffe8e8', text: '#dc2626', border: '#dc2626' },
  severe: { bg: '#ffe8e8', text: '#dc2626', border: '#dc2626' },
  watch: { bg: '#fff4dd', text: '#d79b2b', border: '#d79b2b' },
  normal: { bg: '#e7f6ef', text: '#158363', border: '#158363' },
};

export default function ReportsPage() {
  const t = useTranslations('Reports');
  const tHeader = useTranslations('Header');
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [events, setEvents] = useState<PollutionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeframe, setTimeframe] = useState<'all' | '24h' | '7d' | '30d'>('all');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchPollutionEvents()
      .then(setEvents)
      .catch((err) => {
        console.error('Failed to load pollution events for reports:', err);
        setEvents([]);
      })
      .finally(() => setLoading(false));

    const id = setInterval(() => {
      fetchPollutionEvents().then(setEvents).catch(() => {});
    }, 30_000);

    return () => clearInterval(id);
  }, []);

  // Filter logic
  const filteredEvents = useMemo(() => {
    const now = Date.now();
    return events.filter((event) => {
      // Search term
      if (search) {
        const q = search.toLowerCase();
        const matchesId = event.event_id.toLowerCase().includes(q);
        const matchesVillage = (event.village_name || '').toLowerCase().includes(q);
        if (!matchesId && !matchesVillage) return false;
      }

      // Severity filter
      if (severityFilter !== 'all' && event.severity.toLowerCase() !== severityFilter.toLowerCase()) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && event.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }

      // Timeframe filter
      if (timeframe !== 'all' && event.detected_at) {
        const eventTime = new Date(event.detected_at).getTime();
        const diffHours = (now - eventTime) / (1000 * 60 * 60);
        if (timeframe === '24h' && diffHours > 24) return false;
        if (timeframe === '7d' && diffHours > 24 * 7) return false;
        if (timeframe === '30d' && diffHours > 24 * 30) return false;
      }

      return true;
    });
  }, [events, search, severityFilter, statusFilter, timeframe]);

  // Key KPI stats
  const stats = useMemo(() => {
    const activeCount = events.filter((e) => e.status === 'active').length;
    const criticalCount = events.filter((e) => ['critical', 'severe'].includes(e.severity)).length;
    const validPm25 = events.filter((e) => typeof e.peak_pm25 === 'number');
    const avgPeakPm25 = validPm25.length
      ? validPm25.reduce((sum, e) => sum + (e.peak_pm25 ?? 0), 0) / validPm25.length
      : 0;

    return [
      {
        title: t('totalIncidents'),
        value: String(events.length),
        sub: t('totalIncidentsSub'),
        color: '#09090b',
      },
      {
        title: t('activeAlerts'),
        value: String(activeCount),
        sub: t('activeAlertsSub'),
        color: '#dc2626',
      },
      {
        title: t('avgPm25'),
        value: `${avgPeakPm25 ? avgPeakPm25.toFixed(1) : '0'} µg/m³`,
        sub: `${criticalCount} ${t('avgPm25Sub')}`,
        color: avgPeakPm25 > 60 ? '#dc2626' : '#0d7778',
      },
      {
        title: t('criticalAlerts'),
        value: String(criticalCount),
        sub: t('criticalAlertsSub'),
        color: '#b91c1c',
      },
    ];
  }, [events, t]);

  // CSV Export
  const handleExportCsv = () => {
    if (filteredEvents.length === 0) {
      showToast('No events available to export.');
      return;
    }

    const headers = ['Incident ID', 'Village / Monitoring Site', 'Severity', 'Status', 'Peak PM2.5 (ug/m3)', 'Peak SO2 (ppb)', 'Detected At'];
    const rows = filteredEvents.map((e) => [
      `"${e.event_id}"`,
      `"${e.village_name || 'Ankleshwar GIDC'}"`,
      `"${e.severity.toUpperCase()}"`,
      `"${e.status.toUpperCase()}"`,
      `"${e.peak_pm25 ?? ''}"`,
      `"${e.peak_so2 ?? ''}"`,
      `"${e.detected_at || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `HPEE_Environmental_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(t('exportSuccess'));
  };

  // JSON Export
  const handleExportJson = () => {
    if (filteredEvents.length === 0) {
      showToast('No events available to export.');
      return;
    }

    const payload = {
      system: 'Hyperlocal Pollution Evidence Engine (HPEE)',
      regulatory_authority: 'State Pollution Control Authority',
      export_date: new Date().toISOString(),
      record_count: filteredEvents.length,
      filters_applied: {
        search: search || null,
        severity: severityFilter,
        status: statusFilter,
        timeframe,
      },
      incidents: filteredEvents,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `HPEE_Export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(t('exportSuccess'));
  };

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ padding: '24px 20px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Floating toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#10282d',
            color: '#ffffff',
            padding: '12px 18px',
            fontSize: '12px',
            fontWeight: 700,
            zIndex: 100,
            borderLeft: '4px solid #0d7778',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}
        >
          {toast}
        </div>
      )}

      {/* Header with Title & Export Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '16px',
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
            REGULATORY DESK · {tHeader('title')}
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
          <div style={{ color: '#71717a', fontSize: '13px', maxWidth: '800px' }}>
            {t('subtitle')}
          </div>
        </div>

        {/* Export Toolbar */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={handleExportCsv}
            style={{
              background: '#ffffff',
              border: '1px solid #09090b',
              color: '#09090b',
              padding: '9px 14px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            📊 {t('exportCsv')}
          </button>

          <button
            onClick={handleExportJson}
            style={{
              background: '#ffffff',
              border: '1px solid #d4d4d8',
              color: '#09090b',
              padding: '9px 14px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            📁 {t('exportJson')}
          </button>

          <button
            onClick={handlePrint}
            style={{
              background: '#0d7778',
              border: 'none',
              color: '#ffffff',
              padding: '9px 16px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            🖨 {t('printReport')}
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: '14px',
          marginBottom: '24px',
        }}
      >
        {stats.map((stat) => (
          <div
            key={stat.title}
            style={{
              background: '#ffffff',
              border: '1px solid #e4e4e7',
              padding: '16px 18px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#71717a',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {stat.title}
            </div>
            <div
              style={{
                fontSize: '28px',
                fontWeight: 900,
                fontFamily: 'var(--font-mono)',
                color: stat.color,
                margin: '6px 0 2px',
              }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: '11px', color: '#71717a' }}>{stat.sub}</div>
          </div>
        ))}
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
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Left: Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '260px', maxWidth: '380px' }}>
          <span style={{ color: '#a1a1aa' }}>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            style={{
              border: 'none',
              outline: 'none',
              fontSize: '12px',
              width: '100%',
              fontFamily: 'inherit',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a1a1aa', fontSize: '12px' }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Right: Dropdowns */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Timeframe */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#71717a' }}>{t('filterTimeframe')}:</span>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
              style={{
                fontSize: '12px',
                padding: '5px 8px',
                border: '1px solid #d4d4d8',
                background: '#ffffff',
                fontWeight: 600,
              }}
            >
              <option value="all">{t('timeAll')}</option>
              <option value="24h">{t('time24h')}</option>
              <option value="7d">{t('time7d')}</option>
              <option value="30d">{t('time30d')}</option>
            </select>
          </div>

          {/* Severity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#71717a' }}>{t('filterSeverity')}:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              style={{
                fontSize: '12px',
                padding: '5px 8px',
                border: '1px solid #d4d4d8',
                background: '#ffffff',
                fontWeight: 600,
              }}
            >
              <option value="all">{t('allSeverities')}</option>
              <option value="critical">CRITICAL</option>
              <option value="severe">SEVERE</option>
              <option value="watch">WATCH</option>
              <option value="normal">NORMAL</option>
            </select>
          </div>

          {/* Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#71717a' }}>{t('filterStatus')}:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                fontSize: '12px',
                padding: '5px 8px',
                border: '1px solid #d4d4d8',
                background: '#ffffff',
                fontWeight: 600,
              }}
            >
              <option value="all">{t('allStatuses')}</option>
              <option value="active">ACTIVE</option>
              <option value="investigate">INVESTIGATE</option>
              <option value="resolved">RESOLVED</option>
            </select>
          </div>

          {/* Record count badge */}
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#71717a', marginLeft: '6px' }}>
            {t('showingRecords', { count: filteredEvents.length, total: events.length })}
          </span>
        </div>
      </div>

      {/* Historical Data Table */}
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
                {t('colSeverity')}
              </th>
              <th style={{ padding: '12px 16px', fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {t('colPeakPm25')}
              </th>
              <th style={{ padding: '12px 16px', fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {t('colPeakSo2')}
              </th>
              <th style={{ padding: '12px 16px', fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {t('colDetectedAt')}
              </th>
              <th style={{ padding: '12px 16px', fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {t('colStatus')}
              </th>
              <th style={{ padding: '12px 16px', fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {t('colAction')}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: '#71717a' }}>
                  Loading telemetry & incident reports...
                </td>
              </tr>
            ) : filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: '#71717a' }}>
                  {t('noRecords')}
                </td>
              </tr>
            ) : (
              filteredEvents.map((ev) => {
                const sevStyle = SEVERITY_COLORS[ev.severity.toLowerCase()] || SEVERITY_COLORS.normal;
                return (
                  <tr key={ev.event_id} style={{ borderBottom: '1px solid #e4e4e7' }}>
                    {/* ID */}
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '12px' }}>
                      {ev.event_id}
                    </td>

                    {/* Site */}
                    <td style={{ padding: '14px 16px', fontSize: '12px' }}>
                      <strong>{ev.village_name || 'Ankleshwar GIDC'}</strong>
                      <div style={{ fontSize: '10px', color: '#71717a' }}>Regional Monitoring Network</div>
                    </td>

                    {/* Severity */}
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          background: sevStyle.bg,
                          color: sevStyle.text,
                          border: `1px solid ${sevStyle.border}`,
                          padding: '3px 8px',
                          fontSize: '10px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                        }}
                      >
                        {ev.severity}
                      </span>
                    </td>

                    {/* Peak PM2.5 */}
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '12px' }}>
                      {ev.peak_pm25 != null ? `${ev.peak_pm25} µg/m³` : '—'}
                    </td>

                    {/* Peak SO2 */}
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '12px' }}>
                      {ev.peak_so2 != null ? `${ev.peak_so2} µg/m³` : '—'}
                    </td>

                    {/* Detected At */}
                    <td style={{ padding: '14px 16px', fontSize: '11px', color: '#71717a', whiteSpace: 'nowrap' }}>
                      {formatTime(ev.detected_at)}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          background: ev.status === 'active' ? '#ffe8e8' : '#e7f6ef',
                          color: ev.status === 'active' ? '#dc2626' : '#158363',
                          border: `1px solid ${ev.status === 'active' ? '#dc2626' : '#158363'}`,
                          padding: '3px 7px',
                          fontSize: '10px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                        }}
                      >
                        {ev.status}
                      </span>
                    </td>

                    {/* Action */}
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={() => router.push(`/${locale}/incidents`)}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #d4d4d8',
                          padding: '6px 10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          color: '#0d7778',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        View Details →
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
