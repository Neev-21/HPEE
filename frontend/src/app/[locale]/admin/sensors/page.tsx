'use client';

import { useState, useEffect } from 'react';
import { appStore, ConfiguredSensor } from '@/lib/store';

const ALL_MEASUREMENTS = [
  'PM2.5',
  'SO₂',
  'Temperature',
  'Humidity',
  'VOC',
  'CO',
  'NO₂',
  'Wind Speed',
  'Wind Direction',
  'pH',
  'Turbidity',
  'Flow Rate',
];

const ZONES = [
  'Boiler Area',
  'Production Unit A',
  'Storage',
  'Waste Treatment',
  'Boundary North',
  'Perimeter South',
];

export default function SensorConfigurationPage() {
  const [sensors, setSensors] = useState<ConfiguredSensor[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<ConfiguredSensor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New Sensor Modal form state
  const [newName, setNewName] = useState('Boundary Sensor 07');
  const [newId, setNewId] = useState('S-007');
  const [newZone, setNewZone] = useState('Boundary North');
  const [newMeasurements, setNewMeasurements] = useState<string[]>(['PM2.5', 'VOC']);

  useEffect(() => {
    const list = appStore.getSensors();
    setSensors(list);
    if (list.length > 0) {
      setSelectedSensor({ ...list[0] });
    }

    const unsub = appStore.subscribe(() => {
      setSensors(appStore.getSensors());
    });
    return unsub;
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleSelectSensor = (s: ConfiguredSensor) => {
    setSelectedSensor({ ...s });
    showToast(`${s.id} loaded for editing`);
  };

  const handleToggleMeasurement = (m: string) => {
    if (!selectedSensor) return;
    const exists = selectedSensor.measurements.includes(m);
    const updated = exists
      ? selectedSensor.measurements.filter((x) => x !== m)
      : [...selectedSensor.measurements, m];
    setSelectedSensor({ ...selectedSensor, measurements: updated });
  };

  const handleToggleBehavior = (
    key: 'showOnOverview' | 'showInDisplay' | 'showTrend' | 'generateAlerts'
  ) => {
    if (!selectedSensor) return;
    setSelectedSensor({
      ...selectedSensor,
      [key]: !selectedSensor[key],
    });
  };

  const handleSaveSensor = () => {
    if (!selectedSensor) return;
    appStore.upsertSensor(selectedSensor);
    showToast(`Sensor ${selectedSensor.id} configuration saved`);
  };

  const handleCreateSensor = () => {
    const newSensor: ConfiguredSensor = {
      id: newId,
      name: newName,
      zone: newZone,
      location: `${newZone} / Station Point`,
      measurements: newMeasurements,
      warningThreshold: 50,
      criticalThreshold: 100,
      showOnOverview: true,
      showInDisplay: true,
      showTrend: true,
      generateAlerts: true,
      status: 'ONLINE',
    };
    appStore.upsertSensor(newSensor);
    setIsModalOpen(false);
    showToast(`Sensor ${newId} created successfully`);
    setSelectedSensor(newSensor);
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px', fontFamily: 'Public Sans, sans-serif' }}>
      {/* Toast Notification */}
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
            Sensor Configuration
          </h1>
          <div style={{ color: '#718087', fontSize: '13px' }}>
            Configure hardware identity, factory zone binding, measurement capabilities, thresholds, and live telemetry behavior.
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            background: '#0d7778',
            color: '#fff',
            border: 'none',
            padding: '10px 18px',
            fontWeight: 800,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>＋</span> Add Sensor
        </button>
      </div>

      {/* Sensor Registry Table */}
      <div style={{ background: '#fff', border: '1px solid #dce5e7', marginBottom: '24px' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #dce5e7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#162126' }}>
            Installed Facility Sensors ({sensors.length})
          </span>
          <span style={{ fontSize: '11px', color: '#718087' }}>
            Synced with local reactive storage
          </span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fbfc', borderBottom: '1px solid #dce5e7' }}>
              <th style={{ padding: '12px 16px', fontSize: '11px', color: '#718087', fontWeight: 800, textTransform: 'uppercase' }}>Sensor Name</th>
              <th style={{ padding: '12px 16px', fontSize: '11px', color: '#718087', fontWeight: 800, textTransform: 'uppercase' }}>Hardware ID</th>
              <th style={{ padding: '12px 16px', fontSize: '11px', color: '#718087', fontWeight: 800, textTransform: 'uppercase' }}>Zone Binding</th>
              <th style={{ padding: '12px 16px', fontSize: '11px', color: '#718087', fontWeight: 800, textTransform: 'uppercase' }}>Configured Capabilities</th>
              <th style={{ padding: '12px 16px', fontSize: '11px', color: '#718087', fontWeight: 800, textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '12px 16px', fontSize: '11px', color: '#718087', fontWeight: 800, textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sensors.map((s) => {
              const isSel = selectedSensor?.id === s.id;
              return (
                <tr
                  key={s.id}
                  onClick={() => handleSelectSensor(s)}
                  style={{
                    borderBottom: '1px solid #eef2f3',
                    background: isSel ? '#f0f9f8' : '#fff',
                    cursor: 'pointer',
                  }}
                >
                  <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: '#162126' }}>
                    {s.name}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '12px', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, color: '#0d7778' }}>
                    {s.id}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#56676c' }}>
                    {s.zone}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '12px', color: '#4a5b61' }}>
                    {s.measurements.join(' • ')}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        fontSize: '10px',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        background: s.status === 'ONLINE' ? '#e7f6ef' : s.status === 'INVESTIGATE' ? '#fff4dd' : '#ffe8e8',
                        color: s.status === 'ONLINE' ? '#158363' : s.status === 'INVESTIGATE' ? '#d79b2b' : '#c94d4d',
                      }}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectSensor(s);
                      }}
                      style={{
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: 800,
                        border: '1px solid #dce5e7',
                        background: '#fff',
                        cursor: 'pointer',
                        color: '#162126',
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Editor Grid: Form on Left, Display Behavior on Right */}
      {selectedSensor && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '24px' }}>
          {/* Form Properties */}
          <div style={{ background: '#fff', border: '1px solid #dce5e7', padding: '24px' }}>
            <div style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '11px', fontWeight: 800, color: '#0d7778', marginBottom: '16px' }}>
              Selected Sensor Configuration • {selectedSensor.id}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Sensor Name
                </label>
                <input
                  type="text"
                  value={selectedSensor.name}
                  onChange={(e) => setSelectedSensor({ ...selectedSensor, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #dce5e7', fontSize: '13px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Hardware Identifier
                </label>
                <input
                  type="text"
                  value={selectedSensor.id}
                  disabled
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #dce5e7', background: '#f7fafb', fontSize: '13px', fontFamily: 'IBM Plex Mono, monospace', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Zone Binding
                </label>
                <select
                  value={selectedSensor.zone}
                  onChange={(e) => setSelectedSensor({ ...selectedSensor, zone: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #dce5e7', fontSize: '13px', background: '#fff', outline: 'none' }}
                >
                  {ZONES.map((z) => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Physical Location
                </label>
                <input
                  type="text"
                  value={selectedSensor.location}
                  onChange={(e) => setSelectedSensor({ ...selectedSensor, location: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #dce5e7', fontSize: '13px', outline: 'none' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Active Sensor Capabilities (Measurements)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {ALL_MEASUREMENTS.map((m) => {
                    const active = selectedSensor.measurements.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleToggleMeasurement(m)}
                        style={{
                          padding: '7px 12px',
                          border: active ? '1px solid #0d7778' : '1px solid #dce5e7',
                          background: active ? '#dff1ef' : '#fff',
                          color: active ? '#0d7778' : '#5b6b71',
                          fontWeight: active ? 800 : 500,
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span style={{ fontSize: '14px' }}>{active ? '☑' : '☐'}</span>
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Warning Threshold (Yellow)
                </label>
                <input
                  type="number"
                  value={selectedSensor.warningThreshold}
                  onChange={(e) => setSelectedSensor({ ...selectedSensor, warningThreshold: Number(e.target.value) })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #dce5e7', fontSize: '13px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Critical Threshold (Red)
                </label>
                <input
                  type="number"
                  value={selectedSensor.criticalThreshold}
                  onChange={(e) => setSelectedSensor({ ...selectedSensor, criticalThreshold: Number(e.target.value) })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #dce5e7', fontSize: '13px', outline: 'none' }}
                />
              </div>
            </div>

            <button
              onClick={handleSaveSensor}
              style={{
                marginTop: '20px',
                background: '#0d7778',
                color: '#fff',
                border: 'none',
                padding: '11px 24px',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Save Configuration
            </button>
          </div>

          {/* Display Behavior & Telemetry Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: '#fff', border: '1px solid #dce5e7', padding: '24px' }}>
              <div style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '11px', fontWeight: 800, color: '#0d7778', marginBottom: '16px' }}>
                Display & Streaming Behavior
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { key: 'showOnOverview' as const, label: 'Show on Overview Blueprint', desc: 'Renders interactive pin on facility map' },
                  { key: 'showInDisplay' as const, label: 'Show in Plant Display Kiosk', desc: 'Streams to production floor external display' },
                  { key: 'showTrend' as const, label: 'Show Historical Trend Mini-chart', desc: 'Renders 60-minute sparklines in detail panel' },
                  { key: 'generateAlerts' as const, label: 'Generate Regulatory Alerts', desc: 'Triggers incident dossier on threshold exceedance' },
                ].map((item) => (
                  <div
                    key={item.key}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: '1px solid #eef2f3',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#162126' }}>{item.label}</div>
                      <div style={{ fontSize: '11px', color: '#718087', marginTop: '2px' }}>{item.desc}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleBehavior(item.key)}
                      style={{
                        width: '44px',
                        height: '24px',
                        borderRadius: '12px',
                        background: selectedSensor[item.key] ? '#0d7778' : '#c9d5d8',
                        position: 'relative',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: '3px',
                          left: selectedSensor[item.key] ? '23px' : '3px',
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
            </div>

            <div style={{ background: '#f4f8f8', border: '1px solid #dce5e7', padding: '18px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#10282d', marginBottom: '6px' }}>
                Operational Architecture Note
              </div>
              <div style={{ fontSize: '11px', color: '#56676c', lineHeight: 1.5 }}>
                Sensor nodes automatically bind to the HPEE telemetry streaming bus (MQTT Broker on port 1884 & FastAPI WebSocket `/api/v1/ws/live`). Modifying capabilities dynamically adjusts the real-time detail inspector and incident attribution algorithms.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Sensor Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(8, 22, 25, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div style={{ maxWidth: '640px', width: '100%', background: '#fff', padding: '24px', border: '1px solid #dce5e7' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#0d7778', fontWeight: 800 }}>
                  New Hardware Node
                </div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#162126' }}>
                  Register Sensor
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ border: 'none', background: 'transparent', fontSize: '20px', cursor: 'pointer', color: '#718087' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '6px' }}>
                  Sensor Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #dce5e7', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '6px' }}>
                  Sensor ID
                </label>
                <input
                  type="text"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #dce5e7', fontSize: '13px', fontFamily: 'IBM Plex Mono, monospace' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '6px' }}>
                  Facility Zone
                </label>
                <select
                  value={newZone}
                  onChange={(e) => setNewZone(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #dce5e7', fontSize: '13px', background: '#fff' }}
                >
                  {ZONES.map((z) => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '8px' }}>
                  Select Measured Parameters
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {ALL_MEASUREMENTS.map((m) => {
                    const sel = newMeasurements.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          if (sel) {
                            setNewMeasurements(newMeasurements.filter((x) => x !== m));
                          } else {
                            setNewMeasurements([...newMeasurements, m]);
                          }
                        }}
                        style={{
                          padding: '6px 10px',
                          border: sel ? '1px solid #0d7778' : '1px solid #dce5e7',
                          background: sel ? '#dff1ef' : '#fff',
                          color: sel ? '#0d7778' : '#5b6b71',
                          fontWeight: sel ? 800 : 500,
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ padding: '9px 16px', border: '1px solid #dce5e7', background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '12px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSensor}
                style={{ padding: '9px 20px', border: 'none', background: '#0d7778', color: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: '12px' }}
              >
                Create Sensor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
