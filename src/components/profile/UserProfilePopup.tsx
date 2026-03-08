import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
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
  ChevronDown,
  ChevronUp,
  Trash2,
  MonitorSmartphone,
} from 'lucide-react';
import { bottomSheetContent, modalBackdrop, SPRING_SNAPPY, SPRING_BOUNCY, SPRING_DEFAULT } from '@/lib/motion-presets';
import { ThemeSelector } from '@/components/shared/ThemeSelector';
import { registerPasskey, isWebAuthnSupported, getPasskeysFromDB, revokePasskey, type DBPasskey } from '@/lib/webauthn';

interface UserProfilePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfilePopup({ isOpen, onClose }: UserProfilePopupProps) {
  const { user, session, signOut } = useAuth();

  const metadata = user?.user_metadata || {};
  const initialFirstName = metadata.first_name || '';
  const initialLastName = metadata.last_name || '';

  const [isEditingName, setIsEditingName] = useState(false);
  const [editFirstName, setEditFirstName] = useState(initialFirstName);
  const [editLastName, setEditLastName] = useState(initialLastName);
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
        const { data, error } = await supabase
          .from('user_devices')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('last_active_at', { ascending: false });
        if (error) throw error;
        setDbDevices(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsFetchingDevices(false);
      }
    };
    fetchDevices();

    // -------- Realtime Subscriptions --------
    const passkeysChannel = supabase
      .channel('profile-passkeys-rt')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_passkeys', filter: `user_id=eq.${user.id}` },
        () => {
          // Re-fetch passkeys on any change (INSERT/UPDATE/DELETE)
          getPasskeysFromDB().then(setDbPasskeys).catch(console.error);
        }
      )
      .subscribe();

    const devicesChannel = supabase
      .channel('profile-devices-rt')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_devices', filter: `user_id=eq.${user.id}` },
        () => {
          // Re-fetch active devices on any change
          supabase
            .from('user_devices')
            .select('*')
            .eq('user_id', user!.id)
            .eq('is_active', true)
            .order('last_active_at', { ascending: false })
            .then(({ data }) => setDbDevices(data || []));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(passkeysChannel);
      supabase.removeChannel(devicesChannel);
    };
  }, [user, isOpen]);

  if (!user) return null;

  const joinDate = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Generate a fallback avatar if none exists
  const avatarUrl = metadata.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(initialFirstName || user.email || 'U')}&background=random`;
  const fullName = [metadata.first_name, metadata.last_name].filter(Boolean).join(' ') || user.email || 'Anonymous';

  // ==========================================
  // Profile Editing
  // ==========================================
  const startEditName = () => {
    setEditFirstName(metadata.first_name || '');
    setEditLastName(metadata.last_name || '');
    setIsEditingName(true);
  };

  const saveName = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: editFirstName,
          last_name: editLastName,
        }
      });
      if (error) throw error;
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
    // Need refresh token to ensure seamless login later
    if (!session?.refresh_token) {
      setPasskeyStatus('Session expired. Please log in again.');
      setTimeout(() => setPasskeyStatus(''), 4000);
      return;
    }

    if (!isWebAuthnSupported()) {
      setPasskeyStatus('Passkeys not supported on this device.');
      setTimeout(() => setPasskeyStatus(''), 4000);
      return;
    }

    setPasskeyStatus('Registering...');
    try {
      const result = await registerPasskey(
        user.id,
        user.email || '',
        fullName,
        session.refresh_token
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
      await supabase.from('user_devices').update({ is_active: false }).eq('id', id);
    } catch (err) {
      console.error('Failed to revoke device', err);
      // refetch on error
      const { data } = await supabase.from('user_devices').select('*').eq('user_id', user.id).eq('is_active', true);
      setDbDevices(data || []);
    }
  };

  const provider = user.app_metadata?.provider || 'Email / Password';

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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Bottom Sheet Profile */}
          <motion.div
            variants={bottomSheetContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed bottom-0 left-0 right-0 sm:left-auto sm:right-4 sm:bottom-4 sm:w-[420px] sm:max-w-[calc(100vw-2rem)] z-50"
          >
            <div className="bg-surface dark:bg-surface border border-outline/20 rounded-t-[28px] sm:rounded-[28px] shadow-elevation-5 overflow-hidden noise-grain max-h-[85vh] overflow-y-auto scrollbar-thin">
              {/* Drag Handle */}
              <div className="pt-3 pb-0">
                <div className="sheet-handle" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-outline/20">
                <h3 className="font-semibold text-foreground text-title-sm">Account Settings</h3>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={SPRING_SNAPPY}
                  className="w-9 h-9 rounded-full bg-surface-variant flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Profile Header */}
              <div className="p-6">
                <div className="flex items-center gap-4 mb-8">
                  {/* Avatar */}
                  <div className="relative group">
                    <img
                      src={avatarUrl}
                      alt={fullName}
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-outline/20"
                    />
                  </div>

                  {/* Name with edit */}
                  <div className="flex-1">
                    {isEditingName ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <input
                            value={editFirstName}
                            onChange={(e) => setEditFirstName(e.target.value)}
                            placeholder="First name"
                            className="flex-1 px-3 py-1.5 text-body-md bg-surface-variant border border-outline/30 rounded-lg text-foreground outline-none focus:border-primary"
                          />
                          <input
                            value={editLastName}
                            onChange={(e) => setEditLastName(e.target.value)}
                            placeholder="Last name"
                            className="flex-1 px-3 py-1.5 text-body-md bg-surface-variant border border-outline/30 rounded-lg text-foreground outline-none focus:border-primary"
                          />
                        </div>
                        <div className="flex gap-2">
                          <motion.button
                            onClick={saveName}
                            disabled={isSaving}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-1 px-3 py-1 text-label-sm bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
                          >
                            <Check className="w-3 h-3" /> Save
                          </motion.button>
                          <button
                            onClick={() => setIsEditingName(false)}
                            className="px-3 py-1 text-label-sm text-muted-foreground hover:text-foreground"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h2 className="text-title-lg font-bold text-foreground">
                          {fullName}
                        </h2>
                        <motion.button
                          onClick={startEditName}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-1 rounded-lg hover:bg-surface-variant text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-muted-foreground text-label-md mt-1">
                      <Mail className="w-3.5 h-3.5" />
                      {user.email}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
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
                          <p className="text-label-sm text-muted-foreground">Sign In Method</p>
                          <p className="text-body-sm text-foreground capitalize">
                            {provider}
                          </p>
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
                              <motion.button
                                onClick={() => handleRevokeDevice(dev.id)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-error hover:bg-error/10 transition-colors"
                                title="Log Out Device"
                              >
                                <LogOut className="w-4 h-4" />
                              </motion.button>
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
                        <motion.button
                          onClick={registerNewPasskey}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          transition={SPRING_SNAPPY}
                          className="px-3 py-1.5 text-label-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                        >
                          Add Device
                        </motion.button>
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
                              <motion.button
                                onClick={() => handleRevokePasskey(pk.id, pk.credential_id)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-error hover:bg-error/10 transition-colors"
                                title="Revoke Device"
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
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

                  {/* Theme Settings — Collapsible */}
                  <div className="space-y-3">
                    <motion.button
                      onClick={() => setShowTheme(!showTheme)}
                      className="flex items-center justify-between w-full"
                    >
                      <h4 className="text-label-sm font-semibold text-primary uppercase tracking-wider">
                        Theme
                      </h4>
                      {showTheme ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
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
                <motion.button
                  onClick={async () => {
                    await signOut();
                    onClose();
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={SPRING_BOUNCY}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-error/10 text-error hover:bg-error/20 rounded-xl font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
