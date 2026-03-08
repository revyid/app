import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { getDeviceInfo } from '@/lib/webauthn';

// Helper to get or create a persistent device ID for this browser
function getDeviceId() {
  if (typeof window === 'undefined') return 'unknown';
  let deviceId = localStorage.getItem('resumx_device_id');
  if (!deviceId) {
    if (window.crypto && window.crypto.randomUUID) {
       deviceId = window.crypto.randomUUID();
    } else {
       // Fallback for non-secure contexts (HTTP on mobile LAN)
       deviceId = '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c: any) =>
          (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
       );
    }
    localStorage.setItem('resumx_device_id', deviceId);
  }
  return deviceId;
}

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let deviceSubscription: ReturnType<typeof supabase.channel> | null = null;
    const deviceId = getDeviceId();

    const handleSessionChange = async (currentSession: Session | null) => {
      setSession(currentSession);
      setUser(currentSession?.user || null);
      setIsLoading(false);

      if (currentSession?.user) {
        // FIRST: Upsert device info — this re-activates the device if it was revoked.
        // This ensures that a user who logs in again after being force-logged-out
        // will have their device record set back to is_active=true.
        const { browser_name, device_name } = getDeviceInfo();
        await supabase.from('user_devices').upsert(
          {
            device_id: deviceId,
            user_id: currentSession.user.id,
            device_name,
            browser_name,
            is_active: true,
            last_active_at: new Date().toISOString()
          },
          { onConflict: 'device_id' }
        );

        // Listen for remote device revocation (real-time)
        if (!deviceSubscription) {
          deviceSubscription = supabase.channel(`public:user_devices:device_id=eq.${deviceId}`)
            .on(
              'postgres_changes',
              { event: 'UPDATE', schema: 'public', table: 'user_devices', filter: `device_id=eq.${deviceId}` },
              (payload) => {
                if (payload.new && payload.new.is_active === false) {
                  console.warn('Device session was revoked remotely. Signing out.');
                  signOut();
                }
              }
            )
            .subscribe();
        }
      } else {
        // Cleanup subscription on logout
        if (deviceSubscription) {
          supabase.removeChannel(deviceSubscription);
          deviceSubscription = null;
        }
      }
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) console.error('Error getting session:', error);
      handleSessionChange(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        handleSessionChange(currentSession);
      }
    );

    return () => {
      subscription.unsubscribe();
      if (deviceSubscription) supabase.removeChannel(deviceSubscription);
    };
  }, []);

  const signOut = async () => {
    try {
      // Mark current device as inactive before signing out
      const deviceId = getDeviceId();
      if (user) {
        await supabase.from('user_devices')
          .update({ is_active: false })
          .eq('device_id', deviceId);
      }
      // Sign out natively — but keep device_id in localStorage!
      // We MUST keep it so the user can re-login with the same device record
      // and reactivate it, instead of creating orphaned revoked records.
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
