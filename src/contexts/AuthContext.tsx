import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { getDeviceInfo } from '@/lib/webauthn';
import {
  validateSession,
  logout as authLogout,
  updateSessionDevice,
  getStoredToken,
  clearToken,
  type AppUser,
} from '@/lib/auth';

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
  user: AppUser | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signOut: async () => {},
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// ─── Provider ───────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const signingOut = useRef(false);

  // Validate session on mount and refresh user data
  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    const result = await validateSession(token);
    if (result.user) {
      setUser(result.user);

      // Update device info for this session
      const { browser_name, device_name } = getDeviceInfo();
      updateSessionDevice(DEVICE_ID, device_name, browser_name);
    } else {
      // Session invalid — clear it
      clearToken();
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    if (signingOut.current) return;
    signingOut.current = true;
    try {
      await authLogout();
      setUser(null);
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      signingOut.current = false;
    }
  }, []);

  // On mount: validate stored session
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Listen for remote session revocation via realtime
  useEffect(() => {
    const token = getStoredToken();
    if (!user || !token) return;

    // Listen for changes to app_sessions where our token matches
    const channel = supabase
      .channel(`session-revoke-${DEVICE_ID}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'app_sessions',
          filter: `token=eq.${token}`,
        },
        (payload) => {
          if (payload.new?.is_active === false) {
            console.warn('[Auth] Session revoked remotely → signing out');
            clearToken();
            setUser(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Listen for storage changes (multi-tab sync)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'app_session_token') {
        if (!e.newValue) {
          setUser(null);
        } else {
          refreshUser();
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
