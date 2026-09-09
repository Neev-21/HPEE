'use client';

import { useState, useEffect } from 'react';
import { appStore, VisualMetricsSettings } from '@/lib/store';

export default function VisualMetricsPage() {
  const [settings, setSettings] = useState<VisualMetricsSettings>({
    showCurrentValue: true,
    showThresholdState: true,
    showTrendArrow: true,
    showUnit: true,
    showHistoricalMiniChart: true,
  });
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    setSettings(appStore.getVisualMetrics());
    const unsub = appStore.subscribe(() => {
      setSettings(appStore.getVisualMetrics());
    });
    return unsub;
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleToggle = (key: keyof VisualMetricsSettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    appStore.setVisualMetrics(updated);
    showToast(`Metric element "${key}" ${updated[key] ? 'enabled' : 'disabled'}`);
  };

  const handleSave = () => {
    appStore.setVisualMetrics(settings);
    showToast('Visual metric formatting rules saved across all screens');
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px', fontFamily: 'Public Sans, sans-serif' }}>
      {/* Toast */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#10282d',
            color: '#fff',
            padding: '12px 20px',
            fontSize: '13px',
            fontWeight: 700,
            zIndex: 9999,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            borderLeft: '4px solid #0d7778',
          }}
        >
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ textTransform: 'uppercase', letterSpacing: '0.12em', color: '#0d7778', fontSize: '11px', fontWeight: 800 }}>
            Admin Workspace
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#162126', margin: '4px 0 6px', letterSpacing: '-0.03em' }}>
            Visual Metrics Configuration
          </h1>
          <div style={{ color: '#718087', fontSize: '13px' }}>
            Configure default information density, threshold indicators, and sparkline rendering rules across the dashboard and external plant display.
          </div>
        </div>

        <button
          onClick={handleSave}
          style={{
            background: '#0d7778',
            color: '#fff',
            border: 'none',
            padding: '10px 22px',
            fontWeight: 800,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Save Configuration
        </button>
      </div>

      {/* Two Column Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)', gap: '24px' }}>
        {/* Toggle Switches */}
        <div style={{ background: '#fff', border: '1px solid #dce5e7', padding: '24px' }}>
          <div style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '11px', fontWeight: 800, color: '#0d7778', marginBottom: '16px' }}>
            Metric Card Component Visibility
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { key: 'showCurrentValue' as const, label: 'Current Value (Numerical)', desc: 'Display large formatted metric readout (e.g. 84.6)' },
              { key: 'showThresholdState' as const, label: 'Threshold Alert Badge', desc: 'Render NORMAL / WATCH / CRITICAL regulatory status badge' },
              { key: 'showTrendArrow' as const, label: 'Rate of Change & Baseline Ratio', desc: 'Display trend arrow with baseline multiplier (e.g. ↑ 2.4× baseline)' },
              { key: 'showUnit' as const, label: 'Engineering Unit Label', desc: 'Render SI measurement units (e.g. µg/m³, ppm, °C, %)' },
              { key: 'showHistoricalMiniChart' as const, label: 'Historical Trend Mini-Chart (Sparkline)', desc: 'Render 60-minute SVG waveform inside card body' },
            ].map((item) => (
              <div
                key={item.key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 0',
                  borderBottom: '1px solid #eef2f3',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#162126' }}>{item.label}</div>
                  <div style={{ fontSize: '11px', color: '#718087', marginTop: '2px' }}>{item.desc}</div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle(item.key)}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '12px',
                    background: settings[item.key] ? '#0d7778' : '#c9d5d8',
                    position: 'relative',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '3px',
                      left: settings[item.key] ? '23px' : '3px',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: '#fff',
                      transition: 'left 0.2s',
                    }}
                  />
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '20px', padding: '14px', background: '#f4f8f8', border: '1px solid #dce5e7' }}>
            <div style={{ fontSize: '11px', color: '#56676c', lineHeight: 1.5 }}>
              Toggles apply immediately to the preview on the right. When saved, all widgets and overview cards inherit these visual parameters.
            </div>
          </div>
        </div>

        {/* Live Interactive Preview */}
        <div style={{ background: '#fff', border: '1px solid #dce5e7', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '11px', fontWeight: 800, color: '#0d7778' }}>
              Live Real-Time Preview
            </div>
            <span style={{ fontSize: '10px', background: '#dff1ef', color: '#0d7778', padding: '3px 8px', fontWeight: 800 }}>
              REACTIVE SYNC
            </span>
          </div>

          {/* Primary PM2.5 Card Preview */}
          <div style={{ background: '#f8fbfc', border: '1px solid #dce5e7', padding: '20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#718087', fontWeight: 700, textTransform: 'uppercase' }}>
                  PM2.5 • S-001 (Boiler Area)
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '8px 0 4px' }}>
                  {settings.showCurrentValue ? (
                    <span style={{ fontSize: '36px', fontWeight: 900, letterSpacing: '-0.04em', color: '#162126' }}>
                      84.6
                    </span>
                  ) : (
                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#91a5a7' }}>[Value Hidden]</span>
                  )}
                  {settings.showUnit && (
                    <span style={{ fontSize: '13px', color: '#718087', fontWeight: 700 }}>
                      µg/m³
                    </span>
                  )}
                </div>
              </div>

              {settings.showThresholdState && (
                <span style={{ padding: '4px 8px', fontSize: '10px', fontWeight: 800, background: '#ffe8e8', color: '#c94d4d' }}>
                  CRITICAL EXCEEDANCE
                </span>
              )}
            </div>

            {settings.showTrendArrow && (
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#c94d4d', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                <span>↑ 2.4× baseline</span>
                <span style={{ color: '#718087', fontWeight: 400, fontSize: '11px' }}>vs 24h average</span>
              </div>
            )}

            {settings.showHistoricalMiniChart && (
              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e0e8ea' }}>
                <div style={{ fontSize: '10px', color: '#718087', marginBottom: '4px', fontWeight: 700 }}>
                  60-MINUTE SENSOR WAVEFORM
                </div>
                <svg viewBox="0 0 400 60" style={{ width: '100%', height: '54px' }} preserveAspectRatio="none">
                  <polyline
                    fill="none"
                    stroke="#c94d4d"
                    strokeWidth="3"
                    points="0,48 25,44 50,49 75,38 100,42 125,30 150,35 175,22 200,28 225,18 250,24 275,14 300,20 325,10 350,15 375,8 400,12"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Secondary Preview Cards (SO2 and Temperature) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: '#f8fbfc', border: '1px solid #dce5e7', padding: '14px' }}>
              <div style={{ fontSize: '10px', color: '#718087', fontWeight: 700, textTransform: 'uppercase' }}>
                SO₂ • S-004
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '4px 0' }}>
                {settings.showCurrentValue ? (
                  <span style={{ fontSize: '22px', fontWeight: 900, color: '#162126' }}>42.7</span>
                ) : (
                  <span style={{ fontSize: '13px', color: '#91a5a7' }}>—</span>
                )}
                {settings.showUnit && <span style={{ fontSize: '11px', color: '#718087' }}>µg/m³</span>}
              </div>
              {settings.showTrendArrow && (
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#d79b2b' }}>↑ 1.8× baseline</div>
              )}
            </div>

            <div style={{ background: '#f8fbfc', border: '1px solid #dce5e7', padding: '14px' }}>
              <div style={{ fontSize: '10px', color: '#718087', fontWeight: 700, textTransform: 'uppercase' }}>
                Temperature • S-002
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '4px 0' }}>
                {settings.showCurrentValue ? (
                  <span style={{ fontSize: '22px', fontWeight: 900, color: '#162126' }}>29.4</span>
                ) : (
                  <span style={{ fontSize: '13px', color: '#91a5a7' }}>—</span>
                )}
                {settings.showUnit && <span style={{ fontSize: '11px', color: '#718087' }}>°C</span>}
              </div>
              {settings.showTrendArrow && (
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#158363' }}>Stable</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
