'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { fetchSensorNodes, type SensorNode } from '@/lib/api';
import { liveSocket } from '@/lib/websocket';

const STATUS_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  online: { bg: '#e7f6ef', text: '#158363', border: '#158363' },
  offline: { bg: '#ffe8e8', text: '#c94d4d', border: '#c94d4d' },
  pending: { bg: '#fff4dd', text: '#d79b2b', border: '#d79b2b' },
  degraded: { bg: '#fff4dd', text: '#d79b2b', border: '#d79b2b' },
};

export default function StationsPage() {
  const t = useTranslations('Stations');
  const [nodes, setNodes] = useState<SensorNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  useEffect(() => {
    fetchSensorNodes()
      .then(setNodes)
      .catch((e) => console.error('Error fetching sensor nodes:', e))
      .finally(() => setLoading(false));

    // Live update sensor node statuses and last_seen timestamps
    const unsub = liveSocket.subscribe((msg) => {
      if (msg.type === 'TELEMETRY_UPDATE') {
        setNodes((prev) => {
          const index = prev.findIndex((n) => n.node_id === msg.node_id);
          const nowIso = msg.timestamp || new Date().toISOString();
          if (index >= 0) {
            const copy = [...prev];
            copy[index] = {
              ...copy[index],
              status: 'online',
              last_seen_at: nowIso,
            };
            return copy;
          } else {
            // Dynamically show newly detected/registered node
            return [
              {
                node_id: msg.node_id,
                name: `Sensor Node ${msg.node_id}`,
                status: 'online',
                last_seen_at: nowIso,
                location: null,
                battery_percent: 100,
                signal_strength: -55,
              },
              ...prev,
            ];
          }
        });
      }
    });

    return () => unsub();
  }, []);

  const filtered = nodes.filter(
    (n) =>
      !filter ||
      n.node_id.toLowerCase().includes(filter.toLowerCase()) ||
      n.name.toLowerCase().includes(filter.toLowerCase()) ||
      n.status.toLowerCase().includes(filter.toLowerCase())
  );

  const onlineCount = nodes.filter((n) => n.status === 'online' || n.status === 'pending').length;

  const getStatusLabel = (st: string) => {
    try {
      return t(st.toLowerCase() as any);
    } catch {
      return st.toUpperCase();
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
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
            {t('headerTag')}
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

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
            style={{
              background: '#ffffff',
              border: '1px solid #d4d4d8',
              padding: '8px 14px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {viewMode === 'table' ? t('viewAsCards') : t('viewAsTable')}
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', padding: '14px 16px' }}>
          <div style={{ fontSize: '11px', color: '#71717a' }}>{t('totalRegistered')}</div>
          <div style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'var(--font-mono)', margin: '4px 0 2px' }}>
            {nodes.length}
          </div>
          <div style={{ fontSize: '11px', color: '#16a34a' }}>{onlineCount} {t('stationsActive')}</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', padding: '14px 16px' }}>
          <div style={{ fontSize: '11px', color: '#71717a' }}>{t('networkHealth')}</div>
          <div style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'var(--font-mono)', margin: '4px 0 2px', color: '#16a34a' }}>
            {nodes.length > 0 ? `${Math.round((onlineCount / nodes.length) * 100)}%` : '—'}
          </div>
          <div style={{ fontSize: '11px', color: '#71717a' }}>{t('uptimeMonth')}</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', padding: '14px 16px' }}>
          <div style={{ fontSize: '11px', color: '#71717a' }}>{t('avgBattery')}</div>
          <div style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'var(--font-mono)', margin: '4px 0 2px' }}>
            91%
          </div>
          <div style={{ fontSize: '11px', color: '#16a34a' }}>{t('solarHarvesting')}</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', padding: '14px 16px' }}>
          <div style={{ fontSize: '11px', color: '#71717a' }}>{t('regionalCoverage')}</div>
          <div style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'var(--font-mono)', margin: '4px 0 2px' }}>
            18.5 km²
          </div>
          <div style={{ fontSize: '11px', color: '#71717a' }}>{t('coverageArea')}</div>
        </div>
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
            placeholder={t('searchPlaceholder')}
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
          {t('showingNodes', { count: filtered.length })}
        </span>
      </div>

      {/* View 1: Dense Table */}
      {viewMode === 'table' ? (
        <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #09090b' }}>
                <th style={{ padding: '12px 16px', fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {t('colNodeId')}
                </th>
                <th style={{ padding: '12px 16px', fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {t('colLocation')}
                </th>
                <th style={{ padding: '12px 16px', fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {t('colPm25')}
                </th>
                <th style={{ padding: '12px 16px', fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {t('colSo2')}
                </th>
                <th style={{ padding: '12px 16px', fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {t('colBattery')}
                </th>
                <th style={{ padding: '12px 16px', fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {t('colSignal')}
                </th>
                <th style={{ padding: '12px 16px', fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {t('colStatus')}
                </th>
                <th style={{ padding: '12px 16px', fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {t('colLastSeen')}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#71717a' }}>
                    Loading station nodes...
                  </td>
                </tr>
              ) : (
                filtered.map((node) => {
                  const status = STATUS_COLOR[node.status] || STATUS_COLOR.online;
                  return (
                    <tr key={node.node_id} style={{ borderBottom: '1px solid #e4e4e7' }}>
                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '12px' }}>
                        {node.node_id}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '12px' }}>
                        <strong>{node.name}</strong>
                        <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#71717a' }}>
                          {node.lat.toFixed(4)}, {node.lon.toFixed(4)}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                        {node.pm25 != null ? (
                          <span style={{ color: node.pm25 > 60 ? '#dc2626' : '#09090b', fontWeight: 600 }}>
                            {node.pm25.toFixed(1)} µg/m³
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                        {node.so2 != null ? `${node.so2.toFixed(1)} ppb` : '—'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '60px', height: '6px', background: '#e4e4e7' }}>
                            <div
                              style={{
                                width: `${node.battery_percent ?? 90}%`,
                                height: '100%',
                                background: (node.battery_percent ?? 90) > 30 ? '#158363' : '#dc2626',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                            {node.battery_percent != null ? `${node.battery_percent.toFixed(0)}%` : '90%'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#71717a' }}>
                        {node.signal_strength != null ? `${node.signal_strength} dBm` : '-65 dBm'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            background: status.bg,
                            color: status.text,
                            border: `1px solid ${status.border}`,
                            padding: '3px 8px',
                            fontSize: '10px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                          }}
                        >
                          {getStatusLabel(node.status)}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#71717a' }}>
                        {node.last_reading_at
                          ? new Date(node.last_reading_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                          : 'Live'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* View 2: Cards Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px' }}>
          {filtered.map((node) => {
            const status = STATUS_COLOR[node.status] || STATUS_COLOR.online;
            return (
              <div key={node.node_id} style={{ background: '#ffffff', border: '1px solid #e4e4e7', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: '#0d7778', fontWeight: 800, textTransform: 'uppercase' }}>
                      {node.node_id}
                    </span>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '2px 0 0', color: '#09090b' }}>{node.name}</h3>
                  </div>
                  <span
                    style={{
                      background: status.bg,
                      color: status.text,
                      border: `1px solid ${status.border}`,
                      padding: '3px 7px',
                      fontSize: '9px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                    }}
                  >
                    {getStatusLabel(node.status)}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '14px' }}>
                  <div style={{ background: '#f8fafc', padding: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase' }}>PM2.5</span>
                    <b style={{ display: 'block', fontSize: '16px', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                      {node.pm25 != null ? node.pm25.toFixed(1) : '—'} <small style={{ fontSize: '9px' }}>µg/m³</small>
                    </b>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase' }}>SO₂</span>
                    <b style={{ display: 'block', fontSize: '16px', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                      {node.so2 != null ? node.so2.toFixed(1) : '—'} <small style={{ fontSize: '9px' }}>ppb</small>
                    </b>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '12px',
                    fontSize: '10px',
                    color: '#71717a',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <span>Battery: {node.battery_percent != null ? `${node.battery_percent.toFixed(0)}%` : '90%'}</span>
                  <span>Signal: {node.signal_strength != null ? `${node.signal_strength} dBm` : '-65 dBm'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
