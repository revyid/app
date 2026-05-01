import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '../../api/github';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('GITHUB_TOKEN', 'ghp_test');
});

function makeRequest(path: string | null, method = 'GET') {
  const url = path
    ? `http://localhost/api/github?path=${encodeURIComponent(path)}`
    : 'http://localhost/api/github';
  return new Request(url, { method });
}

describe('GET /api/github', () => {
  it('returns 405 for non-GET', async () => {
    const res = await handler(makeRequest('users/revyid', 'POST'));
    expect(res.status).toBe(405);
  });

  it('returns 204 for OPTIONS', async () => {
    const res = await handler(new Request('http://localhost/api/github', { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('returns 400 when path missing', async () => {
    const res = await handler(makeRequest(null));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain('path');
  });

  it('returns 403 for disallowed path', async () => {
    const res = await handler(makeRequest('admin/users'));
    expect(res.status).toBe(403);
  });

  it('returns 403 for path traversal attempt', async () => {
    const res = await handler(makeRequest('../etc/passwd'));
    expect(res.status).toBe(403);
  });

  it('allows users/{username}', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ login: 'revyid' }), { status: 200 })
    );
    const res = await handler(makeRequest('users/revyid'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.login).toBe('revyid');
  });

  it('allows users/{username}/repos', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify([{ name: 'repo1' }]), { status: 200 })
    );
    const res = await handler(makeRequest('users/revyid/repos'));
    expect(res.status).toBe(200);
  });

  it('allows repos/{owner}/{repo}', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ full_name: 'revyid/app' }), { status: 200 })
    );
    const res = await handler(makeRequest('repos/revyid/app'));
    expect(res.status).toBe(200);
  });

  it('sends Authorization header when GITHUB_TOKEN set', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 })
    );
    await handler(makeRequest('users/revyid'));
    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.headers['Authorization']).toBe('Bearer ghp_test');
  });

  it('sets cache-control header on success', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 })
    );
    const res = await handler(makeRequest('users/revyid'));
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=300');
  });

  it('returns 502 on github 500', async () => {
    mockFetch.mockResolvedValueOnce(new Response('error', { status: 500 }));
    const res = await handler(makeRequest('users/revyid'));
    expect(res.status).toBe(502);
  });

  it('returns 404 passthrough on github 404', async () => {
    mockFetch.mockResolvedValueOnce(new Response('not found', { status: 404 }));
    const res = await handler(makeRequest('users/nonexistent'));
    expect(res.status).toBe(404);
  });

  it('returns 502 on fetch throw', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network'));
    const res = await handler(makeRequest('users/revyid'));
    expect(res.status).toBe(502);
  });
});
