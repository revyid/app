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
  is_admin: boolean;
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

// ─── Admin Portfolio CRUD ────────────────────────────────────────────

export async function getPortfolioSection(section: string): Promise<unknown> {
  const { data, error } = await supabase.rpc('get_portfolio_section', { p_section: section });
  if (error) throw error;
  return data;
}

export async function getAllPortfolioData(): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.rpc('get_all_portfolio_data');
  if (error) throw error;
  return (data as Record<string, unknown>) || {};
}

export async function upsertPortfolioSection(
  section: string,
  data: unknown
): Promise<{ error?: string }> {
  const token = getStoredToken();
  if (!token) return { error: 'Not authenticated' };

  const { data: result, error } = await supabase.rpc('upsert_portfolio_section', {
    p_token: token,
    p_section: section,
    p_data: data,
  });

  if (error) return { error: error.message };
  if ((result as { error?: string })?.error) return { error: (result as { error: string }).error };
  return {};
}

export async function deletePortfolioItem(
  section: string,
  itemId: string
): Promise<{ error?: string }> {
  const token = getStoredToken();
  if (!token) return { error: 'Not authenticated' };

  const { data: result, error } = await supabase.rpc('delete_portfolio_item', {
    p_token: token,
    p_section: section,
    p_item_id: itemId,
  });

  if (error) return { error: error.message };
  if ((result as { error?: string })?.error) return { error: (result as { error: string }).error };
  return {};
}

// ─── Theme Management ────────────────────────────────────────────────

export interface ThemeData {
  id?: string;
  name: string;
  description?: string;
  seed_color: string;
  light_scheme: Record<string, string>;
  dark_scheme: Record<string, string>;
  is_public?: boolean;
}

export interface SiteSetting {
  key: string;
  value: string;
  description?: string;
}

export async function getThemes(): Promise<ThemeData[]> {
  const { data, error } = await supabase.rpc('get_themes', {
    p_user_id: null
  });
  
  if (error) throw error;
  return (data as ThemeData[]) || [];
}

export async function upsertTheme(theme: ThemeData): Promise<{ id?: string; error?: string }> {
  const token = getStoredToken();
  if (!token) return { error: 'Not authenticated' };

  const { data: result, error } = await supabase.rpc('upsert_theme', {
    p_id: theme.id || null,
    p_name: theme.name,
    p_description: theme.description || null,
    p_seed_color: theme.seed_color,
    p_light_scheme: theme.light_scheme,
    p_dark_scheme: theme.dark_scheme,
    p_is_public: theme.is_public ?? true,
    p_user_id: token
  });

  if (error) return { error: error.message };
  if ((result as { error?: string })?.error) return { error: (result as { error: string }).error };
  return { id: result as string };
}

// ─── Site Settings ───────────────────────────────────────────────────
export async function getSiteSetting(key: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_site_setting', { p_key: key });
  if (error) throw error;
  return data;
}

export async function updateSiteSetting(key: string, value: string): Promise<void> {
  const token = getStoredToken();
  if (!token) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('update_site_setting', {
    p_token: token,
    p_key: key,
    p_value: value
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
}

// ─── Analytics ───────────────────────────────────────────────────────
export async function trackEvent(
  eventType: string,
  eventData?: Record<string, any>,
  userAgent?: string,
  ipAddress?: string,
  referrer?: string
): Promise<void> {
  try {
    const { data, error } = await supabase.rpc('track_event', {
      p_event_type: eventType,
      p_event_data: eventData || null,
      p_user_agent: userAgent || null,
      p_ip_address: ipAddress || null,
      p_referrer: referrer || null
    });

    if (error) {
      console.error('Track event error:', error);
      throw error;
    }
    

  } catch (error) {
    console.error('Failed to track event:', error);
    throw error;
  }
}

export async function getAnalyticsSummary(days: number = 30): Promise<any> {
  const token = getStoredToken();
  if (!token) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('get_analytics_summary', {
    p_token: token,
    p_days: days
  });

  if (error) throw error;
  return data;
}

export async function deleteTheme(themeId: string): Promise<{ error?: string }> {
  const token = getStoredToken();
  if (!token) return { error: 'Not authenticated' };

  const { data: result, error } = await supabase.rpc('delete_theme', {
    p_id: themeId,
    p_user_id: token
  });

  if (error) return { error: error.message };
  if (!result) return { error: 'Failed to delete theme or insufficient permissions' };
  return {};
}
