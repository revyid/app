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
