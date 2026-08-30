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
    const timer = setTimeout(() => {
      setUser(getCurrentUser());
    }, 0);
    return () => clearTimeout(timer);
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
      <header className="bg-[#fffff0] border-b-[3px] border-stone-300 p-3 md:px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Branding */}
        <div className="flex items-center gap-3">
          {/* GPCB Emblem placeholder */}
          <div className="w-9 h-11 bg-[#2c2c2c] text-[#fffff0] flex items-center justify-center text-[9px] font-bold text-center leading-[1.2] p-1 shrink-0 rounded-sm">
            GPCB<br />GOG
          </div>
          <div>
            <h1 className="text-base font-bold uppercase tracking-wide leading-[1.2] m-0 text-[#2c2c2c]">
              {t('title')}
            </h1>
            <p className="text-[11px] text-stone-500 m-0">
              {t('subtitle')}
            </p>
          </div>
        </div>

        {/* Right side: lang switcher + user */}
        <div className="flex items-center gap-3">
          {/* Language switcher */}
          <div className="flex border border-[#2c2c2c] rounded-md overflow-hidden">
            {LOCALES.map((loc) => (
              <button
                key={loc.code}
                onClick={() => switchLocale(loc.code)}
                className={`px-3 py-1.5 text-[11px] font-semibold cursor-pointer border-r last:border-r-0 border-[#2c2c2c] ${
                  locale === loc.code ? 'bg-[#2c2c2c] text-[#fffff0]' : 'bg-[#fffff0] text-[#2c2c2c]'
                }`}
              >
                {loc.label}
              </button>
            ))}
          </div>

          {/* User pill or Login */}
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-stone-600 hidden md:inline-block">
                {user.role.toUpperCase()} / {user.name.toUpperCase()}
              </span>
              <button
                onClick={handleLogout}
                className="bg-[#2c2c2c] text-[#fffff0] px-3 py-1.5 text-[11px] font-semibold rounded-md hover:bg-black"
              >
                {tNav('logout')}
              </button>
            </div>
          ) : (
            <Link
              href={`/${locale}/login`}
              className="bg-[#2c2c2c] text-[#fffff0] px-3 py-1.5 text-[11px] font-semibold rounded-md hover:bg-black no-underline"
            >
              LOGIN
            </Link>
          )}
        </div>
      </header>

      {/* Navigation strip */}
      <nav className="bg-[#fdfbf7] border-b border-stone-200 px-4 flex items-center overflow-x-auto whitespace-nowrap scrollbar-hide">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.key === 'overview' && pathname === `/${locale}`);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`inline-block px-4 py-3 text-[13px] font-bold tracking-wide no-underline ${
                isActive ? 'text-[#2c2c2c] border-b-[3px] border-[#2c2c2c]' : 'text-stone-500 border-b-[3px] border-transparent hover:text-stone-800'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
