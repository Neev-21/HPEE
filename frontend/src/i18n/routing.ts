import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'hi', 'gu'],
  defaultLocale: 'en',
  pathnames: {
    '/': '/',
    '/incidents': '/incidents',
    '/stations': '/stations',
    '/reports': '/reports',
    '/login': '/login',
  },
});
