import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { getMessages } from 'next-intl/server';
import '../globals.css';
import GovHeader from '@/components/Layout/GovHeader';
import StatusBar from '@/components/Layout/StatusBar';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>GPCB — Environmental Monitoring System</title>
        <meta name="description" content="Gujarat Pollution Control Board — Hyperlocal Pollution Evidence Engine" />
      </head>
      <body>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <GovHeader />
          <StatusBar />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
