import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const PUBLIC_PATHS = ['/login'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Locale-stripped path for auth checks
  const pathnameWithoutLocale = pathname.replace(/^\/(en|hi|gu)/, '') || '/';
  const isPublicPath = PUBLIC_PATHS.some((p) => pathnameWithoutLocale.startsWith(p));

  if (!isPublicPath) {
    const token = request.cookies.get('gpcb_token')?.value;
    if (!token) {
      const locale = pathname.match(/^\/(en|hi|gu)/)?.[1] || 'en';
      const loginUrl = new URL(`/${locale}/login`, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
