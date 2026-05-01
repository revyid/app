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

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

import { supabase } from '@/lib/supabase';
const mockRpc = vi.mocked(supabase.rpc);

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
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

// ─── login ───────────────────────────────────────────────────────────

describe('login', () => {
  it('returns token + user on success, stores token', async () => {
    mockRpc.mockResolvedValueOnce({
      data: { token: 'tok_123', user: { id: '1', email: 'a@b.com' } },
      error: null,
    } as any);

    const result = await login('a@b.com', 'pass');

    expect(result.token).toBe('tok_123');
    expect(result.user).toMatchObject({ email: 'a@b.com' });
    expect(getStoredToken()).toBe('tok_123');
  });

  it('returns error on supabase error', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid credentials' },
    } as any);

    const result = await login('a@b.com', 'wrong');

    expect(result.error).toBe('Invalid credentials');
    expect(getStoredToken()).toBeNull();
  });

  it('returns error from data.error field', async () => {
    mockRpc.mockResolvedValueOnce({
      data: { error: 'User not found' },
      error: null,
    } as any);

    const result = await login('a@b.com', 'pass');

    expect(result.error).toBe('User not found');
  });
});

// ─── register ────────────────────────────────────────────────────────

describe('register', () => {
  it('returns token + user on success', async () => {
    mockRpc.mockResolvedValueOnce({
      data: { token: 'tok_new', user: { id: '2', email: 'new@b.com' } },
      error: null,
    } as any);

    const result = await register('new@b.com', 'pass', 'New User');

    expect(result.token).toBe('tok_new');
    expect(getStoredToken()).toBe('tok_new');
  });

  it('returns error on failure', async () => {
    mockRpc.mockResolvedValueOnce({
      data: { error: 'Email already exists' },
      error: null,
    } as any);

    const result = await register('dup@b.com', 'pass');

    expect(result.error).toBe('Email already exists');
  });
});

// ─── oauthLogin ──────────────────────────────────────────────────────

describe('oauthLogin', () => {
  it('stores token on success', async () => {
    mockRpc.mockResolvedValueOnce({
      data: { token: 'tok_oauth', user: { id: '3', email: 'g@gmail.com' } },
      error: null,
    } as any);

    const result = await oauthLogin('g@gmail.com', 'Google User', 'https://avatar', 'google', 'gid_123');

    expect(result.token).toBe('tok_oauth');
    expect(getStoredToken()).toBe('tok_oauth');
  });
});

// ─── logout ──────────────────────────────────────────────────────────

describe('logout', () => {
  it('clears token regardless of rpc result', async () => {
    storeToken('tok_existing');
    mockRpc.mockResolvedValueOnce({ data: null, error: null } as any);

    await logout();

    expect(getStoredToken()).toBeNull();
  });

  it('clears token even if rpc throws', async () => {
    storeToken('tok_existing');
    mockRpc.mockRejectedValueOnce(new Error('network'));

    await logout();

    expect(getStoredToken()).toBeNull();
  });

  it('no rpc call when no token stored', async () => {
    await logout();
    expect(mockRpc).not.toHaveBeenCalled();
  });
});

// ─── validateSession ─────────────────────────────────────────────────

describe('validateSession', () => {
  it('returns error when no token', async () => {
    const result = await validateSession();
    expect(result.error).toBe('No session');
  });

  it('uses stored token when none passed', async () => {
    storeToken('tok_stored');
    mockRpc.mockResolvedValueOnce({
      data: { user: { id: '1', email: 'a@b.com' } },
      error: null,
    } as any);

    const result = await validateSession();

    expect(result.token).toBe('tok_stored');
    expect(result.user).toMatchObject({ email: 'a@b.com' });
  });

  it('uses explicit token over stored', async () => {
    storeToken('tok_stored');
    mockRpc.mockResolvedValueOnce({
      data: { user: { id: '1', email: 'a@b.com' } },
      error: null,
    } as any);

    const result = await validateSession('tok_explicit');

    expect(result.token).toBe('tok_explicit');
    expect(mockRpc).toHaveBeenCalledWith('validate_session', { p_token: 'tok_explicit' });
  });

  it('returns error on invalid session', async () => {
    storeToken('tok_bad');
    mockRpc.mockResolvedValueOnce({
      data: { error: 'Session expired' },
      error: null,
    } as any);

    const result = await validateSession();

    expect(result.error).toBe('Session expired');
  });
});
