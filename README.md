# Revy — Developer Portfolio

A single-page portfolio website with a secure Vercel Edge backend.

## Tech Stack

- **Framework:** React 19 + TypeScript
- **Build:** Vite 7 + SWC
- **Styling:** Tailwind CSS 3.4 with M3 design tokens
- **Animations:** Framer Motion
- **Database:** Supabase (PostgreSQL + RLS)
- **Auth:** Custom passkey/OAuth via Supabase RPC
- **Backend:** Vercel Edge Functions (serverless)

## Quick Start

```bash
pnpm install

# Frontend only (fast, no API routes)
pnpm dev

# Frontend + Backend API routes (full stack)
pnpm dev:full
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Browser (React SPA)                            │
│  ├── /api/track        → POST analytics events  │
│  ├── /api/github?path= → GET GitHub data        │
│  └── /api/auth/github  → POST OAuth exchange    │
└──────────────┬──────────────────────────────────┘
               │ fetch('/api/...')
┌──────────────▼──────────────────────────────────┐
│  Vercel Edge Functions (api/)                   │
│  ├── auth/github.ts  — OAuth token exchange     │
│  │   └── Uses GITHUB_CLIENT_SECRET (server-only)│
│  ├── github.ts       — GitHub API proxy         │
│  │   └── Uses GITHUB_TOKEN (server-only)        │
│  └── track.ts        — Analytics + IP detection │
│      └── Reads x-forwarded-for header           │
└──────────────┬──────────────────────────────────┘
               │ Supabase RPC / GitHub API
┌──────────────▼──────────────────────────────────┐
│  Supabase (PostgreSQL + RLS)                    │
│  └── All auth/data via RPC functions            │
└─────────────────────────────────────────────────┘
```

## Project Structure

```
├── api/                           # Vercel Edge Functions (backend)
│   ├── auth/github.ts             # GitHub OAuth server-side exchange
│   ├── github.ts                  # GitHub API proxy (hides token)
│   └── track.ts                   # Analytics with server-side IP
├── src/
│   ├── App.tsx                    # Root — persistent sidebar + SPA
│   ├── pages/
│   │   ├── HomePage.tsx           # All sections (intro, about, projects, etc.)
│   │   └── NotFound.tsx           # 404 page
│   ├── components/
│   │   ├── sections/              # Portfolio sections
│   │   ├── navbar/                # FloatingNavbar (scroll navigation)
│   │   ├── layout/                # Sidebar (persistent profile)
│   │   ├── shared/                # Reusable UI
│   │   ├── admin/                 # Admin panel
│   │   ├── auth/                  # Login + OAuth callbacks
│   │   ├── chat/                  # Global chat
│   │   ├── command/               # Command palette (Ctrl+K)
│   │   ├── profile/               # User profile popup
│   │   └── ui/                    # Base UI primitives
│   ├── contexts/                  # React contexts
│   ├── hooks/                     # Custom hooks
│   ├── lib/                       # Utilities
│   └── types/                     # TypeScript types
├── vercel.json                    # Routing + security headers
└── .env                           # Environment variables
```

## Backend API Routes

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/auth/github` | Exchanges GitHub OAuth code for user data (server-side, secret never exposed) |
| `GET` | `/api/github?path=...` | Proxies GitHub API with server-side token, 5min edge cache |
| `POST` | `/api/track` | Tracks analytics events with server-side IP detection (no ipify) |

### Security Design
- **Secrets stay server-side:** `GITHUB_CLIENT_SECRET` and `GITHUB_TOKEN` are only in Edge Functions, never bundled into client JS
- **Path whitelist:** GitHub proxy only allows `users/*` and `repos/*` paths
- **Edge caching:** GitHub responses cached for 5 minutes to reduce rate limits
- **CSP headers:** Content Security Policy blocks XSS, clickjacking, and injection
- **No CORS proxy:** Direct server-to-server GitHub API calls (no corsproxy.io)

## Environment Variables

```env
# Client-side (bundled into JS — public by design)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GITHUB_CLIENT_ID=your-github-client-id
VITE_CLOUDINARY_CLOUD_NAME=your-cloud (optional)
VITE_CLOUDINARY_UPLOAD_PRESET=your-preset (optional)

# Server-side only (NOT bundled — secrets)
GITHUB_CLIENT_SECRET=your-github-oauth-secret
GITHUB_TOKEN=your-github-pat
```

> ⚠️ Variables without `VITE_` prefix are **server-only** — they are never sent to the browser.

## Key Features

### UI / UX
- Single-page layout with scroll-based navbar
- Persistent sidebar profile card
- Command palette (`Ctrl+K`)
- M3 Design System with dark/light/system theme
- Spring physics animations

### Keyboard Shortcuts
| Shortcut | Action |
|---|---|
| `Ctrl+K` | Command Palette |
| `Ctrl+Alt+D` | Toggle dark mode |
| `Ctrl+Alt+P` | Go to Projects |
| `Ctrl+Alt+A` | Admin Panel |
| `Ctrl+Alt+C` | Open Chat |

### Performance
- Lazy-loaded modals
- `content-visibility: auto` for off-screen sections
- IntersectionObserver scroll spy
- Edge-cached GitHub API responses

## Deploy

```bash
# Deploy to Vercel (auto-detects Vite + Edge Functions)
vercel --prod
```

Set server-side env vars in Vercel Dashboard → Settings → Environment Variables.

## License

MIT
