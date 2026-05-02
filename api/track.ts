/**
 * POST /api/track
 * Server-side analytics tracking.
 * Reads the real client IP from request headers (no ipify needed),
 * then forwards to Supabase RPC.
 */
export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = await req.json();
    const { event_type, event_data } = body;

    if (!event_type || typeof event_type !== 'string') {
      return json({ error: 'Missing event_type' }, 400);
    }

    // Get real IP from Vercel headers (never exposed to client)
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    const userAgent = req.headers.get('user-agent') || '';
    const referrer = req.headers.get('referer') || body.referrer || 'direct';

    // Forward to Supabase RPC
    // @ts-ignore
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    // @ts-ignore
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return json({ error: 'Supabase not configured' }, 500);
    }

    const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/track_event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        p_event_type: event_type,
        p_event_data: event_data || null,
        p_user_agent: userAgent,
        p_ip_address: ip,
        p_referrer: referrer,
      }),
    });

    if (!rpcRes.ok) {
      return json({ error: 'Tracking failed' }, 502);
    }

    return json({ ok: true });
  } catch {
    return json({ error: 'Internal server error' }, 500);
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}
