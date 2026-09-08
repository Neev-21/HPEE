'use client';

import { useState, useEffect } from 'react';
import { appStore, BlueprintZone, BlueprintPin } from '@/lib/store';

export default function BlueprintEditorPage() {
  const [zones, setZones] = useState<BlueprintZone[]>([]);
  const [pins, setPins] = useState<BlueprintPin[]>([]);
  const [selectedZone, setSelectedZone] = useState<BlueprintZone | null>(null);
  const [selectedPin, setSelectedPin] = useState<BlueprintPin | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [mode, setMode] = useState<'SELECT' | 'ZONE' | 'PIN'>('SELECT');

  useEffect(() => {
    setZones(appStore.getZones());
    setPins(appStore.getPins());

    const unsub = appStore.subscribe(() => {
      setZones(appStore.getZones());
      setPins(appStore.getPins());
    });
    return unsub;
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleSave = () => {
    appStore.setZones(zones);
    appStore.setPins(pins);
    showToast('Facility blueprint and sensor positions saved successfully');
  };

  const handleAddZone = () => {
    const newZoneId = `z${Date.now().toString().slice(-4)}`;
    const newZone: BlueprintZone = {
      id: newZoneId,
      name: 'NEW FACILITY ZONE',
      left: '20%',
      top: '20%',
      width: '30%',
      height: '30%',
    };
    const updated = [...zones, newZone];
    setZones(updated);
    setSelectedZone(newZone);
    setSelectedPin(null);
    showToast('New zone created — adjust coordinates in inspector');
  };

  const handleAddPin = () => {
    const nextPinNum = pins.length + 1;
    const newPin: BlueprintPin = {
      id: `p${Date.now().toString().slice(-4)}`,
      sensorId: `S-00${nextPinNum}`,
      zone: zones[0]?.name || 'Boiler Area',
      left: '50%',
      top: '50%',
      measurements: ['PM2.5', 'SO₂'],
    };
    const updated = [...pins, newPin];
    setPins(updated);
    setSelectedPin(newPin);
    setSelectedZone(null);
    showToast(`Sensor pin S${nextPinNum} placed at center`);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode === 'PIN') {
      const rect = e.currentTarget.getBoundingClientRect();
      const xPct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
      const yPct = Math.round(((e.clientY - rect.top) / rect.height) * 100);
      const nextPinNum = pins.length + 1;
      const newPin: BlueprintPin = {
        id: `p${Date.now().toString().slice(-4)}`,
        sensorId: `S-00${nextPinNum}`,
        zone: selectedZone?.name || 'Boiler Area',
        left: `${xPct}%`,
        top: `${yPct}%`,
        measurements: ['PM2.5', 'SO₂'],
      };
      setPins([...pins, newPin]);
      setSelectedPin(newPin);
      setMode('SELECT');
      showToast(`Placed pin S${nextPinNum} at (${xPct}%, ${yPct}%)`);
    }
  };

  const handleResetDefaults = () => {
    localStorage.removeItem('hpee_zones');
    localStorage.removeItem('hpee_pins');
    setZones(appStore.getZones());
    setPins(appStore.getPins());
    showToast('Blueprint layout reset to plant engineering default');
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <div style={{ textTransform: 'uppercase', letterSpacing: '0.12em', color: '#0d7778', fontSize: '11px', fontWeight: 800 }}>
            Admin Workspace
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#162126', margin: '4px 0 6px', letterSpacing: '-0.03em' }}>
            Facility Blueprint Editor
          </h1>
          <div style={{ color: '#718087', fontSize: '13px' }}>
            Upload CAD or plant architectural drawings, define zoning perimeters, and calibrate physical sensor telemetry coordinates.
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => showToast('CAD Blueprint (.svg / .dwg) upload selector opened')}
            style={{ padding: '9px 14px', border: '1px solid #dce5e7', background: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
          >
            Upload Blueprint
          </button>
          <button
            onClick={handleAddZone}
            style={{ padding: '9px 14px', border: '1px solid #dce5e7', background: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
          >
            ＋ Zone
          </button>
          <button
            onClick={() => {
              setMode('PIN');
              showToast('Click anywhere on the blueprint floor to drop a new sensor pin');
            }}
            style={{
              padding: '9px 14px',
              border: mode === 'PIN' ? '1px solid #0d7778' : '1px solid #dce5e7',
              background: mode === 'PIN' ? '#dff1ef' : '#fff',
              color: mode === 'PIN' ? '#0d7778' : '#162126',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            ＋ Pin Sensor
          </button>
          <button
            onClick={handleResetDefaults}
            style={{ padding: '9px 14px', border: '1px solid #dce5e7', background: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            style={{ padding: '9px 20px', border: 'none', background: '#0d7778', color: '#fff', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
          >
            Save Blueprint
          </button>
        </div>
      </div>

      {/* Editor Layout: Blueprint Canvas + Inspector Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '20px' }}>
        {/* Blueprint Canvas */}
        <div style={{ background: '#fff', border: '1px solid #dce5e7' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #dce5e7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#162126' }}>
                Plant-01 Blueprint Canvas
              </span>
              <span style={{ fontSize: '11px', color: '#718087', marginLeft: '12px' }}>
                {zones.length} zones · {pins.length} active sensor pins
              </span>
            </div>
            <span style={{ padding: '3px 8px', fontSize: '10px', fontWeight: 800, background: '#e7f6ef', color: '#158363' }}>
              CALIBRATED
            </span>
          </div>

          {/* Interactive Graphic Floor */}
          <div
            onClick={handleCanvasClick}
            style={{
              position: 'relative',
              minHeight: '640px',
              overflow: 'hidden',
              background: 'linear-gradient(90deg, rgba(13,119,120,0.04) 1px, transparent 1px), linear-gradient(rgba(13,119,120,0.04) 1px, transparent 1px), #f9fcfa',
              backgroundSize: '32px 32px',
              cursor: mode === 'PIN' ? 'crosshair' : 'default',
            }}
          >
            {/* Outer Perimeter Wall */}
            <div
              style={{
                position: 'absolute',
                left: '6%',
                right: '6%',
                top: '6%',
                bottom: '8%',
                border: '3px solid #65777b',
                background: 'rgba(255, 255, 255, 0.75)',
              }}
            >
              {/* Piping & Process Infrastructure */}
              <div style={{ position: 'absolute', left: '39%', top: '25%', height: '4px', width: '7%', background: '#84999b' }} />
              <div style={{ position: 'absolute', left: '71%', top: '24%', height: '4px', width: '8%', background: '#84999b' }} />
              <div style={{ position: 'absolute', left: '45%', top: '70%', height: '4px', width: '9%', background: '#84999b' }} />

              {/* Zones */}
              {zones.map((z) => {
                const isSel = selectedZone?.id === z.id;
                return (
                  <div
                    key={z.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedZone(z);
                      setSelectedPin(null);
                      showToast(`Zone "${z.name}" selected`);
                    }}
                    style={{
                      position: 'absolute',
                      left: z.left,
                      top: z.top,
                      width: z.width,
                      height: z.height,
                      border: isSel ? '2px solid #0d7778' : '2px dashed #91a5a7',
                      background: isSel ? 'rgba(13, 119, 120, 0.12)' : 'rgba(220, 232, 232, 0.35)',
                      padding: '10px',
                      fontSize: '10px',
                      fontWeight: 900,
                      color: isSel ? '#0d7778' : '#56676c',
                      cursor: 'pointer',
                      userSelect: 'none',
                      transition: 'border 0.2s, background 0.2s',
                    }}
                  >
                    {z.name}
                  </div>
                );
              })}

              {/* Sensor Pins */}
              {pins.map((p, idx) => {
                const isSel = selectedPin?.id === p.id;
                const label = `S${idx + 1}`;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPin(p);
                      setSelectedZone(null);
                      showToast(`Sensor pin ${p.sensorId} selected`);
                    }}
                    style={{
                      position: 'absolute',
                      left: p.left,
                      top: p.top,
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: isSel ? '#d79b2b' : '#0d7778',
                      border: '4px solid #ffffff',
                      boxShadow: '0 0 0 2px rgba(13,119,120,0.25), 0 6px 14px rgba(13,119,120,0.25)',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 900,
                      display: 'grid',
                      placeItems: 'center',
                      cursor: 'pointer',
                      zIndex: 10,
                      transform: isSel ? 'scale(1.15)' : 'none',
                      transition: 'transform 0.2s, background 0.2s',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Canvas Legend */}
            <div
              style={{
                position: 'absolute',
                left: '20px',
                bottom: '16px',
                background: '#fff',
                border: '1px solid #dce5e7',
                padding: '8px 12px',
                display: 'flex',
                gap: '14px',
                fontSize: '11px',
                zIndex: 20,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d7778' }} />
                Sensor Pin
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', border: '1px dashed #819395', background: '#eef4f4' }} />
                Zone Bounds
              </span>
              <span style={{ color: '#718087' }}>Click elements to edit coordinates</span>
            </div>
          </div>
        </div>

        {/* Inspector Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Zone Inspector */}
          {selectedZone && (
            <div style={{ background: '#fff', border: '1px solid #dce5e7', padding: '20px' }}>
              <div style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '11px', fontWeight: 800, color: '#0d7778', marginBottom: '14px' }}>
                Zone Inspector • {selectedZone.name}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '4px' }}>
                    Zone Name
                  </label>
                  <input
                    type="text"
                    value={selectedZone.name}
                    onChange={(e) => {
                      const updated = { ...selectedZone, name: e.target.value };
                      setSelectedZone(updated);
                      setZones(zones.map((z) => (z.id === updated.id ? updated : z)));
                    }}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #dce5e7', fontSize: '12px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '4px' }}>Left %</label>
                    <input
                      type="text"
                      value={selectedZone.left}
                      onChange={(e) => {
                        const updated = { ...selectedZone, left: e.target.value };
                        setSelectedZone(updated);
                        setZones(zones.map((z) => (z.id === updated.id ? updated : z)));
                      }}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #dce5e7', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '4px' }}>Top %</label>
                    <input
                      type="text"
                      value={selectedZone.top}
                      onChange={(e) => {
                        const updated = { ...selectedZone, top: e.target.value };
                        setSelectedZone(updated);
                        setZones(zones.map((z) => (z.id === updated.id ? updated : z)));
                      }}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #dce5e7', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '4px' }}>Width %</label>
                    <input
                      type="text"
                      value={selectedZone.width}
                      onChange={(e) => {
                        const updated = { ...selectedZone, width: e.target.value };
                        setSelectedZone(updated);
                        setZones(zones.map((z) => (z.id === updated.id ? updated : z)));
                      }}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #dce5e7', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '4px' }}>Height %</label>
                    <input
                      type="text"
                      value={selectedZone.height}
                      onChange={(e) => {
                        const updated = { ...selectedZone, height: e.target.value };
                        setSelectedZone(updated);
                        setZones(zones.map((z) => (z.id === updated.id ? updated : z)));
                      }}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #dce5e7', fontSize: '12px' }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setZones(zones.filter((z) => z.id !== selectedZone.id));
                    setSelectedZone(null);
                    showToast('Zone removed from blueprint');
                  }}
                  style={{
                    marginTop: '8px',
                    padding: '8px',
                    border: '1px solid #ffe8e8',
                    background: '#ffe8e8',
                    color: '#c94d4d',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Delete Zone
                </button>
              </div>
            </div>
          )}

          {/* Sensor Pin Inspector */}
          {selectedPin && (
            <div style={{ background: '#fff', border: '1px solid #dce5e7', padding: '20px' }}>
              <div style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '11px', fontWeight: 800, color: '#0d7778', marginBottom: '14px' }}>
                Sensor Pin Inspector • {selectedPin.sensorId}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '4px' }}>
                    Bound Sensor ID
                  </label>
                  <input
                    type="text"
                    value={selectedPin.sensorId}
                    onChange={(e) => {
                      const updated = { ...selectedPin, sensorId: e.target.value };
                      setSelectedPin(updated);
                      setPins(pins.map((p) => (p.id === updated.id ? updated : p)));
                    }}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #dce5e7', fontSize: '12px', fontFamily: 'IBM Plex Mono, monospace' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '4px' }}>
                    Zone Assignment
                  </label>
                  <select
                    value={selectedPin.zone}
                    onChange={(e) => {
                      const updated = { ...selectedPin, zone: e.target.value };
                      setSelectedPin(updated);
                      setPins(pins.map((p) => (p.id === updated.id ? updated : p)));
                    }}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #dce5e7', fontSize: '12px', background: '#fff' }}
                  >
                    {zones.map((z) => (
                      <option key={z.id} value={z.name}>{z.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '4px' }}>Pin Left %</label>
                    <input
                      type="text"
                      value={selectedPin.left}
                      onChange={(e) => {
                        const updated = { ...selectedPin, left: e.target.value };
                        setSelectedPin(updated);
                        setPins(pins.map((p) => (p.id === updated.id ? updated : p)));
                      }}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #dce5e7', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '4px' }}>Pin Top %</label>
                    <input
                      type="text"
                      value={selectedPin.top}
                      onChange={(e) => {
                        const updated = { ...selectedPin, top: e.target.value };
                        setSelectedPin(updated);
                        setPins(pins.map((p) => (p.id === updated.id ? updated : p)));
                      }}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #dce5e7', fontSize: '12px' }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPins(pins.filter((p) => p.id !== selectedPin.id));
                    setSelectedPin(null);
                    showToast('Sensor pin removed from blueprint');
                  }}
                  style={{
                    marginTop: '8px',
                    padding: '8px',
                    border: '1px solid #ffe8e8',
                    background: '#ffe8e8',
                    color: '#c94d4d',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Delete Pin
                </button>
              </div>
            </div>
          )}

          {/* Quick Help card */}
          <div style={{ background: '#f4f8f8', border: '1px solid #dce5e7', padding: '18px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#10282d', marginBottom: '6px' }}>
              Blueprint Calibration Workflow
            </div>
            <div style={{ fontSize: '11px', color: '#56676c', lineHeight: 1.5 }}>
              The blueprint acts as the single spatial truth across the HPEE application. Changes saved here immediately update the Facility Overview blueprint, node selection triggers, and operator kiosk displays.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
