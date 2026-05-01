/**
 * POST /api/auth/github
 * Server-side GitHub OAuth token exchange.
 * Receives the authorization code, exchanges it for an access token
 * using the client secret, fetches user profile, and returns it.
 */
export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const { code } = await req.json();
    if (!code) return json({ error: 'Missing authorization code' }, 400);

    const clientId = process.env.VITE_GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return json({ error: 'GitHub OAuth not configured on server' }, 500);
    }

    // 1. Exchange code → access token (server-side, no CORS proxy needed)
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    if (!tokenRes.ok) {
      return json({ error: 'Token exchange failed' }, 502);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return json({ error: tokenData.error_description || 'Failed to obtain access token' }, 400);
    }

    // 2. Fetch user profile
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!userRes.ok) {
      return json({ error: 'Failed to fetch GitHub user profile' }, 502);
    }

    const userData = await userRes.json();

    // 3. Fetch primary email if not public
    if (!userData.email) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });
      if (emailsRes.ok) {
        const emails = await emailsRes.json();
        const primary = emails.find((e: any) => e.primary);
        userData.email = primary?.email || emails[0]?.email || `${userData.login}@users.noreply.github.com`;
      }
    }

    // Return only safe fields (don't expose the access token)
    return json({
      user: {
        id: userData.id,
        login: userData.login,
        email: userData.email,
        name: userData.name,
        avatar_url: userData.avatar_url,
      },
    });
  } catch (err: any) {
    return json({ error: 'Internal server error' }, 500);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  });
}
