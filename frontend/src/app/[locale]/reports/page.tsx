'use client';

import { useTranslations } from 'next-intl';

export default function ReportsPage() {
  const t = useTranslations('Header');

  return (
    <div style={{ padding: '32px 24px', color: '#52525b' }}>
      <h2 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>
        REPORTS
      </h2>
      <p style={{ fontSize: '13px' }}>
        Monthly environmental compliance reports for {t('title')} will be available here.
      </p>
      <div style={{
        marginTop: 24, border: '1px dashed #e4e4e7', padding: 32,
        textAlign: 'center', color: '#a1a1aa', fontSize: '12px',
      }}>
        Report generation is pending backend availability.
      </div>
    </div>
  );
}
