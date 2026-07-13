import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const CACHE_TTL = 3600; // 1 hour

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase.rpc('get_all_portfolio_data');

    if (error) {
      return NextResponse.json(
        { status: 'error', data: null, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { status: 'ok', data, error: null },
      {
        status: 200,
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=${CACHE_TTL * 2}`,
        },
      }
    );
  } catch (err) {
    return NextResponse.json(
      { status: 'error', data: null, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
