'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { login } from '@/lib/auth';
const ROLE_OPTIONS = [
  { value: 'admin', emailHint: 'admin@gpcb.gov.in', passHint: 'gpcb@admin2026' },
  { value: 'inspector', emailHint: 'inspector.ankleshwar@gpcb.gov.in', passHint: 'inspector@gpcb2026' },
  { value: 'sarpanch', emailHint: 'sarpanch.piraman@gujarat.gov.in', passHint: 'sarpanch@piraman2026' },
];

export default function LoginPage() {
  const t = useTranslations('Login');
  const tRoles = useTranslations('Roles');
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleRoleSelect(emailHint: string, passHint: string) {
    setEmail(emailHint);
    setPassword(passHint);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const user = login(email, password);
    if (user) {
      router.push(`/${locale}`);
    } else {
      setError(t('loginError'));
    }
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 118px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#fdfbf7',
    }}>
      <div style={{
        width: '100%', maxWidth: 440,
        background: '#fff',
        border: '1px solid #d6d3d1',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
      }}>
        {/* Header */}
        <div style={{
          background: '#2c2c2c', color: '#fffff0',
          padding: '16px 20px',
        }}>
          <div style={{ fontWeight: 700, fontSize: '18px', letterSpacing: '0.5px' }}>
            {t('title')}
          </div>
          <div style={{ fontSize: '13px', color: '#a8a29e', marginTop: 2 }}>
            {t('subtitle')}
          </div>
        </div>

        {/* Official notice */}
        <div style={{
          background: '#fef2f2', borderBottom: '1px solid #fca5a5',
          padding: '8px 20px', fontSize: '12px', color: '#7f1d1d',
        }}>
          ⚠️ {t('officialNotice')}
        </div>

        {/* Role selector */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e7e5e4' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, color: '#78716c' }}>
            {t('role')}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {ROLE_OPTIONS.map((opt) => {
              const isActive = email === opt.emailHint;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleRoleSelect(opt.emailHint, opt.passHint)}
                  style={{
                    flex: 1, padding: '8px 0',
                    background: isActive ? '#2c2c2c' : '#f5f5f4',
                    color: isActive ? '#fffff0' : '#44403c',
                    border: isActive ? '1px solid #2c2c2c' : '1px solid #d6d3d1',
                    borderRadius: '6px',
                    fontSize: '11px', fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                  }}
                >
                  {opt.value === 'admin' ? tRoles('admin') : opt.value === 'inspector' ? tRoles('inspector') : tRoles('sarpanch')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '16px 20px' }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5, color: '#52525b' }}>
              {t('email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%', padding: '10px',
                border: '1px solid #d6d3d1', outline: 'none',
                fontFamily: 'var(--font-sans)', fontSize: '14px',
                background: '#fdfbf7', borderRadius: '6px'
              }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5, color: '#52525b' }}>
              {t('password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%', padding: '10px',
                border: '1px solid #d6d3d1', outline: 'none',
                fontFamily: 'var(--font-sans)', fontSize: '14px',
                background: '#fdfbf7', borderRadius: '6px'
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '8px 10px', background: '#fef2f2',
              border: '1px solid #dc2626', color: '#dc2626',
              fontSize: '12px', marginBottom: 12, borderRadius: '6px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px',
              background: '#2c2c2c', color: '#fffff0',
              border: 'none', fontFamily: 'inherit',
              fontWeight: 700, fontSize: '14px',
              letterSpacing: '0.5px', cursor: loading ? 'wait' : 'pointer',
              borderRadius: '6px'
            }}
          >
            {loading ? t('loginLoading') : t('loginButton')}
          </button>
        </form>

        {/* Dev credentials hint */}
        <div style={{ padding: '0 20px 16px', fontSize: '11px', color: '#a8a29e', lineHeight: 1.6 }}>
          DEV CREDENTIALS: admin@gpcb.gov.in / gpcb@admin2026<br />
          inspector.ankleshwar@gpcb.gov.in / inspector@gpcb2026<br />
          sarpanch.piraman@gujarat.gov.in / sarpanch@piraman2026
        </div>
      </div>
    </div>
  );
}
