import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const ALLOWED_ORIGINS = ['https://revy.my.id', 'https://dev.revy.my.id'];

function getCorsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  };
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function validateApiKey(apiKey: string) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  // Check site key first
  const { data: siteKeyRow } = await supabase
    .from('site_settings').select('value').eq('key', 'site_api_key').single();
  if (siteKeyRow?.value && apiKey === siteKeyRow.value) {
    return { valid: true, userId: null, keyId: null, isSiteKey: true };
  }

  const keyHash = await sha256Hex(apiKey);
  const { data } = await supabase.rpc('validate_api_key_for_shorten', { p_key_hash: keyHash });

  if (!data?.valid) {
    return { valid: false };
  }

  return { valid: true, userId: data.user_id, keyId: data.key_id, isSiteKey: false };
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin') || '';
  return new Response(null, { status: 204, headers: getCorsHeaders(origin) });
}

export async function GET(request: Request) {
  const origin = request.headers.get('origin') || '';
  const cors = getCorsHeaders(origin);
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');
  const apiKey = request.headers.get('x-api-key');

  if (!apiKey) {
    return NextResponse.json({ error: 'API key required' }, { status: 401, headers: cors });
  }

  const auth = await validateApiKey(apiKey);
  if (!auth.valid) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401, headers: cors });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  // List mode
  if (!slug) {
    const { data } = await supabase.rpc('list_short_urls', { p_user_id: auth.userId });
    return NextResponse.json({ urls: data }, { headers: cors });
  }

  // Stats mode
  const { data } = await supabase.rpc('get_short_url_stats', { p_user_id: auth.userId, p_slug: slug });

  if (data?.error) {
    return NextResponse.json({ error: data.error }, { status: 404, headers: cors });
  }

  return NextResponse.json(data, { headers: cors });
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin') || '';
  const cors = getCorsHeaders(origin);
  const apiKey = request.headers.get('x-api-key');

  if (!apiKey) {
    return NextResponse.json({ error: 'API key required' }, { status: 401, headers: cors });
  }

  const auth = await validateApiKey(apiKey);
  if (!auth.valid) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401, headers: cors });
  }

  // Site key: find admin user to use as owner
  let userId = auth.userId;
  let keyId = auth.keyId;
  if (!userId) {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: admin } = await supabase.from('app_users').select('id').eq('is_admin', true).limit(1).single();
    if (admin) {
      userId = admin.id;
      // Use first active API key of admin
      const { data: adminKey } = await supabase.from('api_keys').select('id').eq('user_id', admin.id).eq('is_active', true).limit(1).single();
      keyId = adminKey?.id || null;
    }
  }

  let body: any;
  try {
    const text = await request.text();
    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Empty request body' }, { status: 400, headers: cors });
    }
    body = JSON.parse(text);
  } catch (e: any) {
    return NextResponse.json({ error: 'Invalid JSON: ' + (e.message || 'parse error') }, { status: 400, headers: cors });
  }

  const { url, slug } = body;

  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400, headers: cors });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data } = await supabase.rpc('create_short_url', {
    p_user_id: auth.userId,
    p_key_id: auth.keyId,
    p_url: url,
    p_slug: slug || null,
  });

  if (data?.error) {
    return NextResponse.json({ error: data.error }, { status: 400, headers: cors });
  }

  return NextResponse.json(data, { status: 201, headers: cors });
}

export async function DELETE(request: Request) {
  const origin = request.headers.get('origin') || '';
  const cors = getCorsHeaders(origin);
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');
  const apiKey = request.headers.get('x-api-key');

  if (!slug) {
    return NextResponse.json({ error: 'Missing ?slug=' }, { status: 400, headers: cors });
  }
  if (!apiKey) {
    return NextResponse.json({ error: 'API key required' }, { status: 401, headers: cors });
  }

  const auth = await validateApiKey(apiKey);
  if (!auth.valid) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401, headers: cors });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data } = await supabase.rpc('delete_short_url', { p_user_id: auth.userId, p_slug: slug });

  if (data?.error) {
    return NextResponse.json({ error: data.error }, { status: 404, headers: cors });
  }

  return NextResponse.json(data, { headers: cors });
}
