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
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Find URL and increment clicks
  const { data: row } = await supabase
    .from('short_urls')
    .select('original_url, clicks')
    .eq('slug', slug)
    .single();

  if (row?.original_url) {
    // Increment clicks directly (don't block redirect)
    supabase.from('short_urls').update({ clicks: (row as any).clicks + 1 }).eq('slug', slug).then(() => {});
    return NextResponse.redirect(row.original_url, { status: 302 });
  }

  return new Response('Not found', { status: 404 });
}
