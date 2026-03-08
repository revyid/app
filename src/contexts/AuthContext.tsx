import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { getDeviceInfo, updateStoredRefreshToken } from '@/lib/webauthn';

// ─── Persistent Device ID ───────────────────────────────────────────
function getDeviceId(): string {
  if (typeof window === 'undefined') return 'unknown';
  let id = localStorage.getItem('resumx_device_id');
  if (!id) {
    if (window.crypto?.randomUUID) {
      id = window.crypto.randomUUID();
    } else {
      id = '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c: any) =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
      );
    }
    localStorage.setItem('resumx_device_id', id);
  }
  return id;
}

const DEVICE_ID = typeof window !== 'undefined' ? getDeviceId() : 'unknown';

// ─── Context Type ───────────────────────────────────────────────────
interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// ─── Provider ───────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use a ref for "is signing out" to prevent re-entrant signOut calls
  const signingOut = useRef(false);
  // Track the current user id in a ref so callbacks always have the latest
  const userRef = useRef<User | null>(null);

  // Keep userRef in sync
  useEffect(() => { userRef.current = user; }, [user]);

  // ─── Sign Out (stable reference via useCallback) ────────────────
  const signOut = useCallback(async () => {
    if (signingOut.current) return; // Prevent double-signout loops
    signingOut.current = true;
    try {
      // Mark device inactive (use ref for latest user)
      if (userRef.current) {
        await supabase.from('user_devices')
          .update({ is_active: false })
          .eq('device_id', DEVICE_ID);
      }
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      signingOut.current = false;
    }
  }, []);

  // ─── Device Tracking (completely separate from auth state) ──────
  useEffect(() => {
    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

    // Called whenever Supabase fires an auth event
    const onAuthChange = async (_event: string, currentSession: Session | null) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);

      if (currentSession?.user) {
        // Always upsert with is_active = true on any auth event.
        // This re-activates a previously revoked device on re-login.
        const { browser_name, device_name } = getDeviceInfo();
        await supabase.from('user_devices').upsert(
          {
            device_id: DEVICE_ID,
            user_id: currentSession.user.id,
            device_name,
            browser_name,
            is_active: true,
            last_active_at: new Date().toISOString(),
          },
          { onConflict: 'device_id' }
        );

        // Keep passkey refresh tokens up-to-date.
        // Supabase rotates tokens on every refresh — if we don't sync,
        // the passkey login will fail with a stale token and ask for password.
        if (currentSession.refresh_token) {
          updateStoredRefreshToken(currentSession.user.id, currentSession.refresh_token);
        }

        // Start listening for remote revocation (only once)
        if (!realtimeChannel) {
          realtimeChannel = supabase
            .channel(`device-revoke-${DEVICE_ID}`)
            .on(
              'postgres_changes',
              {
                event: 'UPDATE',
                schema: 'public',
                table: 'user_devices',
                filter: `device_id=eq.${DEVICE_ID}`,
              },
              (payload) => {
                if (payload.new?.is_active === false) {
                  console.warn('[Auth] Device revoked remotely → signing out');
                  signOut();
                }
              }
            )
            .subscribe();
        }
      } else {
        // Logged out → tear down realtime
        if (realtimeChannel) {
          supabase.removeChannel(realtimeChannel);
          realtimeChannel = null;
        }
      }
    };

    // 0. Fix malformed double-hash from previous OAuth redirects
    //    e.g. /##access_token=... → /#access_token=...
    if (window.location.hash.startsWith('##')) {
      const fixed = window.location.hash.substring(1); // Remove the extra #
      window.history.replaceState(null, '', window.location.pathname + fixed);
      // Force Supabase to re-detect the fixed hash by reloading the client
    }

    // 1. Hydrate from existing session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      onAuthChange('INITIAL_SESSION', s);
    });

    // 2. Listen for future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, s) => {
        onAuthChange(event, s);

        // Clean the URL after Supabase processes the OAuth hash fragment
        if (event === 'SIGNED_IN' && window.location.hash.includes('access_token')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      if (realtimeChannel) supabase.removeChannel(realtimeChannel);
    };
  }, [signOut]);

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
