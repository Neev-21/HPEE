'use client';

import React, { useState } from 'react';
import { appStore } from '@/lib/store';

export default function SensorNetworkPage() {
  const [toast, setToast] = useState<string | null>(null);
  const master = appStore.getMaster();

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto' }}>
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#10282d',
            color: '#fff',
            padding: '12px 18px',
            fontSize: '12px',
            fontWeight: 700,
            zIndex: 100,
            borderLeft: '4px solid #0d7778',
          }}
        >
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <div style={{ textTransform: 'uppercase', letterSpacing: '0.14em', color: '#0d7778', fontSize: '10px', fontWeight: 800 }}>
            INFRASTRUCTURE TOPOLOGY
          </div>
          <h1 style={{ fontSize: '28px', letterSpacing: '-0.04em', fontWeight: 900, margin: '4px 0', color: '#09090b' }}>
            Sensor Network Architecture
          </h1>
          <div style={{ color: '#71717a', fontSize: '13px' }}>
            Full multi-tier facility architecture and field bus telemetry distribution. Every node is clickable.
          </div>
        </div>
      </div>

      {/* Interactive Topology Canvas */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e4e4e7',
          padding: '40px',
          minHeight: '580px',
          position: 'relative',
          overflowX: 'auto',
        }}
      >
        <div style={{ minWidth: '900px', height: '500px', position: 'relative' }}>
          {/* Level 1: Root Facility Node */}
          <div
            onClick={() => showToast(`${master.companyName} • ${master.plantName} root gateway selected`)}
            style={{
              position: 'absolute',
              left: '42%',
              top: '20px',
              padding: '14px 20px',
              border: '2px solid #0d7778',
              background: '#eef8f7',
              boxShadow: '0 8px 24px rgba(13, 119, 120, 0.08)',
              cursor: 'pointer',
              zIndex: 10,
            }}
          >
            <b style={{ fontSize: '15px', color: '#0d7778', display: 'block' }}>{master.companyName}</b>
            <span style={{ fontSize: '11px', color: '#5b6b71' }}>{master.plantName} • Primary Ingestion Node</span>
          </div>

          {/* Connectors Level 1 -> Level 2 */}
          <div style={{ position: 'absolute', left: '26%', top: '75px', width: '22%', height: '2px', background: '#94a3b8', transform: 'rotate(-25deg)', transformOrigin: 'right center' }} />
          <div style={{ position: 'absolute', left: '49%', top: '75px', width: '2px', height: '100px', background: '#94a3b8' }} />
          <div style={{ position: 'absolute', left: '52%', top: '75px', width: '22%', height: '2px', background: '#94a3b8', transform: 'rotate(25deg)', transformOrigin: 'left center' }} />

          {/* Level 2: Functional Zones */}
          <div
            onClick={() => showToast('Production Area Zone: 2 Active Nodes')}
            style={{
              position: 'absolute',
              left: '12%',
              top: '180px',
              padding: '12px 18px',
              border: '1px solid #dce5e7',
              background: '#ffffff',
              boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
              cursor: 'pointer',
              zIndex: 10,
            }}
          >
            <b style={{ fontSize: '13px', display: 'block' }}>Production Unit A</b>
            <span style={{ fontSize: '10px', color: '#71717a' }}>2 Telemetry Nodes</span>
          </div>

          <div
            onClick={() => showToast('Boiler Area Zone: 2 Active Nodes')}
            style={{
              position: 'absolute',
              left: '42%',
              top: '180px',
              padding: '12px 18px',
              border: '1px solid #dce5e7',
              background: '#ffffff',
              boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
              cursor: 'pointer',
              zIndex: 10,
            }}
          >
            <b style={{ fontSize: '13px', display: 'block' }}>Boiler Area</b>
            <span style={{ fontSize: '10px', color: '#71717a' }}>2 Telemetry Nodes</span>
          </div>

          <div
            onClick={() => showToast('Storage & Perimeter: 2 Active Nodes')}
            style={{
              position: 'absolute',
              left: '72%',
              top: '180px',
              padding: '12px 18px',
              border: '1px solid #dce5e7',
              background: '#ffffff',
              boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
              cursor: 'pointer',
              zIndex: 10,
            }}
          >
            <b style={{ fontSize: '13px', display: 'block' }}>Storage & Boundary</b>
            <span style={{ fontSize: '10px', color: '#71717a' }}>2 Telemetry Nodes</span>
          </div>

          {/* Level 3: Installed Sensors */}
          {[
            { id: 'S-001', name: 'Boiler Sensor 01', zone: 'Boiler Area', left: '5%', desc: 'PM2.5 • SO₂ • Temp' },
            { id: 'S-002', name: 'Storage Sensor 02', zone: 'Storage', left: '23%', desc: 'Temp • Humidity' },
            { id: 'S-003', name: 'Boundary North 03', zone: 'Boundary', left: '42%', desc: 'PM2.5 • VOC' },
            { id: 'S-004', name: 'Waste Sensor 04', zone: 'Waste Treatment', left: '61%', desc: 'SO₂ • VOC' },
            { id: 'S-005', name: 'Boiler Wind 05', zone: 'Boiler Area', left: '80%', desc: 'PM2.5 • Wind Speed' },
          ].map((s) => (
            <div
              key={s.id}
              onClick={() => showToast(`${s.id} (${s.name}) • ${s.desc}`)}
              style={{
                position: 'absolute',
                left: s.left,
                top: '360px',
                padding: '12px 16px',
                border: '1px solid #dce5e7',
                background: '#ffffff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                cursor: 'pointer',
                zIndex: 10,
                minWidth: '150px',
              }}
            >
              <b style={{ fontSize: '13px', color: '#0d7778', display: 'block' }}>{s.id}</b>
              <span style={{ fontSize: '11px', fontWeight: 700, display: 'block', color: '#09090b' }}>{s.name}</span>
              <span style={{ fontSize: '10px', color: '#71717a' }}>{s.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
