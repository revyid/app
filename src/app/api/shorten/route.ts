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

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin') || '';
  return new Response(null, { status: 204, headers: getCorsHeaders(origin) });
}

export async function GET(request: Request) {
  const origin = request.headers.get('origin') || '';
  const cors = getCorsHeaders(origin);
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');

  // List mode (no slug)
  if (!slug) {
    const token = url.searchParams.get('token');
    if (!token) {
      return NextResponse.json({ error: 'Missing ?token= parameter' }, { status: 400, headers: cors });
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data } = await supabase.rpc('list_short_urls', { p_token: token });

    if (data?.error) {
      return NextResponse.json({ error: data.error }, { status: 401, headers: cors });
    }

    return NextResponse.json({ urls: data }, { headers: cors });
  }

  // Stats mode
  const token = url.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'Missing ?token= parameter' }, { status: 400, headers: cors });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data } = await supabase.rpc('get_short_url_stats', { p_token: token, p_slug: slug });

  if (data?.error) {
    return NextResponse.json({ error: data.error }, { status: 404, headers: cors });
  }

  return NextResponse.json(data, { headers: cors });
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin') || '';
  const cors = getCorsHeaders(origin);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: cors });
  }

  const { url, slug, token } = body;

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400, headers: cors });
  }
  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400, headers: cors });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data } = await supabase.rpc('create_short_url', {
    p_token: token,
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
  const token = url.searchParams.get('token');

  if (!slug || !token) {
    return NextResponse.json({ error: 'Missing ?slug= and ?token=' }, { status: 400, headers: cors });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data } = await supabase.rpc('delete_short_url', { p_token: token, p_slug: slug });

  if (data?.error) {
    return NextResponse.json({ error: data.error }, { status: 404, headers: cors });
  }

  return NextResponse.json(data, { headers: cors });
}
