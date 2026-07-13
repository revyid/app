import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from '@/i18n/config';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
});

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip i18n for API routes, auth callbacks, short URLs, and static files
  const isApiRoute = pathname.startsWith('/api/');
  const isAuthCallback = pathname.startsWith('/auth/');
  const isShortUrl = pathname.startsWith('/s/');
  const isStaticFile = pathname.includes('.') && !pathname.endsWith('.json');

  if (isApiRoute || isAuthCallback || isShortUrl || isStaticFile) {
    const response = NextResponse.next();

    // CSP for non-API routes
    if (!isApiRoute) {
      response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' https://accounts.google.com https://static.cloudflareinsights.com https://vercel.live; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com https://vercel.live; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com; frame-src https://accounts.google.com https://vercel.live; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self';"
      );
    }

    if (isApiRoute) {
      response.headers.set('Cache-Control', 'no-store');
    }

    // Enforce API key on /api/github (skip OPTIONS)
    if (pathname.startsWith('/api/github') && request.method !== 'OPTIONS') {
      const apiKey = request.headers.get('x-api-key');
      if (!apiKey) {
        return NextResponse.json(
          { error: 'API key required. Get one at /dashboard/api-keys' },
          { status: 401 }
        );
      }
    }

    return response;
  }

  // Apply i18n middleware for all other routes
  const intlResponse = intlMiddleware(request);
  if (intlResponse) return intlResponse;

  // CSP for other routes
  const response = NextResponse.next();
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' https://accounts.google.com https://static.cloudflareinsights.com https://vercel.live; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com https://vercel.live; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com; frame-src https://accounts.google.com https://vercel.live; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self';"
  );

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|og-image.png).*)'],
};
