/**
 * GET /api/github?path=users/revyid
 * Proxies GitHub API requests with a server-side token.
 * The GITHUB_TOKEN never reaches the browser.
 */
export const config = { runtime: 'edge' };

// Cache responses for 5 minutes to reduce API calls
const CACHE_TTL = 300;

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const url = new URL(req.url);
  const path = url.searchParams.get('path');

  if (!path) {
    return json({ error: 'Missing ?path= parameter' }, 400);
  }

  // Whitelist: only allow safe GitHub API paths
  const allowed = /^(users\/[\w.-]+(?:\/repos|\/events)?|repos\/[\w.-]+\/[\w.-]+)(\?.*)?$/;
  if (!allowed.test(path)) {
    return json({ error: 'Path not allowed' }, 403);
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
      return json(
        { error: `GitHub API error: ${ghRes.status}` },
        ghRes.status >= 500 ? 502 : ghRes.status
      );
    }

    const data = await ghRes.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=${CACHE_TTL * 2}`,
        ...corsHeaders(),
      },
    });
  } catch {
    return json({ error: 'Failed to fetch from GitHub' }, 502);
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}
