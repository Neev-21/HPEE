'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { appStore, ConfiguredSensor } from '@/lib/store';

const STEP_NAMES = [
  'Company',
  'Facility',
  'Blueprint',
  'Sensors',
  'Dashboard',
  'Display',
];

export default function SetupWizardPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [currentStep, setCurrentStep] = useState(0);
  const [sensors, setSensors] = useState<ConfiguredSensor[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form State
  const [companyName, setCompanyName] = useState('Apex Chemicals');
  const [brandName, setBrandName] = useState('EcoPlant Intelligence');
  const [plantName, setPlantName] = useState('Ankleshwar Plant');
  const [city, setCity] = useState('Ankleshwar');
  const [state, setState] = useState('');
  const [selectedLayout, setSelectedLayout] = useState<'Standard' | 'Operations'>('Operations');
  const [displayName, setDisplayName] = useState('Main Plant LCD');
  const [screenType, setScreenType] = useState('Large LCD / TV');

  useEffect(() => {
    setSensors(appStore.getSensors());
    const m = appStore.getMaster();
    setCompanyName(m.companyName);
    setBrandName(m.brandName);
    setPlantName(m.plantName);
    setCity(m.city);
    setState(m.state);
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
      showToast(`Step ${currentStep + 1} confirmed`);
    } else {
      // Save all configured items into appStore
      appStore.setMaster({
        companyName,
        brandName,
        plantName,
        city,
        state,
      });
      appStore.setDisplaySettings({
        displayName,
        screenType,
        layout: selectedLayout === 'Operations' ? '3 × 2 Metrics' : '2 × 2 Metrics',
      });
      showToast('Facility Onboarding Complete — Launching Overview...');
      setTimeout(() => {
        router.push(`/${locale}`);
      }, 900);
    }
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
      <div style={{ marginBottom: '20px' }}>
        <div style={{ textTransform: 'uppercase', letterSpacing: '0.12em', color: '#0d7778', fontSize: '11px', fontWeight: 800 }}>
          Initial Plant Onboarding
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#162126', margin: '4px 0 6px', letterSpacing: '-0.03em' }}>
          Facility Setup Wizard
        </h1>
        <div style={{ color: '#718087', fontSize: '13px' }}>
          Follow the guided 6-step workflow to configure corporate identity, spatial CAD blueprint, hardware sensors, and operator floor displays.
        </div>
      </div>

      {/* 6 Step Progress Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', marginBottom: '24px' }}>
        {STEP_NAMES.map((name, idx) => {
          const isActive = idx === currentStep;
          const isDone = idx < currentStep;
          return (
            <button
              key={name}
              onClick={() => setCurrentStep(idx)}
              style={{
                padding: '12px 8px',
                background: isActive ? '#0d7778' : isDone ? '#dff1ef' : '#eaf0f1',
                color: isActive ? '#ffffff' : isDone ? '#0d7778' : '#687a80',
                border: 'none',
                textAlign: 'center',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                letterSpacing: '0.04em',
                transition: 'background 0.2s',
              }}
            >
              {idx + 1} • {name}
            </button>
          );
        })}
      </div>

      {/* Wizard Two Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '24px' }}>
        {/* Step Body */}
        <div style={{ background: '#fff', border: '1px solid #dce5e7', padding: '28px' }}>
          {currentStep === 0 && (
            <div>
              <div style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '11px', fontWeight: 800, color: '#0d7778', marginBottom: '14px' }}>
                Step 1 • Enterprise & Company Identity
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '6px' }}>
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #dce5e7', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '6px' }}>
                    Brand Name / Environmental Monitoring Division
                  </label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #dce5e7', fontSize: '13px' }}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div>
              <div style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '11px', fontWeight: 800, color: '#0d7778', marginBottom: '14px' }}>
                Step 2 • Facility & Plant Location
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '6px' }}>
                    Plant / Site Name
                  </label>
                  <input
                    type="text"
                    value={plantName}
                    onChange={(e) => setPlantName(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #dce5e7', fontSize: '13px' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '6px' }}>
                      City / Estate
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #dce5e7', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '6px' }}>
                      State
                    </label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #dce5e7', fontSize: '13px' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <div style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '11px', fontWeight: 800, color: '#0d7778', marginBottom: '14px' }}>
                Step 3 • Upload Spatial CAD Blueprint
              </div>
              <div
                style={{
                  border: '2px dashed #bfd0d2',
                  padding: '48px 24px',
                  textAlign: 'center',
                  background: '#fcfdfe',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#162126', marginBottom: '4px' }}>
                  Drag & Drop Plant Blueprint File
                </div>
                <div style={{ fontSize: '12px', color: '#718087', marginBottom: '16px' }}>
                  Supported formats: SVG, DWG, High-Resolution PNG or CAD architectural floorplans
                </div>
                <button
                  type="button"
                  onClick={() => showToast('CAD Blueprint file selector opened')}
                  style={{
                    background: '#0d7778',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 20px',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Choose File
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <div style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '11px', fontWeight: 800, color: '#0d7778', marginBottom: '14px' }}>
                Step 4 • Configured Physical Sensors ({sensors.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sensors.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: '#f8fbfc',
                      border: '1px solid #eef2f3',
                      fontSize: '12px',
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 800, color: '#0d7778', fontFamily: 'IBM Plex Mono, monospace', marginRight: '8px' }}>
                        {s.id}
                      </span>
                      <span style={{ fontWeight: 700, color: '#162126' }}>{s.name}</span>
                    </div>
                    <span style={{ color: '#56676c' }}>{s.zone}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => router.push(`/${locale}/admin/sensors`)}
                style={{
                  marginTop: '16px',
                  padding: '9px 16px',
                  background: '#0d7778',
                  color: '#fff',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                ＋ Manage Sensors in Sensor Workspace
              </button>
            </div>
          )}

          {currentStep === 4 && (
            <div>
              <div style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '11px', fontWeight: 800, color: '#0d7778', marginBottom: '14px' }}>
                Step 5 • Dashboard Layout Template
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div
                  onClick={() => setSelectedLayout('Standard')}
                  style={{
                    border: selectedLayout === 'Standard' ? '2px solid #0d7778' : '1px solid #dce5e7',
                    background: selectedLayout === 'Standard' ? '#f0f9f8' : '#fff',
                    padding: '18px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#162126' }}>Standard Layout</div>
                  <div style={{ fontSize: '11px', color: '#718087', margin: '4px 0 12px' }}>
                    Top 4 summary metric tiles, full blueprint interactive canvas, node detail drawer.
                  </div>
                  <span style={{ fontSize: '10px', background: '#eaf0f1', padding: '3px 6px', fontWeight: 700 }}>
                    COMPACT
                  </span>
                </div>

                <div
                  onClick={() => setSelectedLayout('Operations')}
                  style={{
                    border: selectedLayout === 'Operations' ? '2px solid #0d7778' : '1px solid #dce5e7',
                    background: selectedLayout === 'Operations' ? '#f0f9f8' : '#fff',
                    padding: '18px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#162126' }}>Operations Layout</div>
                  <div style={{ fontSize: '11px', color: '#718087', margin: '4px 0 12px' }}>
                    Dual view toggle (CAD Blueprint + GIS Regional Map), live event attribution, 60m trends.
                  </div>
                  <span style={{ fontSize: '10px', background: '#dff1ef', color: '#0d7778', padding: '3px 6px', fontWeight: 800 }}>
                    RECOMMENDED
                  </span>
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div>
              <div style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '11px', fontWeight: 800, color: '#0d7778', marginBottom: '14px' }}>
                Step 6 • External Plant Display Configuration
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '6px' }}>
                    Display Terminal Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #dce5e7', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '6px' }}>
                    Hardware Screen Type
                  </label>
                  <select
                    value={screenType}
                    onChange={(e) => setScreenType(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #dce5e7', fontSize: '13px', background: '#fff' }}
                  >
                    <option value="Large LCD / TV">Large LCD / TV (1080p / 4K)</option>
                    <option value="LED Wall">Outdoor Industrial LED Wall</option>
                    <option value="Operator Monitor">Control Room Multi-Monitor Station</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Setup Status Tracker Card */}
        <div style={{ background: '#fff', border: '1px solid #dce5e7', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '11px', fontWeight: 800, color: '#0d7778', marginBottom: '16px' }}>
              Onboarding Checklist
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {STEP_NAMES.map((name, idx) => {
                const isCurrent = idx === currentStep;
                const isComplete = idx < currentStep;
                return (
                  <div
                    key={name}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingBottom: '8px',
                      borderBottom: '1px solid #eef2f3',
                      fontSize: '12px',
                    }}
                  >
                    <span style={{ color: isCurrent ? '#0d7778' : isComplete ? '#162126' : '#718087', fontWeight: isCurrent ? 800 : 500 }}>
                      {idx + 1}. {name}
                    </span>
                    <span
                      style={{
                        fontSize: '9px',
                        padding: '2px 6px',
                        fontWeight: 800,
                        background: isComplete ? '#e7f6ef' : isCurrent ? '#dff1ef' : '#f0f3f4',
                        color: isComplete ? '#158363' : isCurrent ? '#0d7778' : '#718087',
                      }}
                    >
                      {isComplete ? 'READY' : isCurrent ? 'CURRENT' : 'PENDING'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <button
              type="button"
              onClick={handleNext}
              style={{
                width: '100%',
                padding: '12px',
                background: '#0d7778',
                color: '#fff',
                border: 'none',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {currentStep === 5 ? 'Finish Setup & Launch Overview →' : 'Continue →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
