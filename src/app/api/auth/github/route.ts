import { NextResponse } from 'next/server';

export const runtime = 'edge';

const ALLOWED_ORIGINS = ['https://revy.my.id', 'https://dev.revy.my.id'];

function getCorsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin') || '';
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(origin) });
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin') || '';
  const cors = getCorsHeaders(origin);

  try {
    const { code } = await request.json();
    if (!code) {
      return NextResponse.json({ error: 'Missing authorization code' }, { status: 400, headers: cors });
    }

    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'GitHub OAuth not configured on server' }, { status: 500, headers: cors });
    }

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });

    if (!tokenRes.ok) {
      return NextResponse.json({ error: 'Token exchange failed' }, { status: 502, headers: cors });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.json({ error: tokenData.error_description || 'Failed to obtain access token' }, { status: 400, headers: cors });
    }

    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    });

    if (!userRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch GitHub user profile' }, { status: 502, headers: cors });
    }

    const userData = await userRes.json();

    if (!userData.email) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
      });
      if (emailsRes.ok) {
        const emails = await emailsRes.json();
        const primary = emails.find((e: any) => e.primary);
        userData.email = primary?.email || emails[0]?.email || `${userData.login}@users.noreply.github.com`;
      }
    }

    return NextResponse.json({
      user: {
        id: userData.id,
        login: userData.login,
        email: userData.email,
        name: userData.name,
        avatar_url: userData.avatar_url,
      },
    }, { status: 200, headers: cors });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: cors });
  }
}
