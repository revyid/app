/**
 * curl-ts/browser — Browser-side curl executor.
 * Executes parsed curl options via fetch (direct or proxy).
 */

import { parseCurlCommand, type CurlOptions } from './parser';

export interface CurlResponse<T = any> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: T;
  url: string;
  ok: boolean;
  duration: number;
  curlCommand: string;
}

export function toCurl(options: CurlOptions): string {
  const parts = ['curl'];
  const method = options.method?.toUpperCase() || 'GET';
  if (method !== 'GET') parts.push(`-X ${method}`);
  if (options.verbose) parts.push('-v');
  if (options.insecure) parts.push('-k');
  if (options.redirect === 'follow') parts.push('-L');
  if (options.includeHeaders) parts.push('-i');
  if (options.userAgent !== 'curl/7.81.0') parts.push(`-A "${options.userAgent}"`);
  if (options.user) parts.push(`-u "${options.user}"`);
  if (options.cookie) parts.push(`-b "${options.cookie}"`);
  if (options.cookieJar) parts.push(`-c "${options.cookieJar}"`);
  if (options.referer) parts.push(`-e "${options.referer}"`);
  Object.entries(options.headers).forEach(([k, v]) => parts.push(`-H "${k}: ${v}"`));
  if (options.body) {
    if (typeof options.body === 'string') parts.push(`-d '${options.body}'`);
    else if (Array.isArray(options.body)) options.body.forEach(([k, v]) => parts.push(`-F "${k}=${v}"`));
  }
  parts.push(`"${options.url}"`);
  return parts.join(' ');
}

/**
 * Execute a curl command in the browser.
 * @param input - curl command string or CurlOptions object
 * @param proxyUrl - optional proxy endpoint URL (for bypassing CORS)
 */
export async function curl<T = any>(input: CurlOptions | string, proxyUrl?: string): Promise<CurlResponse<T>> {
  const start = performance.now();
  const options = typeof input === 'string' ? parseCurlCommand(input) : input;

  if (proxyUrl) {
    // Server-side proxy execution (bypasses CORS)
    const res = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data as CurlResponse<T>;
  }

  // Direct browser fetch
  const { method = 'GET', url, headers = {}, body, userAgent = 'curl/7.81.0' } = options;
  const rh = new Headers(headers);
  rh.set('User-Agent', userAgent);
  const res = await fetch(url, {
    method: method.toUpperCase(),
    headers: rh,
    body: !['GET', 'HEAD'].includes(method.toUpperCase()) ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  });
  const rb = await res.json();
  return {
    status: res.status, statusText: res.statusText,
    headers: Object.fromEntries(res.headers.entries()),
    body: rb, url: res.url, ok: res.ok,
    duration: Math.round(performance.now() - start),
    curlCommand: toCurl(options),
  };
}
