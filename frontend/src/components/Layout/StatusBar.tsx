'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { fetchHealth } from '@/lib/api';

export default function StatusBar() {
  const t = useTranslations('StatusBar');
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [time, setTime] = useState('');

  useEffect(() => {
    fetchHealth()
      .then(() => setIsOnline(true))
      .catch(() => setIsOnline(false));

    const tick = () => {
      setTime(new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      background: '#f8fafc',
      borderBottom: '1px solid #e4e4e7',
      padding: '5px 16px',
      display: 'flex',
      gap: '20px',
      alignItems: 'center',
      fontSize: '11px',
      fontFamily: 'var(--font-mono)',
      color: '#3f3f46',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span
          className={isOnline ? 'severity-pulse' : ''}
          style={{
            display: 'inline-block',
            width: 8, height: 8,
            background: isOnline === null ? '#a1a1aa' : isOnline ? '#16a34a' : '#dc2626',
          }}
        />
        <strong>
          {isOnline === null ? 'CHECKING...' : isOnline ? t('systemOperational') : 'BACKEND OFFLINE'}
        </strong>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: '16px' }}>
        <span>{t('lastSync')}: <strong>{time || '--:--:--'}</strong> IST</span>
        <span>BUILD 1.0.0</span>
      </div>
    </div>
  );
}
