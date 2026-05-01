import { useEffect, useState } from 'react';

/**
 * Handles the GitHub OAuth callback.
 * Sends the authorization code to our backend API for secure token exchange.
 * The client secret never touches the browser.
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

        // Cleanup state immediately to prevent replay
        localStorage.removeItem('github_oauth_state');

        setStatus('Exchanging code for token...');

        // Call our secure backend API — no client secret needed here
        const res = await fetch('/api/auth/github', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Server error: ${res.status}`);
        }

        const { user: userData } = await res.json();

        setStatus('Authentication successful! Closing window...');

        // Send data back to the opener window
        if (window.opener) {
          window.opener.postMessage(
            { type: 'github-auth-callback', user: userData },
            window.location.origin
          );
        } else {
          setError('Could not find parent window to complete login.');
        }
      } catch (err: any) {
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
