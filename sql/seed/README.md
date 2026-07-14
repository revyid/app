# sql/seed/ — Dev-only seed data (NOT a migration)

These files insert **fake/dev data** into an already-provisioned database.
They are NOT schema changes and must NOT be run against production.

## Files

- `seed_analytics.sql` — Generates ~200 fake `analytics_events` rows (page_view
  events spread across 30 days with randomized IPs, user agents, referrers).
  Useful for testing the analytics dashboard locally without waiting for real
  traffic.

## Usage

```bash
# After running database.sql against a fresh Supabase project:
supabase db execute --file sql/seed/seed_analytics.sql
```

Or paste into Supabase SQL Editor. Safe to re-run (it just adds more rows —
delete the rows first if you want a clean re-seed).
