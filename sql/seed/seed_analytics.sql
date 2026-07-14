-- ============================================================
-- FAKE ANALYTICS DATA
-- ~200 page views with bots included, spread across 30 days
-- Run this in Supabase SQL Editor
-- ============================================================

-- Clear existing fake data (optional)
-- DELETE FROM analytics_events WHERE event_type = 'page_view';

-- Insert ~200 page views (including bots)
INSERT INTO analytics_events (event_type, event_data, user_agent, ip_address, referrer, created_at)
SELECT
  'page_view',
  jsonb_build_object('page', pages.page),
  agents.agent,
  (floor(random() * 223 + 1)::int || '.' ||
   floor(random() * 255)::int || '.' ||
   floor(random() * 255)::int || '.' ||
   floor(random() * 255)::int)::inet,
  referrers.referrer,
  now() - (floor(random() * 30)::int || ' days')::interval
    - (floor(random() * 24)::int || ' hours')::interval
    - (floor(random() * 60)::int || ' minutes')::interval
FROM
  (VALUES
    ('/'), ('/'), ('/'), ('/'), ('/'), ('/'), ('/'), ('/'), ('/'), ('/'),
    ('/'), ('/'), ('/'), ('/'), ('/'), ('/'), ('/'), ('/'), ('/'), ('/'),
    ('/'), ('/'), ('/'), ('/'), ('/'), ('/'), ('/'), ('/'), ('/'), ('/'),
    ('/'), ('/'), ('/'), ('/'), ('/'), ('/'), ('/'), ('/'), ('/'), ('/'),
    ('/'), ('/'), ('/'), ('/'), ('/'), ('/'), ('/'), ('/'), ('/'), ('/'),
    ('/about'), ('/about'), ('/about'), ('/about'), ('/about'), ('/about'), ('/about'), ('/about'),
    ('/projects'), ('/projects'), ('/projects'), ('/projects'), ('/projects'), ('/projects'), ('/projects'), ('/projects'), ('/projects'), ('/projects'),
    ('/projects'), ('/projects'), ('/projects'), ('/projects'), ('/projects'),
    ('/contact'), ('/contact'), ('/contact'), ('/contact'), ('/contact'), ('/contact'), ('/contact'), ('/contact'), ('/contact'), ('/contact'),
    ('/contact'), ('/contact'), ('/contact'), ('/contact'), ('/contact')
  ) AS pages(page)
CROSS JOIN
  (VALUES
    ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36'),
    ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36'),
    ('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'),
    ('Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/126.0.0.0 Mobile Safari/537.36'),
    ('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0'),
    ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.5 Safari/605.1.15'),
    ('Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'),
    ('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'),
    ('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'),
    ('Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)'),
    ('Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)'),
    ('Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)'),
    ('Twitterbot/1.0'),
    ('Twitterbot/1.0'),
    ('facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'),
    ('facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'),
    ('LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)'),
    ('Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)'),
    ('Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)')
  ) AS agents(agent)
CROSS JOIN
  (VALUES
    (NULL), (NULL), (NULL), (NULL), (NULL), (NULL), (NULL), (NULL), (NULL), (NULL),
    ('https://www.google.com/search?q=full+stack+developer+indonesia'),
    ('https://www.google.com/search?q=revy+portfolio'),
    ('https://www.google.com/search?q=react+developer+jambi'),
    ('https://www.google.com/search?q=nextjs+portfolio+template'),
    ('https://github.com/revyid'),
    ('https://github.com/revyid/app'),
    ('https://www.linkedin.com/in/revyid'),
    ('https://twitter.com/revyid'),
    ('https://www.instagram.com/revyid'),
    ('https://dev.to/revyid')
  ) AS referrers(referrer)
LIMIT 200;

-- Summary
SELECT
  count(*) as total_views,
  count(DISTINCT created_at::date) as days_with_views,
  count(DISTINCT event_data->>'page') as unique_pages,
  count(DISTINCT ip_address) as unique_visitors,
  count(*) FILTER (WHERE user_agent LIKE '%bot%' OR user_agent LIKE '%Bot%') as bot_views,
  min(created_at::date) as first_view,
  max(created_at::date) as last_view
FROM analytics_events
WHERE event_type = 'page_view';
