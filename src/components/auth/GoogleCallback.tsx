import { useEffect } from 'react';

/**
 * Handles the Google OAuth implicit flow callback.
 * Parses the id_token from the URL hash, decodes user info, and sends it
 * back to the opener window via postMessage.
 */
export function GoogleCallback() {
  useEffect(() => {
    try {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const idToken = hash.get('id_token');
      const state = hash.get('state');
      const savedState = localStorage.getItem('google_oauth_state');

      if (!idToken) throw new Error('No id_token in response.');
      if (state !== savedState) throw new Error('Invalid state parameter (potential CSRF).');

      // Cleanup the state immediately to prevent replay attacks
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
      // Safe error display — no raw user input, only our own error message
      document.body.textContent = `Google auth error: ${err.message || 'Unknown error'}`;
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}
