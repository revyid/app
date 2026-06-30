import { useEffect, useState } from 'react';
import { Github } from 'lucide-react';

export function GithubCallback() {
  const [status, setStatus] = useState('Verifying authentication...');
  const [error, setError] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');

        if (!code) throw new Error('No authorization code provided.');

        const savedState = localStorage.getItem('github_oauth_state');
        if (state !== savedState) throw new Error('Invalid state parameter.');

        localStorage.removeItem('github_oauth_state');

        setStatus('Exchanging code for token...');

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
      <div className="max-w-sm w-full p-8 rounded-[24px] bg-surface-container border border-outline/10 text-center space-y-5">
        <div className="w-12 h-12 rounded-2xl bg-surface-variant flex items-center justify-center mx-auto">
          <Github className="w-6 h-6 text-foreground" />
        </div>

        <h2 className="text-lg font-semibold text-foreground">GitHub Authentication</h2>

        {error ? (
          <div className="space-y-3">
            <p className="text-sm text-error">{error}</p>
            <button
              onClick={() => window.close()}
              className="px-5 py-2 bg-error/10 text-error rounded-full text-sm font-medium hover:bg-error/20 transition-colors"
            >
              Close Window
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">{status}</p>
          </div>
        )}
      </div>
    </div>
  );
}
