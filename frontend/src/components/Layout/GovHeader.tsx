'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, logout } from '@/lib/auth';
import { appStore, MasterIdentity } from '@/lib/store';
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setUser(getCurrentUser());
    }, 0);
    setMaster(appStore.getMaster());

    const unsub = appStore.subscribe(() => {
      setMaster(appStore.getMaster());
    });
    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, []);

  function switchLocale(newLocale: string) {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
  }

  function handleLogout() {
    logout();
    router.push(`/${locale}/login`);
  }

  // Complete mockup navigation strip with tags
  const navItems: { href: string; label: string; key: string; tag?: string; tagColor?: string }[] = [
    { href: `/${locale}`, label: 'Overview', key: 'overview' },
    { href: `/${locale}/incidents`, label: 'Current Events', key: 'incidents' },
    { href: `/${locale}/network`, label: 'Sensor Network', key: 'network' },
    { href: `/${locale}/stations`, label: 'Stations', key: 'stations' },
    { href: `/${locale}/reports`, label: 'Reports', key: 'reports' },
    { href: `/${locale}/kiosk`, label: 'Plant Display', key: 'kiosk', tag: 'ADMIN' },
    { href: `/${locale}/admin/sensors`, label: 'Sensor Config', key: 'sensors', tag: 'ADMIN' },
    { href: `/${locale}/admin/blueprint`, label: 'Blueprint Editor', key: 'blueprint', tag: 'ADMIN' },
    { href: `/${locale}/admin/builder`, label: 'Dashboard Builder', key: 'builder', tag: 'ADMIN' },
    { href: `/${locale}/admin/visual-metrics`, label: 'Visual Metrics', key: 'visual', tag: 'ADMIN' },
    { href: `/${locale}/admin/master`, label: 'Master Editor', key: 'master', tag: 'MASTER', tagColor: '#d79b2b' },
    { href: `/${locale}/admin/wizard`, label: 'Setup Wizard', key: 'wizard' },
  ];

  return (
    <>
      {/* GOV.UK style top black regulatory banner */}
      <div
        style={{
          background: '#000000',
          color: '#ffffff',
          padding: '4px 20px',
          fontSize: '11px',
          letterSpacing: '0.4px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'Public Sans, sans-serif',
        }}
      >
        <span>{t('govBanner')}</span>
        <span style={{ fontSize: '10px', color: '#a0b0b5', fontFamily: 'IBM Plex Mono, monospace' }}>
          DATA CLASSIFICATION: OFFICIAL REGULATORY USE ONLY
        </span>
      </div>

      {/* Main Console Top Bar */}
      <div
        style={{
          height: '68px',
          background: '#10282d',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          fontFamily: 'Public Sans, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              fontSize: '20px',
              fontWeight: 900,
              letterSpacing: '-0.02em',
              color: '#ffffff',
            }}
          >
            {master.companyName || 'Apex Chemicals'}
          </span>
          <span style={{ opacity: 0.35, fontSize: '18px' }}>×</span>
          <span
            style={{
              fontSize: '14px',
              opacity: 0.85,
              fontWeight: 500,
              color: '#dff1ef',
            }}
          >
            {master.brandName || 'EcoPlant Intelligence'} • Regulatory Monitoring Console
          </span>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Live Indicator */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '7px 14px',
              fontSize: '11px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              letterSpacing: '0.6px',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '7px',
                height: '7px',
                background: '#52d3a1',
                borderRadius: '50%',
                boxShadow: '0 0 8px #52d3a1',
              }}
            />
            LIVE MONITORING
          </div>

          {/* User Role Pill */}
          <div
            style={{
              padding: '7px 12px',
              background: 'rgba(255, 255, 255, 0.1)',
              fontSize: '11px',
              fontWeight: 700,
              color: '#e6f4f1',
            }}
          >
            {user ? user.name : 'Plant Manager • Admin'}
          </div>

          {/* Language Switcher */}
          <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,0.2)' }}>
            {LOCALES.map((loc) => (
              <button
                key={loc.code}
                onClick={() => switchLocale(loc.code)}
                style={{
                  padding: '5px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  background: locale === loc.code ? '#0d7778' : 'transparent',
                  color: '#ffffff',
                }}
              >
                {loc.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Strip */}
      <nav
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #dce5e7',
          display: 'flex',
          gap: '2px',
          padding: '4px 20px',
          overflowX: 'auto',
          scrollbarWidth: 'thin',
          fontFamily: 'Public Sans, sans-serif',
        }}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.key === 'overview' && pathname === `/${locale}`);
          return (
            <Link
              key={item.key}
              href={item.href}
              style={{
                border: 'none',
                background: isActive ? '#dff1ef' : 'transparent',
                color: isActive ? '#0d7778' : '#5e7077',
                fontWeight: 800,
                fontSize: '12px',
                padding: '9px 12px',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                letterSpacing: '0.2px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>{(() => {
                try {
                  return tNav(item.key as any);
                } catch {
                  return item.label;
                }
              })()}</span>
              {item.tag && (
                <span
                  style={{
                    fontSize: '8px',
                    fontWeight: 900,
                    background: item.tagColor ? 'rgba(215,155,43,0.15)' : '#edf2f3',
                    color: item.tagColor ? item.tagColor : '#718087',
                    padding: '2px 5px',
                    letterSpacing: '0.05em',
                  }}
                >
                  {item.tag}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
