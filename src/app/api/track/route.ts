import { NextResponse } from 'next/server';

export const runtime = 'edge';

const ALLOWED_ORIGINS = ['https://revy.my.id', 'https://dev.revy.my.id'];

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

function getCorsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin') || '';
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(origin) });
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin') || '';
  const cors = getCorsHeaders(origin);

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: cors });
  }

  try {
    const body = await request.json();
    const { event_type, event_data } = body;

    if (!event_type || typeof event_type !== 'string') {
      return NextResponse.json({ error: 'Missing event_type' }, { status: 400, headers: cors });
    }

    const userAgent = request.headers.get('user-agent') || '';
    const referrer = request.headers.get('referer') || body.referrer || 'direct';

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500, headers: cors });
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
      return NextResponse.json({ error: 'Tracking failed' }, { status: 502, headers: cors });
    }

    return NextResponse.json({ ok: true }, { status: 200, headers: cors });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: cors });
  }
}
