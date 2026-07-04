'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Plus, Trash2, Copy, Check, ArrowLeft, Clock, Shield } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { listApiKeys, createApiKey, deleteApiKey } from '@/lib/auth';

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
  const { user, loading: authLoading } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);

  useEffect(() => {
    if (!authLoading && !user) window.location.href = '/';
  }, [user, authLoading]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const fetchKeys = async () => {
    setLoading(true);
    const result = await listApiKeys();
    setKeys(result);
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchKeys();
  }, [user]);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setIsCreating(true);
    setError('');
    const result = await createApiKey(newKeyName.trim());
    if (result.error) {
      setError(result.error);
    } else {
      setGeneratedKey(result.key!);
      setNewKeyName('');
      fetchKeys();
    }
    setIsCreating(false);
  };

  const handleDelete = async (keyId: string) => {
    if (!confirm('Delete this API key? This cannot be undone.')) return;
    const success = await deleteApiKey(keyId);
    if (success) fetchKeys();
  };

  const copyKey = () => {
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-outline/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <span className="text-title-sm font-semibold text-foreground">API Keys</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Create New Key */}
        <div className="p-6 rounded-2xl bg-surface border border-outline/20">
          <h2 className="text-title-sm font-semibold text-foreground mb-4">Create New Key</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Key name (e.g., my-app)"
              className="flex-1 px-4 py-3 rounded-xl bg-surface-variant border border-outline/50 text-foreground outline-none focus:ring-2 focus:ring-primary/30"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <button
              onClick={handleCreate}
              disabled={isCreating || !newKeyName.trim()}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {isCreating ? 'Creating...' : 'Create'}
            </button>
          </div>
          {error && <p className="text-body-sm text-error mt-2">{error}</p>}
        </div>

        {/* Generated Key Alert */}
        <AnimatePresence>
          {generatedKey && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-success/10 border border-success/30 rounded-2xl"
            >
              <p className="text-body-sm text-success font-medium mb-2">New API key created!</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-surface rounded-xl text-body-sm font-mono text-foreground break-all select-all">
                  {generatedKey}
                </code>
                <button onClick={copyKey} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-body-sm font-medium flex items-center gap-1 shrink-0">
                  {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Existing Keys */}
        <div className="p-6 rounded-2xl bg-surface border border-outline/20">
          <h2 className="text-title-sm font-semibold text-foreground mb-4">Your Keys</h2>
          {loading ? (
            <div className="text-body-sm text-muted-foreground">Loading...</div>
          ) : keys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p className="text-body-md">No API keys yet</p>
              <p className="text-body-sm">Create one to start using the GitHub API</p>
            </div>
          ) : (
            <div className="space-y-3">
              {keys.map((key) => (
                <motion.div
                  key={key.id}
                  layout
                  className="flex items-center justify-between p-4 bg-surface-variant/50 rounded-2xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center">
                      <Key className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-body-md font-medium text-foreground">{key.name}</p>
                      <p className="text-label-sm text-muted-foreground">
                        {key.key_prefix}... • {key.rate_limit} req/hr
                        {key.last_used_at && (
                          <span className="ml-2">
                            <Clock className="w-3 h-3 inline" /> Last used: {new Date(key.last_used_at).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(key.id)}
                    className="p-2 rounded-xl hover:bg-error/10 text-muted-foreground hover:text-error transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Rate Limit Info */}
        <div className="p-4 rounded-2xl bg-surface-variant/50 border border-outline/10">
          <div className="flex items-center gap-2 text-label-sm text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>Rate limit: 100 requests per hour (shared across all your keys)</span>
          </div>
        </div>
      </main>
    </div>
  );
}
