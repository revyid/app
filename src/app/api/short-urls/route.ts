import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function getAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  const admin = getAdmin();

  if (action === 'count-today') {
    const { count } = await admin
      .from('short_urls').select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());
    return NextResponse.json({ count: count || 0 });
  }

  // Default: list all
  const { data, error } = await admin
    .from('short_urls')
    .select('id, slug, original_url, clicks, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const urls = (data || []).map((r: any) => ({
    ...r,
    short_url: `https://revy.my.id/s/${r.slug}`,
  }));

  return NextResponse.json({ urls });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url: originalUrl, slug: customSlug, token } = body;

    if (!originalUrl) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const admin = getAdmin();

    // Validate session
    const { data: session } = await admin
      .from('app_sessions')
      .select('user_id')
      .eq('token', token)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Generate slug if not provided
    let slug = customSlug;
    if (!slug) {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      slug = Array.from({ length: 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }

    // Check if slug already exists
    const { data: existing } = await admin
      .from('short_urls')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    }

    // Create short URL
    const { data, error } = await admin
      .from('short_urls')
      .insert({
        slug,
        original_url: originalUrl,
        user_id: session.user_id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      short_url: `https://revy.my.id/s/${slug}`,
      slug,
      id: data.id,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
