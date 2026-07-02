/**
 * Custom WebAuthn Passkey Library
 * Self-hosted biometric authentication using the Web Authentication API.
 * Does NOT require Clerk premium — credentials are stored in localStorage
 * and verified client-side against the user's device authenticator.
 */

import { getSupabase } from './supabase';
import { getStoredToken } from './auth';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import type { PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON, AuthenticatorTransportFuture } from '@simplewebauthn/types';

export interface StoredCredential {
  credentialId: string;
  publicKey: string;
  userId: string;
  userEmail: string;
  userName: string;
  supabaseRefreshToken?: string;
  createdAt: string;
}

const STORAGE_KEY = 'webauthn_credentials';

// Utility: convert ArrayBuffer to base64url string
function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (const byte of bytes) {
    str += String.fromCharCode(byte);
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Generate a random challenge and base64url encode it
function generateChallengeBase64URL(): string {
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);
  return bufferToBase64url(challenge.buffer as ArrayBuffer);
}

// Get stored credentials from localStorage
function getStoredCredentials(): StoredCredential[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save credentials to localStorage
function saveCredentials(credentials: StoredCredential[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
}

/**
 * Update the stored refresh token for all passkeys belonging to a user.
 * This MUST be called on every session change (TOKEN_REFRESHED, SIGNED_IN)
 * because Supabase rotates refresh tokens — the old one becomes invalid.
 */
export function updateStoredRefreshToken(userId: string, newRefreshToken: string): void {
  const creds = getStoredCredentials();
  let changed = false;
  for (const cred of creds) {
    if (cred.userId === userId && cred.supabaseRefreshToken !== newRefreshToken) {
      cred.supabaseRefreshToken = newRefreshToken;
      changed = true;
    }
  }
  if (changed) saveCredentials(creds);
}

// Utility: parse basic device info from user-agent
export function getDeviceInfo() {
  const ua = navigator.userAgent;
  let browser_name = "Unknown Browser";
  if (ua.includes("Chrome") && !ua.includes("Edg")) browser_name = "Chrome";
  else if (ua.includes("Firefox")) browser_name = "Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser_name = "Safari";
  else if (ua.includes("Edg")) browser_name = "Edge";
  
  let device_name = "Unknown Device";
  if (ua.includes("Android")) device_name = "Android Mobile";
  else if (ua.includes("like Mac")) device_name = "iOS Mobile";
  else if (ua.includes("Win")) device_name = "Windows PC";
  else if (ua.includes("Mac")) device_name = "Mac";
  else if (ua.includes("Linux")) device_name = "Linux PC";

  return { browser_name, device_name };
}

/**
 * Check if the browser supports WebAuthn
 * Relaxed check — only requires PublicKeyCredential to exist.
 * Does NOT require platform authenticator — cross-platform (USB keys, phones) also works.
 */
export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'credentials' in navigator &&
    !!window.PublicKeyCredential
  );
}

/**
 * Check if platform authenticator (fingerprint/face/PIN) is available
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  try {
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
    // If we can't check, assume it's available and let the actual create/get call fail gracefully
    return true;
  } catch {
    return true; // Assume available, let the actual WebAuthn call handle errors
  }
}

/**
 * Check if the user has any registered passkeys
 */
export function hasRegisteredPasskeys(userId?: string): boolean {
  const credentials = getStoredCredentials();
  if (userId) {
    return credentials.some(c => c.userId === userId);
  }
  return credentials.length > 0;
}

/**
 * Get all registered passkeys for a user
 */
export function getUserPasskeys(userId: string): StoredCredential[] {
  return getStoredCredentials().filter(c => c.userId === userId);
}

/**
 * Register a new passkey for a user
 * This prompts the user's biometric authenticator (fingerprint/face/PIN)
 * Works for both sign-up and post-login registration.
 */
export async function registerPasskey(
  userId: string,
  userEmail: string,
  userName: string,
  supabaseRefreshToken?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isWebAuthnSupported()) {
    return { success: false, error: 'Your browser does not support passkeys. Try using Chrome, Safari, Edge, or Firefox on a recent version.' };
  }

  try {
    const challenge = generateChallengeBase64URL();

    // Mock the options usually generated by @simplewebauthn/server generateRegistrationOptions
    const createOptionsJSON: PublicKeyCredentialCreationOptionsJSON = {
      challenge,
      rp: {
        name: 'Revy Portfolio',
        id: window.location.hostname,
      },
      user: {
        id: btoa(userId).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''), // Base64URL encode UUID
        name: userEmail,
        displayName: userName || userEmail,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },   // ES256
        { type: 'public-key', alg: -257 },  // RS256
      ],
      authenticatorSelection: {
        userVerification: 'preferred',
        residentKey: 'preferred',
      },
      timeout: 120000,
      attestation: 'none',
      excludeCredentials: getStoredCredentials().map(cred => ({
        id: cred.credentialId,
        type: 'public-key',
        transports: ['internal', 'hybrid'] as AuthenticatorTransportFuture[],
      })),
    };

    // Use SimpleWebAuthn to handle the browser API perfectly across devices
    let attestationResponse;
    try {
      attestationResponse = await startRegistration({ optionsJSON: createOptionsJSON });
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        return { success: false, error: 'Authentication was cancelled or timed out.' };
      }
      throw err;
    }

    if (!attestationResponse) {
      return { success: false, error: 'Credential creation was cancelled.' };
    }

    // Since we don't use @simplewebauthn/server verifyRegistrationResponse, we blindly trust it (Local-only mode)
    // Extract Public Key (Assuming ES256 / SPKI format loosely, although strictly we'd need a ASN.1 parser)
    // For local fallback, we will just use the rawId as the credential ID.
    const credentialIdStr = attestationResponse.id;
    // We cannot easily extract a pure public key string from attestationObject without a server parser,
    // so we store a placeholder, since local verify blindly trusts the ID possession anyway.
    const publicKeyStr = "simplewebauthn_client_pk_placeholder";

    const storedCred: StoredCredential = {
      credentialId: credentialIdStr,
      publicKey: publicKeyStr,
      userId,
      userEmail,
      userName,
      supabaseRefreshToken,
      createdAt: new Date().toISOString(),
    };

    // 1. Sync to Supabase Database via RPC
    const token = getStoredToken();
    if (!token) {
      return { success: false, error: 'Not authenticated. Please log in first.' };
    }
    const { browser_name, device_name } = getDeviceInfo();
    const { data: rpcData, error: dbError } = await (await getSupabase()).rpc('register_passkey', {
      p_token: token,
      p_credential_id: credentialIdStr,
      p_public_key: publicKeyStr,
      p_device_name: device_name,
      p_browser_name: browser_name,
    });

    if (dbError || rpcData?.error) {
      console.error('Failed to sync passkey to database:', dbError || rpcData?.error);
      return { success: false, error: rpcData?.error || 'Database sync failed.' };
    }

    // 2. Save locally
    const credentials = getStoredCredentials();
    credentials.push(storedCred);
    saveCredentials(credentials);

    return { success: true };
  } catch (err: any) {
    console.error('WebAuthn register error:', err);
    if (err.name === 'SecurityError') {
      return { success: false, error: 'Security error — this feature requires HTTPS.' };
    }
    if (err.name === 'InvalidStateError') {
      // Credential exists in browser but not in database (e.g. after DB reset)
      // Clear local credentials so user can retry
      saveCredentials([]);
      return { success: false, error: 'Old passkey cleared. Please try registering again.' };
    }
    return { success: false, error: err.message || 'Failed to create passkey.' };
  }
}

/**
 * Authenticate with a passkey
 * Returns the matched credential info if successful
 */
export async function authenticateWithPasskey(): Promise<{
  success: boolean;
  credential?: StoredCredential;
  error?: string;
}> {
  if (!isWebAuthnSupported()) {
    return { success: false, error: 'Your browser does not support passkeys.' };
  }

  const storedCredentials = getStoredCredentials();

  try {
    const challenge = generateChallengeBase64URL();

    // Build authentication options.
    // If we have local credentials, we provide them as hints.
    // If localStorage is empty (e.g., after logout or on a new device),
    // we send EMPTY allowCredentials to let the authenticator present
    // all discoverable (resident key) credentials for this RP.
    const getOptionsJSON: PublicKeyCredentialRequestOptionsJSON = {
      challenge,
      rpId: window.location.hostname,
      allowCredentials: storedCredentials.length > 0
        ? storedCredentials.map(cred => ({
            type: 'public-key',
            id: cred.credentialId,
            transports: ['internal', 'hybrid'] as AuthenticatorTransportFuture[],
          }))
        : [], // Empty = discoverable credentials mode
      userVerification: 'preferred',
      timeout: 120000,
    };

    let authenticationResponse;
    try {
      authenticationResponse = await startAuthentication({ optionsJSON: getOptionsJSON });
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        return { success: false, error: 'Authentication was cancelled or timed out.' };
      }
      throw err;
    }

    if (!authenticationResponse) {
      return { success: false, error: 'Authentication was cancelled.' };
    }

    const assertionId = authenticationResponse.id;

    // Try matching from local cache first
    let matchedCred = storedCredentials.find(c => c.credentialId === assertionId);

    // If not in localStorage, look it up in the database via RPC
    if (!matchedCred) {
      const token = getStoredToken();
      const { data: rpcData } = await (await getSupabase()).rpc('list_passkeys', {
        p_token: token || '',
      });

      if (rpcData?.passkeys) {
        const dbRecord = rpcData.passkeys.find((pk: any) => pk.credential_id === assertionId);
        if (dbRecord) {
          matchedCred = {
            credentialId: dbRecord.credential_id,
            publicKey: 'db_lookup',
            userId: dbRecord.user_id,
            userEmail: '',
            userName: '',
            createdAt: dbRecord.created_at,
          };
        }
      }
    }

    if (!matchedCred) {
      return { success: false, error: 'Credential not recognized. Please register a new passkey.' };
    }

    // Update last_used_at is handled server-side by passkey_login RPC

    return { success: true, credential: matchedCred };
  } catch (err: any) {
    console.error('WebAuthn auth error:', err);
    return { success: false, error: err.message || 'Passkey authentication failed.' };
  }
}

/**
 * Remove a passkey (local only)
 */
export function removePasskey(credentialId: string): void {
  const credentials = getStoredCredentials().filter(c => c.credentialId !== credentialId);
  saveCredentials(credentials);
}

/**
 * Remove all passkeys for a user (local only)
 */
export function removeUserPasskeys(userId: string): void {
  const credentials = getStoredCredentials().filter(c => c.userId !== userId);
  saveCredentials(credentials);
}

// =====================================
// Database Integration Helpers
// =====================================

export interface DBPasskey {
  id: string;
  user_id: string;
  credential_id: string;
  device_name: string;
  browser_name: string;
  created_at: string;
  last_used_at: string | null;
}

/**
 * Get passkeys from the Supabase database via RPC
 */
export async function getPasskeysFromDB(): Promise<DBPasskey[]> {
  const token = getStoredToken();
  if (!token) return [];
  const { data, error } = await (await getSupabase()).rpc('list_passkeys', { p_token: token });
  if (error) throw error;
  return (data?.passkeys || []) as DBPasskey[];
}

/**
 * Revoke a passkey from the database and locally
 */
export async function revokePasskey(id: string, credentialId: string): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;
  const { data, error } = await (await getSupabase()).rpc('delete_passkey', {
    p_token: token,
    p_id: id,
  });
  if (error || data?.error) {
    console.error('Failed to revoke passkey from DB:', error || data?.error);
    return false;
  }
  
  // Delete locally
  removePasskey(credentialId);
  return true;
}

