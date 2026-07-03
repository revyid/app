import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CurlOptions {
  method?: string; url: string; headers?: Record<string, string>; body?: any;
  timeout?: number; verbose?: boolean; user?: string;
  redirect?: 'follow' | 'error' | 'manual';
  userAgent?: string; referer?: string; cookie?: string;
  isGetWithData?: boolean; urlEncodeData?: Record<string, string>;
  includeHeaders?: boolean;
}

interface CurlResponse {
  status: number; statusText: string; headers: Record<string, string>;
  body: any; url: string; ok: boolean; duration: number; curlCommand: string;
}

class CurlParser {
  private command: string;
  constructor(command: string) { this.command = command.trim(); }

  parse(): CurlOptions {
    const options: CurlOptions = { url: '', headers: {} };
    const args = this.split(this.command);
    let i = 0;
    while (i < args.length) {
      const arg = args[i];
      switch (arg) {
        case '-X': case '--request': options.method = args[++i]; break;
        case '-I': case '--head': options.method = 'HEAD'; break;
        case '-H': case '--header':
          const hp = args[++i].split(':');
          if (hp.length >= 2) { options.headers![hp[0].trim()] = hp.slice(1).join(':').trim(); }
          break;
        case '-d': case '--data': case '--data-raw': case '--data-binary':
          const data = args[++i];
          if (!options.body) options.body = data; else options.body += '&' + data;
          if (!options.method) options.method = 'POST';
          break;
        case '--data-urlencode':
          const ed = args[++i];
          if (!options.urlEncodeData) options.urlEncodeData = {};
          const [ek, ev] = ed.split('=');
          if (ev) options.urlEncodeData[ek] = ev;
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
          options.timeout = parseFloat(args[++i]) * 1000; break;
        default:
          if (!options.url && !arg.startsWith('-')) options.url = arg;
          break;
      }
      i++;
    }
    if (!options.url) throw new Error('URL is required.');
    return options;
  }

  private split(cmd: string): string[] {
    const args: string[] = []; let cur = ''; let sq = false; let dq = false; let esc = false;
    for (let i = 0; i < cmd.length; i++) {
      const c = cmd[i];
      if (esc) { cur += c; esc = false; }
      else if (c === '\\') { if (i + 1 < cmd.length && cmd[i+1] === '\n') i++; else esc = true; }
      else if (c === "'") { if (dq) cur += c; else sq = !sq; }
      else if (c === '"') { if (sq) cur += c; else dq = !dq; }
      else if ((c === ' ' || c === '\n') && !sq && !dq) { if (cur) args.push(cur); cur = ''; }
      else cur += c;
    }
    if (cur) args.push(cur);
    return args;
  }
}

function toCurl(opts: CurlOptions): string {
  const p = ['curl'];
  const m = opts.method?.toUpperCase() || 'GET';
  if (m !== 'GET') p.push(`-X ${m}`);
  p.push(`"${opts.url}"`);
  if (opts.headers) Object.entries(opts.headers).forEach(([k, v]) => p.push(`-H "${k}: ${v}"`));
  if (opts.userAgent) p.push(`-A "${opts.userAgent}"`);
  if (opts.cookie) p.push(`-b "${opts.cookie}"`);
  if (opts.referer) p.push(`-e "${opts.referer}"`);
  if (opts.user) p.push(`-u "${opts.user}"`);
  if (opts.body) { if (typeof opts.body === 'string') p.push(`-d '${opts.body}'`); }
  if (opts.verbose) p.push('-v');
  return p.join(' ');
}

export async function POST(req: NextRequest) {
  const start = performance.now();
  let options: CurlOptions;
  const body = await req.json();

  try {
    if (body.curlCommand) {
      options = new CurlParser(body.curlCommand).parse();
    } else {
      options = body as CurlOptions;
    }

    const { method = 'GET', url, headers = {}, body: reqBody, timeout, userAgent = 'curl/7.81.0', referer, cookie, user, redirect = 'follow', isGetWithData, urlEncodeData } = options;

    let requestUrl: URL;
    try { requestUrl = new URL(url); } catch {
      return NextResponse.json({ error: `Invalid URL: ${url}` }, { status: 400 });
    }

    if (urlEncodeData) {
      const params = new URLSearchParams();
      Object.entries(urlEncodeData).forEach(([k, v]) => params.append(k, v));
      const encoded = params.toString();
      if (method.toUpperCase() === 'GET' || isGetWithData) {
        encoded.split('&').forEach(p => { const [k, v] = p.split('='); if (k) requestUrl.searchParams.append(k, decodeURIComponent(v)); });
      }
    }

    let finalBody: any = reqBody;
    if (isGetWithData && finalBody) {
      if (typeof finalBody === 'string') {
        finalBody.split('&').forEach((p: string) => { const [k, v] = p.split('='); if (k) requestUrl.searchParams.append(k, v ? decodeURIComponent(v) : ''); });
      }
      finalBody = undefined;
    }

    const rh = new Headers(headers);
    rh.set('User-Agent', userAgent);
    if (referer) rh.set('Referer', referer);
    if (cookie) rh.set('Cookie', cookie);
    if (user) rh.set('Authorization', `Basic ${Buffer.from(user).toString('base64')}`);

    if (finalBody && typeof finalBody === 'string') {
      try { JSON.parse(finalBody); if (!rh.has('Content-Type')) rh.set('Content-Type', 'application/json'); }
      catch { if (!rh.has('Content-Type')) rh.set('Content-Type', 'application/x-www-form-urlencoded'); }
    }

    const controller = new AbortController();
    const tid = timeout ? setTimeout(() => controller.abort(), timeout) : null;

    const res = await fetch(requestUrl.toString(), {
      method: method.toUpperCase(),
      headers: rh,
      body: !['GET', 'HEAD'].includes(method.toUpperCase()) ? finalBody : undefined,
      signal: controller.signal,
      redirect,
    });

    if (tid) clearTimeout(tid);

    const duration = Math.round(performance.now() - start);
    const responseHeaders = Object.fromEntries(res.headers.entries());
    const ct = res.headers.get('content-type');

    let responseBody: any;
    if (ct?.includes('application/json')) responseBody = await res.json();
    else if (ct?.includes('text/') || ct?.includes('xml') || ct?.includes('html')) responseBody = await res.text();
    else { const buf = Buffer.from(await res.arrayBuffer()); responseBody = buf.toString('base64'); }

    return NextResponse.json({
      status: res.status, statusText: res.statusText, headers: responseHeaders,
      body: responseBody, url: res.url, ok: res.ok, duration, curlCommand: toCurl(options),
    } as CurlResponse);

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'POST { curlCommand: "curl ..." } or { url, method, headers, body }' }, { status: 405 });
}
