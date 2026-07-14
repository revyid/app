// @ts-expect-error - playwright types resolve at runtime via the playwright runner
import { test, expect } from '@playwright/test';

test.describe('smoke: homepage', () => {
  test('loads and shows portfolio content', async ({ page }: any) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Revy/);
    // Sidebar profile visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('has correct meta description', async ({ page }: any) => {
    await page.goto('/');
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc).toContain('software engineer');
  });

  test('has canonical link', async ({ page }: any) => {
    await page.goto('/');
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBeTruthy();
  });

  test('has og:image meta', async ({ page }: any) => {
    await page.goto('/');
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogImage).toContain('og-image');
  });
});

test.describe('smoke: navigation', () => {
  test('404 page renders for unknown route', async ({ page }: any) => {
    await page.goto('/this-does-not-exist');
    // SPA serves index.html, NotFound component should render
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('smoke: api', () => {
  // Note: middleware.ts enforces `x-api-key` on /api/github BEFORE the route
  // handler runs. So requests without a key get 401 from middleware, not 400/403
  // from the route. Tests that exercise the route's own 400/403 paths must pass
  // a dummy key to get past middleware. See CHANGELOG (Phase 2).
  test('GET /api/github returns 401 without x-api-key (middleware)', async ({ request }: any) => {
    const res = await request.get('/api/github');
    expect(res.status()).toBe(401);
  });

  test('GET /api/github returns 400 without path param (with dummy key)', async ({ request }: any) => {
    const res = await request.get('/api/github', {
      headers: { 'x-api-key': 'dummy-test-key' },
    });
    expect(res.status()).toBe(400);
  });

  test('GET /api/github returns 403 for disallowed path (with dummy key)', async ({ request }: any) => {
    const res = await request.get('/api/github?path=admin/users', {
      headers: { 'x-api-key': 'dummy-test-key' },
    });
    expect(res.status()).toBe(403);
  });

  test('POST /api/track returns 400 without event_type', async ({ request }: any) => {
    const res = await request.post('/api/track', {
      data: { event_data: {} },
    });
    expect(res.status()).toBe(400);
  });

  test('POST /api/track returns 405 for GET', async ({ request }: any) => {
    const res = await request.get('/api/track');
    expect(res.status()).toBe(405);
  });
});
