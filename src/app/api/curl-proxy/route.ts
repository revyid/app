import { NextRequest, NextResponse } from 'next/server';
import { parseCurlCommand, type CurlOptions } from '@/lib/curl-parser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function toCurl(opts: CurlOptions): string {
  const p = ['curl'];
  const m = opts.method?.toUpperCase() || 'GET';
  if (m !== 'GET') p.push(`-X ${m}`);
  if (opts.verbose) p.push('-v');
  if (opts.insecure) p.push('-k');
  if (opts.redirect === 'follow') p.push('-L');
  if (opts.includeHeaders) p.push('-i');
  Object.entries(opts.headers).forEach(([k, v]) => p.push(`-H "${k}: ${v}"`));
  if (opts.userAgent !== 'curl/7.81.0') p.push(`-A "${opts.userAgent}"`);
  if (opts.user) p.push(`-u "${opts.user}"`);
  if (opts.cookie) p.push(`-b "${opts.cookie}"`);
  if (opts.cookieJar) p.push(`-c "${opts.cookieJar}"`);
  if (opts.referer) p.push(`-e "${opts.referer}"`);
  if (opts.body) {
    if (typeof opts.body === 'string') p.push(`-d '${opts.body}'`);
    else if (Array.isArray(opts.body)) opts.body.forEach(([k, v]) => p.push(`-F "${k}=${v}"`));
  }
  p.push(`"${opts.url}"`);
  return p.join(' ');
}

export async function POST(req: NextRequest) {
  const start = performance.now();

  try {
    const body = await req.json();
    const options: CurlOptions = body.url ? body : parseCurlCommand(body.curlCommand || '');

    const { method = 'GET', url, headers = {}, body: reqBody, timeout, userAgent = 'curl/7.81.0', referer, cookie, user, redirect = 'follow', isGetWithData, queryParams } = options as any;

    let requestUrl: URL;
    try { requestUrl = new URL(url); } catch {
      return NextResponse.json({ error: `Invalid URL: ${url}` }, { status: 400 });
    }

    // Append query params
    if (queryParams) Object.entries(queryParams as Record<string, string>).forEach(([k, v]) => requestUrl.searchParams.append(k, v));

    // Handle -G / --get with data
    let finalBody: any = reqBody;
    if ((options as any).isGetWithData && finalBody) {
      if (typeof finalBody === 'string') {
        finalBody.split('&').forEach((p: string) => {
          const [k, v] = p.split('=');
          if (k) requestUrl.searchParams.append(k, v ? decodeURIComponent(v) : '');
        });
      }
      finalBody = undefined;
    }

    // Build headers
    const rh = new Headers(headers);
    rh.set('User-Agent', userAgent);
    if (referer) rh.set('Referer', referer);
    if (cookie) rh.set('Cookie', cookie);
    if (user) rh.set('Authorization', `Basic ${Buffer.from(user).toString('base64')}`);

    // Auto Content-Type
    if (finalBody && typeof finalBody === 'string') {
      try {
        JSON.parse(finalBody);
        if (!rh.has('Content-Type')) rh.set('Content-Type', 'application/json');
      } catch {
        if (!rh.has('Content-Type')) rh.set('Content-Type', 'application/x-www-form-urlencoded');
      }
    }

    // Handle multipart form data
    if (Array.isArray(finalBody)) {
      const fd = new FormData();
      finalBody.forEach(([k, v]: [string, string]) => {
        // Skip @file references — can't resolve files from curl command
        if (!v.startsWith('@')) fd.append(k, v);
      });
      finalBody = fd;
      // Remove Content-Type so browser sets multipart/form-data with boundary
      rh.delete('Content-Type');
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
      body: responseBody, url: res.url, ok: res.ok, duration,
      curlCommand: toCurl(options as CurlOptions),
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'POST { url, method, headers, body } or { curlCommand: "curl ..." }' }, { status: 405 });
}
