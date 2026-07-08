/**
 * Custom Auth Library
 * Calls Supabase RPC functions for all auth operations.
 * No dependency on Supabase Auth — sessions are simple tokens.
 */

import { getSupabase } from './supabase';
import { createClient } from '@supabase/supabase-js';

// ─── Types ──────────────────────────────────────────────────────────
export interface AppUser {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  provider: string;
  linked_providers: Array<{ provider: string; provider_id: string }>;
  is_admin: boolean;
  created_at: string;
}

export interface AuthResult {
  token?: string;
  user?: AppUser;
  error?: string;
}

const TOKEN_KEY = 'app_session_token';
const SITE_API_KEY_STORAGE = 'site_api_key';

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

// ─── Site API Key Storage (localStorage) ────────────────────────────
export function getStoredSiteApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SITE_API_KEY_STORAGE);
}

export function storeSiteApiKey(key: string): void {
  localStorage.setItem(SITE_API_KEY_STORAGE, key);
}

export function clearSiteApiKey(): void {
  localStorage.removeItem(SITE_API_KEY_STORAGE);
}

// ─── Auth Operations ────────────────────────────────────────────────

export async function register(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthResult> {
  const client = await getSupabase();
  const { data, error } = await client.rpc('register_user', {
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
  const { data, error } = await (await getSupabase()).rpc('login_user', {
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
  const { data, error } = await (await getSupabase()).rpc('oauth_login', {
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
  const { data, error } = await (await getSupabase()).rpc('passkey_login', {
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

  const { data, error } = await (await getSupabase()).rpc('validate_session', {
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
      await (await getSupabase()).rpc('logout_session', { p_token: token });
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

  const { data, error } = await (await getSupabase()).rpc('update_user_profile', {
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
    await (await getSupabase()).rpc('update_session_device', {
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

  const { data, error } = await (await getSupabase()).rpc('get_user_sessions', {
    p_token: token,
  });

  if (error || data?.error) return [];
  return data?.sessions || [];
}

export async function revokeSession(sessionId: string): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  const { data, error } = await (await getSupabase()).rpc('revoke_session', {
    p_token: token,
    p_session_id: sessionId,
  });

  if (error || data?.error) return false;
  return true;
}

// ─── Admin Portfolio CRUD ────────────────────────────────────────────

export async function getPortfolioSection(section: string): Promise<unknown> {
  const { data, error } = await (await getSupabase()).rpc('get_portfolio_section', { p_section: section });
  if (error) throw error;
  return data;
}

export async function getAllPortfolioData(): Promise<Record<string, unknown>> {
  const { data, error } = await (await getSupabase()).rpc('get_all_portfolio_data');
  if (error) throw error;
  return (data as Record<string, unknown>) || {};
}

export async function upsertPortfolioSection(
  section: string,
  data: unknown
): Promise<{ error?: string }> {
  const token = getStoredToken();
  if (!token) return { error: 'Not authenticated' };

  const { data: result, error } = await (await getSupabase()).rpc('upsert_portfolio_section', {
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

  const { data: result, error } = await (await getSupabase()).rpc('delete_portfolio_item', {
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
  const { data, error } = await (await getSupabase()).rpc('get_themes', {
    p_user_id: null
  });
  
  if (error) throw error;
  return (data as ThemeData[]) || [];
}

export async function upsertTheme(theme: ThemeData): Promise<{ id?: string; error?: string }> {
  const token = getStoredToken();
  if (!token) return { error: 'Not authenticated' };

  const { data: result, error } = await (await getSupabase()).rpc('upsert_theme', {
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
  const { data, error } = await (await getSupabase()).rpc('get_site_setting', { p_key: key });
  if (error) throw error;
  return data;
}

export async function updateSiteSetting(key: string, value: string): Promise<void> {
  const token = getStoredToken();
  if (!token) throw new Error('Not authenticated');

  const { data, error } = await (await getSupabase()).rpc('update_site_setting', {
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
    const { error } = await (await getSupabase()).rpc('track_event', {
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

  const { data, error } = await (await getSupabase()).rpc('get_analytics_summary', {
    p_token: token,
    p_days: days
  });

  if (error) throw error;
  return data;
}

export async function deleteTheme(themeId: string): Promise<{ error?: string }> {
  const token = getStoredToken();
  if (!token) return { error: 'Not authenticated' };

  const client = await getSupabase();
  const { data: session } = await client.from('app_sessions').select('user_id').eq('token', token).eq('is_active', true).single();
  if (!session) return { error: 'Invalid session' };

  // Verify admin
  const { data: user } = await client.from('app_users').select('is_admin').eq('id', session.user_id).single();
  if (!user?.is_admin) return { error: 'Admin access required' };

  const { error } = await client.from('themes').delete().eq('id', themeId);
  if (error) return { error: error.message };
  return {};
}

// ─── API Keys ─────────────────────────────────────────────────────

export async function createApiKey(name: string): Promise<{ key?: string; id?: string; key_prefix?: string; error?: string }> {
  const token = getStoredToken();
  if (!token) return { error: 'Not authenticated' };
  const { data, error } = await (await getSupabase()).rpc('create_api_key', { p_token: token, p_name: name });
  if (error) return { error: error.message };
  if (data?.error) return { error: data.error };
  return { key: data.key, id: data.id, key_prefix: data.key_prefix };
}

export async function listApiKeys(): Promise<Array<{ id: string; name: string; key_prefix: string; rate_limit: number; is_active: boolean; created_at: string; last_used_at: string }>> {
  const token = getStoredToken();
  if (!token) return [];
  const { data, error } = await (await getSupabase()).rpc('list_api_keys', { p_token: token });
  if (error || data?.error) return [];
  return data?.keys || [];
}

export async function deleteApiKey(keyId: string): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;
  const { data, error } = await (await getSupabase()).rpc('delete_api_key', { p_token: token, p_key_id: keyId });
  if (error) return false;
  return data === true;
}

export async function getApiUsageToday(): Promise<number> {
  const token = getStoredToken();
  if (!token) return 0;
  const user = await validateSession(token);
  if (!user.user) return 0;
  const { data } = await (await getSupabase()).rpc('get_api_usage_today', { p_user_id: user.user.id });
  return data || 0;
}

// ─── Site API Key ──────────────────────────────────────────────────

export async function getSiteApiKey(): Promise<string | null> {
  const token = getStoredToken();
  if (!token) return null;
  const { data, error } = await (await getSupabase()).rpc('get_site_api_key', { p_token: token });
  if (error || data?.error) return null;
  return data?.key || null;
}

export async function regenerateSiteApiKey(): Promise<{ key?: string; error?: string }> {
  const token = getStoredToken();
  if (!token) return { error: 'Not authenticated' };
  const { data, error } = await (await getSupabase()).rpc('regenerate_site_api_key', { p_token: token });
  if (error) return { error: error.message };
  if (data?.error) return { error: data.error };
  return { key: data.key };
}

// ─── Short URLs ────────────────────────────────────────────────────

export async function listShortUrls(): Promise<Array<{ id: string; slug: string; short_url: string; original_url: string; clicks: number; created_at: string }>> {
  const token = getStoredToken();
  if (!token) return [];
  const user = await validateSession(token);
  if (!user.user) return [];
  try {
    const res = await fetch('/api/short-urls');
    const data = await res.json();
    return data.urls || [];
  } catch {
    return [];
  }
}

export async function getShortenUsageToday(): Promise<number> {
  const token = getStoredToken();
  if (!token) return 0;
  const user = await validateSession(token);
  if (!user.user) return 0;
  try {
    const res = await fetch('/api/short-urls?action=count-today');
    const data = await res.json();
    return data.count || 0;
  } catch {
    return 0;
  }
}

export async function deleteShortUrl(slug: string): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;
  try {
    // Validate session to get user
    const session = await validateSession(token);
    if (!session.user) return false;

    // Get site API key from DB for auth
    const siteKey = await getSiteSetting('site_api_key');
    if (!siteKey) return false;

    const res = await fetch(`/api/shorten?slug=${encodeURIComponent(slug)}`, {
      method: 'DELETE',
      headers: { 'x-api-key': siteKey },
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data?.ok === true || data?.deleted === true || res.status === 200;
  } catch {
    return false;
  }
}

export async function updateShortUrl(slug: string, newOriginalUrl: string, newSlug?: string): Promise<{ ok?: boolean; error?: string }> {
  const token = getStoredToken();
  if (!token) return { error: 'Not authenticated' };
  try {
    const session = await validateSession(token);
    if (!session.user) return { error: 'Invalid session' };

    const siteKey = await getSiteSetting('site_api_key');
    if (!siteKey) return { error: 'No API key configured' };

    const res = await fetch(`/api/shorten?slug=${encodeURIComponent(slug)}`, {
      method: 'PATCH',
      headers: { 'x-api-key': siteKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: newOriginalUrl, new_slug: newSlug }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || 'Failed to update' };
    return { ok: true };
  } catch (e: any) {
    return { error: e.message };
  }
}
