import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Caching policy for /api/* routes.
 *
 * Default: `no-store` — safe for auth/mutation/user-scoped endpoints
 * (ai-chat, auth/*, curl-proxy, keys, playground, short-urls, shorten, track).
 *
 * Allowlist: public read-only GET routes that manage their own Cache-Control
 * header at the route handler. Middleware skips setting Cache-Control for these
 * so the route's own header survives end-to-end. See CHANGELOG (Phase 3).
 */
const PUBLIC_CACHEABLE_API_ROUTES = new Set<string>([
  '/api/portfolio', // public portfolio data, s-maxage=3600 set in route handler
  '/api/github',    // per-caller but uses `private, max-age` set in route handler
]);

function isCacheableApiRoute(pathname: string): boolean {
  // Exact match first (cheap)
  if (PUBLIC_CACHEABLE_API_ROUTES.has(pathname)) return true;
  // Allow trailing-slash variants
  if (pathname.endsWith('/') && PUBLIC_CACHEABLE_API_ROUTES.has(pathname.slice(0, -1))) {
    return true;
  }
  return false;
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // CSP only for non-API (HTML) responses.
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' https://accounts.google.com https://static.cloudflareinsights.com https://vercel.live; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com https://vercel.live; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com; frame-src https://accounts.google.com https://vercel.live; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self';"
    );
  }

  // Path-aware Cache-Control for /api/*.
  // - Public cacheable routes (portfolio, github): skip — route handler sets its own header.
  // - Everything else under /api/: no-store (private/mutating/user-scoped).
  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (!isCacheableApiRoute(request.nextUrl.pathname)) {
      response.headers.set('Cache-Control', 'no-store');
    }
  }

  // Enforce x-api-key on /api/github for non-OPTIONS requests.
  const pathname = request.nextUrl.pathname;
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

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|og-image.png).*)'],
};
