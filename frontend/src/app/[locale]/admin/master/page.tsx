'use client';

import { useState, useEffect } from 'react';
import { appStore, MasterIdentity } from '@/lib/store';

export default function MasterEditorPage() {
  const [master, setMaster] = useState<MasterIdentity>({
    companyName: 'Apex Chemicals',
    brandName: 'EcoPlant Intelligence',
    companyId: 'AC-001',
    plantId: 'ANK-001',
    plantName: 'Ankleshwar Plant',
    city: 'Ankleshwar',
    state: '',
    address: 'Industrial Estate, Ankleshwar',
    timezone: 'Asia/Kolkata (IST)',
    defaultDisplay: 'Main Plant LCD',
  });
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    setMaster(appStore.getMaster());
    const unsub = appStore.subscribe(() => {
      setMaster(appStore.getMaster());
    });
    return unsub;
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleChange = (key: keyof MasterIdentity, value: string) => {
    setMaster({ ...master, [key]: value });
  };

  const handleSave = () => {
    appStore.setMaster(master);
    showToast('Master identity & plant credentials updated globally');
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
          <div style={{ textTransform: 'uppercase', letterSpacing: '0.12em', color: '#d79b2b', fontSize: '11px', fontWeight: 800 }}>
            Master Administration
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#162126', margin: '4px 0 6px', letterSpacing: '-0.03em' }}>
            Master Identity & Credentials
          </h1>
          <div style={{ color: '#718087', fontSize: '13px' }}>
            Root-level corporate enterprise, facility binding, regulatory identification, and plant timezone settings.
          </div>
        </div>

        <button
          onClick={handleSave}
          style={{
            background: '#0d7778',
            color: '#fff',
            border: 'none',
            padding: '10px 24px',
            fontWeight: 800,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Save Master Settings
        </button>
      </div>

      {/* Two Column Identity Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px' }}>
        {/* Company Identity */}
        <div style={{ background: '#fff', border: '1px solid #dce5e7', padding: '24px' }}>
          <div style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '11px', fontWeight: 800, color: '#0d7778', marginBottom: '16px' }}>
            Company & Corporate Identity
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '6px', textTransform: 'uppercase' }}>
                Company Name
              </label>
              <input
                type="text"
                value={master.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #dce5e7', fontSize: '13px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '6px', textTransform: 'uppercase' }}>
                Brand / Product Division
              </label>
              <input
                type="text"
                value={master.brandName}
                onChange={(e) => handleChange('brandName', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #dce5e7', fontSize: '13px', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Company ID
                </label>
                <input
                  type="text"
                  value={master.companyId}
                  onChange={(e) => handleChange('companyId', e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #dce5e7', fontSize: '13px', fontFamily: 'IBM Plex Mono, monospace', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Plant Unit Code
                </label>
                <input
                  type="text"
                  value={master.plantId}
                  onChange={(e) => handleChange('plantId', e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #dce5e7', fontSize: '13px', fontFamily: 'IBM Plex Mono, monospace', outline: 'none' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '6px', textTransform: 'uppercase' }}>
                Corporate Brand Mark / SVG Emblem
              </label>
              <input
                type="text"
                defaultValue="apex-chemicals-mark.svg"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #dce5e7', fontSize: '13px', outline: 'none', background: '#f7fafb' }}
              />
            </div>
          </div>
        </div>

        {/* Facility Identity */}
        <div style={{ background: '#fff', border: '1px solid #dce5e7', padding: '24px' }}>
          <div style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '11px', fontWeight: 800, color: '#0d7778', marginBottom: '16px' }}>
            Facility Location & Regulatory Dispatch
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '6px', textTransform: 'uppercase' }}>
                Plant Facility Name
              </label>
              <input
                type="text"
                value={master.plantName}
                onChange={(e) => handleChange('plantName', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #dce5e7', fontSize: '13px', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '6px', textTransform: 'uppercase' }}>
                  City / Taluka
                </label>
                <input
                  type="text"
                  value={master.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #dce5e7', fontSize: '13px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '6px', textTransform: 'uppercase' }}>
                  State / Jurisdiction
                </label>
                <input
                  type="text"
                  value={master.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #dce5e7', fontSize: '13px', outline: 'none' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '6px', textTransform: 'uppercase' }}>
                Postal Address / Industrial Estate Plot
              </label>
              <input
                type="text"
                value={master.address}
                onChange={(e) => handleChange('address', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #dce5e7', fontSize: '13px', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Regulatory Time Zone
                </label>
                <select
                  value={master.timezone}
                  onChange={(e) => handleChange('timezone', e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #dce5e7', fontSize: '13px', background: '#fff', outline: 'none' }}
                >
                  <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#5b6b71', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Primary Floor Display
                </label>
                <select
                  value={master.defaultDisplay}
                  onChange={(e) => handleChange('defaultDisplay', e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #dce5e7', fontSize: '13px', background: '#fff', outline: 'none' }}
                >
                  <option value="Main Plant LCD">Main Plant LCD</option>
                  <option value="Control Room LED Wall">Control Room LED Wall</option>
                  <option value="Perimeter Security Kiosk">Perimeter Security Kiosk</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
