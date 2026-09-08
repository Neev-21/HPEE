'use client';

import React, { useState, useEffect } from 'react';
import { appStore, type DashboardWidget } from '@/lib/store';

export default function DashboardBuilderPage() {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(appStore.getWidgets());
  const [activeWidgetId, setActiveWidgetId] = useState<string>('w1');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    setWidgets(appStore.getWidgets());
    return appStore.subscribe(() => {
      setWidgets(appStore.getWidgets());
    });
  }, []);

  const activeWidget = widgets.find((w) => w.id === activeWidgetId) || widgets[0];

  const handleAddWidget = (type: string) => {
    const newId = `w-${Date.now()}`;
    const newWidget: DashboardWidget = {
      id: newId,
      type,
      title: `${type} • Configured`,
      dataSource: 'S-001 / PM2.5',
      spanCol: type === 'Historical Trend' ? 6 : 3,
      spanRow: type === 'Historical Trend' || type === 'Weather' ? 2 : 1,
      showTrend: true,
      showThreshold: false,
    };
    appStore.addWidget(newWidget);
    setActiveWidgetId(newId);
    showToast(`${type} widget added to canvas`);
  };

  const handleRemoveWidget = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    appStore.removeWidget(id);
    showToast('Widget removed');
  };

  const handleUpdateActiveWidget = (patch: Partial<DashboardWidget>) => {
    if (!activeWidget) return;
    const updated = widgets.map((w) => (w.id === activeWidget.id ? { ...w, ...patch } : w));
    appStore.setWidgets(updated);
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
            Dashboard Builder
          </h1>
          <div style={{ color: '#71717a', fontSize: '13px' }}>
            Add, arrange, and configure widgets for operational monitoring (client-side persisted UI demo).
          </div>
        </div>

        <button
          onClick={() => showToast('Dashboard configuration saved to storage')}
          style={{
            background: '#0d7778',
            color: '#ffffff',
            border: 'none',
            padding: '10px 16px',
            fontWeight: 800,
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          Save Dashboard
        </button>
      </div>

      {/* 3-Column Builder Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '250px minmax(0, 1fr) 280px', gap: '16px' }}>
        {/* Left: Widget Palette */}
        <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', padding: '16px', minHeight: '620px' }}>
          <div style={{ textTransform: 'uppercase', letterSpacing: '0.1em', color: '#0d7778', fontSize: '10px', fontWeight: 800, marginBottom: '14px' }}>
            WIDGET LIBRARY
          </div>

          {[
            'Metric Card',
            'Historical Trend',
            'Statistics',
            'Weather',
            'Sensor Status',
            'Event Summary',
            'Custom KPI',
          ].map((type) => (
            <div
              key={type}
              style={{
                padding: '10px 12px',
                border: '1px solid #e4e4e7',
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              <span>{type}</span>
              <button
                onClick={() => handleAddWidget(type)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0d7778',
                  fontWeight: 900,
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                ＋ ADD
              </button>
            </div>
          ))}
        </div>

        {/* Center: 12-Column Responsive Canvas */}
        <div
          style={{
            minHeight: '620px',
            padding: '16px',
            border: '2px dashed #cbd5e1',
            background: '#f8fafc',
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gridAutoRows: '96px',
            gap: '12px',
          }}
        >
          {widgets.map((widget) => {
            const isActive = activeWidget?.id === widget.id;
            return (
              <div
                key={widget.id}
                onClick={() => setActiveWidgetId(widget.id)}
                style={{
                  gridColumn: `span ${widget.spanCol}`,
                  gridRow: `span ${widget.spanRow}`,
                  background: '#ffffff',
                  border: `1px solid ${isActive ? '#0d7778' : '#e4e4e7'}`,
                  outline: isActive ? '2px solid #0d7778' : 'none',
                  padding: '12px',
                  position: 'relative',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <button
                  onClick={(e) => handleRemoveWidget(e, widget.id)}
                  style={{
                    position: 'absolute',
                    right: '6px',
                    top: '6px',
                    border: 'none',
                    background: '#f1f5f9',
                    fontSize: '11px',
                    fontWeight: 800,
                    width: '20px',
                    height: '20px',
                    borderRadius: '3px',
                    cursor: 'pointer',
                  }}
                >
                  ×
                </button>

                <small style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                  {widget.title}
                </small>

                <div>
                  <strong style={{ fontSize: widget.spanCol > 3 ? '22px' : '18px', color: '#09090b', display: 'block' }}>
                    {widget.type === 'Historical Trend'
                      ? 'Live Multi-Sensor Sparkline'
                      : widget.type === 'Weather'
                      ? '4.8 m/s • SE Direction'
                      : widget.type === 'Sensor Status'
                      ? '20 / 20 Online'
                      : '84.6 µg/m³'}
                  </strong>
                  <small style={{ fontSize: '10px', color: '#94a3b8' }}>
                    {widget.dataSource} • {widget.showTrend ? 'Trend Active' : 'Static'}
                  </small>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Widget Properties Inspector */}
        <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', padding: '16px', minHeight: '620px' }}>
          <div style={{ textTransform: 'uppercase', letterSpacing: '0.1em', color: '#0d7778', fontSize: '10px', fontWeight: 800, marginBottom: '14px' }}>
            WIDGET PROPERTIES
          </div>

          {activeWidget ? (
            <div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                  Title
                </label>
                <input
                  value={activeWidget.title}
                  onChange={(e) => handleUpdateActiveWidget({ title: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #dce5e7', fontSize: '12px' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                  Data Source
                </label>
                <select
                  value={activeWidget.dataSource}
                  onChange={(e) => handleUpdateActiveWidget({ dataSource: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #dce5e7', fontSize: '12px', background: '#fff' }}
                >
                  <option>S-001 / PM2.5</option>
                  <option>S-001 / SO₂</option>
                  <option>S-002 / Temperature</option>
                  <option>S-005 / Wind Speed</option>
                  <option>Network / All</option>
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                  Grid Width (Columns)
                </label>
                <select
                  value={activeWidget.spanCol}
                  onChange={(e) => handleUpdateActiveWidget({ spanCol: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #dce5e7', fontSize: '12px', background: '#fff' }}
                >
                  <option value={3}>Small (3 Columns)</option>
                  <option value={4}>Medium (4 Columns)</option>
                  <option value={6}>Large (6 Columns)</option>
                  <option value={12}>Full Width (12 Columns)</option>
                </select>
              </div>

              <div style={{ padding: '10px 0', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <span>Show Trend Arrow</span>
                <input
                  type="checkbox"
                  checked={activeWidget.showTrend}
                  onChange={(e) => handleUpdateActiveWidget({ showTrend: e.target.checked })}
                />
              </div>

              <div style={{ padding: '10px 0', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <span>Show Threshold Limit</span>
                <input
                  type="checkbox"
                  checked={activeWidget.showThreshold}
                  onChange={(e) => handleUpdateActiveWidget({ showThreshold: e.target.checked })}
                />
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Select a widget on the canvas to configure properties.</div>
          )}
        </div>
      </div>
    </div>
  );
}
