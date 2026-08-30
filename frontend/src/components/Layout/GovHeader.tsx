'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, logout } from '@/lib/auth';
import { useEffect, useState } from 'react';
import type { GpcbUser } from '@/lib/auth';

const LOCALES = [
  { code: 'en', label: 'EN' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'gu', label: 'ગુજ' },
];

export default function GovHeader() {
  const t = useTranslations('Header');
  const tNav = useTranslations('Nav');
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const [user, setUser] = useState<GpcbUser | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  function switchLocale(newLocale: string) {
    // Replace the locale segment in the current path
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
  }

  function handleLogout() {
    logout();
    router.push(`/${locale}/login`);
  }

  // Build nav items with active detection
  const navItems = [
    { href: `/${locale}`, label: tNav('overview'), key: 'overview' },
    { href: `/${locale}/incidents`, label: tNav('incidents'), key: 'incidents' },
    { href: `/${locale}/stations`, label: tNav('stations'), key: 'stations' },
    { href: `/${locale}/compliance`, label: tNav('compliance'), key: 'compliance' },
    { href: `/${locale}/reports`, label: tNav('reports'), key: 'reports' },
  ];

  return (
    <>
      {/* GOV.UK style top black banner */}
      <div style={{
        background: '#000',
        color: '#fff',
        padding: '3px 16px',
        fontSize: '11px',
        letterSpacing: '0.4px',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>{t('govBanner')}</span>
        <span>DATA CLASSIFICATION: OFFICIAL USE ONLY</span>
      </div>

      {/* Main header */}
      <header style={{
        background: '#fff',
        borderBottom: '3px solid #000',
        padding: '10px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        {/* Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* GPCB Emblem placeholder */}
          <div style={{
            width: 36,
            height: 42,
            background: '#000',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '9px',
            fontWeight: 700,
            textAlign: 'center',
            lineHeight: 1.2,
            padding: '3px',
            flexShrink: 0,
          }}>
            GPCB<br />GOG
          </div>
          <div>
            <h1 style={{
              fontSize: '16px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              lineHeight: 1.2,
              margin: 0,
            }}>
              {t('title')}
            </h1>
            <p style={{ fontSize: '11px', color: '#52525b', margin: 0 }}>
              {t('subtitle')}
            </p>
          </div>
        </div>

        {/* Right side: lang switcher + user */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Language switcher */}
          <div style={{ display: 'flex', border: '1px solid #000' }}>
            {LOCALES.map((loc) => (
              <button
                key={loc.code}
                onClick={() => switchLocale(loc.code)}
                style={{
                  background: locale === loc.code ? '#000' : '#fff',
                  color: locale === loc.code ? '#fff' : '#000',
                  border: 'none',
                  borderRight: '1px solid #000',
                  padding: '5px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  lineHeight: 1,
                }}
              >
                {loc.label}
              </button>
            ))}
          </div>

          {/* User pill */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: '#3f3f46',
              }}>
                {user.role.toUpperCase()} / {user.name.toUpperCase()}
              </span>
              <button
                onClick={handleLogout}
                style={{
                  background: '#000',
                  color: '#fff',
                  border: 'none',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {tNav('logout')}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Navigation strip */}
      <nav style={{
        background: '#f8fafc',
        borderBottom: '1px solid #e4e4e7',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '0',
      }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.key === 'overview' && pathname === `/${locale}`);
          return (
            <Link
              key={item.key}
              href={item.href}
              style={{
                display: 'inline-block',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.5px',
                textDecoration: 'none',
                color: isActive ? '#000' : '#71717a',
                borderBottom: isActive ? '3px solid #000' : '3px solid transparent',
                background: 'transparent',
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
