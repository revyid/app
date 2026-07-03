/**
 * curl-browser.ts: re-implementation of curl for Next.js.
 * 
 * This version uses a Next.js API Route as a proxy to bypass browser security 
 * restrictions (CORS, Forbidden Headers, SSL issues).
 * 
 * Instructions:
 * 1. Place this file in your project (e.g., /utils/curl-browser-ultra.ts).
 * 2. Create an API route at /pages/api/curl-proxy.ts (or /app/api/curl-proxy/route.ts).
 * 3. Enjoy 100% curl power in the browser!
 */

export interface BrowserCurlOptions {
  method?: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
  queryParams?: Record<string, string>;
  timeout?: number;
  verbose?: boolean;
  user?: string;
  redirect?: 'follow' | 'error' | 'manual';
  credentials?: 'include' | 'same-origin' | 'omit';
  userAgent?: string;
  referer?: string;
  cookie?: string;
  isGetWithData?: boolean;
  urlEncodeData?: Record<string, string>;
  includeHeaders?: boolean;
  /** Whether to use the API proxy (default: true for 100% curl similarity) */
  useProxy?: boolean;
}

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

export class CurlParser {
  private command: string;

  constructor(command: string) {
    this.command = command.trim();
  }

  public parse(): BrowserCurlOptions {
    const options: BrowserCurlOptions = { url: '', headers: {}, queryParams: {} };
    const args = this.splitCurlCommand(this.command);

    let i = 0;
    while (i < args.length) {
      const arg = args[i];
      switch (arg) {
        case '-X': case '--request': options.method = args[++i]; break;
        case '-I': case '--head': options.method = 'HEAD'; break;
        case '-H': case '--header':
          const hp = args[++i].split(':');
          if (hp.length >= 2) {
            const key = hp[0].trim();
            const val = hp.slice(1).join(':').trim();
            options.headers![key] = val;
          }
          break;
        case '-d': case '--data': case '--data-raw': case '--data-binary':
          const data = args[++i];
          if (!options.body) options.body = data;
          else options.body += '&' + data;
          if (!options.method) options.method = 'POST';
          break;
        case '--data-urlencode':
          const encodeData = args[++i];
          if (!options.urlEncodeData) options.urlEncodeData = {};
          const [ek, ev] = encodeData.split('=');
          if (ev) options.urlEncodeData[ek] = ev;
          if (!options.method) options.method = 'POST';
          break;
        case '-F': case '--form':
          if (!options.body || !(options.body instanceof FormData)) options.body = new FormData();
          const fp = args[++i];
          const ei = fp.indexOf('=');
          if (ei > -1) {
            const n = fp.substring(0, ei);
            const v = fp.substring(ei + 1);
            options.body.append(n, v.startsWith('@') ? v.substring(1) : v);
          }
          if (!options.method) options.method = 'POST';
          break;
        case '-A': case '--user-agent': options.userAgent = args[++i]; break;
        case '-u': case '--user': options.user = args[++i]; break;
        case '-L': case '--location': options.redirect = 'follow'; break;
        case '-v': case '--verbose': options.verbose = true; break;
        case '-i': case '--include': options.includeHeaders = true; break;
        case '-G': case '--get': options.isGetWithData = true; options.method = 'GET'; break;
        case '-b': case '--cookie': options.cookie = args[++i]; break;
        case '-e': case '--referer': options.referer = args[++i]; break;
        case '--max-time': case '--connect-timeout':
          options.timeout = parseFloat(args[++i]) * 1000;
          break;
        default:
          if (!options.url && !arg.startsWith('-')) options.url = arg;
          break;
      }
      i++;
    }

    if (!options.url) throw new Error('Curl Error: URL is required.');
    return options;
  }

  private splitCurlCommand(command: string): string[] {
    const args: string[] = [];
    let current = '';
    let inSingle = false;
    let inDouble = false;
    let escaped = false;

    for (let i = 0; i < command.length; i++) {
      const char = command[i];
      if (escaped) { current += char; escaped = false; }
      else if (char === '\\') {
        if (i + 1 < command.length && command[i+1] === '\n') i++;
        else escaped = true;
      }
      else if (char === "'") { if (inDouble) current += char; else inSingle = !inSingle; }
      else if (char === '"') { if (inSingle) current += char; else inDouble = !inDouble; }
      else if (char === ' ' && !inSingle && !inDouble) {
        if (current) args.push(current);
        current = '';
      } else if (char === '\n' && !inSingle && !inDouble) {
        if (current) args.push(current);
        current = '';
      } else current += char;
    }
    if (current) args.push(current);
    return args;
  }
}

export function toCurl(options: BrowserCurlOptions): string {
  const parts = ['curl'];
  const method = options.method?.toUpperCase() || 'GET';
  if (method !== 'GET') parts.push(`-X ${method}`);
  parts.push(`"${options.url}"`);
  if (options.headers) Object.entries(options.headers).forEach(([k, v]) => parts.push(`-H "${k}: ${v}"`));
  if (options.userAgent) parts.push(`-A "${options.userAgent}"`);
  if (options.cookie) parts.push(`-b "${options.cookie}"`);
  if (options.referer) parts.push(`-e "${options.referer}"`);
  if (options.user) parts.push(`-u "${options.user}"`);
  if (options.body) {
    if (typeof options.body === 'string') parts.push(`-d '${options.body}'`);
    else if (options.body instanceof FormData) options.body.forEach((v, k) => parts.push(`-F "${k}=${v}"`));
  }
  if (options.verbose) parts.push('-v');
  return parts.join(' ');
}

export async function browserCurl<T = any>(input: BrowserCurlOptions | string): Promise<BrowserCurlResponse<T>> {
  const start = performance.now();
  let options: BrowserCurlOptions;
  if (typeof input === 'string') options = new CurlParser(input).parse();
  else options = input;

  const useProxy = options.useProxy !== undefined ? options.useProxy : true;

  if (useProxy) {
    const proxyUrl = '/api/curl-proxy';
    let serializableBody = options.body;
    if (options.body instanceof FormData) serializableBody = Array.from(options.body.entries());

    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...options, body: serializableBody, curlCommand: typeof input === 'string' ? input : toCurl(options) }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data as BrowserCurlResponse<T>;
  } else {
    // Direct fetch logic (simplified)
    const { method = 'GET', url, headers = {}, body, timeout, userAgent = 'curl/7.81.0' } = options;
    const rh = new Headers(headers);
    rh.set('User-Agent', userAgent);
    const res = await fetch(url, { method: method.toUpperCase(), headers: rh, body: !['GET', 'HEAD'].includes(method.toUpperCase()) ? body : undefined });
    const rb = await res.json();
    return { status: res.status, statusText: res.statusText, headers: Object.fromEntries(res.headers.entries()), body: rb, url: res.url, ok: res.ok, duration: Math.round(performance.now() - start), curlCommand: toCurl(options) };
  }
}
