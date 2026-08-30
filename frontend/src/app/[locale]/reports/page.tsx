'use client';

import { useTranslations } from 'next-intl';

export default function ReportsPage() {
  const t = useTranslations('Header');

  return (
    <div className="p-6 md:p-8 h-[calc(100vh-118px)] overflow-y-auto bg-[#fffff0]">
      <h2 className="text-xl font-bold uppercase tracking-wide mb-2 text-[#2c2c2c]">
        Compliance & Analytics Reports
      </h2>
      <p className="text-sm text-stone-600 mb-8 max-w-2xl">
        Monthly environmental compliance reports, emission audits, and statistical analysis for the {t('title')} network.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { title: 'Total Incidents', value: '142', sub: '+12% from last month', color: 'text-amber-600' },
          { title: 'Notices Issued', value: '38', sub: 'Action taken against violators', color: 'text-red-600' },
          { title: 'Avg AQI', value: '112', sub: 'Moderate category overall', color: 'text-stone-600' }
        ].map(stat => (
          <div key={stat.title} className="bg-[#fdfbf7] border border-stone-200 p-5 rounded-lg shadow-sm">
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">{stat.title}</h3>
            <div className={`text-3xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
            <p className="text-xs text-stone-400 mt-2">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#fdfbf7] border border-stone-200 rounded-lg p-6 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">📊</span>
        </div>
        <h3 className="text-lg font-bold text-[#2c2c2c] mb-2">Detailed Reports Pending</h3>
        <p className="text-sm text-stone-500 max-w-md text-center">
          The analytics engine is currently processing this month&apos;s telemetry data. Full PDF reports will be available once the backend aggregation is complete.
        </p>
      </div>
    </div>
  );
}
