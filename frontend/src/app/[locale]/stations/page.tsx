'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { fetchSensorNodes, type SensorNode } from '@/lib/api';

const STATUS_COLOR: Record<string, string> = {
  online: '#16a34a',
  offline: '#dc2626',
  degraded: '#d97706',
};

export default function StationsPage() {
  const t = useTranslations('Stations');
  const tCommon = useTranslations('Common');
  const [nodes, setNodes] = useState<SensorNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSensorNodes()
      .then(setNodes)
      .catch(() => setError(tCommon('error')))
      .finally(() => setLoading(false));
  }, [tCommon]);

  return (
    <div style={{ padding: '0', overflowY: 'auto', height: 'calc(100vh - 118px)' }}>
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
          NODES / {String(nodes.length).padStart(2, '0')} TOTAL
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ minWidth: 800 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #000' }}>
              {[
                t('colNodeId'), t('colLocation'), t('colPm25'), t('colSo2'),
                t('colBattery'), t('colSignal'), t('colStatus'), t('colLastSeen'),
              ].map((col) => (
                <th key={col} style={{
                  padding: '8px 12px', fontSize: '10px', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.6px', color: '#71717a',
                }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: '#71717a' }}>
                  {tCommon('loading')}
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: '#dc2626' }}>
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && nodes.map((node) => {
              const statusColor = STATUS_COLOR[node.status] || '#71717a';
              const pm25Critical = node.pm25 != null && node.pm25 > 60;
              return (
                <tr key={node.node_id} style={{ borderBottom: '1px solid #f4f4f5' }}>
                  <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600 }}>
                    {node.node_id}
                  </td>
                  <td style={{ padding: '8px 12px', fontSize: '12px' }}>
                    {node.name}
                    <br />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#71717a' }}>
                      {node.lat.toFixed(4)}, {node.lon.toFixed(4)}
                    </span>
                  </td>
                  <td style={{
                    padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: '12px',
                    fontWeight: 600, color: pm25Critical ? '#dc2626' : '#000',
                  }}>
                    {node.pm25 != null ? `${node.pm25.toFixed(1)} µg/m³` : '—'}
                  </td>
                  <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                    {node.so2 != null ? `${node.so2.toFixed(1)} ppb` : '—'}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <div style={{
                      width: 80, height: 8, background: '#e4e4e7', position: 'relative',
                    }}>
                      <div style={{
                        width: `${node.battery_percent ?? 0}%`,
                        height: '100%',
                        background: (node.battery_percent ?? 0) > 30 ? '#16a34a' : '#dc2626',
                      }} />
                    </div>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#71717a' }}>
                      {node.battery_percent != null ? `${node.battery_percent.toFixed(0)}%` : '—'}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                    {node.signal_strength != null ? `${node.signal_strength} dBm` : '—'}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                    }}>
                      <span style={{
                        display: 'inline-block', width: 7, height: 7, background: statusColor,
                      }} />
                      <span style={{ color: statusColor }}>
                        {node.status === 'online' ? t('online') : node.status === 'offline' ? t('offline') : t('degraded')}
                      </span>
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#71717a' }}>
                    {node.last_reading_at
                      ? new Date(node.last_reading_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
