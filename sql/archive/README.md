# sql/archive/ — Historical SQL patches (DO NOT RUN)

These files are **historical, already-applied patches** kept for audit trail
only. They are NOT migrations and must NOT be run against a fresh database.

## Single source of truth

**`database.sql`** (at the repo root) is the only file you need to run against
a fresh Supabase project. It contains the complete, current schema — every
table, function, policy, grant, index, and trigger — with all changes from the
patches below already merged in.

## Why keep these files?

Each file documents a specific change that was made to the schema at some point
in the past. They're useful for:

- Understanding *why* a function/table looks the way it does (the patch shows
  the delta, `database.sql` only shows the end state).
- Auditing security/RLS changes over time.
- Debugging production issues that trace back to a specific migration.

## Why NOT run these files?

Several files are **stale/superseded** — they reference old function signatures
or older function bodies that `database.sql` has since replaced. Re-running them
against a current database would either:

- **Error out** (e.g. `fix_grants.sql` grants execute on
  `create_short_url(text, text, text, text)` — a signature that no longer
  exists; the canonical signature is `(uuid, uuid, text, text)`).
- **Silently regress** a function to an older body (e.g. `add_expires_at.sql`
  would recreate `create_api_key` without the `rv_` prefix that the current
  codebase relies on).

## File-by-file status (as of Phase 5 reconciliation)

| File | Status | Notes |
|------|--------|-------|
| `add_expires_at.sql` | STALE/SUPERSEDED | Regresses 4 functions to older bodies; re-creates obsolete `create_short_url(text,text,text,text)` overload. |
| `enable_analytics_realtime.sql` | ALREADY MERGED | Verbatim in `database.sql`. |
| `enable_themes_realtime.sql` | ALREADY MERGED | Verbatim (wrapped in `do $$ ... exception` block in `database.sql`). |
| `fix_chat_admin_delete_and_stats.sql` | ALREADY MERGED | Verbatim; 1 inert `to authenticated` grant absent (app uses anon key only). |
| `fix_grants.sql` | STALE/SUPERSEDED | Grants on obsolete `create_short_url(text,text,text,text)` signature. |
| `fix_list_api_keys.sql` | ALREADY MERGED | Verbatim. |
| `fix_oauth_multi_provider.sql` | ALREADY MERGED | All functions verbatim; one-time data backfill is moot for fresh deploys. |
| `fix_theme_upsert.sql` | ALREADY MERGED | Verbatim; 2 inert `to authenticated` grants absent. |
| `passkey_rpc_update.sql` | ALREADY MERGED | All 3 functions + grants verbatim. |
| `security_fixes.sql` | ALREADY MERGED | All policies + realtime publication verbatim. |
| `short_urls.sql` | MERGED INTO database.sql | The 2 functions that were missing (`validate_api_key_for_shorten`, `list_short_urls(uuid)` overload) have been merged into `database.sql` during Phase 5. |

## Going forward

New schema changes should be written as:

1. A direct edit to `database.sql` (so it stays the single source of truth).
2. A dated file under `sql/migrations/` (create that folder if it doesn't
   exist yet) — e.g. `sql/migrations/2026-07-14_add_audit_log.sql` — so there's
   a clear, ordered history of changes for production databases that were
   provisioned before the change.

Do NOT add more loose `fix_*.sql` files at the repo root of `sql/`. That
pattern is what created the confusion this archive exists to resolve.
