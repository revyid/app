import { useEffect } from 'react';

export function GoogleCallback() {
  useEffect(() => {
    try {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const idToken = hash.get('id_token');
      const state = hash.get('state');
      const savedState = localStorage.getItem('google_oauth_state');

      if (!idToken) throw new Error('No id_token in response.');
      if (state !== savedState) throw new Error('Invalid state parameter.');

      localStorage.removeItem('google_oauth_state');

      const payload = JSON.parse(atob(idToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));

      if (window.opener) {
        window.opener.postMessage(
          { type: 'google-auth-callback', user: payload },
          window.location.origin
        );
      }
      window.close();
    } catch (err: any) {
      document.body.textContent = `Google auth error: ${err.message || 'Unknown error'}`;
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Signing in with Google...</p>
      </div>
    </div>
  );
}
