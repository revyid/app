/**
 * Custom Auth Library
 * Calls Supabase RPC functions for all auth operations.
 * No dependency on Supabase Auth — sessions are simple tokens.
 */

import { supabase } from './supabase';

// ─── Types ──────────────────────────────────────────────────────────
export interface AppUser {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  provider: string;
  created_at: string;
}

export interface AuthResult {
  token?: string;
  user?: AppUser;
  error?: string;
}

const TOKEN_KEY = 'app_session_token';

// ─── Token Storage ──────────────────────────────────────────────────
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ─── Auth Operations ────────────────────────────────────────────────

export async function register(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthResult> {
  const { data, error } = await supabase.rpc('register_user', {
    p_email: email,
    p_password: password,
    p_display_name: displayName || null,
  });

  if (error) return { error: error.message };
  if (data?.error) return { error: data.error };

  storeToken(data.token);
  return { token: data.token, user: data.user };
}

export async function login(
  email: string,
  password: string
): Promise<AuthResult> {
  const { data, error } = await supabase.rpc('login_user', {
    p_email: email,
    p_password: password,
  });

  if (error) return { error: error.message };
  if (data?.error) return { error: data.error };

  storeToken(data.token);
  return { token: data.token, user: data.user };
}

export async function oauthLogin(
  email: string,
  displayName: string,
  avatarUrl: string,
  provider: 'google' | 'github',
  providerId: string
): Promise<AuthResult> {
  const { data, error } = await supabase.rpc('oauth_login', {
    p_email: email,
    p_display_name: displayName,
    p_avatar_url: avatarUrl,
    p_provider: provider,
    p_provider_id: providerId,
  });

  if (error) return { error: error.message };
  if (data?.error) return { error: data.error };

  storeToken(data.token);
  return { token: data.token, user: data.user };
}

export async function passkeyLogin(
  credentialId: string,
  oldToken: string
): Promise<AuthResult> {
  const { data, error } = await supabase.rpc('passkey_login', {
    p_credential_id: credentialId,
    p_old_token: oldToken,
  });

  if (error) return { error: error.message };
  if (data?.error) return { error: data.error };

  storeToken(data.token);
  return { token: data.token, user: data.user };
}

export async function validateSession(token?: string): Promise<AuthResult> {
  const t = token || getStoredToken();
  if (!t) return { error: 'No session' };

  const { data, error } = await supabase.rpc('validate_session', {
    p_token: t,
  });

  if (error) return { error: error.message };
  if (data?.error) return { error: data.error };

  return { token: t, user: data.user };
}

export async function logout(): Promise<void> {
  const token = getStoredToken();
  if (token) {
    try {
      await supabase.rpc('logout_session', { p_token: token });
    } catch { /* ignore */ }
  }
  clearToken();
}

export async function updateProfile(
  displayName?: string,
  avatarUrl?: string
): Promise<AuthResult> {
  const token = getStoredToken();
  if (!token) return { error: 'Not authenticated' };

  const { data, error } = await supabase.rpc('update_user_profile', {
    p_token: token,
    p_display_name: displayName || null,
    p_avatar_url: avatarUrl || null,
  });

  if (error) return { error: error.message };
  if (data?.error) return { error: data.error };

  return { user: data.user };
}

export async function updateSessionDevice(
  deviceId: string,
  deviceName: string,
  browserName: string
): Promise<void> {
  const token = getStoredToken();
  if (!token) return;

  try {
    await supabase.rpc('update_session_device', {
      p_token: token,
      p_device_id: deviceId,
      p_device_name: deviceName,
      p_browser_name: browserName,
    });
  } catch { /* ignore */ }
}

export async function getUserSessions(): Promise<any[]> {
  const token = getStoredToken();
  if (!token) return [];

  const { data, error } = await supabase.rpc('get_user_sessions', {
    p_token: token,
  });

  if (error || data?.error) return [];
  return data?.sessions || [];
}

export async function revokeSession(sessionId: string): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  const { data, error } = await supabase.rpc('revoke_session', {
    p_token: token,
    p_session_id: sessionId,
  });

  if (error || data?.error) return false;
  return true;
}
