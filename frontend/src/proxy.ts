import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export function proxy(request: NextRequest) {
  // Pass all requests to intlMiddleware (Public access)
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|health|_next|_vercel|.*\\..*).*)'],
};
