interface TrackEventParams {
  event: string;
  path?: string;
  meta?: Record<string, unknown>;
}

/**
 * Send an analytics event to /api/track.
 *
 * IMPORTANT: the route handler reads `{ event_type, event_data }` (matching the
 * underlying `track_event` SQL RPC params `p_event_type` / `p_event_data`).
 * The previous implementation sent `{ event, path, meta }`, which the route
 * rejected with HTTP 400 "Missing event_type" on every single call — silently
 * dropping all frontend analytics. This was a frontend/backend drift bug caught
 * in the Phase 2 audit; the body shape now matches the route contract exactly.
 *
 * `path` and `meta` are bundled into `event_data` so the original caller-side
 * ergonomic shape is preserved without changing the route's contract.
 */
export async function trackEvent({ event, path, meta }: TrackEventParams): Promise<{ status: string; error?: string }> {
  try {
    const res = await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: event,
        event_data: { path, meta },
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { status: 'error', error: data.error || `HTTP ${res.status}` };
    }

    return { status: 'ok' };
  } catch (err) {
    return { status: 'error', error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
