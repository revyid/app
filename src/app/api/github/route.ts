import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const CACHE_TTL = 300;
const ALLOWED_ORIGINS = ['https://revy.my.id', 'https://dev.revy.my.id'];
const RATE_LIMIT = 100; // per hour per user

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

  // Require API key
  if (!apiKey) {
    return NextResponse.json({ error: 'API key required. Get one at https://revy.my.id/dashboard/api-keys' }, { status: 401, headers: cors });
  }

  // Validate API key
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const keyHash = await sha256Hex(apiKey);
  const { data: keyData } = await supabase.from('api_keys').select('id, user_id, rate_limit, is_active').eq('key_hash', keyHash).single();

  if (!keyData || !keyData.is_active) {
    return NextResponse.json({ error: 'Invalid or inactive API key' }, { status: 401, headers: cors });
  }

  // Check rate limit (per user, 100 req/hour) — skip if unlimited is enabled
  const { data: unlimitedSetting } = await supabase.from('site_settings').select('value').eq('key', 'unlimited_api_keys').single();
  const isUnlimited = unlimitedSetting?.value === 'true';

  if (!isUnlimited) {
    const { count } = await supabase.from('api_key_usage').select('id', { count: 'exact', head: true }).eq('user_id', keyData.user_id).gte('used_at', new Date(Date.now() - 3600000).toISOString());

    if ((count || 0) >= RATE_LIMIT) {
      return NextResponse.json({ error: 'Rate limit exceeded. Max 100 requests per hour.' }, { status: 429, headers: { ...cors, 'Retry-After': '3600' } });
    }
  }

  // Record usage
  await supabase.from('api_key_usage').insert({ user_id: keyData.user_id });
  await supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', keyData.id);

  // Validate path
  if (!path) {
    return NextResponse.json({ error: 'Missing ?path= parameter' }, { status: 400, headers: cors });
  }

  const allowed = /^(users\/[\w.-]+(?:\/repos|\/events)?|repos\/[\w.-]+\/[\w.-]+)(\?.*)?$/;
  if (!allowed.test(path)) {
    return NextResponse.json({ error: 'Path not allowed' }, { status: 403, headers: cors });
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
        'Cache-Control': `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=${CACHE_TTL * 2}`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch from GitHub' }, { status: 502, headers: cors });
  }
}
