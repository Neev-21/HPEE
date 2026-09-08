'use client';

import React from 'react';
import Sparkline from './Sparkline';
import type { PollutionEvent } from '@/lib/api';

export interface NodeMeasurement {
  label: string;
  value: string | number;
  unit?: string;
  isAlert?: boolean;
}

interface NodeDetailPanelProps {
  nodeId: string;
  nodeName: string;
  zone: string;
  status: 'ONLINE' | 'INVESTIGATE' | 'OFFLINE';
  readings: NodeMeasurement[];
  activeEvent?: PollutionEvent | null;
}

export default function NodeDetailPanel({
  nodeId,
  nodeName,
  zone,
  status,
  readings,
  activeEvent,
}: NodeDetailPanelProps) {
  const statusColors = {
    ONLINE: { bg: '#e7f6ef', text: '#158363', border: '#158363' },
    INVESTIGATE: { bg: '#fff4dd', text: '#d79b2b', border: '#d79b2b' },
    OFFLINE: { bg: '#ffe8e8', text: '#c94d4d', border: '#c94d4d' },
  };

  const currentStatus = statusColors[status] || statusColors.ONLINE;

  return (
    <div
      style={{
        padding: '18px',
        height: '100%',
        overflowY: 'auto',
        background: '#ffffff',
        borderLeft: '1px solid #e4e4e7',
      }}
    >
      {/* Node Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div
            style={{
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#0d7778',
              fontSize: '10px',
              fontWeight: 800,
            }}
          >
            SELECTED NODE
          </div>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 800,
              margin: '3px 0 0',
              letterSpacing: '-0.02em',
              color: '#18181b',
            }}
          >
            {nodeId}
          </h2>
          <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>
            {zone} {nodeName !== nodeId ? `• ${nodeName}` : ''}
          </div>
        </div>

        <span
          style={{
            background: currentStatus.bg,
            color: currentStatus.text,
            border: `1px solid ${currentStatus.border}`,
            fontSize: '9px',
            fontWeight: 800,
            padding: '4px 8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {status}
        </span>
      </div>

      {/* Real-time Configured Measurements */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          marginTop: '16px',
        }}
      >
        {readings.map((reading) => (
          <div
            key={reading.label}
            style={{
              background: reading.isAlert ? '#fef2f2' : '#f8fafc',
              border: `1px solid ${reading.isAlert ? '#dc2626' : '#e2e8f0'}`,
              padding: '10px 12px',
            }}
          >
            <span
              style={{
                fontSize: '10px',
                color: reading.isAlert ? '#dc2626' : '#64748b',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
              }}
            >
              {reading.label}
            </span>
            <b
              style={{
                display: 'block',
                fontSize: '20px',
                marginTop: '4px',
                fontFamily: 'var(--font-mono)',
                color: reading.isAlert ? '#dc2626' : '#09090b',
              }}
            >
              {reading.value}
            </b>
            {reading.unit && (
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>{reading.unit}</span>
            )}
          </div>
        ))}
      </div>

      {/* Historical Mini Sparkline */}
      <div style={{ marginTop: '16px' }}>
        <div
          style={{
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: '#71717a',
            letterSpacing: '0.5px',
          }}
        >
          60-Minute Historical Trend
        </div>
        <Sparkline />
      </div>

      {/* Attributed Incident Dossier Section */}
      {activeEvent && (
        <div
          style={{
            marginTop: '20px',
            padding: '14px',
            background: '#fafafa',
            border: '1px solid #e4e4e7',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                textTransform: 'uppercase',
                color: '#dc2626',
                letterSpacing: '0.5px',
              }}
            >
              ACTIVE REGULATORY DOSSIER
            </span>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#71717a' }}>
              {activeEvent.severity.toUpperCase()}
            </span>
          </div>

          <div style={{ fontSize: '13px', fontWeight: 700, color: '#09090b' }}>
            Event: {activeEvent.event_id.slice(0, 8)}...
          </div>
          <div style={{ fontSize: '11px', color: '#52525b', marginTop: '4px' }}>
            Peak PM2.5: <strong>{activeEvent.peak_pm25 ?? '—'} µg/m³</strong> | Peak SO₂:{' '}
            <strong>{activeEvent.peak_so2 ?? '—'} ppb</strong>
          </div>

          <div
            style={{
              marginTop: '10px',
              padding: '8px 10px',
              background: '#fef3c7',
              border: '1px solid #f59e0b',
              fontSize: '11px',
              color: '#92400e',
            }}
          >
            <strong>Attributed Culprit:</strong> Apex Agro-Chem Synthesis (Plot 805, GIDC Phase III)
            <div style={{ fontSize: '10px', color: '#b45309', marginTop: '2px' }}>
              Confidence: 89.5% • Regulatory Consent: CCA-BH-14562/2025
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
