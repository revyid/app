import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, OPTIONS } from '../app/api/github/route';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const mockRpc = vi.fn();
const mockFrom = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    rpc: mockRpc,
    from: mockFrom,
  }),
}));

function chain(result: any) {
  const c: any = {};
  c.select = () => c;
  c.eq = () => c;
  c.gte = () => ({ count: 0 });
  c.insert = () => c;
  c.update = () => c;
  c.single = () => Promise.resolve(result);
  Object.defineProperty(c, 'head', { get: () => c });
  c.then = (resolve: Function) => resolve(result);
  return c;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('GITHUB_TOKEN_1', 'ghp_test');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');

  mockFrom.mockImplementation((table: string) => {
    if (table === 'site_settings') return chain({ data: null });
    return chain({ data: null });
  });
});

function req(path: string | null, opts?: { method?: string; apiKey?: string }) {
  const url = path
    ? `http://localhost/api/github?path=${encodeURIComponent(path)}`
    : 'http://localhost/api/github';
  const headers: Record<string, string> = {};
  if (opts?.apiKey) headers['x-api-key'] = opts.apiKey;
  return new Request(url, { method: opts?.method || 'GET', headers });
}

describe('GET /api/github', () => {
  it('OPTIONS returns 204', async () => {
    const res = await OPTIONS(new Request('http://localhost/api/github', { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('returns 400 when path missing', async () => {
    const res = await GET(req(null, { apiKey: 'rv_test' }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain('path');
  });

  it('returns 401 without API key', async () => {
    const res = await GET(req('users/revyid'));
    expect(res.status).toBe(401);
  });

  it('returns 403 for disallowed path', async () => {
    const res = await GET(req('admin/users', { apiKey: 'rv_test' }));
    expect(res.status).toBe(403);
  });

  it('returns 403 for path traversal', async () => {
    const res = await GET(req('../etc/passwd', { apiKey: 'rv_test' }));
    expect(res.status).toBe(403);
  });

  it('returns 401 for invalid API key', async () => {
    mockRpc.mockResolvedValueOnce({ data: { valid: false } });
    const res = await GET(req('users/revyid', { apiKey: 'rv_bad' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('Invalid');
  });

  it('allows valid user API key', async () => {
    mockRpc.mockResolvedValueOnce({ data: { valid: true, user_id: 'u1', rate_limit: 100 } });
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ login: 'revyid' }), { status: 200 }));
    const res = await GET(req('users/revyid', { apiKey: 'rv_valid' }));
    expect(res.status).toBe(200);
  });

  it('site API key bypasses rate limit', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'site_settings') return chain({ data: { value: 'rv_site_abc' } });
      return chain({ data: null });
    });
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ login: 'revyid' }), { status: 200 }));
    const res = await GET(req('users/revyid', { apiKey: 'rv_site_abc' }));
    expect(res.status).toBe(200);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('sends GitHub auth header', async () => {
    mockRpc.mockResolvedValueOnce({ data: { valid: true, user_id: 'u1', rate_limit: 100 } });
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
    await GET(req('users/revyid', { apiKey: 'rv_test' }));
    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.headers['Authorization']).toBe('Bearer ghp_test');
  });

  it('sets cache-control on success', async () => {
    mockRpc.mockResolvedValueOnce({ data: { valid: true, user_id: 'u1', rate_limit: 100 } });
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
    const res = await GET(req('users/revyid', { apiKey: 'rv_test' }));
    // Phase 3: route emits `private, max-age=300` (per-caller, NOT public
    // s-maxage) because the response is gated by the caller's x-api-key +
    // rate-limit check. See CHANGELOG (Phase 3) and the inline comment in
    // src/app/api/github/route.ts.
    expect(res.headers.get('Cache-Control')).toContain('max-age=300');
    expect(res.headers.get('Cache-Control')).toContain('private');
  });

  it('returns 502 on GitHub 500', async () => {
    mockRpc.mockResolvedValueOnce({ data: { valid: true, user_id: 'u1', rate_limit: 100 } });
    mockFetch.mockResolvedValueOnce(new Response('error', { status: 500 }));
    const res = await GET(req('users/revyid', { apiKey: 'rv_test' }));
    expect(res.status).toBe(502);
  });

  it('returns GitHub 404 passthrough', async () => {
    mockRpc.mockResolvedValueOnce({ data: { valid: true, user_id: 'u1', rate_limit: 100 } });
    mockFetch.mockResolvedValueOnce(new Response('not found', { status: 404 }));
    const res = await GET(req('users/nonexistent', { apiKey: 'rv_test' }));
    expect(res.status).toBe(404);
  });

  it('returns 502 on network error', async () => {
    mockRpc.mockResolvedValueOnce({ data: { valid: true, user_id: 'u1', rate_limit: 100 } });
    mockFetch.mockRejectedValueOnce(new Error('network'));
    const res = await GET(req('users/revyid', { apiKey: 'rv_test' }));
    expect(res.status).toBe(502);
  });
});
