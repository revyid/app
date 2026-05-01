import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isWebAuthnSupported,
  hasRegisteredPasskeys,
  getUserPasskeys,
  removePasskey,
  removeUserPasskeys,
  updateStoredRefreshToken,
  getDeviceInfo,
} from '@/lib/webauthn';

// Mock supabase — webauthn uses it for DB sync
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
      update: vi.fn().mockReturnThis(),
      then: vi.fn(),
    })),
  },
}));

// Mock @simplewebauthn/browser
vi.mock('@simplewebauthn/browser', () => ({
  startRegistration: vi.fn(),
  startAuthentication: vi.fn(),
}));

const STORAGE_KEY = 'webauthn_credentials';

function seedCredentials(creds: object[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

// ─── isWebAuthnSupported ─────────────────────────────────────────────

describe('isWebAuthnSupported', () => {
  it('returns true when PublicKeyCredential exists', () => {
    // jsdom exposes window.PublicKeyCredential as undefined by default
    // Patch it to simulate supported browser
    Object.defineProperty(window, 'PublicKeyCredential', {
      value: class {},
      configurable: true,
    });
    Object.defineProperty(navigator, 'credentials', {
      value: {},
      configurable: true,
    });
    expect(isWebAuthnSupported()).toBe(true);
  });
});

// ─── hasRegisteredPasskeys ───────────────────────────────────────────

describe('hasRegisteredPasskeys', () => {
  it('returns false when no credentials stored', () => {
    expect(hasRegisteredPasskeys()).toBe(false);
  });

  it('returns true when credentials exist', () => {
    seedCredentials([{ credentialId: 'cred1', userId: 'u1' }]);
    expect(hasRegisteredPasskeys()).toBe(true);
  });

  it('returns true for specific userId', () => {
    seedCredentials([{ credentialId: 'cred1', userId: 'u1' }]);
    expect(hasRegisteredPasskeys('u1')).toBe(true);
  });

  it('returns false for different userId', () => {
    seedCredentials([{ credentialId: 'cred1', userId: 'u1' }]);
    expect(hasRegisteredPasskeys('u2')).toBe(false);
  });
});

// ─── getUserPasskeys ─────────────────────────────────────────────────

describe('getUserPasskeys', () => {
  it('returns only passkeys for given userId', () => {
    seedCredentials([
      { credentialId: 'cred1', userId: 'u1' },
      { credentialId: 'cred2', userId: 'u2' },
      { credentialId: 'cred3', userId: 'u1' },
    ]);
    const result = getUserPasskeys('u1');
    expect(result).toHaveLength(2);
    expect(result.every(c => c.userId === 'u1')).toBe(true);
  });

  it('returns empty array when no passkeys for user', () => {
    expect(getUserPasskeys('u99')).toEqual([]);
  });
});

// ─── removePasskey ───────────────────────────────────────────────────

describe('removePasskey', () => {
  it('removes credential by id', () => {
    seedCredentials([
      { credentialId: 'cred1', userId: 'u1' },
      { credentialId: 'cred2', userId: 'u1' },
    ]);
    removePasskey('cred1');
    expect(hasRegisteredPasskeys('u1')).toBe(true);
    expect(getUserPasskeys('u1').find(c => c.credentialId === 'cred1')).toBeUndefined();
  });

  it('no-op when credential not found', () => {
    seedCredentials([{ credentialId: 'cred1', userId: 'u1' }]);
    removePasskey('nonexistent');
    expect(getUserPasskeys('u1')).toHaveLength(1);
  });
});

// ─── removeUserPasskeys ──────────────────────────────────────────────

describe('removeUserPasskeys', () => {
  it('removes all passkeys for user', () => {
    seedCredentials([
      { credentialId: 'cred1', userId: 'u1' },
      { credentialId: 'cred2', userId: 'u1' },
      { credentialId: 'cred3', userId: 'u2' },
    ]);
    removeUserPasskeys('u1');
    expect(hasRegisteredPasskeys('u1')).toBe(false);
    expect(hasRegisteredPasskeys('u2')).toBe(true);
  });
});

// ─── updateStoredRefreshToken ────────────────────────────────────────

describe('updateStoredRefreshToken', () => {
  it('updates refresh token for all user credentials', () => {
    seedCredentials([
      { credentialId: 'cred1', userId: 'u1', supabaseRefreshToken: 'old_tok' },
      { credentialId: 'cred2', userId: 'u1', supabaseRefreshToken: 'old_tok' },
      { credentialId: 'cred3', userId: 'u2', supabaseRefreshToken: 'other_tok' },
    ]);

    updateStoredRefreshToken('u1', 'new_tok');

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.find((c: any) => c.credentialId === 'cred1').supabaseRefreshToken).toBe('new_tok');
    expect(stored.find((c: any) => c.credentialId === 'cred2').supabaseRefreshToken).toBe('new_tok');
    // u2 untouched
    expect(stored.find((c: any) => c.credentialId === 'cred3').supabaseRefreshToken).toBe('other_tok');
  });

  it('no write when token unchanged', () => {
    seedCredentials([
      { credentialId: 'cred1', userId: 'u1', supabaseRefreshToken: 'same_tok' },
    ]);
    const setSpy = vi.spyOn(Storage.prototype, 'setItem');
    updateStoredRefreshToken('u1', 'same_tok');
    expect(setSpy).not.toHaveBeenCalled();
  });
});

// ─── getDeviceInfo ───────────────────────────────────────────────────

describe('getDeviceInfo', () => {
  it('returns browser_name and device_name strings', () => {
    const info = getDeviceInfo();
    expect(info).toHaveProperty('browser_name');
    expect(info).toHaveProperty('device_name');
    expect(typeof info.browser_name).toBe('string');
    expect(typeof info.device_name).toBe('string');
  });
});
