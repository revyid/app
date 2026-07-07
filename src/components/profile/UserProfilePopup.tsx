import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { getSupabase } from '@/lib/supabase';
import { getStoredToken, updateProfile, getUserSessions, revokeSession } from '@/lib/auth';
import {
  X,
  LogOut,
  Mail,
  Calendar,
  Key,
  User as UserIcon,
  Pencil,
  Check,
  Fingerprint,
  Trash2,
  MonitorSmartphone,
} from 'lucide-react';
import { bottomSheetContent, modalBackdrop, SPRING_DEFAULT } from '@/lib/motion-presets';
import { BottomSheet } from '@/components/shared/BottomSheet';
import { ThemeSelector } from '@/components/shared/ThemeSelector';
import { Button, IconButton } from '@/components/ui/button';
import { MorphIcon } from '@/components/ui/morph-icon';
import { registerPasskey, isWebAuthnSupported, getPasskeysFromDB, revokePasskey, type DBPasskey } from '@/lib/webauthn';

interface UserProfilePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginRequest?: () => void;
}

export function UserProfilePopup({ isOpen, onClose, onLoginRequest }: UserProfilePopupProps) {
  const { user, signOut, refreshUser } = useAuth();

  const initialName = user?.display_name || '';

  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(initialName);
  const [isSaving, setIsSaving] = useState(false);
  const [showTheme, setShowTheme] = useState(true);
  const [passkeyStatus, setPasskeyStatus] = useState('');
  const [dbPasskeys, setDbPasskeys] = useState<DBPasskey[]>([]);
  const [isFetchingPasskeys, setIsFetchingPasskeys] = useState(false);
  
  // Device Tracker state
  const [dbDevices, setDbDevices] = useState<any[]>([]);
  const [isFetchingDevices, setIsFetchingDevices] = useState(false);

  useEffect(() => {
    if (!user || !isOpen) return;

    // Initial fetch
    setIsFetchingPasskeys(true);
    getPasskeysFromDB()
      .then(setDbPasskeys)
      .catch(console.error)
      .finally(() => setIsFetchingPasskeys(false));

    setIsFetchingDevices(true);
    const fetchDevices = async () => {
      try {
        const sessions = await getUserSessions();
        setDbDevices(sessions || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsFetchingDevices(false);
      }
    };
    fetchDevices();

    // -------- Realtime Subscriptions --------
    let passkeysChannel: any;
    let devicesChannel: any;
    let cancelled = false;

    getSupabase().then(client => {
      if (cancelled) return;

      passkeysChannel = client.channel(`profile-passkeys-rt-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_passkeys', filter: `user_id=eq.${user.id}` },
          () => {
            getPasskeysFromDB().then(setDbPasskeys).catch(console.error);
          }
        )
        .subscribe();

      devicesChannel = client.channel(`profile-devices-rt-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'app_sessions', filter: `user_id=eq.${user.id}` },
          () => {
            getUserSessions().then(s => setDbDevices(s || []));
          }
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (passkeysChannel) getSupabase().then(c => c.removeChannel(passkeysChannel));
      if (devicesChannel) getSupabase().then(c => c.removeChannel(devicesChannel));
    };
  }, [user, isOpen]);

  const joinDate = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  }) : '';

  const avatarUrl = user?.avatar_url || (user ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.display_name || user.email || 'U')}&background=random` : '');
  const fullName = user?.display_name || user?.email || 'Guest User';

  // ==========================================
  // Profile Editing
  // ==========================================
  const startEditName = () => {
    if (!user) return;
    setEditName(user.display_name || '');
    setIsEditingName(true);
  };

  const saveName = async () => {
    setIsSaving(true);
    try {
      const result = await updateProfile(editName || undefined);
      if (result.error) throw new Error(result.error);
      await refreshUser();
      setIsEditingName(false);
    } catch (err) {
      console.error('Error updating name:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // Passkey Registration
  // ==========================================
  const registerNewPasskey = async () => {
    const token = getStoredToken();
    if (!token) {
      setPasskeyStatus('Session expired. Please log in again.');
      setTimeout(() => setPasskeyStatus(''), 4000);
      return;
    }

    if (!isWebAuthnSupported()) {
      setPasskeyStatus('Passkeys not supported on this device.');
      setTimeout(() => setPasskeyStatus(''), 4000);
      return;
    }

    if (!user) return;

    setPasskeyStatus('Registering...');
    try {
      const result = await registerPasskey(
        user.id,
        user.email || '',
        fullName,
        token
      );

      if (result.success) {
        setPasskeyStatus('Passkey registered successfully! ✓');
        getPasskeysFromDB().then(setDbPasskeys).catch(console.error);
      } else {
        setPasskeyStatus(result.error || 'Failed to register passkey.');
      }
      setTimeout(() => setPasskeyStatus(''), 4000);
    } catch (err: any) {
      console.error('Passkey registration error:', err);
      setPasskeyStatus('Failed to register passkey.');
      setTimeout(() => setPasskeyStatus(''), 4000);
    }
  };

  const handleRevokePasskey = async (id: string, credentialId: string) => {
    try {
      // Optimistic update
      setDbPasskeys(prev => prev.filter(p => p.id !== id));
      await revokePasskey(id, credentialId);
    } catch (err) {
      console.error('Revoke failed', err);
      getPasskeysFromDB().then(setDbPasskeys).catch(console.error);
    }
  };

  const handleRevokeDevice = async (id: string) => {
    try {
      setDbDevices(prev => prev.filter(d => d.id !== id));
      await revokeSession(id);
    } catch (err) {
      console.error('Failed to revoke device', err);
      const sessions = await getUserSessions();
      setDbDevices(sessions || []);
    }
  };

  const linkedProviders = user?.linked_providers || [];
  const primaryProvider = user?.provider || 'email';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 popup-backdrop z-[60]"
          />

          {/* Bottom Sheet Profile */}
          <motion.div
            variants={bottomSheetContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed bottom-0 left-0 right-0 sm:left-4 sm:bottom-4 sm:w-[420px] sm:max-w-[calc(100vw-2rem)] z-[60]"
          >
            <BottomSheet onClose={onClose}>
              <div className="bg-surface dark:bg-surface border border-outline/20 rounded-t-[28px] sm:rounded-[28px] shadow-elevation-5 overflow-hidden noise-grain max-h-[85vh] overflow-y-auto scrollbar-thin" data-lenis-prevent>
                <div className="pt-2.5 pb-1 flex justify-center cursor-grab active:cursor-grabbing"><div className="sheet-handle" /></div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-outline/20">
                <h3 className="font-semibold text-foreground text-title-sm">Account Settings</h3>
                <IconButton
                  onClick={onClose}
                  variant="ghost"
                  className="rounded-full bg-surface-variant hover:bg-surface-variant/80"
                >
                  <X className="w-5 h-5" />
                </IconButton>
              </div>

              {/* Profile Header */}
              <div className="p-6">
                <div className="flex items-center gap-4 mb-8">
                  {/* Avatar */}
                  <div className="relative group">
                    {user ? (
                      <img
                        src={avatarUrl}
                        alt={fullName}
                        className="w-16 h-16 rounded-full object-cover ring-2 ring-outline/20"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-surface-variant text-muted-foreground flex items-center justify-center ring-2 ring-outline/20">
                        <UserIcon className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  {/* Name with edit */}
                  <div className="flex-1">
                    {isEditingName ? (
                      <div className="flex flex-col gap-2">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Display name"
                          className="px-3 py-1.5 text-body-md bg-surface-variant border border-outline/30 rounded-lg text-foreground outline-none focus:border-primary"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={saveName}
                            disabled={isSaving}
                            variant="filled"
                            size="sm"
                          >
                            <Check className="w-3.5 h-3.5" /> Save
                          </Button>
                          <Button
                            onClick={() => setIsEditingName(false)}
                            variant="text"
                            size="sm"
                            className="text-muted-foreground"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h2 className="text-title-lg font-bold text-foreground">
                          {fullName}
                        </h2>
                        {user && (
                          <IconButton
                            onClick={startEditName}
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground"
                          >
                            <Pencil className="w-4 h-4" />
                          </IconButton>
                        )}
                      </div>
                    )}
                    {user ? (
                      <div className="flex items-center gap-1.5 text-muted-foreground text-label-md mt-1">
                        <Mail className="w-3.5 h-3.5" />
                        {user.email}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-muted-foreground text-label-md mt-1">
                        Not signed in
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {/* User-specific sections */}
                  {user ? (
                    <>
                      {/* Account Details */}
                      <div className="space-y-3">
                        <h4 className="text-label-sm font-semibold text-primary uppercase tracking-wider">
                          Account Info
                        </h4>
                        <div className="p-4 bg-surface-variant/50 rounded-2xl space-y-4 border border-outline/10">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-surface text-primary flex items-center justify-center font-medium shadow-sm">
                              <UserIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-label-sm text-muted-foreground">User ID</p>
                              <p className="text-body-sm font-mono text-foreground truncate max-w-[200px]">
                                {user.id}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-surface text-primary flex items-center justify-center font-medium shadow-sm">
                              <Calendar className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-label-sm text-muted-foreground">Joined</p>
                              <p className="text-body-sm text-foreground">{joinDate}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-surface text-primary flex items-center justify-center font-medium shadow-sm">
                              <Key className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-label-sm text-muted-foreground">Sign In Methods</p>
                              <div className="flex items-center gap-2">
                                {linkedProviders.length > 0 ? (
                                  linkedProviders.map((lp: { provider: string }) => (
                                    <span key={lp.provider} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-label-sm capitalize">
                                      {lp.provider === 'google' && <svg className="w-3 h-3" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>}
                                      {lp.provider === 'github' && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>}
                                      {lp.provider}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-body-sm text-foreground capitalize">{primaryProvider}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Active Sessions (Device Tracking) */}
                      <div className="space-y-3 mt-6">
                        <h4 className="text-label-sm font-semibold text-primary uppercase tracking-wider">
                          Active Sessions
                        </h4>
                        <div className="p-4 bg-surface-variant/50 rounded-2xl border border-outline/10 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-surface text-primary flex items-center justify-center font-medium shadow-sm">
                                <MonitorSmartphone className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-body-sm font-medium text-foreground">Logged-in Devices</p>
                                <p className="text-label-sm text-muted-foreground">
                                  {isFetchingDevices ? 'Loading...' : `${dbDevices.length} active`}
                                </p>
                              </div>
                            </div>
                          </div>

                          {dbDevices.length > 0 && (
                            <div className="space-y-2 mt-2 pt-2 border-t border-outline/10">
                              {dbDevices.map((dev) => (
                                <div key={dev.id} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-outline/5">
                                  <div>
                                    <p className="text-body-sm font-medium text-foreground">{dev.device_name}</p>
                                    <p className="text-label-sm text-muted-foreground flex items-center gap-2">
                                      <span>{dev.browser_name}</span>
                                      <span>&bull;</span>
                                      <span>Last active: {new Date(dev.last_active_at).toLocaleDateString()}</span>
                                    </p>
                                  </div>
                                  <IconButton
                                    onClick={() => handleRevokeDevice(dev.id)}
                                    variant="ghost"
                                    size="icon-sm"
                                    className="text-error hover:text-error hover:bg-error/10"
                                    title="Log Out Device"
                                  >
                                    <LogOut className="w-4 h-4" />
                                  </IconButton>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Passkey Management */}
                      <div className="space-y-3 mt-6">
                        <h4 className="text-label-sm font-semibold text-primary uppercase tracking-wider">
                          Authorized Devices (Passkeys)
                        </h4>
                        <div className="p-4 bg-surface-variant/50 rounded-2xl border border-outline/10 space-y-4">
                          {/* Header Row */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-surface text-primary flex items-center justify-center font-medium shadow-sm">
                                <Fingerprint className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-body-sm font-medium text-foreground">Passkeys</p>
                                <p className="text-label-sm text-muted-foreground">
                                  {isFetchingPasskeys ? 'Loading...' : dbPasskeys.length > 0
                                    ? `${dbPasskeys.length} connected`
                                    : 'None registered'}
                                </p>
                              </div>
                            </div>
                            <Button
                              onClick={registerNewPasskey}
                              variant="tonal"
                              size="sm"
                              className="bg-primary/10 text-primary hover:bg-primary/20"
                            >
                              Add Device
                            </Button>
                          </div>

                          {/* Device List */}
                          {dbPasskeys.length > 0 && (
                            <div className="space-y-2 mt-2 pt-2 border-t border-outline/10">
                              {dbPasskeys.map((pk) => (
                                <div key={pk.id} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-outline/5">
                                  <div>
                                    <p className="text-body-sm font-medium text-foreground">{pk.device_name}</p>
                                    <p className="text-label-sm text-muted-foreground flex items-center gap-2">
                                      <span>{pk.browser_name}</span>
                                      {pk.last_used_at && (
                                        <>
                                          <span>&bull;</span>
                                          <span>Last used: {new Date(pk.last_used_at).toLocaleDateString()}</span>
                                        </>
                                      )}
                                    </p>
                                  </div>
                                  <IconButton
                                    onClick={() => handleRevokePasskey(pk.id, pk.credential_id)}
                                    variant="ghost"
                                    size="icon-sm"
                                    className="text-error hover:text-error hover:bg-error/10"
                                    title="Revoke Device"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </IconButton>
                                </div>
                              ))}
                            </div>
                          )}

                          <AnimatePresence>
                            {passkeyStatus && (
                              <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={SPRING_DEFAULT}
                                className={`text-label-sm ${
                                  passkeyStatus.includes('success') ? 'text-primary' : 'text-error'
                                }`}
                              >
                                {passkeyStatus}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="bg-surface-variant/30 rounded-2xl p-5 border border-outline/20 text-center space-y-3 mb-6">
                      <p className="text-body-md text-foreground">Sign in to access account settings, devices, and profile customization.</p>
                      <Button onClick={() => { onClose(); onLoginRequest?.(); }} variant="filled" className="rounded-full w-full">
                        Sign In / Register
                      </Button>
                    </div>
                  )}

                  {/* Theme Settings — Collapsible */}
                  <div className="space-y-3">
                    <motion.button
                      onClick={() => setShowTheme(!showTheme)}
                      className="flex items-center justify-between w-full"
                    >
                      <h4 className="text-label-sm font-semibold text-primary uppercase tracking-wider">
                        Theme
                      </h4>
                      <MorphIcon 
                        type="chevron-down-up" 
                        isActive={showTheme} 
                        className="w-4 h-4 text-muted-foreground"
                      />
                    </motion.button>
                    <AnimatePresence>
                      {showTheme && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={SPRING_DEFAULT}
                          className="overflow-hidden"
                        >
                          <ThemeSelector />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-outline/20 bg-surface-variant/20 flex flex-col gap-2">
                <Button
                  onClick={async () => {
                    await signOut();
                    onClose();
                  }}
                  variant="destructive"
                  className="w-full bg-error/10 text-error hover:bg-error/20"
                  size="lg"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </Button>
              </div>
              </div>
            </BottomSheet>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
