import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: row } = await supabase
    .from('short_urls')
    .select('original_url, clicks')
    .eq('slug', slug)
    .single();

  if (!row?.original_url) {
    return new Response('Not found', { status: 404 });
  }

  // Increment clicks (fire and forget)
  supabase.from('short_urls').update({ clicks: ((row as any).clicks ?? 0) + 1 }).eq('slug', slug);

  // Return interstitial page with AdSense + auto redirect
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redirecting...</title>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1944632457818474" crossorigin="anonymous"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8f9fa; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .container { max-width: 728px; width: 100%; padding: 20px; text-align: center; }
    .ad-slot { margin: 20px auto; min-height: 90px; }
    .timer { font-size: 14px; color: #666; margin-top: 16px; }
    .timer a { color: #1a73e8; text-decoration: none; font-weight: 500; }
    .timer a:hover { text-decoration: underline; }
    .skip { position: absolute; top: 10px; right: 10px; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <ins class="adsbygoogle ad-slot"
         data-ad-client="ca-pub-1944632457818474"
         data-ad-slot="auto"></ins>
    <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
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
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
