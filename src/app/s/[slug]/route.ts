import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function themedPage(title: string, message: string, slug: string, icon: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    :root {
      --bg: 240 5% 97%; --fg: 240 10% 8%; --surface: 240 5% 94%; --surface-container: 240 5% 94%;
      --primary: 82 90% 48%; --primary-fg: 0 0% 5%; --primary-container: 82 75% 88%;
      --primary-container-fg: 82 100% 12%; --outline: 220 10% 70%;
      --error: 0 80% 50%; --error-container: 0 75% 92%; --muted: 220 10% 40%;
    }
    .dark {
      --bg: 11 6% 9%; --fg: 232 7% 91%; --surface: 232 6% 14%; --surface-container: 232 6% 14%;
      --primary: 82 85% 55%; --primary-fg: 0 0% 5%; --primary-container: 82 35% 20%;
      --primary-container-fg: 82 75% 88%; --outline: 232 6% 45%;
      --error: 0 72% 61%; --error-container: 0 40% 19%; --muted: 232 6% 55%;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: hsl(var(--bg)); color: hsl(var(--fg));
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      -webkit-font-smoothing: antialiased; padding: 24px;
    }
    .container { max-width: 440px; width: 100%; text-align: center; }
    .big-number { font-size: 10rem; font-weight: 900; line-height: 1; color: hsl(var(--primary)); user-select: none; }
    .card { border-radius: 32px; padding: 32px; margin-top: 32px; background: hsl(var(--surface-container)); }
    .icon-box { width: 64px; height: 64px; border-radius: 16px; background: hsl(var(--primary-container));
      display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
    .icon-box svg { width: 32px; height: 32px; color: hsl(var(--primary-container-fg)); }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
    p { font-size: 14px; color: hsl(var(--muted)); line-height: 1.6; }
    .slug { font-size: 13px; font-weight: 600; margin-top: 16px; opacity: 0.4; font-family: monospace; }
    .btn { display: inline-block; margin-top: 24px; padding: 12px 28px; border-radius: 24px;
      background: hsl(var(--primary)); color: hsl(var(--primary-fg));
      font-size: 14px; font-weight: 600; text-decoration: none; transition: transform 0.15s; }
    .btn:hover { transform: scale(1.03); }
    .path { font-size: 12px; color: hsl(var(--outline)); margin-top: 32px; word-break: break-all; }
  </style>
  <script>
    (function(){
      try {
        var t = localStorage.getItem('theme');
        if (t === 'dark' || (!t && matchMedia('(prefers-color-scheme:dark)').matches))
          document.documentElement.classList.add('dark');
        else
          document.documentElement.classList.remove('dark');
      } catch(e) {}
    })();
  </script>
</head>
<body>
  <div class="container">
    <div class="big-number">404</div>
    <div class="card">
      <div class="icon-box">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><line x1="11" y1="8" x2="11" y2="11"/><line x1="11" y1="14" x2="11.01" y2="14"/>
        </svg>
      </div>
      <h1>${title}</h1>
      <p>${message}</p>
      <a href="/" class="btn">Go home</a>
    </div>
    <div class="path">/s/${slug}</div>
  </div>
</body>
</html>`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  let { slug } = await params;
  // Strip .html extension if present (browser sometimes adds it)
  slug = slug.replace(/\.html$/, '');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: row, error: queryError } = await supabase
    .from('short_urls')
    .select('original_url, clicks, expires_at')
    .eq('slug', slug)
    .single();

  if (!row?.original_url) {
    return new Response(
      themedPage(
        'Link not found',
        'This short link doesn\'t exist or has been removed.',
        slug,
        '🔍'
      ),
      { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  // Check if expired
  const now = new Date();
  const expiresAt = row.expires_at ? new Date(row.expires_at) : null;
  const isExpired = expiresAt ? expiresAt < now : false;

  if (isExpired) {
    return new Response(
      themedPage(
        'Link expired',
        'This short link has expired and is no longer active.',
        slug,
        '🔗'
      ),
      { status: 410, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  // Increment clicks (fire and forget)
  supabase.from('short_urls').update({ clicks: ((row as any).clicks ?? 0) + 1 }).eq('slug', slug);

  // Redirect page with ad + countdown
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redirecting...</title>
  <style>
    :root {
      --bg: 240 5% 97%; --fg: 240 10% 8%; --surface: 240 5% 94%;
      --primary: 82 90% 48%; --primary-fg: 0 0% 5%; --outline: 220 10% 70%;
    }
    .dark {
      --bg: 11 6% 9%; --fg: 232 7% 91%; --surface: 232 6% 14%;
      --primary: 82 85% 55%; --primary-fg: 0 0% 5%; --outline: 232 6% 45%;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: hsl(var(--bg)); color: hsl(var(--fg));
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      -webkit-font-smoothing: antialiased;
    }
    .card { max-width: 360px; width: 90%; text-align: center; padding: 48px 32px; border-radius: 28px; background: hsl(var(--surface)); }
    .timer { font-size: 13px; opacity: 0.6; margin-top: 8px; }
    .timer a { color: hsl(var(--primary)); text-decoration: none; font-weight: 600; }
    .timer a:hover { text-decoration: underline; }
  </style>
  <script>
    (function(){
      try {
        var t = localStorage.getItem('theme');
        if (t === 'dark' || (!t && matchMedia('(prefers-color-scheme:dark)').matches))
          document.documentElement.classList.add('dark');
        else
          document.documentElement.classList.remove('dark');
      } catch(e) {}
    })();
  </script>
</head>
<body>
  <div class="card">
    <div class="timer">
      Redirecting in <span id="countdown">30</span>s... <a href="${row.original_url}">Skip</a>
    </div>
  </div>
  <script>
    let t = 30;
    const el = document.getElementById('countdown');
    const iv = setInterval(() => {
      t--;
      el.textContent = t;
      if (t <= 0) { clearInterval(iv); window.location.href = ${JSON.stringify(row.original_url)}; }
    }, 1000);
  </script>
  <script>(function(s){s.dataset.zone='11285195',s.src='https://nap5k.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>
  <script>(function(s){s.dataset.zone='11285222',s.src='https://n6wxm.com/vignette.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
