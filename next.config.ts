import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  // ESLint is run as a separate `bun run lint` step. Pre-existing lint debt
  // (212 errors at baseline) should NOT block builds — that would prevent
  // any incremental refactor from landing. TypeScript errors still fail the
  // build (typeCheck is not disabled).
  eslint: { ignoreDuringBuilds: true },
  // Serve static HTML files from public directories (no .html extension needed)
  async rewrites() {
    return [
      // Subpages: /lens-light/gallery → /lens-light/gallery.html
      {
        source: '/:slug/:page((?!api|_next|images|favicon|robots|sitemap|sw|site|og|apple)[^\\.]+)',
        destination: '/:slug/:page.html',
      },
      // Root index: /techflow-saas → /techflow-saas/index.html
      {
        source: '/:slug((?!api|_next|images|favicon|robots|sitemap|sw|site|og|apple)[^\\.]+)',
        destination: '/:slug/index.html',
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.cloudinary.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
  async headers() {
    // Security headers apply to every route.
    // NOTE: API route Cache-Control is intentionally NOT set here. Caching
    // policy for /api/* lives in exactly two places:
    //   1. middleware.ts        — default `no-store` for all /api/* (safe for
    //                             auth/mutation/user-scoped routes), skipped for
    //                             an explicit allowlist of public read-only routes.
    //   2. route handler itself — may override with its own Cache-Control for
    //                             public caches (e.g. /api/portfolio).
    // Setting it here too caused a stomp bug where every route-level Cache-Control
    // was silently overwritten. See CHANGELOG (Phase 3).
    return [
      { source: '/(.*)', headers: securityHeaders },
    ];
  },
  turbopack: undefined,
};

export default nextConfig;
