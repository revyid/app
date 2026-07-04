/**
 * curl-browser.ts — Client-side curl executor.
 * Uses shared parser from curl-parser.ts, sends to /api/curl-proxy for real execution.
 */

import { parseCurlCommand, type CurlOptions } from './curl-parser';

export type { CurlOptions as BrowserCurlOptions };

export interface BrowserCurlResponse<T = any> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: T;
  url: string;
  ok: boolean;
  duration: number;
  curlCommand: string;
}

export { parseCurlCommand as CurlParser };

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

export async function browserCurl<T = any>(input: CurlOptions | string): Promise<BrowserCurlResponse<T>> {
  const start = performance.now();
  let options: CurlOptions;

  if (typeof input === 'string') {
    options = parseCurlCommand(input);
  } else {
    options = input;
  }

  // Send to proxy for real execution (bypasses CORS)
  const response = await fetch('/api/curl-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data as BrowserCurlResponse<T>;
}
