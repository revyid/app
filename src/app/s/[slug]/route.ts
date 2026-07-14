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
      --bg: 240 5% 97%; --fg: 240 10% 8%; --surface: 240 5% 94%;
      --primary: 82 90% 48%; --primary-fg: 0 0% 5%; --primary-container: 82 75% 88%;
      --primary-container-fg: 82 100% 12%; --outline: 220 10% 70%;
      --error: 0 80% 50%; --error-container: 0 75% 92%;
    }
    .dark {
      --bg: 11 6% 9%; --fg: 232 7% 91%; --surface: 232 6% 14%;
      --primary: 82 85% 55%; --primary-fg: 0 0% 5%; --primary-container: 82 35% 20%;
      --primary-container-fg: 82 75% 88%; --outline: 232 6% 45%;
      --error: 0 72% 61%; --error-container: 0 40% 19%;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: hsl(var(--bg)); color: hsl(var(--fg));
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      -webkit-font-smoothing: antialiased;
    }
    .card {
      max-width: 360px; width: 90%; text-align: center;
      padding: 48px 32px; border-radius: 28px;
      background: hsl(var(--surface));
    }
    .icon { font-size: 48px; margin-bottom: 20px; }
    h1 { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
    p { font-size: 14px; opacity: 0.6; line-height: 1.6; }
    .slug { font-size: 13px; font-weight: 600; margin-top: 16px; opacity: 0.4; font-family: monospace; }
    a { display: inline-block; margin-top: 24px; padding: 10px 28px; border-radius: 16px;
      background: hsl(var(--primary)); color: hsl(var(--primary-fg));
      font-size: 13px; font-weight: 600; text-decoration: none; transition: opacity 0.15s; }
    a:hover { opacity: 0.85; }
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
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <div class="slug">/s/${slug}</div>
    <a href="/">Go home</a>
  </div>
</body>
</html>`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

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
      Redirecting in <span id="countdown">5</span>s... <a href="${row.original_url}">Skip</a>
    </div>
  </div>
  <script>
    let t = 5;
    const el = document.getElementById('countdown');
    const iv = setInterval(() => {
      t--;
      el.textContent = t;
      if (t <= 0) { clearInterval(iv); window.location.href = ${JSON.stringify(row.original_url)}; }
    }, 1000);
  </script>
  <script>(function(s){s.dataset.zone='11285195',s.src='https://nap5k.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
