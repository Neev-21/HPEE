'use client';

import React, { useEffect, useState } from 'react';
import { appStore, type PlantDisplaySettings } from '@/lib/store';
import { fetchSensorNodes, fetchPollutionEvents, type SensorNode, type PollutionEvent } from '@/lib/api';
import { liveSocket } from '@/lib/websocket';

export default function KioskPage() {
  const [settings, setSettings] = useState<PlantDisplaySettings>(appStore.getDisplaySettings());
  const [nodes, setNodes] = useState<SensorNode[]>([]);
  const [activeEvent, setActiveEvent] = useState<PollutionEvent | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Live real-time telemetry metrics
  const [liveMetrics, setLiveMetrics] = useState({
    pm25: 84.6,
    so2: 42.7,
    temperature: 29.4,
    humidity: 71,
    windSpeed: 4.8,
    activeNodeId: 'S-001',
    onlineCount: 20,
    totalCount: 20,
  });
  const [alertMessage, setAlertMessage] = useState<string | null>(
    '⚠ ENVIRONMENTAL EVENT DETECTED • Probable source: Boiler Area (Apex Agro-Chem Synthesis) • Confidence 89.5%'
  );

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    setSettings(appStore.getDisplaySettings());
    const unsub = appStore.subscribe(() => {
      setSettings(appStore.getDisplaySettings());
    });

    fetchSensorNodes().then((nds) => {
      setNodes(nds);
      const online = nds.filter((n) => n.status === 'online' || n.status === 'pending').length;
      setLiveMetrics((prev) => ({
        ...prev,
        onlineCount: online || 20,
        totalCount: nds.length || 20,
      }));
    }).catch(() => {});

    fetchPollutionEvents().then((evs) => {
      const active = evs.find((e) => e.status === 'active') || evs[0] || null;
      setActiveEvent(active);
      if (active) {
        setAlertMessage(
          `⚠ ENVIRONMENTAL EVENT DETECTED • Probable source: ${active.village_name || 'Industrial Zone'} • Severity: ${active.severity.toUpperCase()}`
        );
      }
    }).catch(() => {});

    // 1. High-frequency 1-second polling to ensure live updates even if WebSocket is blocked
    const fetchLatestTelemetry = async () => {
      try {
        const res = await fetch('/api/v1/kiosk/latest');
        if (res.ok) {
          const data = await res.json();
          setLiveMetrics((prev) => ({
            ...prev,
            pm25: data.pm25 != null ? Number(data.pm25) : prev.pm25,
            so2: data.so2 != null ? Number(data.so2) : prev.so2,
            temperature: data.temperature != null ? Number(data.temperature) : prev.temperature,
            humidity: data.humidity != null ? Number(data.humidity) : prev.humidity,
            windSpeed: data.wind_speed != null ? Number(data.wind_speed) : prev.windSpeed,
            activeNodeId: data.node_id || prev.activeNodeId,
            onlineCount: data.online_nodes || prev.onlineCount,
          }));
        }
      } catch (err) {
        // Fallback silently if API is warming up
      }
    };

    fetchLatestTelemetry();
    const pollInterval = setInterval(fetchLatestTelemetry, 1000);

    // 2. Real-time WebSocket listener
    const unsubWs = liveSocket.subscribe((msg) => {
      if (msg.type === 'TELEMETRY_UPDATE') {
        setLiveMetrics((prev) => ({
          ...prev,
          pm25: msg.pm25 != null ? Number(msg.pm25) : prev.pm25,
          so2: msg.so2 != null ? Number(msg.so2) : prev.so2,
          temperature: msg.temperature != null ? Number(msg.temperature) : prev.temperature,
          humidity: msg.humidity != null ? Number(msg.humidity) : prev.humidity,
          windSpeed: msg.wind_speed != null ? Number(msg.wind_speed) : prev.windSpeed,
          activeNodeId: msg.node_id || prev.activeNodeId,
        }));
      } else if (msg.type === 'POLLUTION_ALERT') {
        const culprit = msg.primary_culprit ? ` • Attributed: ${msg.primary_culprit.name} (${(msg.primary_culprit.probability_score * 100).toFixed(0)}%)` : '';
        setAlertMessage(`⚠ ACTIVE ENVIRONMENTAL SURGE: ${msg.severity.toUpperCase()} anomaly at ${msg.village_name}${culprit}`);
      }
    });

    return () => {
      unsub();
      unsubWs();
      clearInterval(pollInterval);
    };
  }, []);

  const openPopupDisplay = () => {
    const w = window.open('', '_blank');
    if (!w) {
      showToast('Please allow popups to launch Display Mode');
      return;
    }

    const pm25 = liveMetrics.pm25;
    const so2 = liveMetrics.so2;
    const temp = liveMetrics.temperature;
    const hum = liveMetrics.humidity;
    const wind = liveMetrics.windSpeed;
    const online = liveMetrics.onlineCount;
    const total = liveMetrics.totalCount;
    const alertText = alertMessage || 'NO CRITICAL ENVIRONMENTAL ALERTS ACTIVE';

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
            <span class="val" id="kiosk-pm25" style="color:#f87171;">${Number(pm25).toFixed(1)}</span>
            <span class="unit">µg/m³ • CPCB 24h Threshold: 60</span>
          </div>
          <div class="card">
            <span class="lbl">SO₂ TOXIC GAS</span>
            <span class="val" id="kiosk-so2" style="color:#fbbf24;">${Number(so2).toFixed(1)}</span>
            <span class="unit">ppb • CPCB Benchmark: 80</span>
          </div>
          <div class="card">
            <span class="lbl">AMBIENT TEMPERATURE</span>
            <span class="val" id="kiosk-temp">${Number(temp).toFixed(1)}</span>
            <span class="unit">°C • Ambient Thermal</span>
          </div>
          <div class="card">
            <span class="lbl">RELATIVE HUMIDITY</span>
            <span class="val" id="kiosk-hum">${Math.round(Number(hum))}</span>
            <span class="unit">% • Relative Moisture</span>
          </div>
          <div class="card">
            <span class="lbl">WIND VECTOR</span>
            <span class="val" id="kiosk-wind">${Number(wind).toFixed(1)}</span>
            <span class="unit">m/s • Real-time Anemometer</span>
          </div>
          <div class="card">
            <span class="lbl">NETWORK INTEGRITY</span>
            <span class="val" id="kiosk-network" style="color:#52d3a1;">${online}/${total}</span>
            <span class="unit">Sensors Online • Live Status</span>
          </div>
        </div>

        <div class="alert" id="kiosk-alert">
          ${alertText}
        </div>

        <script>
          (function() {
            const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.hostname || '127.0.0.1';
            const wsUrl = proto + '//' + host + ':8100/api/v1/ws/live?token=hpee-live-token';
            let ws;
            function connect() {
              try {
                ws = new WebSocket(wsUrl);
                ws.onmessage = function(event) {
                  try {
                    const msg = JSON.parse(event.data);
                    if (msg.type === 'TELEMETRY_UPDATE') {
                      if (msg.pm25 != null) {
                        const el = document.getElementById('kiosk-pm25');
                        if (el) el.innerText = Number(msg.pm25).toFixed(1);
                      }
                      if (msg.so2 != null) {
                        const el = document.getElementById('kiosk-so2');
                        if (el) el.innerText = Number(msg.so2).toFixed(1);
                      }
                      if (msg.temperature != null) {
                        const el = document.getElementById('kiosk-temp');
                        if (el) el.innerText = Number(msg.temperature).toFixed(1);
                      }
                      if (msg.humidity != null) {
                        const el = document.getElementById('kiosk-hum');
                        if (el) el.innerText = Math.round(Number(msg.humidity));
                      }
                      if (msg.wind_speed != null) {
                        const el = document.getElementById('kiosk-wind');
                        if (el) el.innerText = Number(msg.wind_speed).toFixed(1);
                      }
                    } else if (msg.type === 'POLLUTION_ALERT') {
                      const el = document.getElementById('kiosk-alert');
                      if (el) {
                        const culprit = msg.primary_culprit ? ' • Attributed: ' + msg.primary_culprit.name : '';
                        el.innerText = '⚠ ACTIVE ENVIRONMENTAL SURGE: ' + msg.severity.toUpperCase() + ' anomaly at ' + msg.village_name + culprit;
                      }
                    }
                  } catch(err) {}
                };
                ws.onclose = function() { setTimeout(connect, 3000); };
              } catch(e) { setTimeout(connect, 5000); }
            }
            connect();

            // 1-second fallback poll in popup
            setInterval(function() {
              fetch('/api/v1/kiosk/latest')
                .then(function(r) { return r.json(); })
                .then(function(data) {
                  if (data.pm25 != null) {
                    var el = document.getElementById('kiosk-pm25');
                    if (el) el.innerText = Number(data.pm25).toFixed(1);
                  }
                  if (data.so2 != null) {
                    var el = document.getElementById('kiosk-so2');
                    if (el) el.innerText = Number(data.so2).toFixed(1);
                  }
                  if (data.temperature != null) {
                    var el = document.getElementById('kiosk-temp');
                    if (el) el.innerText = Number(data.temperature).toFixed(1);
                  }
                  if (data.humidity != null) {
                    var el = document.getElementById('kiosk-hum');
                    if (el) el.innerText = Math.round(Number(data.humidity));
                  }
                  if (data.wind_speed != null) {
                    var el = document.getElementById('kiosk-wind');
                    if (el) el.innerText = Number(data.wind_speed).toFixed(1);
                  }
                })
                .catch(function() {});
            }, 1000);
          })();
        </script>
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
              <b style={{ fontSize: '46px', display: 'block', letterSpacing: '-0.04em', margin: '6px 0', fontFamily: 'var(--font-mono)', color: liveMetrics.pm25 > 60 ? '#f87171' : '#52d3a1' }}>
                {liveMetrics.pm25.toFixed(1)}
              </b>
              <em style={{ fontSize: '11px', color: '#9ab2b4', fontStyle: 'normal' }}>
                µg/m³ • {liveMetrics.pm25 > 60 ? '↑ Above 24h Threshold (60)' : 'Normal Level'}
              </em>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)', padding: '20px' }}>
              <span style={{ color: '#98b2b4', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>SO₂</span>
              <b style={{ fontSize: '46px', display: 'block', letterSpacing: '-0.04em', margin: '6px 0', fontFamily: 'var(--font-mono)', color: liveMetrics.so2 > 40 ? '#fbbf24' : '#52d3a1' }}>
                {liveMetrics.so2.toFixed(1)}
              </b>
              <em style={{ fontSize: '11px', color: '#9ab2b4', fontStyle: 'normal' }}>
                µg/m³ • {liveMetrics.so2 > 40 ? '↑ Elevated Level' : 'Benchmark OK'}
              </em>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)', padding: '20px' }}>
              <span style={{ color: '#98b2b4', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>TEMPERATURE</span>
              <b style={{ fontSize: '46px', display: 'block', letterSpacing: '-0.04em', margin: '6px 0', fontFamily: 'var(--font-mono)' }}>
                {liveMetrics.temperature.toFixed(1)}
              </b>
              <em style={{ fontSize: '11px', color: '#9ab2b4', fontStyle: 'normal' }}>°C • Ambient Thermal</em>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)', padding: '20px' }}>
              <span style={{ color: '#98b2b4', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>HUMIDITY</span>
              <b style={{ fontSize: '46px', display: 'block', letterSpacing: '-0.04em', margin: '6px 0', fontFamily: 'var(--font-mono)' }}>
                {Math.round(liveMetrics.humidity)}
              </b>
              <em style={{ fontSize: '11px', color: '#9ab2b4', fontStyle: 'normal' }}>% • Relative Moisture</em>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)', padding: '20px' }}>
              <span style={{ color: '#98b2b4', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>WIND</span>
              <b style={{ fontSize: '46px', display: 'block', letterSpacing: '-0.04em', margin: '6px 0', fontFamily: 'var(--font-mono)' }}>
                {liveMetrics.windSpeed.toFixed(1)}
              </b>
              <em style={{ fontSize: '11px', color: '#9ab2b4', fontStyle: 'normal' }}>m/s • Real-time Anemometer</em>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)', padding: '20px' }}>
              <span style={{ color: '#98b2b4', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>NETWORK</span>
              <b style={{ fontSize: '46px', display: 'block', letterSpacing: '-0.04em', margin: '6px 0', fontFamily: 'var(--font-mono)', color: '#52d3a1' }}>
                {liveMetrics.onlineCount}/{liveMetrics.totalCount}
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
            {alertMessage || 'NO ACTIVE POLLUTION SURGE DETECTED'}
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
