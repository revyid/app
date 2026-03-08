import { useEffect, useState } from 'react';

/**
 * Handles the GitHub OAuth callback.
 * Since GitHub requires a server-side exchange (and has CORS restrictions),
 * we use a simple CORS proxy and require VITE_GITHUB_CLIENT_SECRET for this
 * purely client-side implementation.
 * 
 * In a production App, this exchange should happen on a secure backend!
 */
export function GithubCallback() {
  const [status, setStatus] = useState('Verifying authentication...');
  const [error, setError] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');

        if (!code) {
          throw new Error('No authorization code provided.');
        }

        const savedState = localStorage.getItem('github_oauth_state');
        if (state !== savedState) {
          throw new Error('Invalid state parameter (potential CSRF).');
        }

        setStatus('Exchanging code for token...');

        const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
        const clientSecret = import.meta.env.VITE_GITHUB_CLIENT_SECRET;

        if (!clientSecret) {
          throw new Error('VITE_GITHUB_CLIENT_SECRET is missing in .env. Needed for client-side OAuth exchange.');
        }

        // 1. Exchange code for access token (Using a CORS proxy as GitHub blocks direct browser requests)
        const tokenResponse = await fetch('https://corsproxy.io/?' + encodeURIComponent('https://github.com/login/oauth/access_token'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            redirect_uri: window.location.origin + '/auth/github/callback',
          }),
        });

        if (!tokenResponse.ok) {
          throw new Error(`Token exchange failed: ${tokenResponse.statusText}`);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        if (!accessToken) {
          throw new Error('Failed to obtain access token from GitHub.');
        }

        setStatus('Fetching user profile...');

        // 2. Fetch user profile
        const userResponse = await fetch('https://api.github.com/user', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        });

        if (!userResponse.ok) {
          throw new Error('Failed to fetch GitHub user profile.');
        }

        const userData = await userResponse.json();

        // 3. Fetch user emails (if primary email is private)
        let primaryEmail = userData.email;
        if (!primaryEmail) {
          const emailsResponse = await fetch('https://api.github.com/user/emails', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json',
            },
          });
          if (emailsResponse.ok) {
            const emails = await emailsResponse.json();
            const primary = emails.find((e: any) => e.primary);
            primaryEmail = primary ? primary.email : emails[0]?.email;
          }
        }

        userData.email = primaryEmail || `${userData.login}@users.noreply.github.com`;

        setStatus('Authentication successful! Closing window...');

        // 4. Send data back to the opener window
        if (window.opener) {
          window.opener.postMessage(
            { type: 'github-auth-callback', user: userData },
            window.location.origin
          );
        } else {
          setError('Could not find parent window to complete login.');
        }
      } catch (err: any) {
        console.error('GitHub OAuth Error:', err);
        setError(err.message || 'Authentication failed');
      }
    };

    processCallback();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-[24px] bg-surface-container shadow-lg text-center border border-outline/10">
        <h2 className="text-xl font-medium mb-4">GitHub Authentication</h2>
        
        {error ? (
          <div className="p-4 bg-error/10 text-error rounded-xl text-sm">
            <p className="font-medium mb-2">Error during authentication</p>
            <p className="opacity-80 break-words">{error}</p>
            <button 
              onClick={() => window.close()}
              className="mt-4 px-4 py-2 bg-error text-error-foreground rounded-full text-sm font-medium"
            >
              Close Window
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
            <p className="text-muted-foreground">{status}</p>
          </div>
        )}
      </div>
    </div>
  );
}
