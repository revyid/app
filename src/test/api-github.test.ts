import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, OPTIONS } from '../app/api/github/route';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock chainable Supabase query builder
function createChain(result: any) {
  const chain: any = {};
  chain.select = () => chain;
  chain.eq = () => chain;
  chain.single = () => Promise.resolve(result);
  chain.gte = () => chain;
  chain.insert = () => chain;
  chain.update = () => chain;
  // For count queries (head: true)
  Object.defineProperty(chain, 'head', { get: () => chain });
  // Make it thenable so `await` resolves to result
  chain.then = (resolve: Function) => resolve(result);
  return chain;
}

const mockSupabaseFrom = vi.fn();
const mockRpc = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    rpc: mockRpc,
    from: (table: string) => mockSupabaseFrom(table),
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('GITHUB_TOKEN_1', 'ghp_test');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');

  // Default: site_api_key not set, no rate limit issues
  mockSupabaseFrom.mockImplementation((table: string) => {
    if (table === 'site_settings') {
      return createChain({ data: null });
    }
    if (table === 'api_key_usage') {
        const chain: any = {};
        chain.select = () => chain;
        chain.eq = () => chain;
        chain.gte = () => ({ count: 0 });
        chain.insert = () => chain;
        chain.update = () => chain;
      Object.defineProperty(chain, 'head', { get: () => chain });
      return chain;
    }
    if (table === 'api_keys') {
      return createChain({ error: null });
    }
    return createChain({ error: null });
  });
});

function makeRequest(path: string | null, method = 'GET', apiKey?: string) {
  const url = path
    ? `http://localhost/api/github?path=${encodeURIComponent(path)}`
    : 'http://localhost/api/github';
  const headers: Record<string, string> = {};
  if (apiKey) headers['x-api-key'] = apiKey;
  return new Request(url, { method, headers });
}

describe('GET /api/github', () => {
  it('returns 204 for OPTIONS', async () => {
    const res = await OPTIONS(new Request('http://localhost/api/github', { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('returns 400 when path missing', async () => {
    const res = await GET(makeRequest(null, 'GET', 'rv_test'));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain('path');
  });

  it('returns 401 when API key missing', async () => {
    const res = await GET(makeRequest('users/revyid'));
    expect(res.status).toBe(401);
  });

  it('returns 403 for disallowed path', async () => {
    const res = await GET(makeRequest('admin/users', 'GET', 'rv_test'));
    expect(res.status).toBe(403);
  });

  it('returns 403 for path traversal attempt', async () => {
    const res = await GET(makeRequest('../etc/passwd', 'GET', 'rv_test'));
    expect(res.status).toBe(403);
  });

  it('returns 401 when API key is invalid', async () => {
    mockRpc.mockResolvedValueOnce({ data: { valid: false }, error: null });
    const res = await GET(makeRequest('users/revyid', 'GET', 'rv_invalid'));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('Invalid API key');
  });

  it('allows valid user API key', async () => {
    mockRpc.mockResolvedValueOnce({ data: { valid: true, user_id: 'u1', rate_limit: 100 }, error: null });
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'site_settings') {
        return createChain({ data: { value: 'false' } });
      }
      if (table === 'api_key_usage') {
        const chain: any = {};
        chain.select = () => chain;
        chain.eq = () => chain;
        chain.gte = () => ({ count: 0 });
        chain.insert = () => chain;
        chain.update = () => chain;
        Object.defineProperty(chain, 'head', { get: () => chain });
        return chain;
      }
      return createChain({ error: null });
    });
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ login: 'revyid' }), { status: 200 })
    );
    const res = await GET(makeRequest('users/revyid', 'GET', 'rv_validkey'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.login).toBe('revyid');
  });

  it('allows site API key without rate limiting', async () => {
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'site_settings') {
        return createChain({ data: { value: 'rv_site_abc123' } });
      }
      return createChain({ error: null });
    });
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ login: 'revyid' }), { status: 200 })
    );
    const res = await GET(makeRequest('users/revyid', 'GET', 'rv_site_abc123'));
    expect(res.status).toBe(200);
    // Should NOT have called validate_api_key RPC (site key bypasses it)
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('allows users/{username}/repos', async () => {
    mockRpc.mockResolvedValueOnce({ data: { valid: true, user_id: 'u1', rate_limit: 100 }, error: null });
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'site_settings') return createChain({ data: { value: 'false' } });
      if (table === 'api_key_usage') {
        const chain: any = {};
        chain.select = () => chain;
        chain.eq = () => chain;
        chain.gte = () => ({ count: 0 });
        chain.insert = () => chain;
        chain.update = () => chain;
        Object.defineProperty(chain, 'head', { get: () => chain });
        return chain;
      }
      return createChain({ error: null });
    });
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify([{ name: 'repo1' }]), { status: 200 })
    );
    const res = await GET(makeRequest('users/revyid/repos', 'GET', 'rv_test'));
    expect(res.status).toBe(200);
  });

  it('allows repos/{owner}/{repo}', async () => {
    mockRpc.mockResolvedValueOnce({ data: { valid: true, user_id: 'u1', rate_limit: 100 }, error: null });
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'site_settings') return createChain({ data: { value: 'false' } });
      if (table === 'api_key_usage') {
        const chain: any = {};
        chain.select = () => chain;
        chain.eq = () => chain;
        chain.gte = () => ({ count: 0 });
        chain.insert = () => chain;
        chain.update = () => chain;
        Object.defineProperty(chain, 'head', { get: () => chain });
        return chain;
      }
      return createChain({ error: null });
    });
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ full_name: 'revyid/app' }), { status: 200 })
    );
    const res = await GET(makeRequest('repos/revyid/app', 'GET', 'rv_test'));
    expect(res.status).toBe(200);
  });

  it('sends Authorization header when GITHUB_TOKEN set', async () => {
    mockRpc.mockResolvedValueOnce({ data: { valid: true, user_id: 'u1', rate_limit: 100 }, error: null });
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'site_settings') return createChain({ data: { value: 'false' } });
      if (table === 'api_key_usage') {
        const chain: any = {};
        chain.select = () => chain;
        chain.eq = () => chain;
        chain.gte = () => ({ count: 0 });
        chain.insert = () => chain;
        chain.update = () => chain;
        Object.defineProperty(chain, 'head', { get: () => chain });
        return chain;
      }
      return createChain({ error: null });
    });
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 })
    );
    await GET(makeRequest('users/revyid', 'GET', 'rv_test'));
    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.headers['Authorization']).toBe('Bearer ghp_test');
  });

  it('sets cache-control header on success', async () => {
    mockRpc.mockResolvedValueOnce({ data: { valid: true, user_id: 'u1', rate_limit: 100 }, error: null });
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'site_settings') return createChain({ data: { value: 'false' } });
      if (table === 'api_key_usage') {
        const chain: any = {};
        chain.select = () => chain;
        chain.eq = () => chain;
        chain.gte = () => ({ count: 0 });
        chain.insert = () => chain;
        chain.update = () => chain;
        Object.defineProperty(chain, 'head', { get: () => chain });
        return chain;
      }
      return createChain({ error: null });
    });
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 })
    );
    const res = await GET(makeRequest('users/revyid', 'GET', 'rv_test'));
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=300');
  });

  it('returns 502 on github 500', async () => {
    mockRpc.mockResolvedValueOnce({ data: { valid: true, user_id: 'u1', rate_limit: 100 }, error: null });
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'site_settings') return createChain({ data: { value: 'false' } });
      if (table === 'api_key_usage') {
        const chain: any = {};
        chain.select = () => chain;
        chain.eq = () => chain;
        chain.gte = () => ({ count: 0 });
        chain.insert = () => chain;
        chain.update = () => chain;
        Object.defineProperty(chain, 'head', { get: () => chain });
        return chain;
      }
      return createChain({ error: null });
    });
    mockFetch.mockResolvedValueOnce(new Response('error', { status: 500 }));
    const res = await GET(makeRequest('users/revyid', 'GET', 'rv_test'));
    expect(res.status).toBe(502);
  });

  it('returns 404 passthrough on github 404', async () => {
    mockRpc.mockResolvedValueOnce({ data: { valid: true, user_id: 'u1', rate_limit: 100 }, error: null });
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'site_settings') return createChain({ data: { value: 'false' } });
      if (table === 'api_key_usage') {
        const chain: any = {};
        chain.select = () => chain;
        chain.eq = () => chain;
        chain.gte = () => ({ count: 0 });
        chain.insert = () => chain;
        chain.update = () => chain;
        Object.defineProperty(chain, 'head', { get: () => chain });
        return chain;
      }
      return createChain({ error: null });
    });
    mockFetch.mockResolvedValueOnce(new Response('not found', { status: 404 }));
    const res = await GET(makeRequest('users/nonexistent', 'GET', 'rv_test'));
    expect(res.status).toBe(404);
  });

  it('returns 502 on fetch throw', async () => {
    mockRpc.mockResolvedValueOnce({ data: { valid: true, user_id: 'u1', rate_limit: 100 }, error: null });
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'site_settings') return createChain({ data: { value: 'false' } });
      if (table === 'api_key_usage') {
        const chain: any = {};
        chain.select = () => chain;
        chain.eq = () => chain;
        chain.gte = () => ({ count: 0 });
        chain.insert = () => chain;
        chain.update = () => chain;
        Object.defineProperty(chain, 'head', { get: () => chain });
        return chain;
      }
      return createChain({ error: null });
    });
    mockFetch.mockRejectedValueOnce(new Error('network'));
    const res = await GET(makeRequest('users/revyid', 'GET', 'rv_test'));
    expect(res.status).toBe(502);
  });
});
