import { useEffect } from 'react';

/**
 * Handles the Google OAuth implicit flow callback.
 * Parses the id_token from the URL hash, decodes user info, and sends it
 * back to the opener window via postMessage.
 */
export function GoogleCallback() {
  useEffect(() => {
    console.log('[GoogleCallback] URL:', window.location.href);
    console.log('[GoogleCallback] hash:', window.location.hash);
    try {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const idToken = hash.get('id_token');
      const state = hash.get('state');
      const savedState = localStorage.getItem('google_oauth_state');

      console.log('[GoogleCallback] id_token present:', !!idToken);
      console.log('[GoogleCallback] state match:', state === savedState);

      if (!idToken) throw new Error('No id_token in response.');
      if (state !== savedState) throw new Error('Invalid state parameter (potential CSRF).');

      const payload = JSON.parse(atob(idToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      console.log('[GoogleCallback] payload:', payload);

      if (window.opener) {
        console.log('[GoogleCallback] sending postMessage to opener');
        window.opener.postMessage(
          { type: 'google-auth-callback', user: payload },
          window.location.origin
        );
      } else {
        console.warn('[GoogleCallback] no window.opener!');
      }
      window.close();
    } catch (err: any) {
      console.error('[GoogleCallback] error:', err);
      document.body.innerHTML = `<p style="font-family:sans-serif;padding:2rem;color:red">Google auth error: ${err.message}</p>`;
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}
