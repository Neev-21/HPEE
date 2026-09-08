'use client';

import React, { useEffect, useState } from 'react';
import { appStore, type PlantDisplaySettings } from '@/lib/store';
import { fetchSensorNodes, fetchPollutionEvents, type SensorNode, type PollutionEvent } from '@/lib/api';

export default function KioskPage() {
  const [settings, setSettings] = useState<PlantDisplaySettings>(appStore.getDisplaySettings());
  const [nodes, setNodes] = useState<SensorNode[]>([]);
  const [activeEvent, setActiveEvent] = useState<PollutionEvent | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    setSettings(appStore.getDisplaySettings());
    const unsub = appStore.subscribe(() => {
      setSettings(appStore.getDisplaySettings());
    });

    fetchSensorNodes().then(setNodes).catch(() => {});
    fetchPollutionEvents().then((evs) => {
      const active = evs.find((e) => e.status === 'active') || evs[0] || null;
      setActiveEvent(active);
    }).catch(() => {});

    return unsub;
  }, []);

  const openPopupDisplay = () => {
    const w = window.open('', '_blank');
    if (!w) {
      showToast('Please allow popups to launch Display Mode');
      return;
    }

    const pm25 = activeEvent?.peak_pm25 ?? 84.6;
    const so2 = activeEvent?.peak_so2 ?? 42.7;

    w.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>HPEE — Plant Display Mode</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            background: #071b1f;
            color: #ffffff;
            font-family: system-ui, -apple-system, sans-serif;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            padding: 30px;
          }
          .head { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 20px; }
          .brand { font-size: 24px; font-weight: 900; letter-spacing: 0.5px; }
          .sub { color: #91aaac; font-size: 13px; margin-top: 4px; }
          .live { color: #6be1ae; font-weight: 800; font-size: 14px; display: flex; align-items: center; gap: 8px; }
          .live i { width: 10px; height: 10px; background: #6be1ae; border-radius: 50%; display: inline-block; box-shadow: 0 0 10px #6be1ae; }
          .grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin: 30px 0;
            flex: 1;
          }
          .card {
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.12);
            padding: 30px;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .lbl { color: #98b2b4; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
          .val { font-size: 68px; font-weight: 900; margin: 10px 0; font-family: monospace; }
          .unit { color: #9ab2b4; font-size: 14px; font-weight: 600; }
          .alert {
            background: rgba(217, 119, 6, 0.18);
            border: 2px solid #d97706;
            color: #fde68a;
            padding: 18px 24px;
            font-size: 15px;
            font-weight: 800;
            letter-spacing: 0.5px;
          }
        </style>
      </head>
      <body>
        <div class="head">
          <div>
            <div class="brand">APEX CHEMICALS × ECOPLANT INTELLIGENCE</div>
            <div class="sub">ANKLESHWAR PLANT • HYPERLOCAL POLLUTION EVIDENCE ENGINE</div>
          </div>
          <div class="live"><i></i> LIVE REAL-TIME FEED</div>
        </div>

        <div class="grid">
          <div class="card">
            <span class="lbl">PM2.5 CONCENTRATION</span>
            <span class="val" style="color:#f87171;">${Number(pm25).toFixed(1)}</span>
            <span class="unit">µg/m³ • CPCB 24h Threshold: 60</span>
          </div>
          <div class="card">
            <span class="lbl">SO₂ TOXIC GAS</span>
            <span class="val" style="color:#fbbf24;">${Number(so2).toFixed(1)}</span>
            <span class="unit">ppb • CPCB Benchmark: 80</span>
          </div>
          <div class="card">
            <span class="lbl">AMBIENT TEMPERATURE</span>
            <span class="val">29.4</span>
            <span class="unit">°C • Stable Thermal Inversion</span>
          </div>
          <div class="card">
            <span class="lbl">RELATIVE HUMIDITY</span>
            <span class="val">71</span>
            <span class="unit">% • Atmospheric Boundary Layer</span>
          </div>
          <div class="card">
            <span class="lbl">WIND VECTOR</span>
            <span class="val">4.8</span>
            <span class="unit">m/s • SE Direction (135°)</span>
          </div>
          <div class="card">
            <span class="lbl">NETWORK INTEGRITY</span>
            <span class="val" style="color:#52d3a1;">20/20</span>
            <span class="unit">Sensors Online • 99.8% Uptime</span>
          </div>
        </div>

        <div class="alert">
          ⚠ ACTIVE ENVIRONMENTAL SURGE: Attributed Source: Apex Agro-Chem Synthesis (Plot 805, GIDC Phase III) • Confidence 89.5%
        </div>
      </body>
      </html>
    `);
    w.document.close();
    showToast('Plant Display Mode opened in new window');
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
            ADMINISTRATION
          </div>
          <h1 style={{ fontSize: '28px', letterSpacing: '-0.04em', fontWeight: 900, margin: '4px 0', color: '#09090b' }}>
            Plant Display Kiosk Mode
          </h1>
          <div style={{ color: '#71717a', fontSize: '13px' }}>
            Configure external high-visibility LCD, TV, and LED command-center displays for the plant floor.
          </div>
        </div>

        <button
          onClick={openPopupDisplay}
          style={{
            background: '#0d7778',
            color: '#ffffff',
            border: 'none',
            padding: '10px 16px',
            fontWeight: 800,
            fontSize: '12px',
            cursor: 'pointer',
            letterSpacing: '0.5px',
          }}
        >
          🖥 Open Fullscreen Display Mode
        </button>
      </div>

      {/* Main Grid: Screen Preview + Configuration */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '20px' }}>
        {/* Left Screen Preview */}
        <div
          style={{
            background: '#071b1f',
            color: '#ffffff',
            padding: '28px',
            minHeight: '580px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '2px solid #16363c',
          }}
        >
          {/* Screen Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, letterSpacing: '0.5px' }}>
                APEX CHEMICALS × ECOPLANT INTELLIGENCE
              </h3>
              <div style={{ color: '#91aaac', fontSize: '11px', marginTop: '4px' }}>
                ANKLESHWAR PLANT • ENVIRONMENT MONITORING
              </div>
            </div>
            <div style={{ color: '#6be1ae', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', background: '#6be1ae', borderRadius: '50%', display: 'inline-block' }} />
              LIVE
            </div>
          </div>

          {/* Screen Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', margin: '24px 0' }}>
            <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)', padding: '20px' }}>
              <span style={{ color: '#98b2b4', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>PM2.5</span>
              <b style={{ fontSize: '46px', display: 'block', letterSpacing: '-0.04em', margin: '6px 0', fontFamily: 'var(--font-mono)', color: '#f87171' }}>
                84.6
              </b>
              <em style={{ fontSize: '11px', color: '#9ab2b4', fontStyle: 'normal' }}>µg/m³ • ↑ 2.4× baseline</em>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)', padding: '20px' }}>
              <span style={{ color: '#98b2b4', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>SO₂</span>
              <b style={{ fontSize: '46px', display: 'block', letterSpacing: '-0.04em', margin: '6px 0', fontFamily: 'var(--font-mono)', color: '#fbbf24' }}>
                42.7
              </b>
              <em style={{ fontSize: '11px', color: '#9ab2b4', fontStyle: 'normal' }}>ppb • ↑ 1.8× baseline</em>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)', padding: '20px' }}>
              <span style={{ color: '#98b2b4', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>TEMPERATURE</span>
              <b style={{ fontSize: '46px', display: 'block', letterSpacing: '-0.04em', margin: '6px 0', fontFamily: 'var(--font-mono)' }}>
                29.4
              </b>
              <em style={{ fontSize: '11px', color: '#9ab2b4', fontStyle: 'normal' }}>°C • Ambient Thermal</em>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)', padding: '20px' }}>
              <span style={{ color: '#98b2b4', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>HUMIDITY</span>
              <b style={{ fontSize: '46px', display: 'block', letterSpacing: '-0.04em', margin: '6px 0', fontFamily: 'var(--font-mono)' }}>
                71
              </b>
              <em style={{ fontSize: '11px', color: '#9ab2b4', fontStyle: 'normal' }}>% • Relative Moisture</em>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)', padding: '20px' }}>
              <span style={{ color: '#98b2b4', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>WIND</span>
              <b style={{ fontSize: '46px', display: 'block', letterSpacing: '-0.04em', margin: '6px 0', fontFamily: 'var(--font-mono)' }}>
                4.8
              </b>
              <em style={{ fontSize: '11px', color: '#9ab2b4', fontStyle: 'normal' }}>m/s • SE Direction</em>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)', padding: '20px' }}>
              <span style={{ color: '#98b2b4', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>NETWORK</span>
              <b style={{ fontSize: '46px', display: 'block', letterSpacing: '-0.04em', margin: '6px 0', fontFamily: 'var(--font-mono)', color: '#52d3a1' }}>
                20/20
              </b>
              <em style={{ fontSize: '11px', color: '#9ab2b4', fontStyle: 'normal' }}>Active Monitoring Nodes</em>
            </div>
          </div>

          {/* Active Alert Banner */}
          <div
            style={{
              padding: '14px 18px',
              background: 'rgba(213, 155, 43, 0.15)',
              border: '1px solid rgba(213, 155, 43, 0.35)',
              color: '#eac879',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.4px',
            }}
          >
            ⚠ ENVIRONMENTAL EVENT DETECTED • Probable source: Boiler Area (Apex Agro-Chem Synthesis) • Confidence 89.5%
          </div>
        </div>

        {/* Right Configuration Card */}
        <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', padding: '20px' }}>
          <div style={{ textTransform: 'uppercase', letterSpacing: '0.1em', color: '#0d7778', fontSize: '10px', fontWeight: 800 }}>
            DISPLAY CONFIGURATION
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#5b6b71', marginBottom: '6px' }}>
              Display Name
            </label>
            <input
              value={settings.displayName}
              onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
              style={{ width: '100%', padding: '9px 11px', border: '1px solid #dce5e7', fontSize: '12px' }}
            />
          </div>

          <div style={{ marginTop: '14px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#5b6b71', marginBottom: '6px' }}>
              Screen Type
            </label>
            <select
              value={settings.screenType}
              onChange={(e) => setSettings({ ...settings, screenType: e.target.value })}
              style={{ width: '100%', padding: '9px 11px', border: '1px solid #dce5e7', fontSize: '12px', background: '#fff' }}
            >
              <option>Large LCD / TV</option>
              <option>LED Wall</option>
              <option>Operator Monitor</option>
            </select>
          </div>

          <div style={{ marginTop: '14px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#5b6b71', marginBottom: '6px' }}>
              Layout
            </label>
            <select
              value={settings.layout}
              onChange={(e) => setSettings({ ...settings, layout: e.target.value })}
              style={{ width: '100%', padding: '9px 11px', border: '1px solid #dce5e7', fontSize: '12px', background: '#fff' }}
            >
              <option>3 × 2 Metrics</option>
              <option>2 × 2 Metrics</option>
              <option>Metrics + Event</option>
            </select>
          </div>

          <div style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#5b6b71', textTransform: 'uppercase', marginBottom: '8px' }}>
              Visible Metrics
            </div>
            {['PM2.5', 'SO₂', 'Temperature', 'Humidity', 'Wind Vector', 'Network Uptime'].map((metric) => (
              <div
                key={metric}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: '1px solid #f4f4f5',
                  fontSize: '12px',
                }}
              >
                <span>{metric}</span>
                <input type="checkbox" defaultChecked />
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              appStore.setDisplaySettings(settings);
              showToast('Plant display configuration saved');
            }}
            style={{
              width: '100%',
              marginTop: '20px',
              background: '#0d7778',
              color: '#ffffff',
              border: 'none',
              padding: '11px 16px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Save Display Settings
          </button>
        </div>
      </div>
    </div>
  );
}
