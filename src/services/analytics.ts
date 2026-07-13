interface TrackEventParams {
  event: string;
  path?: string;
  meta?: Record<string, unknown>;
}

export async function trackEvent({ event, path, meta }: TrackEventParams): Promise<{ status: string; error?: string }> {
  try {
    const res = await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, path, meta }),
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
