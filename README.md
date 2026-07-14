# Revy — Developer Portfolio

A production Next.js (App Router) portfolio platform with a custom session-token auth layer, Supabase (PostgreSQL + RLS), admin panel, public REST APIs, and a live code sandbox.

## Tech Stack

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript 5.9
- **Runtime:** Bun (authoritative package manager — `bun.lock` + `packageManager` field)
- **Styling:** Tailwind CSS 3.4 with M3 design tokens
- **Animations:** Framer Motion, GSAP, AOS, Lenis (smooth scroll)
- **State:** Zustand (portfolio/theme/active-section stores) + React Context (AuthContext) + SWR (data fetching)
- **Database:** Supabase (PostgreSQL + RLS + custom session-token auth via RPC — *not* Supabase Auth)
- **Admin UI:** shadcn/ui-style components, sonner toasts, recharts analytics

## Quick Start

```bash
bun install
cp .env.example .env.local   # fill in your Supabase + OAuth creds
bun run dev                   # http://localhost:3000
```

### Scripts

| Script | Purpose |
|--------|---------|
| `bun run dev` | Next.js dev server |
| `bun run build` | Production build (TypeScript type-check runs; ESLint runs separately) |
| `bun run start` | Serve the production build |
| `bun run lint` | ESLint flat config (`eslint.config.mjs`) — non-interactive |
| `bun run test` | Vitest unit tests (69 tests) |
| `bun run test:e2e` | Playwright e2e tests |
| `bun run generate:og` | Regenerate OG image |
| `bun run generate:favicon` | Regenerate favicon |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (Next.js App Router)                                │
│  ├── src/app/(main)/        → homepage (portfolio)           │
│  ├── src/app/admin/         → admin panel (8 tabs)           │
│  ├── src/app/dashboard/     → user dashboard (api-keys,     │
│  │                            shorten, overview)              │
│  ├── src/app/docs/          → docs + code sandbox            │
│  ├── src/app/auth/          → OAuth callbacks (github/google)│
│  ├── src/app/s/[slug]       → short URL redirect             │
│  └── src/app/api/           → REST API routes (see below)    │
└──────────────┬──────────────────────────────────────────────┘
               │ fetch('/api/...') + Supabase RPC (client)
┌──────────────▼──────────────────────────────────────────────┐
│  Next.js API Routes (src/app/api/**/route.ts)                │
│  ├── /api/ai-chat      → SSE streaming (Groq)                │
│  ├── /api/auth/github  → GitHub OAuth exchange               │
│  ├── /api/curl-proxy   → server-side curl proxy              │
│  ├── /api/github       → GitHub API proxy (x-api-key gated)  │
│  ├── /api/playground   → glot.io code execution (Go/Rust/PHP)│
│  ├── /api/portfolio    → public, edge-cached portfolio data  │
│  ├── /api/short-urls   → user-scoped short URL CRUD          │
│  ├── /api/shorten      → public short URL API (x-api-key)    │
│  └── /api/track        → analytics event ingest              │
└──────────────┬──────────────────────────────────────────────┘
               │ Supabase RPC (security definer functions)
┌──────────────▼──────────────────────────────────────────────┐
│  Supabase (PostgreSQL + RLS)                                 │
│  └── All auth/data via custom session-token RPC functions    │
│     (NOT Supabase Auth — see "Auth Model" below)             │
└─────────────────────────────────────────────────────────────┘
```

### Project Structure

```
├── database.sql              # SINGLE SOURCE OF TRUTH for the schema
├── sql/
│   ├── archive/              # historical patches (DO NOT RUN — see README)
│   ├── seed/                 # dev-only seed data
│   └── migrations/           # (create for new dated changes)
├── middleware.ts             # CSP + path-aware Cache-Control + x-api-key enforcement
├── next.config.ts            # security headers + images + eslint config
├── eslint.config.mjs         # flat ESLint config (js + ts + next + react-hooks)
├── src/
│   ├── app/                  # Next.js App Router routes + API routes
│   ├── components/
│   │   ├── admin/            # AdminPanel, AnalyticsDashboard, ThemeBuilder,
│   │   │                     # SiteSettings, UserManagement, ShortUrlsAdmin,
│   │   │                     # ApiKeysAdmin, ChatModeration
│   │   ├── sections/         # portfolio sections (intro, about, projects, etc.)
│   │   ├── shared/           # reusable UI (ConfirmDialog, ImageUpload, etc.)
│   │   ├── ui/               # base primitives (button, card, dialog, etc.)
│   │   ├── chat/             # ChatPopup (global chat widget)
│   │   └── ...               # navbar, layout, auth, dashboard, command, profile
│   ├── contexts/AuthContext.tsx  # session/user state, realtime revocation, multi-tab
│   ├── stores/               # Zustand: portfolio-store, theme-store, active-section
│   ├── hooks/                # use-portfolio-data, use-github-data, useScrollSpy, etc.
│   ├── lib/
│   │   ├── auth.ts           # ~50 exported functions: auth, portfolio CRUD, themes,
│   │   │                     # API keys, short URLs, analytics, admin oversight
│   │   ├── supabase.ts       # Supabase client singleton + chat functions
│   │   ├── cloudinary.ts     # image upload
│   │   ├── curl-browser.ts   # client-side curl execution
│   │   ├── curl-parser.ts    # curl command parser
│   │   ├── webauthn.ts       # passkey registration/login
│   │   └── ...
│   ├── services/             # analytics.ts, portfolio.ts, github.ts
│   └── types/                # shared TypeScript interfaces
```

## Auth Model

This app uses **custom session-token auth via Supabase RPC**, NOT Supabase Auth.

- Users register/login with email+password, OAuth (GitHub/Google), or passkeys (WebAuthn).
- On success, a session token is generated server-side and stored in `app_sessions` table.
- The token is persisted client-side in `localStorage['app_session_token']`.
- Every authenticated RPC takes `p_token text` as the first parameter and validates it
  inside a `security definer` function (via `validate_session` or `verify_admin_internal`).
- RLS policies are intentionally permissive (`to public using (true/false)`) because the
  actual auth happens inside the `security definer` functions, not via Supabase Auth's
  `auth.uid()` / JWT claims. **Do not "fix" this into standard Supabase Auth RLS** — it
  would break the entire auth layer.

## API Routes

### Internal-only routes

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| `POST` | `/api/ai-chat` | AI chat (SSE streaming via Groq) | Origin allow-list + rate limit |
| `POST` | `/api/auth/github` | GitHub OAuth code exchange | None (this IS the auth step) |
| `POST` | `/api/curl-proxy` | Server-side curl proxy for docs sandbox | None |
| `GET/POST` | `/api/short-urls` | User-scoped short URL list/create | `?token=` session query param |
| `POST` | `/api/track` | Analytics event ingest | Origin allow-list + rate limit |

### Public API surfaces (documented for third-party consumers)

| Method | Endpoint | Purpose | Auth | Cache |
|--------|----------|---------|------|-------|
| `GET` | `/api/portfolio` | Full portfolio dataset | None | `public, s-maxage=3600, stale-while-revalidate=7200` |
| `GET` | `/api/github?path=...` | GitHub API proxy | `x-api-key` header | `private, max-age=300` |
| `GET/POST/DELETE/PATCH` | `/api/shorten` | Short URL create/list/delete/update/stats | `x-api-key` header | `no-store` |
| `POST` | `/api/playground` | Go/Rust/PHP code execution via glot.io | None (rate-limited server-side) | `no-store` |

Full API docs: [/docs/api-reference](https://revy.my.id/docs/api-reference)

## Caching Policy

API route caching lives in **exactly two places** (single source of truth — do not
re-add Cache-Control in `next.config.ts` or `vercel.json` headers, that caused a
stomp bug where route-level headers were silently overwritten):

1. **`middleware.ts`** — default `no-store` for all `/api/*` (safe for
   auth/mutation/user-scoped routes). An explicit allowlist
   (`PUBLIC_CACHEABLE_API_ROUTES`) skips the middleware header for public
   read-only routes so the route handler's own header survives.
2. **Route handler itself** — may set its own `Cache-Control` for public caches
   (e.g. `/api/portfolio` sets `public, s-maxage=3600`).

The homepage also has a **localStorage cache** in `portfolio-store.ts` (5min TTL)
that sits in front of the Supabase RPC — this is separate from the HTTP cache
because the homepage calls the RPC directly, not via `/api/portfolio`. Both
layers serve different consumers and should be kept.

## Database Schema

**`database.sql`** is the single source of truth. Run it once in Supabase SQL
Editor to set up everything (tables, functions, policies, grants, indexes,
triggers, default settings).

- `sql/archive/` — historical patches kept for audit trail only. **DO NOT RUN**
  these against a fresh database; several reference obsolete signatures.
- `sql/seed/` — dev-only seed data (e.g. fake analytics events for local testing).
- `sql/migrations/` — create this folder for new dated schema changes going
  forward. Write the change into `database.sql` AND a dated file here.

New admin RPCs (Phase 7b): `admin_list_users`, `admin_list_short_urls`,
`admin_list_api_keys`, `admin_list_chat_messages`, `admin_delete_api_key`,
`admin_delete_short_url`, `delete_message_admin`, `delete_own_message`, etc.
All are `security definer` and verify via `verify_admin_internal(p_token)`.

## Environment Variables

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # server-only, used by API routes

# Cloudinary (optional — for image uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-preset

# OAuth (optional — for social login)
NEXT_PUBLIC_GITHUB_CLIENT_ID=your-github-client-id
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-secret      # server-only

# GitHub API proxy (server-only — up to 5 tokens for round-robin load balancing)
GITHUB_TOKEN_1=your-github-pat-1
# GITHUB_TOKEN_2=... GITHUB_TOKEN_3=... etc.

# Code sandbox (optional — for Go/Rust/PHP execution in /docs/sandbox)
GLOT_API_TOKEN=your-glot-token   # get one free at https://glot.io/account/token

# AI chat (optional — for /api/ai-chat)
GROQ_API_KEY=your-groq-key

# App URL (for OAuth redirects, sitemap, etc.)
NEXT_PUBLIC_APP_URL=https://revy.my.id
```

> ⚠️ Variables without `NEXT_PUBLIC_` prefix are **server-only** — they are never
> bundled into client JS. `SUPABASE_SERVICE_ROLE_KEY` in particular bypasses RLS
> and must never be exposed to the browser.

## Admin Panel

Located at `/admin` (requires `app_users.is_admin = true`). 8 tabs:

1. **Portfolio** — full CRUD for all portfolio sections (profile, intro, skills,
   projects, experiences, education, testimonials, social links, contacts) with
   dirty-tracking and "Save All".
2. **Analytics** — total views, unique visitors, daily chart, top pages, top referrers.
3. **Themes** — create/edit/delete custom themes (M3 seed-color based).
4. **Short URLs** — cross-user oversight: list all, click counts, owner, admin-delete.
5. **API Keys** — cross-user oversight: list all, owner, last-used, expiry, admin-revoke.
6. **Chat Mod** — list recent chat messages, admin-delete any message.
7. **Users** — list all users, toggle admin flag (with last-admin lockout), set per-user rate limit.
8. **Settings** — all site_settings keys (logo, favicon, header, title, description,
   GitHub username, rate limits, unlimited toggle) + site API key management.

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+K` | Command Palette |
| `Ctrl+Alt+D` | Toggle dark mode |
| `Ctrl+Alt+P` | Go to Projects |
| `Ctrl+Alt+A` | Admin Panel |
| `Ctrl+Alt+C` | Open Chat |

## Deploy

```bash
bun run build
# Deploy to Vercel (auto-detects Next.js):
vercel --prod
```

Set server-side env vars in Vercel Dashboard → Settings → Environment Variables.
`SUPABASE_SERVICE_ROLE_KEY`, `GITHUB_CLIENT_SECRET`, `GITHUB_TOKEN_*`,
`GLOT_API_TOKEN`, `GROQ_API_KEY` must all be set for production.

## License

MIT
