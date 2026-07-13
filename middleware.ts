import { type NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip for API routes, auth callbacks, short URLs, static files
  const isApiRoute = pathname.startsWith('/api/');
  const isAuthCallback = pathname.startsWith('/auth/');
  const isShortUrl = pathname.startsWith('/s/');
  const isLocalePath = pathname.startsWith('/en') || pathname.startsWith('/id');

  if (isApiRoute || isAuthCallback || isShortUrl) {
    const response = NextResponse.next();

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

  // If already has locale prefix, continue
  if (isLocalePath) {
    return NextResponse.next();
  }

  // For root path, rewrite to /en (default locale)
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/en';
    return NextResponse.rewrite(url);
  }

  // For other paths without locale, rewrite to /en + path
  const url = request.nextUrl.clone();
  url.pathname = `/en${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|og-image.png).*)'],
};
