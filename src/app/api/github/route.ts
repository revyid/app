import { NextResponse } from 'next/server';

export const runtime = 'edge';

const CACHE_TTL = 300;
const ALLOWED_ORIGINS = ['https://revy.my.id', 'https://dev.revy.my.id'];

function getCorsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
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

  if (!path) {
    return NextResponse.json({ error: 'Missing ?path= parameter' }, { status: 400, headers: cors });
  }

  const allowed = /^(users\/[\w.-]+(?:\/repos|\/events)?|repos\/[\w.-]+\/[\w.-]+)(\?.*)?$/;
  if (!allowed.test(path)) {
    return NextResponse.json({ error: 'Path not allowed' }, { status: 403, headers: cors });
  }

  try {
    const token = process.env.GITHUB_TOKEN;
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
