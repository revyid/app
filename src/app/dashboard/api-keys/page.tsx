'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Plus, Trash2, Copy, Check, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getSupabase } from '@/lib/supabase';
import { listApiKeys, createApiKey, deleteApiKey } from '@/lib/auth';
import { containerVariants, itemVariants, SPRING_BOUNCY } from '@/lib/motion-presets';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  rate_limit: number;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  expires_at?: string | null;
}

export default function ApiKeysPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Create popup
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiry, setNewKeyExpiry] = useState('never');
  const [isCreating, setIsCreating] = useState(false);

  // Delete confirm
  const [deletingKey, setDeletingKey] = useState<ApiKey | null>(null);

  // Store full keys in localStorage
  const [storedKeys, setStoredKeys] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('revy_api_keys') ?? '{}'); } catch { return {}; }
  });
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!authLoading && !user) window.location.href = '/';
  }, [user, authLoading]);

  const fetchKeys = useCallback(async () => {
    if (!user) return;
    const result = await listApiKeys();
    setKeys(result);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchKeys();

    getSupabase().then(client => {
      channelRef.current = client
        .channel('api-keys-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'api_keys' }, () => {
          fetchKeys();
        })
        .subscribe();
    });

    return () => {
      if (channelRef.current) getSupabase().then(c => c.removeChannel(channelRef.current));
    };
  }, [user, fetchKeys]);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setIsCreating(true);
    setError('');
    const result = await createApiKey(newKeyName.trim(), newKeyExpiry === 'never' ? undefined : newKeyExpiry);
    if (result.error) {
      setError(result.error);
    } else {
      setGeneratedKey(result.key!);
      if (result.id && result.key) {
        const updated = { ...storedKeys, [result.id!]: result.key! };
        setStoredKeys(updated);
        localStorage.setItem('revy_api_keys', JSON.stringify(updated));
      }
      setNewKeyName('');
      setNewKeyExpiry('never');
      setShowCreate(false);
      fetchKeys();
    }
    setIsCreating(false);
  };

  const handleDelete = async () => {
    if (!deletingKey) return;
    const success = await deleteApiKey(deletingKey.id);
    if (success) {
      setKeys(prev => prev.filter(k => k.id !== deletingKey.id));
      const updated = { ...storedKeys };
      delete updated[deletingKey.id];
      setStoredKeys(updated);
      localStorage.setItem('revy_api_keys', JSON.stringify(updated));
    }
    setDeletingKey(null);
  };

  const copyKey = (text: string, id?: string) => {
    navigator.clipboard.writeText(text);
    if (id) { setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); }
    else { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-6">
      {/* Create Button */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">API Keys</h1>
          <p className="text-body-sm text-muted-foreground mt-1">Manage your API keys for accessing the service.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreate(true)}
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Key
        </motion.button>
      </motion.div>

      {/* Generated Key Alert */}
      <AnimatePresence>
        {generatedKey && (
          <motion.div initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }} transition={SPRING_BOUNCY}
            className="p-4 bg-success/10 border border-success/30 rounded-2xl space-y-3">
            <p className="text-body-sm text-success font-medium">New API key created!</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <code className="flex-1 p-3 bg-surface rounded-xl text-body-sm font-mono text-foreground break-all select-all border border-outline/20">{generatedKey}</code>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => copyKey(generatedKey)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-body-sm font-medium flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap">
                {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keys List */}
      <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-surface border border-outline/20 space-y-4">
        <h2 className="text-title-sm font-semibold text-foreground">Your Keys</h2>
        {loading ? (
          <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-16 rounded-2xl bg-surface-variant/50 animate-pulse" />)}</div>
        ) : keys.length === 0 ? (
          <div className="text-center py-10">
            <Key className="w-8 h-8 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-body-md text-muted-foreground">No API keys yet</p>
            <p className="text-body-sm text-muted-foreground/60 mt-1">Create one to start using the API</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {keys.map(key => (
                <motion.div key={key.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}
                  className="p-4 bg-surface-variant/40 rounded-2xl border border-outline/10 hover:border-outline/25 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center flex-shrink-0">
                        <Key className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-body-sm font-medium text-foreground truncate">{key.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <code className="text-label-sm text-muted-foreground font-mono break-all select-all">
                            {storedKeys[key.id] ?? `${key.key_prefix}${'•'.repeat(24)}`}
                          </code>
                          {storedKeys[key.id] && (
                            <button onClick={() => copyKey(storedKeys[key.id], key.id)}
                              className="p-0.5 rounded hover:bg-surface-variant transition-colors text-muted-foreground hover:text-foreground flex-shrink-0" title="Copy full key">
                              {copiedId === key.id ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                        <p className="text-label-sm text-muted-foreground/60 mt-0.5">
                          {key.rate_limit} req/hr
                          {key.expires_at && (
                            <span className="ml-2 inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              expires {new Date(key.expires_at).toLocaleDateString()}
                            </span>
                          )}
                          {key.last_used_at && (
                            <span className="ml-2 inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(key.last_used_at).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className={`px-2 py-0.5 rounded-full text-label-sm font-medium ${key.is_active ? 'bg-success/15 text-success' : 'bg-error/15 text-error'}`}>
                        {key.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <button onClick={() => setDeletingKey(key)}
                        className="p-2 rounded-xl hover:bg-error/10 text-muted-foreground hover:text-error transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Create Popup */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="relative w-full max-w-md bg-surface rounded-2xl border border-outline/20 shadow-elevation-5 p-6 space-y-4">
              <h3 className="text-title-sm font-semibold text-foreground">Create API Key</h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Key Name</label>
                  <input type="text" value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
                    placeholder="e.g., my-app" autoFocus
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    onKeyDown={e => e.key === 'Enter' && handleCreate()} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Expiry</label>
                  <select value={newKeyExpiry} onChange={e => setNewKeyExpiry(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="never">Never</option>
                    <option value="30d">30 days</option>
                    <option value="90d">90 days</option>
                    <option value="180d">6 months</option>
                    <option value="365d">1 year</option>
                  </select>
                </div>
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outlined" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button size="sm" onClick={handleCreate} disabled={isCreating || !newKeyName.trim()}>
                  {isCreating ? 'Creating…' : 'Create'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <ConfirmDialog open={!!deletingKey} title="Delete API Key"
        description={`Delete "${deletingKey?.name}"? This cannot be undone.`}
        onConfirm={handleDelete} onCancel={() => setDeletingKey(null)} />
    </motion.div>
  );
}
