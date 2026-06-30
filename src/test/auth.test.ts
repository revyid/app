import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getStoredToken,
  storeToken,
  clearToken,
  login,
  logout,
  validateSession,
  register,
  oauthLogin,
} from '@/lib/auth';

const mockRpc = vi.fn();
const mockGetSupabase = vi.fn().mockResolvedValue({ rpc: mockRpc });

vi.mock('@/lib/supabase', () => ({
  getSupabase: (...args: any[]) => mockGetSupabase(...args),
  supabase: () => ({ rpc: mockRpc }),
}));

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  mockGetSupabase.mockResolvedValue({ rpc: mockRpc });
});

// ─── Token Storage ───────────────────────────────────────────────────

describe('token storage', () => {
  it('returns null when no token stored', () => {
    expect(getStoredToken()).toBeNull();
  });

  it('stores and retrieves token', () => {
    storeToken('tok_abc');
    expect(getStoredToken()).toBe('tok_abc');
  });

  it('clearToken removes token', () => {
    storeToken('tok_abc');
    clearToken();
    expect(getStoredToken()).toBeNull();
  });
});

// ─── Login ───────────────────────────────────────────────────────────

describe('login', () => {
  it('returns error on RPC failure', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'fail' } });
    const result = await login('a@b.com', 'pass');
    expect(result.error).toBe('fail');
    expect(getStoredToken()).toBeNull();
  });

  it('returns error from data payload', async () => {
    mockRpc.mockResolvedValueOnce({ data: { error: 'wrong password' }, error: null });
    const result = await login('a@b.com', 'pass');
    expect(result.error).toBe('wrong password');
  });

  it('stores token on success', async () => {
    mockRpc.mockResolvedValueOnce({
      data: { token: 'tok_123', user: { id: '1', email: 'a@b.com' } },
      error: null,
    });
    const result = await login('a@b.com', 'pass');
    expect(result.token).toBe('tok_123');
    expect(getStoredToken()).toBe('tok_123');
  });
});

// ─── Register ────────────────────────────────────────────────────────

describe('register', () => {
  it('returns error on failure', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'exists' } });
    const result = await register('a@b.com', 'pass');
    expect(result.error).toBe('exists');
  });

  it('stores token on success', async () => {
    mockRpc.mockResolvedValueOnce({
      data: { token: 'tok_reg', user: { id: '2' } },
      error: null,
    });
    const result = await register('a@b.com', 'pass', 'Test');
    expect(result.token).toBe('tok_reg');
    expect(getStoredToken()).toBe('tok_reg');
  });
});

// ─── OAuth Login ─────────────────────────────────────────────────────

describe('oauthLogin', () => {
  it('returns error on failure', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'oauth fail' } });
    const result = await oauthLogin('a@b.com', 'User', '', 'google', '123');
    expect(result.error).toBe('oauth fail');
  });

  it('stores token on success', async () => {
    mockRpc.mockResolvedValueOnce({
      data: { token: 'tok_oauth', user: { id: '3' } },
      error: null,
    });
    const result = await oauthLogin('a@b.com', 'User', '', 'github', '456');
    expect(result.token).toBe('tok_oauth');
  });
});

// ─── Validate Session ────────────────────────────────────────────────

describe('validateSession', () => {
  it('returns error when no token', async () => {
    const result = await validateSession();
    expect(result.error).toBe('No session');
  });

  it('validates stored token', async () => {
    storeToken('tok_val');
    mockRpc.mockResolvedValueOnce({
      data: { user: { id: '1' } },
      error: null,
    });
    const result = await validateSession();
    expect(result.user).toEqual({ id: '1' });
    expect(mockRpc).toHaveBeenCalledWith('validate_session', { p_token: 'tok_val' });
  });
});

// ─── Logout ──────────────────────────────────────────────────────────

describe('logout', () => {
  it('clears token', async () => {
    storeToken('tok_log');
    mockRpc.mockResolvedValueOnce({ data: null, error: null });
    await logout();
    expect(getStoredToken()).toBeNull();
  });
});
