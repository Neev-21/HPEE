'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { login } from '@/lib/auth';

const ROLE_OPTIONS = [
  { value: 'admin', emailHint: 'admin@gpcb.gov.in' },
  { value: 'inspector', emailHint: 'inspector.ankleshwar@gpcb.gov.in' },
  { value: 'sarpanch', emailHint: 'sarpanch.piraman@gujarat.gov.in' },
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

  function handleRoleSelect(emailHint: string) {
    setEmail(emailHint);
    setPassword('');
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Small artificial delay for UX
    await new Promise((r) => setTimeout(r, 600));

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
      background: '#f8fafc',
    }}>
      <div style={{
        width: '100%', maxWidth: 440,
        background: '#fff',
        border: '2px solid #000',
      }}>
        {/* Header */}
        <div style={{
          background: '#000', color: '#fff',
          padding: '16px 20px',
        }}>
          <div style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '0.5px' }}>
            {t('title')}
          </div>
          <div style={{ fontSize: '12px', color: '#a1a1aa', marginTop: 2 }}>
            {t('subtitle')}
          </div>
        </div>

        {/* Official notice */}
        <div style={{
          background: '#fef2f2', borderBottom: '1px solid #fca5a5',
          padding: '8px 20px', fontSize: '11px', color: '#7f1d1d',
        }}>
          ⚠️ {t('officialNotice')}
        </div>

        {/* Role selector */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e4e4e7' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, color: '#71717a' }}>
            {t('role')}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {ROLE_OPTIONS.map((opt) => {
              const isActive = email === opt.emailHint;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleRoleSelect(opt.emailHint)}
                  style={{
                    flex: 1, padding: '6px 0',
                    background: isActive ? '#000' : '#fff',
                    color: isActive ? '#fff' : '#000',
                    border: '1px solid #000',
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
                width: '100%', padding: '8px 10px',
                border: '1px solid #27272a', outline: 'none',
                fontFamily: 'var(--font-mono)', fontSize: '12px',
                background: '#f8fafc',
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
                width: '100%', padding: '8px 10px',
                border: '1px solid #27272a', outline: 'none',
                fontFamily: 'var(--font-mono)', fontSize: '12px',
                background: '#f8fafc',
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '8px 10px', background: '#fef2f2',
              border: '1px solid #dc2626', color: '#dc2626',
              fontSize: '12px', marginBottom: 12,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '10px',
              background: '#000', color: '#fff',
              border: 'none', fontFamily: 'inherit',
              fontWeight: 700, fontSize: '13px',
              letterSpacing: '0.5px', cursor: loading ? 'wait' : 'pointer',
            }}
          >
            {loading ? t('loginLoading') : t('loginButton')}
          </button>
        </form>

        {/* Dev credentials hint */}
        <div style={{ padding: '0 20px 16px', fontSize: '10px', color: '#a1a1aa', lineHeight: 1.8 }}>
          DEV CREDENTIALS: admin@gpcb.gov.in / gpcb@admin2026<br />
          inspector.ankleshwar@gpcb.gov.in / inspector@gpcb2026<br />
          sarpanch.piraman@gujarat.gov.in / sarpanch@piraman2026
        </div>
      </div>
    </div>
  );
}
