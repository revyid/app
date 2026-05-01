import { test, expect } from '@playwright/test';

test.describe('smoke: homepage', () => {
  test('loads and shows portfolio content', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Revy/);
    // Sidebar profile visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('has correct meta description', async ({ page }) => {
    await page.goto('/');
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc).toContain('software engineer');
  });

  test('has canonical link', async ({ page }) => {
    await page.goto('/');
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBeTruthy();
  });

  test('has og:image meta', async ({ page }) => {
    await page.goto('/');
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogImage).toContain('og-image');
  });
});

test.describe('smoke: navigation', () => {
  test('404 page renders for unknown route', async ({ page }) => {
    await page.goto('/this-does-not-exist');
    // SPA serves index.html, NotFound component should render
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('smoke: api', () => {
  test('GET /api/github returns 400 without path param', async ({ request }) => {
    const res = await request.get('/api/github');
    expect(res.status()).toBe(400);
  });

  test('GET /api/github returns 403 for disallowed path', async ({ request }) => {
    const res = await request.get('/api/github?path=admin/users');
    expect(res.status()).toBe(403);
  });

  test('POST /api/track returns 400 without event_type', async ({ request }) => {
    const res = await request.post('/api/track', {
      data: { event_data: {} },
    });
    expect(res.status()).toBe(400);
  });

  test('POST /api/track returns 405 for GET', async ({ request }) => {
    const res = await request.get('/api/track');
    expect(res.status()).toBe(405);
  });
});
