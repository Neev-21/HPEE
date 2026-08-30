import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://127.0.0.1:8100/api/v1/:path*',
      },
      {
        source: '/health',
        destination: 'http://127.0.0.1:8100/health',
      }
    ];
  },
};

export default withNextIntl(nextConfig);
