import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function getAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

function parseInterval(s: string): number {
  const m = s.match(/^(\d+)([smhd])$/);
  if (!m) return 0;
  const n = parseInt(m[1]);
  const unit: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return n * (unit[m[2]] || 0);
}

/**
 * Validate the session token and return { user_id, is_admin } or null.
 *
 * Phase 2 security fix: previously GET /api/short-urls had NO auth check at all
 * and used the service-role key to list every short URL on the site (including
 * other users' original_url values). Now every GET requires a valid session
 * token (passed as `?token=...` query param, matching the existing POST
 * pattern). Non-admin callers only see their own URLs; admins see all.
 * See CHANGELOG (Phase 2).
 */
async function validateSessionToken(token: string | null) {
  if (!token) return null;
  const admin = getAdmin();
  const { data: session } = await admin
    .from('app_sessions')
    .select('user_id')
    .eq('token', token)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .single();
  if (!session?.user_id) return null;
  const { data: user } = await admin
    .from('app_users')
    .select('is_admin')
    .eq('id', session.user_id)
    .single();
  return { user_id: session.user_id, is_admin: Boolean(user?.is_admin) };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const token = url.searchParams.get('token');

  const session = await validateSessionToken(token);
  if (!session) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  const admin = getAdmin();

  if (action === 'count-today') {
    // Non-admins: count only their own URLs created today.
    // Admins: count all URLs created today (site-wide stat).
    let query = admin
      .from('short_urls')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());
    if (!session.is_admin) {
      query = query.eq('user_id', session.user_id);
    }
    const { count } = await query;
    return NextResponse.json({ count: count || 0 });
  }

  // Default: list (scoped to caller; admins see all)
  let query = admin
    .from('short_urls')
    .select('id, slug, original_url, clicks, created_at, expires_at, user_id')
    .order('created_at', { ascending: false });
  if (!session.is_admin) {
    query = query.eq('user_id', session.user_id);
  }
  const { data, error } = await query;

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
    const { url: originalUrl, slug: customSlug, token, expires_in } = body;

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

    // Calculate expiry
    let expiresAt = null;
    if (expires_in && expires_in !== 'never') {
      const ms = parseInterval(expires_in);
      if (ms > 0) expiresAt = new Date(Date.now() + ms).toISOString();
    }

    // Create short URL
    const { data, error } = await admin
      .from('short_urls')
      .insert({
        slug,
        original_url: originalUrl,
        user_id: session.user_id,
        expires_at: expiresAt,
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
