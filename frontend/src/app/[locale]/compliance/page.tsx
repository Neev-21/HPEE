'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import {
  fetchPollutionEvents,
  fetchComplaint,
  generateComplaint,
  submitComplaint,
  getComplaintPdfUrl,
  type PollutionEvent,
  type Complaint,
} from '@/lib/api';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export default function CompliancePage() {
  const t = useTranslations('Compliance');
  const tCommon = useTranslations('Common');

  const [events, setEvents] = useState<PollutionEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<PollutionEvent | null>(null);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPollutionEvents()
      .then((evs) => {
        setEvents(evs);
        const active = evs.find((e) => e.status === 'active') || evs[0] || null;
        setSelectedEvent(active);
        if (active) loadComplaint(active.event_id);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadComplaint(eventId: string) {
    // Try fetching an existing complaint for this event
    try {
      const c = await fetchComplaint(eventId);
      setComplaint(c);
    } catch {
      setComplaint(null);
    }
  }

  async function handleGenerate() {
    if (!selectedEvent) return;
    setGenerating(true);
    try {
      const c = await generateComplaint(selectedEvent.event_id);
      setComplaint(c);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit() {
    if (!complaint) return;
    setSubmitting(true);
    try {
      const updated = await submitComplaint(complaint.complaint_id);
      setComplaint(updated);
      setSubmitMsg(`${t('submitted')}: ${updated.complaint_id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  const now = new Date();
  const formData = complaint?.gspcb_form_data;

  // Build A-17 rows from complaint data
  const a17Rows = complaint ? [
    {
      srNo: 1,
      nameAddress: formData?.alleged_source || '—',
      gpcbId: complaint.complaint_number,
      wastewaterParams: 'pH, TOC, COD, NH₃N',
      airParams: `SPM, NO₂, SO₂ | ${formData?.peak_levels || '—'}`,
      dateDirections: new Date().toLocaleDateString('en-IN'),
      directions: 'Immediate CEMS verification required',
      datesFollowup: '—',
      dateCompliance: '—',
      actionTaken: complaint.status === 'submitted' ? 'Notice Issued' : 'Pending Review',
      remarks: formData?.legal_basis || '—',
    },
  ] : [];

  const evidenceHash = complaint?.documents?.[0]?.file_hash || '—';

  return (
    <div style={{ overflowY: 'auto', height: 'calc(100vh - 118px)' }}>
      {/* Page header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #e4e4e7',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
            {t('title')}
          </h2>
          <p style={{ fontSize: '11px', color: '#71717a', margin: '2px 0 0' }}>{t('subtitle')}</p>
        </div>
        {/* Event selector */}
        <select
          value={selectedEvent?.event_id || ''}
          onChange={(e) => {
            const ev = events.find((x) => x.event_id === e.target.value) || null;
            setSelectedEvent(ev);
            setComplaint(null);
            setSubmitMsg('');
            if (ev) loadComplaint(ev.event_id);
          }}
          style={{
            border: '1px solid #000', padding: '5px 10px', fontFamily: 'var(--font-mono)',
            fontSize: '11px', background: '#fff', cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="">— Select Event —</option>
          {events.map((ev) => (
            <option key={ev.event_id} value={ev.event_id}>
              {ev.village_name} · {new Date(ev.detected_at).toLocaleDateString('en-IN')} · {ev.severity.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div style={{ padding: 24, color: '#71717a' }}>{tCommon('loading')}</div>
      )}

      {!loading && selectedEvent && (
        <div style={{ padding: '16px' }}>
          {/* GPCB Form A-17 Official Header */}
          <div style={{
            border: '2px solid #000',
            padding: '16px 20px',
            marginBottom: 16,
            background: '#fff',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '0.5px' }}>GPCB</div>
              <div style={{ fontWeight: 700, fontSize: '13px' }}>{t('formTitle')}</div>
              <div style={{ fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>{t('formSubtitle')}</div>
              <div style={{ fontSize: '11px', fontStyle: 'italic' }}>{t('formCaption')}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <div>
                <strong>{t('regionalOffice')}:</strong>{' '}
                <span style={{ fontFamily: 'var(--font-mono)' }}>Ankleshwar Regional Office</span>
              </div>
              <div>
                <strong>{t('forMonth')}:</strong>{' '}
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  {MONTH_NAMES[now.getMonth()]} {now.getFullYear()}
                </span>
              </div>
            </div>
          </div>

          {/* If no complaint yet, show generate button */}
          {!complaint && (
            <div style={{
              border: '1px dashed #e4e4e7', padding: '24px', textAlign: 'center', marginBottom: 16,
            }}>
              <p style={{ color: '#71717a', margin: '0 0 12px', fontSize: '13px' }}>
                No Form A-17 generated for this event yet.
              </p>
              <button
                onClick={handleGenerate}
                disabled={generating}
                style={{
                  background: '#000', color: '#fff', border: 'none',
                  padding: '10px 20px', fontFamily: 'inherit', fontWeight: 700,
                  fontSize: '12px', cursor: generating ? 'wait' : 'pointer',
                }}
              >
                {generating ? 'Generating...' : 'Generate GPCB Form A-17'}
              </button>
            </div>
          )}

          {/* Official Form A-17 Table */}
          {complaint && (
            <>
              <div style={{ overflowX: 'auto', border: '1px solid #000', marginBottom: 12 }}>
                <table style={{ minWidth: 1100, fontSize: '11px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #000' }}>
                      {[
                        ['1', t('colSrNo')],
                        ['2', t('colNameAddress')],
                        ['3', t('colGpcbId')],
                        ['4', t('colWastewaterParams')],
                        ['5', t('colAirParams')],
                        ['6', t('colDateDirections')],
                        ['7', t('colDirections')],
                        ['8', t('colDatesFollowup')],
                        ['9', t('colDateCompliance')],
                        ['10', t('colActionTaken')],
                        ['11', t('colRemarks')],
                      ].map(([num, label]) => (
                        <th key={num} style={{
                          padding: '6px 8px', fontWeight: 700, textAlign: 'center',
                          letterSpacing: '0.3px', borderRight: '1px solid #000',
                          verticalAlign: 'top', lineHeight: 1.3,
                        }}>
                          <div style={{ fontSize: '9px', color: '#71717a', marginBottom: 2 }}>{num}</div>
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {a17Rows.map((row) => (
                      <tr key={row.srNo} style={{ borderBottom: '1px solid #e4e4e7' }}>
                        <td style={{ padding: '8px', textAlign: 'center', fontFamily: 'var(--font-mono)', borderRight: '1px solid #e4e4e7' }}>{row.srNo}</td>
                        <td style={{ padding: '8px', minWidth: 160, borderRight: '1px solid #e4e4e7' }}>
                          <strong>{row.nameAddress}</strong>
                        </td>
                        <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '10px', borderRight: '1px solid #e4e4e7' }}>{row.gpcbId}</td>
                        <td style={{ padding: '8px', fontSize: '10px', borderRight: '1px solid #e4e4e7' }}>{row.wastewaterParams}</td>
                        <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '10px', borderRight: '1px solid #e4e4e7' }}>{row.airParams}</td>
                        <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '10px', borderRight: '1px solid #e4e4e7' }}>{row.dateDirections}</td>
                        <td style={{ padding: '8px', fontSize: '10px', minWidth: 140, borderRight: '1px solid #e4e4e7' }}>{row.directions}</td>
                        <td style={{ padding: '8px', borderRight: '1px solid #e4e4e7' }}>{row.datesFollowup}</td>
                        <td style={{ padding: '8px', borderRight: '1px solid #e4e4e7' }}>{row.dateCompliance}</td>
                        <td style={{ padding: '8px', borderRight: '1px solid #e4e4e7' }}>{row.actionTaken}</td>
                        <td style={{ padding: '8px', fontSize: '10px', minWidth: 160 }}>{row.remarks}</td>
                      </tr>
                    ))}
                    {/* 5 empty rows as per official format */}
                    {Array.from({ length: 5 }).map((_, i) => (
                      <tr key={`empty-${i}`} style={{ borderBottom: '1px solid #e4e4e7', height: 28 }}>
                        {Array.from({ length: 11 }).map((__, j) => (
                          <td key={j} style={{ borderRight: '1px solid #e4e4e7' }} />
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Notes Section */}
              <div style={{ fontSize: '11px', marginBottom: 16, lineHeight: 1.7 }}>
                <strong>{t('noteTitle')}</strong><br />
                {t('note1')}<br />
                {t('note2')}<br />
                {t('noteWastewater')}<br />
                {t('noteAir')}<br />
                {t('noteUH')}
              </div>

              {/* Evidence Dossier */}
              <div style={{
                border: '1px solid #e4e4e7', padding: 14,
                background: '#f8fafc', marginBottom: 16,
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                  {t('evidenceVerification')}
                </div>
                {[
                  t('telemetryVerified'),
                  t('weatherVerified'),
                  t('shiftVerified'),
                  t('hashVerified'),
                ].map((item) => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, fontSize: '12px' }}>
                    <span style={{
                      display: 'inline-block', width: 14, height: 14,
                      border: '1px solid #000', background: '#000',
                      color: '#fff', textAlign: 'center', lineHeight: '14px', fontSize: '10px',
                    }}>✓</span>
                    {item}
                  </div>
                ))}

                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#52525b', textTransform: 'uppercase' }}>
                    {t('evidenceHash')}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#52525b',
                    background: '#fff', border: '1px solid #e4e4e7',
                    padding: '6px 8px', marginTop: 4, wordBreak: 'break-all',
                  }}>
                    {evidenceHash}
                  </div>
                </div>

                <div style={{ marginTop: 8, fontSize: '12px' }}>
                  <strong>{t('docketNumber')}:</strong>{' '}
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#1d4ed8' }}>
                    {complaint.complaint_number}
                  </span>
                </div>
                <div style={{ fontSize: '12px' }}>
                  <strong>{t('signatory')}:</strong>{' '}
                  {formData?.complainant || '—'}
                </div>
              </div>

              {/* Success message */}
              {submitMsg && (
                <div style={{
                  padding: '8px 12px', background: '#f0fdf4', border: '1px solid #16a34a',
                  fontSize: '12px', color: '#15803d', marginBottom: 12,
                }}>
                  ✓ {submitMsg}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <a
                  href={getComplaintPdfUrl(complaint.complaint_id)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: '#000', color: '#fff',
                    padding: '10px 16px', fontFamily: 'inherit',
                    fontWeight: 700, fontSize: '12px',
                    textDecoration: 'none', display: 'inline-block',
                  }}
                >
                  {t('downloadPdf')}
                </a>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || complaint.status === 'submitted'}
                  style={{
                    background: complaint.status === 'submitted' ? '#f0fdf4' : '#fff',
                    color: complaint.status === 'submitted' ? '#16a34a' : '#000',
                    border: `1px solid ${complaint.status === 'submitted' ? '#16a34a' : '#000'}`,
                    padding: '10px 16px', fontFamily: 'inherit',
                    fontWeight: 700, fontSize: '12px',
                    cursor: submitting || complaint.status === 'submitted' ? 'not-allowed' : 'pointer',
                  }}
                >
                  {complaint.status === 'submitted' ? '✓ Submitted to GPCB' : submitting ? 'Submitting...' : t('submitGpcb')}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
