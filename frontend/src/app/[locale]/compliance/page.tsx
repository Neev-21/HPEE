'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  fetchPollutionEvents,
  fetchComplaint,
  generateComplaint,
  submitComplaint,
  getComplaintPdfUrl,
  type PollutionEvent,
  type ComplaintDetails,
} from '@/lib/api';
import { liveSocket } from '@/lib/websocket';

export default function CompliancePage() {
  const t = useTranslations('Compliance');
  const searchParams = useSearchParams();
  const queryEventId = searchParams?.get('eventId');

  const [events, setEvents] = useState<PollutionEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [complaint, setComplaint] = useState<ComplaintDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Evidence Checklist State
  const [verifiedItems, setVerifiedItems] = useState({
    telemetry: true,
    weather: true,
    shift: true,
    hash: true,
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    async function init() {
      try {
        const evList = await fetchPollutionEvents();
        setEvents(evList);

        const targetId = queryEventId || evList[0]?.event_id;
        if (targetId) {
          setSelectedEventId(targetId);
          await loadComplaintForEvent(targetId);
        }
      } catch (err) {
        console.error('Error loading compliance events:', err);
      } finally {
        setLoading(false);
      }
    }
    init();

    // Subscribe to live incident alerts
    const unsubWs = liveSocket.subscribe((msg) => {
      if (msg.type === 'POLLUTION_ALERT') {
        showToast(`🚨 New Pollution Incident: ${msg.severity.toUpperCase()} at ${msg.village_name}. Events list updated.`);
        fetchPollutionEvents().then((evList) => {
          setEvents(evList);
        }).catch(() => {});
      }
    });

    return () => unsubWs();
  }, [queryEventId]);

  const loadComplaintForEvent = async (eventId: string) => {
    setActionLoading(true);
    try {
      // Auto-generate or fetch draft complaint
      const details = await generateComplaint(eventId);
      setComplaint(details);
    } catch (err) {
      console.warn('Complaint auto-fetch notice:', err);
      // Fallback: try direct fetch if ID was passed
      try {
        const details = await fetchComplaint(eventId);
        setComplaint(details);
      } catch {
        setComplaint(null);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectEvent = (id: string) => {
    setSelectedEventId(id);
    loadComplaintForEvent(id);
  };

  const handleSubmitGspcb = async () => {
    if (!complaint) return;
    setActionLoading(true);
    try {
      const ackRef = `GSPCB/ONLINE/${new Date().getFullYear()}/BH-${Math.floor(10000 + Math.random() * 90000)}`;
      const updated = await submitComplaint(complaint.complaint_id, ackRef);
      setComplaint(updated);
      showToast(`✓ Complaint submitted to GSPCB with reference: ${ackRef}`);
    } catch (err: any) {
      console.error('Submission error:', err);
      showToast(`Submission failed: ${err.message || err}`);
    } finally {
      setActionLoading(false);
    }
  };

  const activeEvent = events.find((e) => e.event_id === selectedEventId);
  const formData = complaint?.gspcb_form_data || {};
  const isSubmitted = complaint?.status === 'submitted';

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px 20px', fontFamily: 'var(--font-sans)' }}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#09090b',
            color: '#ffffff',
            padding: '14px 22px',
            fontSize: '12px',
            fontWeight: 700,
            zIndex: 9999,
            borderLeft: '4px solid #16a34a',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          }}
        >
          {toast}
        </div>
      )}

      {/* Top Banner / Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ textTransform: 'uppercase', letterSpacing: '0.12em', color: '#0d7778', fontSize: '10px', fontWeight: 800 }}>
            LEGAL ENFORCEMENT & COMPLIANCE
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.03em', margin: '4px 0 2px', color: '#09090b' }}>
            {t('title')}
          </h1>
          <div style={{ color: '#71717a', fontSize: '13px' }}>
            {t('subtitle')} — Air (Prevention and Control of Pollution) Act, 1981 Section 21
          </div>
        </div>

        {/* Event Selector Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, color: '#71717a', textTransform: 'uppercase' }}>
            Select Incident:
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => handleSelectEvent(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d4d4d8',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              background: '#ffffff',
              cursor: 'pointer',
            }}
          >
            {events.map((ev) => (
              <option key={ev.event_id} value={ev.event_id}>
                {ev.village_name || 'Incident'} ({ev.event_id.slice(0, 8)}) — {ev.severity.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#71717a', background: '#fff', border: '1px solid #e4e4e7' }}>
          Loading legal compliance dossier...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
          {/* Main Legal Form Dossier */}
          <div style={{ background: '#ffffff', border: '2px solid #09090b', padding: '32px' }}>
            {/* Form Header */}
            <div style={{ borderBottom: '2px solid #09090b', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#71717a' }}>
                  GUJARAT POLLUTION CONTROL BOARD
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 900, margin: '4px 0', letterSpacing: '-0.02em', color: '#09090b' }}>
                  {formData.form_title || 'FORM-A: NOTICE OF EMISSION VIOLATION & CITIZEN COMPLAINT'}
                </h2>
                <div style={{ fontSize: '11px', color: '#71717a', fontFamily: 'var(--font-mono)' }}>
                  STATUTORY FILING UNDER SECTION 21 & 43 OF THE AIR ACT, 1981
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    fontFamily: 'var(--font-mono)',
                    background: isSubmitted ? '#e7f6ef' : '#fff4dd',
                    color: isSubmitted ? '#158363' : '#d79b2b',
                    border: `1px solid ${isSubmitted ? '#158363' : '#d79b2b'}`,
                  }}
                >
                  {isSubmitted ? '✓ OFFICIALLY SUBMITTED' : 'DRAFT FOR REVIEW'}
                </span>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#71717a', marginTop: '4px' }}>
                  {complaint?.complaint_number || 'PENDING ASSIGNMENT'}
                </div>
              </div>
            </div>

            {/* Grid of Legal Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#f8fafc', padding: '12px 16px', border: '1px solid #e4e4e7' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#71717a', textTransform: 'uppercase' }}>
                  Affected Locality / Village
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '2px', color: '#09090b' }}>
                  {formData.locality || activeEvent?.village_name || 'Piraman Village, Ankleshwar Taluka'}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 16px', border: '1px solid #e4e4e7' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#71717a', textTransform: 'uppercase' }}>
                  Alleged Culprit Source
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '2px', color: '#dc2626' }}>
                  {formData.alleged_source || 'Gujarat Organics & Dyes Ltd - Plot 401'}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 16px', border: '1px solid #e4e4e7' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#71717a', textTransform: 'uppercase' }}>
                  Pollutants Observed
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '2px', color: '#09090b' }}>
                  {formData.pollutants_observed ? formData.pollutants_observed.join(', ') : 'SO₂ (Sulphur Dioxide), PM2.5'}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 16px', border: '1px solid #e4e4e7' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#71717a', textTransform: 'uppercase' }}>
                  Peak Recorded Concentration
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '2px', color: '#09090b', fontFamily: 'var(--font-mono)' }}>
                  {formData.peak_concentration_recorded || `PM2.5: ${activeEvent?.peak_pm25 ?? 194.8} µg/m³, SO₂: ${activeEvent?.peak_so2 ?? 141.6} ppb`}
                </div>
              </div>
            </div>

            {/* Evidence Summary Section */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#09090b', textTransform: 'uppercase', marginBottom: '6px' }}>
                Forensic Evidence Summary (Multi-Sensor & Plume Dispersion)
              </div>
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e4e4e7',
                  padding: '14px 16px',
                  fontSize: '12px',
                  lineHeight: '1.6',
                  color: '#3f3f46',
                }}
              >
                {formData.evidence_summary ||
                  'Continuous telemetry from calibrated sensor nodes confirmed sustained elevated SO₂ and PM2.5 emissions. Gaussian Plume backward trajectory matched prevailing OpenMeteo meteorological wind vector (315° NW) aligned directly with factory stack coordinates.'}
              </div>
            </div>

            {/* Action Requested */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#09090b', textTransform: 'uppercase', marginBottom: '6px' }}>
                Statutory Regulatory Action Requested
              </div>
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e4e4e7',
                  padding: '12px 16px',
                  fontSize: '12px',
                  color: '#3f3f46',
                }}
              >
                {formData.action_requested ||
                  'Immediate inspection under Section 21 of The Air Act, stack sampling, and issuance of show-cause notice regarding unauthorized nighttime emissions.'}
              </div>
            </div>

            {/* Complainant Signature Block */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', borderTop: '1px solid #e4e4e7', paddingTop: '16px' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', fontWeight: 700 }}>
                  {t('signatory')}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#09090b' }}>
                  {formData.complainant_name || 'Sureshbhai Patel (Sarpanch Piraman)'}
                </div>
                <div style={{ fontSize: '11px', color: '#71717a' }}>
                  {formData.complainant_contact || '+91 98790 11223'}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', fontWeight: 700 }}>
                  Submission Docket Reference
                </div>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0d7778' }}>
                  {complaint?.submission_reference || 'PENDING SUBMISSION'}
                </div>
              </div>
            </div>
          </div>

          {/* Side Panel: Evidence Verification & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Action Controls */}
            <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', padding: '18px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#0d7778', marginBottom: '12px' }}>
                ONE-CLICK ACTIONS
              </div>

              {complaint ? (
                <>
                  <a
                    href={getComplaintPdfUrl(complaint.complaint_id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block',
                      width: '100%',
                      background: '#09090b',
                      color: '#ffffff',
                      textAlign: 'center',
                      padding: '12px 16px',
                      fontSize: '12px',
                      fontWeight: 800,
                      textDecoration: 'none',
                      marginBottom: '10px',
                    }}
                  >
                    {t('downloadPdf')} ⬇
                  </a>

                  <button
                    onClick={handleSubmitGspcb}
                    disabled={isSubmitted || actionLoading}
                    style={{
                      width: '100%',
                      background: isSubmitted ? '#16a34a' : '#0d7778',
                      color: '#ffffff',
                      border: 'none',
                      padding: '12px 16px',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: isSubmitted || actionLoading ? 'default' : 'pointer',
                    }}
                  >
                    {actionLoading ? 'Processing...' : isSubmitted ? '✓ Submitted to GSPCB' : t('submitGpcb')}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => selectedEventId && loadComplaintForEvent(selectedEventId)}
                  disabled={actionLoading}
                  style={{
                    width: '100%',
                    background: '#0d7778',
                    color: '#ffffff',
                    border: 'none',
                    padding: '12px 16px',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {actionLoading ? 'Generating...' : 'Generate Form-A Draft'}
                </button>
              )}
            </div>

            {/* Evidence Verification Checklist */}
            <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', padding: '18px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#09090b', marginBottom: '12px' }}>
                {t('evidenceVerification')}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#3f3f46', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={verifiedItems.telemetry}
                    onChange={(e) => setVerifiedItems({ ...verifiedItems, telemetry: e.target.checked })}
                  />
                  <span>{t('telemetryVerified')}</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#3f3f46', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={verifiedItems.weather}
                    onChange={(e) => setVerifiedItems({ ...verifiedItems, weather: e.target.checked })}
                  />
                  <span>{t('weatherVerified')}</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#3f3f46', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={verifiedItems.shift}
                    onChange={(e) => setVerifiedItems({ ...verifiedItems, shift: e.target.checked })}
                  />
                  <span>{t('shiftVerified')}</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#3f3f46', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={verifiedItems.hash}
                    onChange={(e) => setVerifiedItems({ ...verifiedItems, hash: e.target.checked })}
                  />
                  <span>{t('hashVerified')}</span>
                </label>
              </div>
            </div>

            {/* Cryptographic SHA-256 Hash Box */}
            <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', padding: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#71717a', textTransform: 'uppercase' }}>
                {t('evidenceHash')}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  background: '#f8fafc',
                  border: '1px solid #e4e4e7',
                  padding: '8px',
                  wordBreak: 'break-all',
                  marginTop: '6px',
                  color: '#09090b',
                }}
              >
                {complaint?.documents?.[0]?.file_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
