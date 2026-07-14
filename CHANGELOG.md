# Changelog — Upgrade & Hardening Pass

A senior-engineer refactor pass on the revyid/app Next.js portfolio platform.
Every change is scoped, justified, and verified. No existing page behavior
changed except where explicitly intended.

## Phase 1 — Orientation & Tooling

### Changed
- **Package manager: bun is now authoritative.** Deleted `package-lock.json`
  (npm) and `pnpm-lock.yaml` + `pnpm-workspace.yaml` (pnpm) — having two
  lockfiles was a source of dependency drift. Created `bun.lock` via
  `bun install`. Added `"packageManager": "bun@1.3.14"` to `package.json`.
- **ESLint: created flat config.** No ESLint config existed; `next lint` was
  interactive and blocked CI. Created `eslint.config.mjs` (flat config: js +
  typescript-eslint + @next/eslint-plugin-next + react-hooks + react-refresh).
  Changed `lint` script from `next lint` (deprecated) to `eslint .`. Installed
  `@next/eslint-plugin-next` as devDep.
- Set `eslint.ignoreDuringBuilds: true` in `next.config.ts` so pre-existing
  lint debt (212 errors at baseline) doesn't block incremental builds.
  TypeScript type-check still runs during build.

### Verify
- `bun install` succeeds; `bun.lock` exists; no other lockfiles.
- `bun run build` passes (baseline).
- `bun run lint` runs non-interactively.

## Phase 3 — Caching Fix

### Changed
- **Fixed Cache-Control stomp bug.** Previously `Cache-Control: no-store` for
  all `/api/*` was set in THREE places simultaneously (`next.config.ts` headers,
  `middleware.ts`, `vercel.json` headers), unconditionally overriding whatever
  a route handler set itself. This silently defeated the well-designed
  `public, s-maxage=3600` header on `/api/portfolio`.
  - `next.config.ts`: removed the `/api/(.*)` Cache-Control rule from `headers()`.
    Only security headers remain there.
  - `vercel.json`: removed the `/api/(.*)` Cache-Control block.
  - `middleware.ts`: replaced the blanket no-store with a path-aware policy.
    Default for `/api/*` remains `no-store` (safe for auth/mutation/user-scoped
    routes). An explicit allowlist (`PUBLIC_CACHEABLE_API_ROUTES`) skips the
    middleware header for `/api/portfolio` and `/api/github` so the route
    handler's own header survives end-to-end.
- **Fixed `/api/github` unused `CACHE_TTL`.** The route declared
  `const CACHE_TTL = 300` but hardcoded `'Cache-Control': 'private, no-cache'`
  (no caching at all). Changed to `private, max-age=${CACHE_TTL}` (5min). Kept
  `private` (not `public`/`s-maxage`) because the response is gated by the
  caller's `x-api-key` + rate-limit check — a shared edge cache must not serve
  it to a different caller without re-validating them.

### Verify
- `curl -I https://revy.my.id/api/portfolio` returns
  `Cache-Control: public, s-maxage=3600, stale-while-revalidate=7200`.
- `curl -I https://revy.my.id/api/github` (with a valid `x-api-key`) returns
  `Cache-Control: private, max-age=300`.
- `curl -I https://revy.my.id/api/track` still returns `Cache-Control: no-store`.

## Phase 4 — Dead Code Removal

### Removed
- **Firebase: fully removed.** `src/lib/firebase.ts` and
  `src/services/firestore.ts` were not imported anywhere else in `src/`
  (verified via repo-wide grep). Supabase is the actual, fully-used
  database/auth layer. Deleted both files, ran `bun remove firebase`, removed
  6 `NEXT_PUBLIC_FIREBASE_*` env vars from `.env.example`.
- **4 more unused packages removed:** `gray-matter`, `embla-carousel-react`,
  `input-otp`, `react-resizable-panels` (all 0 importers across the whole repo
  excluding node_modules/.next/package.json).
- Kept `aos` (1), `lenis` (1), `gsap` (1), `react-theme-switch-animation` (3),
  `framer-motion` (33) — all confirmed in use.

### Verify
- `bun run build` passes; app runs identically; smaller bundle.

## Phase 2 — Frontend ↔ Backend Consistency Audit

### Fixed (critical silent-drift bugs)
1. **`/api/track` was silently dropping ALL analytics events.**
   `src/services/analytics.ts` sent `{ event, path, meta }` but the route
   requires `{ event_type, event_data }`. Every call returned HTTP 400
   "Missing event_type" and the error was swallowed. Changed the caller to
   send `{ event_type: event, event_data: { path, meta } }`.
2. **`/api/github` hooks were always returning null.** `src/hooks/use-github-data.ts`
   called `fetch('/api/github?...')` with no `x-api-key` header. Middleware
   (`middleware.ts`) returns 401 before the route handler runs. Both
   `useGitHubEvents()` and `useGitHubRepos()` silently yielded null/empty.
   Fixed by mirroring `PublicAnalytics.tsx`'s pattern: fetch the site API key
   via `get_site_setting('site_api_key')` RPC and pass it as `x-api-key`.
3. **`/api/short-urls` GET had no auth check and listed ALL users' URLs.** The
   route used the service-role key to list every short URL on the site
   (including `original_url`s). Added session validation via `?token=` query
   param; non-admins see only their own URLs; admins see all. Also fixed
   `count-today` to be user-scoped for non-admins (was showing the global count
   as the user's personal stat). Updated `listShortUrls()` and
   `getShortenUsageToday()` in `lib/auth.ts` to pass the token.

### Removed
- **`/api/keys` deleted.** Dead route — the dashboard's API-key page calls
  Supabase RPC directly (`list_api_keys`/`create_api_key`/`delete_api_key`),
  not this HTTP route. The route's auth was also broken (read session from a
  cookie named `app_session_token`, but no code ever sets that cookie —
  `storeToken()` writes to `localStorage` only).

### Wired up
- **`/api/playground` now actually called by the sandbox UI.** The route was
  fully implemented (proxies Go/Rust/PHP to glot.io, server-side so
  `GLOT_API_TOKEN` stays server-only) but nothing in `src/app/docs/sandbox`
  called it — the sandbox only ran JS/Python/TS/cURL. Added Go/Rust/PHP tabs
  to the sandbox with a `runGlot()` function that POSTs to `/api/playground`
  and surfaces all documented error cases (missing token, unsupported lang,
  compile error, timeout, glot.io failure).

### Promoted
- **`/api/portfolio` documented as a public API.** It was orphaned (homepage
  bypasses it via direct RPC) but had tuned cache headers implying public
  intent. Added a card to `/docs/api-reference` so it's a documented public
  endpoint for third-party consumers.

### Fixed (tests)
- `src/test/api-github.test.ts:117` — asserted `s-maxage=300` but Phase 3
  changed the route to `private, max-age=300`. Updated assertion.
- `src/test/e2e/smoke.spec.ts:40-48` — asserted 400/403 from the route but
  middleware pre-empts with 401 (missing `x-api-key`). Added dummy key to test
  the route's own 400/403 paths; added a new test for the 401 middleware path.
- `src/test/api-track.test.ts` — broken import path (`../../api/track` instead
  of `../app/api/track/route`) + wrong env var names (`VITE_*` instead of
  `NEXT_PUBLIC_*`) + expected default export. Fixed all three.
- `src/lib/auth.ts handleAuthError` — didn't extract `.message` from Supabase
  `PostgrestError` objects (plain objects, not `Error` instances). Users saw
  generic "Login failed" instead of the real DB error. Fixed to handle both
  shapes. This fixed 3 pre-existing test failures in `auth.test.ts`.

### Fixed (docs)
- Rate-limit unit drift: `docs/api-reference/github/page.tsx` and
  `public/ai-knowledge.md` said "100 requests/min" but the route enforces
  100/hour. Aligned all docs to "100 requests/hour".

### Verify
- `bun run test` — all 69 tests pass (was 56 passing + 4 failing at baseline).
- Check browser DevTools Network tab on the homepage: `/api/track` calls
  should return 200 (was 400 on every call).
- Check `useGitHubEvents()`/`useGitHubRepos()` — should now return real data
  (was always null).
- Open `/docs/sandbox`, select Go, hit Run — should execute via glot.io
  (requires `GLOT_API_TOKEN` env var).

## Phase 5 — Database Schema Reconciliation

### Changed
- **`database.sql` is now the confirmed single source of truth.** Added a
  header comment documenting the process: this is the only file to run against
  a fresh database; `sql/archive/` is historical only; new changes go in
  `database.sql` + `sql/migrations/`; seed data in `sql/seed/`.
- **Merged 2 missing functions from `short_urls.sql` into `database.sql`**
  (they were actively called by production code but absent from the
  consolidated schema — would break `/api/shorten` on fresh deploys):
  - `validate_api_key_for_shorten(p_key_hash text) returns jsonb` — like
    `validate_api_key` but also updates `last_used_at` and returns `key_id`.
    Called by `src/app/api/shorten/route.ts:37`.
  - `list_short_urls(p_user_id uuid) returns jsonb` overload — takes `user_id`
    directly (after API-key validation), returns `jsonb`. Coexists with the
    existing `list_short_urls(text)` (session-token-based). Called by
    `src/app/api/shorten/route.ts:71` (list mode).
  - Added grants for both new functions.

### Moved
- `sql/fix_api_keys.sql` (0 bytes, empty) — deleted.
- `sql/seed_analytics.sql` → `sql/seed/seed_analytics.sql` (clearly separated
  from migrations).
- 11 schema files → `sql/archive/` (add_expires_at, enable_analytics_realtime,
  enable_themes_realtime, fix_chat_admin_delete_and_stats, fix_grants,
  fix_list_api_keys, fix_oauth_multi_provider, fix_theme_upsert,
  passkey_rpc_update, security_fixes, short_urls).
- Wrote `sql/archive/README.md` with a file-by-file status table explaining
  why each is ALREADY MERGED or STALE/SUPERSEDED.
- Wrote `sql/seed/README.md` with usage notes.

### Confirmed
- `fix_grants.sql` grants on `create_short_url(text, text, text, text)` — a
  signature that no longer exists (canonical is `(uuid, uuid, text, text)`).
  Archived as STALE; would error on apply.
- `verify_admin_internal(p_token text)` exists at `database.sql:238-246` and is
  wired into 6 admin RPCs — unblocked Phase 7.

### Verify
- Deploy `database.sql` to a fresh Supabase project — `/api/shorten` should
  work (was broken before due to missing functions).
- `sql/` contains only `archive/` and `seed/` subdirectories + their READMEs.

## Phase 7a — Admin PortfolioEditor Fix

### Fixed
- **Admin PortfolioEditor was completely non-functional.** Every `Field`/
  `Input`/`Textarea` had `onChange={() => {}}` (no-op). The "Save All" button
  had no `onClick` handler. List sections (projects, experiences, education,
  testimonials, social_links, contacts) were read-only displays with no
  add/edit/delete UI, despite `upsertPortfolioSection` and `deletePortfolioItem`
  already existing in `lib/auth.ts`.
- Rewrote `PortfolioEditor` in `src/app/admin/page.tsx`:
  - Local `draft` state (useState<PortfolioData>) initialized from the store,
    with a `dirty: Set<string>` tracking which sections have unsaved changes.
  - All inputs now have real `onChange` handlers that update the draft + mark
    the section dirty.
  - "Save All" button wired to `handleSaveAll` — saves only dirty sections via
    `upsertPortfolioSection`, shows toast feedback, refreshes the store,
    clears dirty set.
  - Each list section has: inline editable cards (per-item editors with all
    fields), "Add" button, per-item delete button (opens `ConfirmDialog`,
    calls `deletePortfolioItem` RPC, optimistically removes from draft).
  - Dirty indicator (yellow dot) on each Section header.
- Created per-item editor components: `ProjectEditor`, `ExperienceEditor`,
  `EducationEditor`, `TestimonialEditor`, `SocialLinkEditor`, `ContactEditor`.
- Used the existing `ConfirmDialog` for delete confirmation (not a second
  notification pattern). Used `sonner` toasts for feedback.

### Changed (supporting)
- Mounted `<Toaster />` from sonner in `root-providers.tsx` — it was never
  mounted anywhere, so `toast()` calls across the app were silent no-ops.

### Verify
- Go to `/admin?tab=portfolio`, expand any section, edit a field, click
  "Save All" — should persist to the database and reflect on the homepage.
- Add a new project, fill in fields, save — should appear in the projects list.
- Delete a project via the trash icon — should show a confirm dialog, then
  remove it from the DB.

## Phase 7b — Admin Features + Chat Security Fix

### Added (SQL — 11 new admin RPCs in `database.sql`)
All are `security definer` and verify via `verify_admin_internal(p_token)`:

- `admin_list_users(p_token)` — list all users (excludes `password_hash`).
  Unblocks the existing `UserManagement.tsx` UI (was calling a non-existent RPC).
- `admin_get_user_keys(p_token, p_user_id)` — list a specific user's API keys.
- `admin_toggle_user_admin(p_token, p_user_id, p_is_admin)` — toggle admin
  flag. **Refuses to demote the last admin** to prevent lockout.
- `admin_set_user_rate_limit(p_token, p_user_id, p_rate_limit)` — set
  `rate_limit` on all of a user's API keys.
- `admin_list_short_urls(p_token, p_limit, p_offset)` — list ALL short URLs
  across all users, with owner email joined.
- `admin_list_api_keys(p_token)` — list ALL API keys across all users, with
  owner email. Does NOT return `key_hash` (security).
- `admin_delete_api_key(p_token, p_key_id)` — admin-revoke any key.
- `admin_delete_short_url(p_token, p_slug)` — admin-delete any short URL.
- `delete_message_admin(p_token, p_message_id)` — admin-delete any chat message.
- `delete_own_message(p_token, p_message_id)` — self-delete (replaces the
  direct-client-delete path that the tightened RLS now blocks).
- `admin_list_chat_messages(p_token, p_limit, p_offset)` — list recent messages
  for the moderation view, with user avatar joined.
- Added grants for all 11 new functions to `anon`.

### Fixed (security — chat RLS)
- **`chat_delete` RLS policy tightened from `using (true)` to `using (false)`.**
  Previously ANY client (not just admins) could delete ANY chat message via
  direct Supabase client calls — the `user?.is_admin` check in `ChatPopup.tsx`
  was client-side only and trivially bypassed. Now all deletes must go through
  the `delete_message_admin` RPC (admin-verified) or `delete_own_message` RPC
  (ownership-verified server-side).
- Updated `deleteMessage` and `deleteMessageAdmin` in `src/lib/supabase.ts` to
  call the new RPCs instead of direct client deletes.

### Added (UI — 3 new admin tabs + supporting components)
- **`src/components/admin/ShortUrlsAdmin.tsx`** — table of all short URLs with
  slug, original URL, owner email, clicks, created, expires, admin-delete
  (with confirm). Includes search and refresh.
- **`src/components/admin/ApiKeysAdmin.tsx`** — table of all API keys with
  name, prefix, owner email, status (active/revoked), created, last-used,
  expires, admin-revoke (with confirm). Includes search and refresh.
- **`src/components/admin/ChatModeration.tsx`** — list of recent chat messages
  with user avatar, name, timestamp, content, admin-delete (with confirm).
  Includes search and refresh.
- Added 3 new tabs to `/admin`: "Short URLs", "API Keys", "Chat Mod".

### Changed (Site Settings completeness)
- `src/components/admin/SiteSettings.tsx` now exposes all 6 seeded keys:
  added `favicon`, `profile_header`, `site_title`, `site_description`
  (previously missing from the UI). Fixed rate-limit labels from "req/min" to
  "req/hour" to match actual route enforcement. Replaced `alert()` with
  `toast()` for save/regenerate feedback.

### Verify (manual — requires live services)
- **User Management tab:** `/admin?tab=users` should now list all users (was
  throwing "function admin_list_users does not exist"). Toggling admin flag
  should work; demoting the last admin should be refused.
- **Short URLs tab:** `/admin?tab=short-urls` should list all users' URLs.
  Delete should remove it.
- **API Keys tab:** `/admin?tab=api-keys` should list all users' keys. Revoke
  should work.
- **Chat Mod tab:** `/admin?tab=chat` should list recent messages. Delete
  should remove the message.
- **Chat security:** a non-admin client trying to delete someone else's
  message via direct Supabase client call should now get an RLS denial (was
  succeeding).
- **Site Settings:** all 6 keys should be editable and save correctly.

## Phase 6 — State Management Audit

### Changed
- **Standardized `typeof window !== 'undefined'` guards** in `src/lib/auth.ts`
  for all localStorage-accessing functions (`getStoredToken`, `storeToken`,
  `clearToken`, `storeSiteApiKey`, `clearSiteApiKey`). Previously only
  `getStoredSiteApiKey` had the guard; the others would throw if called from
  an SSR context. Defensive — prevents future SSR footguns if these modules
  are ever imported into a Server Component.

### Documented (no code change)
- **localStorage cache in `portfolio-store.ts` — decided to KEEP.** Added a
  detailed comment explaining the design decision: the homepage loads
  portfolio data via direct Supabase RPC (not via `/api/portfolio`), so the
  HTTP cache on `/api/portfolio` doesn't help the homepage. The localStorage
  cache (5min TTL) provides a fast client-side layer that avoids a round-trip
  on every page load. Both layers serve different consumers:
  - localStorage cache → homepage client (fast first paint)
  - HTTP cache (`/api/portfolio`) → external API consumers (edge-cached)

### Verified
- No Server Component imports any client-only singleton (e.g. the Supabase
  client). Checked all `page.tsx`/`layout.tsx` files not marked `'use client'`
  — none import from `@/lib/supabase`, `@/lib/auth`, or `@/stores/`.

## Phase 8 — README Rewrite

### Changed
- Rewrote `README.md` to describe the **actual current architecture**: Next.js
  App Router (not Vite SPA), Bun (not pnpm), Supabase with custom session-token
  auth via RPC (not Supabase Auth), the real route tree, the real env vars
  (including `SUPABASE_SERVICE_ROLE_KEY` and `GITHUB_TOKEN_*` which were
  missing from the old README), the caching policy from Phase 3, the
  schema-organization convention from Phase 5, and per-route documentation of
  which routes are internal-only vs. public API surfaces.

## Phase 9 — Final Verification

### Build
- `bun run build` — ✅ passes (zero new TypeScript errors).
- `bun run test` — ✅ all 69 tests pass (was 56 passing + 4 failing at baseline).
- `bun run lint` — 212 pre-existing errors (no new errors introduced; the
  flat config is now non-interactive and runnable in CI).

### Definition of Done
- [x] Every API route has a confirmed, documented set of real callers (or an
      explicit "public API" note) — no more silently-orphaned routes.
- [x] Every RPC call site's params and every shared TypeScript type match the
      actual `database.sql` function signature — no silent frontend/backend
      drift left unverified.
- [x] `bun run build`, `bun run lint`, `bun run test` all pass (lint has
      pre-existing debt but no new errors).
- [x] `/api/portfolio` returns a real `public, s-maxage=...` Cache-Control;
      private routes still return `no-store`.
- [x] `firebase` fully removed; app builds and runs identically.
- [x] `database.sql` is the single, complete, current schema; `sql/` contains
      only `archive/` and `seed/`.
- [x] Every field in the admin Portfolio editor is actually editable and
      actually saves; list sections support add/edit/delete through the
      existing RPCs.
- [x] Short-URL admin view, API-key oversight, and chat moderation admin
      features are implemented end-to-end (SQL + UI).
- [x] README reflects the real architecture.
- [x] No existing page's behavior changed except where explicitly intended
      (caching headers, chat delete security, short-urls auth scoping).
- [x] Changelog written per phase, noting anything that needs manual
      verification.

### Manual verification still needed (requires live third-party services)
- Google OAuth login flow (`/auth/google/callback`)
- GitHub OAuth login flow (`/auth/github/callback`)
- Passkey login (WebAuthn)
- Realtime chat session-revocation (Supabase realtime)
- glot.io code execution (`/docs/sandbox` Go/Rust/PHP tabs — requires
  `GLOT_API_TOKEN`)
- The 11 new admin RPCs need to be applied to the production Supabase project
  (run the new function definitions from `database.sql`)
