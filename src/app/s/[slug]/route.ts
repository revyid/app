import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Increment clicks and get URL atomically
  const { data: url } = await supabase
    .rpc('increment_short_url_clicks', { p_slug: slug });

  if (url) {
    return NextResponse.redirect(url, { status: 302 });
  }

  // Fallback: try to find the URL without incrementing
  const { data: row } = await supabase
    .from('short_urls')
    .select('original_url')
    .eq('slug', slug)
    .single();

  if (row?.original_url) {
    return NextResponse.redirect(row.original_url, { status: 302 });
  }

  return new Response('Not found', { status: 404 });
}
