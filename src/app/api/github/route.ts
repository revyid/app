import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const CACHE_TTL = 300;
const ALLOWED_ORIGINS = ['https://revy.my.id', 'https://dev.revy.my.id'];

function getCorsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  };
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function getGitHubTokens(): string[] {
  const tokens: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const t = process.env[`GITHUB_TOKEN_${i}`];
    if (t) tokens.push(t);
  }
  return tokens;
}

function pickToken(): string | undefined {
  const tokens = getGitHubTokens();
  if (tokens.length === 0) return undefined;
  return tokens[Math.floor(Math.random() * tokens.length)];
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin') || '';
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(origin) });
}

export async function GET(request: Request) {
  const origin = request.headers.get('origin') || '';
  const cors = getCorsHeaders(origin);
  const url = new URL(request.url);
  const path = url.searchParams.get('path');
  const apiKey = request.headers.get('x-api-key');

  // Validate path
  if (!path) {
    return NextResponse.json({ error: 'Missing ?path= parameter' }, { status: 400, headers: cors });
  }

  const allowed = /^(users\/[\w.-]+(?:\/repos|\/events)?|repos\/[\w.-]+\/[\w.-]+)(\?.*)?$/;
  if (!allowed.test(path)) {
    return NextResponse.json({ error: 'Path not allowed' }, { status: 403, headers: cors });
  }

  if (!apiKey) {
    return NextResponse.json({ error: 'API key required' }, { status: 401, headers: cors });
  }

  // Validate API key
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Check if it's the site's own API key (bypasses rate limit)
  const { data: siteKeyRow } = await supabase
    .from('site_settings').select('value').eq('key', 'site_api_key').single();
  const isSiteKey = siteKeyRow?.value && apiKey === siteKeyRow.value;

  if (!isSiteKey) {
    // Validate as user API key
    const keyHash = await sha256Hex(apiKey);
    const { data: keyResult } = await supabase.rpc('validate_api_key', { p_key_hash: keyHash });

    if (!keyResult?.valid) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401, headers: cors });
    }

    // Use service role for all DB queries (bypass RLS)
    const adminDb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // Check rate limit (unless unlimited setting is on)
    const { data: unlimitedSetting } = await adminDb
      .from('site_settings').select('value').eq('key', 'unlimited_api_keys').single();
    const isUnlimited = unlimitedSetting?.value === 'true';

    // Resolve user_id: site key uses admin user
    let trackUserId = keyResult.user_id;
    if (!trackUserId) {
      const { data: admin } = await adminDb.from('app_users').select('id').eq('is_admin', true).limit(1).single();
      trackUserId = admin?.id;
    }

    if (!isUnlimited && trackUserId) {
      const { count } = await adminDb.from('api_key_usage')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', trackUserId)
        .gte('used_at', new Date(Date.now() - 3600000).toISOString());

      const { data: ghLimitSetting } = await adminDb
        .from('site_settings').select('value').eq('key', 'rate_limit_github').single();
      const ghLimit = ghLimitSetting?.value ? parseInt(ghLimitSetting.value) : 100;

      if ((count || 0) >= ghLimit) {
        return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429, headers: { ...cors, 'Retry-After': '3600' } });
      }
    }

    // Record usage (use service role to bypass RLS)
    if (trackUserId) {
      const adminSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
      await adminSupabase.from('api_key_usage').insert({ user_id: trackUserId });
      await adminSupabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('key_hash', keyHash);
    }
  }

  try {
    const token = pickToken();
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'revy-portfolio',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const ghRes = await fetch(`https://api.github.com/${path}`, { headers });

    if (!ghRes.ok) {
      return NextResponse.json(
        { error: `GitHub API error: ${ghRes.status}` },
        { status: ghRes.status >= 500 ? 502 : ghRes.status, headers: cors }
      );
    }

    const data = await ghRes.json();

    return NextResponse.json(data, {
      status: 200,
      headers: {
        ...cors,
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch from GitHub' }, { status: 502, headers: cors });
  }
}
