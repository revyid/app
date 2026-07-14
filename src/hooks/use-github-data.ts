import useSWR from 'swr';
import { getSupabase } from '@/lib/supabase';

const GITHUB_USERNAME = 'revyid';

/**
 * Cached site API key — fetched once per session via the `get_site_setting`
 * RPC. The /api/github route requires an `x-api-key` header (enforced in
 * middleware.ts before the route handler even runs). Without it, every call
 * returns 401 and the hook silently yields null/[].
 *
 * This was a frontend/backend drift bug caught in the Phase 2 audit: the
 * hooks were calling /api/github with no auth header, while PublicAnalytics.tsx
 * correctly fetched the site key first. We mirror that pattern here.
 */
let _siteKeyCache: string | null = null;

async function getSiteKey(): Promise<string> {
  if (_siteKeyCache !== null) return _siteKeyCache;
  try {
    const client = await getSupabase();
    const { data } = await client.rpc('get_site_setting', { p_key: 'site_api_key' });
    _siteKeyCache = data || '';
  } catch {
    _siteKeyCache = '';
  }
  return _siteKeyCache ?? '';
}

async function fetchGitHub(path: string) {
  const key = await getSiteKey();
  const res = await fetch(`/api/github?path=${encodeURIComponent(path)}`, {
    headers: key ? { 'x-api-key': key } : {},
  });
  if (!res.ok) return null;
  return res.json();
}

async function fetchGitHubContributions() {
  return fetchGitHub(`users/${GITHUB_USERNAME}/events?per_page=1`);
}

async function fetchGitHubRepos() {
  const data = await fetchGitHub(`users/${GITHUB_USERNAME}/repos?sort=updated&per_page=10`);
  return data ?? [];
}

export function useGitHubEvents() {
  const { data, error, isLoading, mutate } = useSWR(
    'github-events',
    fetchGitHubContributions,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes
      errorRetryCount: 2,
    }
  );

  return { data, error, isLoading, refresh: () => mutate() };
}

export function useGitHubRepos() {
  const { data, error, isLoading, mutate } = useSWR(
    'github-repos',
    fetchGitHubRepos,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000,
      errorRetryCount: 2,
    }
  );

  return { data, error, isLoading, refresh: () => mutate() };
}
