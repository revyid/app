import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '../../api/track';

function makeRequest(body: unknown, method = 'POST', headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/track', {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: method !== 'GET' ? JSON.stringify(body) : undefined,
  });
}

// Mock fetch for Supabase RPC call
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');
});

describe('POST /api/track', () => {
  it('returns 405 for non-POST', async () => {
    const res = await handler(makeRequest(null, 'GET'));
    expect(res.status).toBe(405);
  });

  it('returns 204 for OPTIONS preflight', async () => {
    const res = await handler(new Request('http://localhost/api/track', { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('returns 400 when event_type missing', async () => {
    const res = await handler(makeRequest({ event_data: {} }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe('Missing event_type');
  });

  it('returns 400 when event_type not string', async () => {
    const res = await handler(makeRequest({ event_type: 123 }));
    expect(res.status).toBe(400);
  });

  it('returns 500 when supabase env missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    const res = await handler(makeRequest({ event_type: 'page_view' }));
    expect(res.status).toBe(500);
  });

  it('forwards event to supabase rpc and returns ok', async () => {
    mockFetch.mockResolvedValueOnce(new Response('{}', { status: 200 }));

    const res = await handler(
      makeRequest(
        { event_type: 'page_view', event_data: { page: '/' } },
        'POST',
        { 'x-forwarded-for': '1.2.3.4', 'user-agent': 'TestAgent' }
      )
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain('/rpc/track_event');
    const sent = JSON.parse(opts.body);
    expect(sent.p_event_type).toBe('page_view');
    expect(sent.p_ip_address).toBe('1.2.3.4');
    expect(sent.p_user_agent).toBe('TestAgent');
  });

  it('extracts first IP from x-forwarded-for chain', async () => {
    mockFetch.mockResolvedValueOnce(new Response('{}', { status: 200 }));

    await handler(
      makeRequest(
        { event_type: 'click' },
        'POST',
        { 'x-forwarded-for': '10.0.0.1, 10.0.0.2, 10.0.0.3' }
      )
    );

    const sent = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(sent.p_ip_address).toBe('10.0.0.1');
  });

  it('returns 502 when supabase rpc fails', async () => {
    mockFetch.mockResolvedValueOnce(new Response('error', { status: 500 }));

    const res = await handler(makeRequest({ event_type: 'page_view' }));
    expect(res.status).toBe(502);
  });

  it('returns 500 on fetch throw', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network'));

    const res = await handler(makeRequest({ event_type: 'page_view' }));
    expect(res.status).toBe(500);
  });
});
