'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Plus, Trash2, Copy, Check, Clock, Shield, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getSupabase } from '@/lib/supabase';
import { listApiKeys, createApiKey, deleteApiKey } from '@/lib/auth';
import { containerVariants, itemVariants, SPRING_BOUNCY } from '@/lib/motion-presets';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  rate_limit: number;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

export default function ApiKeysPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [shownKeyId, setShownKeyId] = useState<string | null>(null);
  // Store newly created full keys in session (not persisted — by design)
  const [sessionKeys, setSessionKeys] = useState<Record<string, string>>({});
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

    // Realtime
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
    const result = await createApiKey(newKeyName.trim());
    if (result.error) {
      setError(result.error);
    } else {
      setGeneratedKey(result.key!);
      // Store full key mapped to key ID for show/copy in the list
      if (result.id && result.key) {
        setSessionKeys(prev => ({ ...prev, [result.id!]: result.key! }));
      }
      setNewKeyName('');
      fetchKeys();
    }
    setIsCreating(false);
  };

  const handleDelete = async (keyId: string) => {
    if (!confirm('Delete this API key? This cannot be undone.')) return;
    setDeletingId(keyId);
    const success = await deleteApiKey(keyId);
    if (success) setKeys(prev => prev.filter(k => k.id !== keyId));
    setDeletingId(null);
  };

  const copyKey = (text: string, id?: string) => {
    navigator.clipboard.writeText(text);
    if (id) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Create New Key */}
      <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-surface border border-outline/20 space-y-4">
        <h2 className="text-title-sm font-semibold text-foreground">Create New Key</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
            placeholder="Key name (e.g., my-app)"
            className="flex-1 px-4 py-3 rounded-xl bg-surface-variant border border-outline/30 text-foreground text-body-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreate}
            disabled={isCreating || !newKeyName.trim()}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            {isCreating ? 'Creating…' : 'Create'}
          </motion.button>
        </div>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-body-sm text-error">
            {error}
          </motion.p>
        )}
      </motion.div>

      {/* Generated Key Alert */}
      <AnimatePresence>
        {generatedKey && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={SPRING_BOUNCY}
            className="p-4 bg-success/10 border border-success/30 rounded-2xl space-y-3"
          >
            <p className="text-body-sm text-success font-medium">✓ New API key created — copy it now, it won't be shown again!</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <code className="flex-1 p-3 bg-surface rounded-xl text-body-sm font-mono text-foreground break-all select-all border border-outline/20">
                {generatedKey}
              </code>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => copyKey(generatedKey)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-body-sm font-medium flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap"
              >
                {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Existing Keys */}
      <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-surface border border-outline/20 space-y-4">
        <h2 className="text-title-sm font-semibold text-foreground">Your Keys</h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-16 rounded-2xl bg-surface-variant/50 animate-pulse" />
            ))}
          </div>
        ) : keys.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10">
            <Key className="w-8 h-8 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-body-md text-muted-foreground">No API keys yet</p>
            <p className="text-body-sm text-muted-foreground/60 mt-1">Create one above to start using the API</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {keys.map(key => (
                <motion.div
                  key={key.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 bg-surface-variant/40 rounded-2xl border border-outline/10 hover:border-outline/25 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center flex-shrink-0">
                        <Key className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-body-sm font-medium text-foreground truncate">{key.name}</p>
                        {/* Key display row */}
                        <div className="flex items-center gap-2 mt-0.5">
                          <code className="text-label-sm text-muted-foreground font-mono break-all">
                            {shownKeyId === key.id
                              ? (sessionKeys[key.id] ?? `${key.key_prefix}${'•'.repeat(24)}`)
                              : `${key.key_prefix}${'•'.repeat(24)}`}
                          </code>
                          {sessionKeys[key.id] && (
                            <button
                              onClick={() => setShownKeyId(shownKeyId === key.id ? null : key.id)}
                              className="p-0.5 rounded hover:bg-surface-variant transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
                              title={shownKeyId === key.id ? 'Hide' : 'Show full key'}
                            >
                              {shownKeyId === key.id ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          )}
                          {sessionKeys[key.id] && (
                            <button
                              onClick={() => copyKey(sessionKeys[key.id], key.id)}
                              className="p-0.5 rounded hover:bg-surface-variant transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
                              title="Copy full key"
                            >
                              {copiedId === key.id ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                        <p className="text-label-sm text-muted-foreground/60 mt-0.5">
                          {key.rate_limit} req/hr
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
                      <button
                        onClick={() => handleDelete(key.id)}
                        disabled={deletingId === key.id}
                        className="p-2 rounded-xl hover:bg-error/10 text-muted-foreground hover:text-error transition-colors disabled:opacity-50"
                      >
                        {deletingId === key.id
                          ? <span className="animate-spin w-4 h-4 border-2 border-error/30 border-t-error rounded-full inline-block" />
                          : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Info */}
      <motion.div variants={itemVariants} className="p-4 rounded-2xl bg-surface-variant/40 border border-outline/10 flex items-start gap-2 text-label-sm text-muted-foreground">
        <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>Full API keys are only shown once at creation. Show/copy is available in this session only — after refresh, only the prefix is shown for identification.</span>
      </motion.div>
    </motion.div>
  );
}
