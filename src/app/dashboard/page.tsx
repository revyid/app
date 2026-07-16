'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Activity, Shield, ArrowRight, ExternalLink, Link2, Trash2, Copy, Check, Pencil, X, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getSupabase } from '@/lib/supabase';
import { listApiKeys, getApiUsageToday, getShortenUsageToday, getSiteSetting, listShortUrls, deleteShortUrl, updateShortUrl, deleteAccount } from '@/lib/auth';
import { containerVariants, itemVariants, SPRING_BOUNCY } from '@/lib/motion-presets';

interface ShortUrl {
  id: string;
  slug: string;
  short_url: string;
  original_url: string;
  clicks: number;
  created_at: string;
}

function StatCard({ label, value, sub, icon, color, progress, delay = 0 }: {
  label: string; value: string; sub?: string; icon: React.ReactNode;
  color: string; progress?: number; delay?: number;
}) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -2, scale: 1.01 }}
      transition={SPRING_BOUNCY}
      className="p-5 rounded-2xl bg-surface border border-outline/20 space-y-3"
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-label-sm text-muted-foreground">{label}</p>
          <p className="text-title-sm font-semibold text-foreground">{value}</p>
        </div>
      </div>
      {progress !== undefined && (
        <div className="h-1.5 bg-surface-variant rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.8, delay, ease: 'easeOut' }}
            className={`h-full rounded-full ${progress > 80 ? 'bg-error' : progress > 50 ? 'bg-warning' : 'bg-primary'}`}
          />
        </div>
      )}
      {sub && <p className="text-label-sm text-muted-foreground">{sub}</p>}
    </motion.div>
  );
}

function EditUrlModal({ url, onSave, onClose }: {
  url: ShortUrl;
  onSave: (slug: string, newUrl: string, newSlug?: string) => Promise<void>;
  onClose: () => void;
}) {
  const [editUrl, setEditUrl] = useState(url.original_url);
  const [editSlug, setEditSlug] = useState(url.slug);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const urlValid = editUrl.startsWith('http://') || editUrl.startsWith('https://');
  const slugValid = /^[a-z0-9-]{3,16}$/.test(editSlug);
  const changed = editUrl !== url.original_url || editSlug !== url.slug;
  const canSave = urlValid && slugValid && changed && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError('');
    try {
      await onSave(url.slug, editUrl, editSlug !== url.slug ? editSlug : undefined);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={SPRING_BOUNCY}
        className="w-full max-w-md bg-surface rounded-3xl border border-outline/20 shadow-elevation-4 p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-title-sm font-semibold text-foreground">Edit Short URL</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface-variant transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-label-sm text-muted-foreground mb-1.5 block">Original URL</label>
            <input
              value={editUrl}
              onChange={e => setEditUrl(e.target.value)}
              placeholder="https://example.com/long-url"
              className={`w-full px-4 py-2.5 rounded-xl bg-surface-variant border text-body-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all ${
                editUrl && !urlValid ? 'border-error/50 bg-error/5' : 'border-outline/30'
              }`}
            />
            {editUrl && !urlValid && (
              <p className="text-label-sm text-error mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Must start with http:// or https://
              </p>
            )}
          </div>

          <div>
            <label className="text-label-sm text-muted-foreground mb-1.5 block">Slug</label>
            <div className="flex items-center gap-2">
              <span className="text-label-sm text-muted-foreground flex-shrink-0">revy.my.id/s/</span>
              <input
                value={editSlug}
                onChange={e => setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="my-slug"
                className={`flex-1 px-4 py-2.5 rounded-xl bg-surface-variant border text-body-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all ${
                  editSlug && !slugValid ? 'border-error/50 bg-error/5' : 'border-outline/30'
                }`}
              />
            </div>
            {editSlug && !slugValid && (
              <p className="text-label-sm text-error mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> 3–16 lowercase alphanumeric or hyphen
              </p>
            )}
          </div>
        </div>

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-body-sm text-error bg-error/10 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </motion.p>
        )}

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-outline/30 text-body-sm font-medium text-muted-foreground hover:bg-surface-variant transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-body-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {saving ? (
              <span className="animate-spin w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user, isLoading, signOut } = useAuth();
  const [keyCount, setKeyCount] = useState(0);
  const [ghUsage, setGhUsage] = useState(0);
  const [shortenUsage, setShortenUsage] = useState(0);
  const [ghLimit, setGhLimit] = useState(100);
  const [shortenLimit, setShortenLimit] = useState(100);
  const [shortUrls, setShortUrls] = useState<ShortUrl[]>([]);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [editingUrl, setEditingUrl] = useState<ShortUrl | null>(null);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const channelRef = useRef<any>(null);
  const channelIdRef = useRef(`dashboard-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  // Handle delete confirmation from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('delete') === 'confirm') {
      setDeleteConfirm(true);
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    const result = await deleteAccount();
    if (result.error) {
      alert(result.error);
      setDeleting(false);
      setDeleteConfirm(false);
    } else {
      await signOut();
      window.location.href = '/';
    }
  };

  useEffect(() => {
    if (!isLoading && !user) window.location.href = '/';
  }, [user, isLoading]);

  const refreshData = useCallback(async () => {
    if (!user) return;
    const [keys, gh, shorten, ghLim, sLim, urls] = await Promise.all([
      listApiKeys(),
      getApiUsageToday(),
      getShortenUsageToday(),
      getSiteSetting('rate_limit_github'),
      getSiteSetting('rate_limit_shorten'),
      listShortUrls(),
    ]);
    setKeyCount(keys.length);
    setGhUsage(gh);
    setShortenUsage(shorten);
    if (ghLim) setGhLimit(parseInt(ghLim));
    if (sLim) setShortenLimit(parseInt(sLim));
    setShortUrls(urls);
  }, [user]);

  // Initial load + realtime
  useEffect(() => {
    if (!user) return;
    refreshData();

    getSupabase().then(client => {
      channelRef.current = client
        .channel(channelIdRef.current)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'short_urls' }, () => {
          listShortUrls().then(setShortUrls);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'api_keys' }, () => {
          listApiKeys().then(k => setKeyCount(k.length));
        })
        .subscribe();
    });

    return () => {
      if (channelRef.current) {
        getSupabase().then(c => c.removeChannel(channelRef.current));
      }
    };
  }, [user, refreshData]);

  const handleCopy = (url: string, slug: string) => {
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleDelete = async (slug: string) => {
    setDeletingSlug(slug);
    const ok = await deleteShortUrl(slug);
    if (ok) setShortUrls(prev => prev.filter(u => u.slug !== slug));
    setDeletingSlug(null);
  };

  const handleEditSave = async (slug: string, newUrl: string, newSlug?: string) => {
    const result = await updateShortUrl(slug, newUrl, newSlug);
    if (result.error) throw new Error(result.error);
    await listShortUrls().then(setShortUrls);
  };

  if (!user) return null;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8"
    >
      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="API Keys" value={String(keyCount)} icon={<Key className="w-5 h-5 text-primary" />} color="bg-primary-container" />
        <StatCard
          label="GitHub (today)" value={`${ghUsage}/${ghLimit}`}
          icon={<Activity className="w-5 h-5 text-secondary" />} color="bg-secondary-container"
          progress={(ghUsage / ghLimit) * 100} delay={0.1}
        />
        <StatCard
          label="Shortener (today)" value={`${shortenUsage}/${shortenLimit}`}
          icon={<Link2 className="w-5 h-5 text-tertiary" />} color="bg-tertiary-container"
          progress={(shortenUsage / shortenLimit) * 100} delay={0.2}
        />
      </motion.div>

      {/* Quick Links */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/dashboard/api-keys" className="group block p-6 rounded-2xl bg-surface border border-outline/20 hover:border-primary/40 hover:bg-surface-container/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center">
                <Key className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-title-sm font-semibold text-foreground">API Keys</h3>
                <p className="text-body-sm text-muted-foreground">Create and manage your keys</p>
              </div>
            </div>
            <motion.div whileHover={{ x: 4 }} transition={SPRING_BOUNCY}>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </motion.div>
          </div>
        </Link>

        <Link href="/dashboard/shorten" className="group block p-6 rounded-2xl bg-surface border border-outline/20 hover:border-secondary/40 hover:bg-surface-container/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center">
                <Link2 className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="text-title-sm font-semibold text-foreground">URL Shortener</h3>
                <p className="text-body-sm text-muted-foreground">Create and manage short URLs</p>
              </div>
            </div>
            <motion.div whileHover={{ x: 4 }} transition={SPRING_BOUNCY}>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-secondary transition-colors" />
            </motion.div>
          </div>
        </Link>

        {/* Account Settings */}
        <motion.div variants={itemVariants}>
          <div className="p-6 rounded-2xl bg-surface border border-outline/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-error" />
              </div>
              <div>
                <h3 className="text-title-sm font-semibold text-foreground">Account</h3>
                <p className="text-body-sm text-muted-foreground">Manage your account settings</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-error/5 border border-error/20">
              <AlertCircle className="w-5 h-5 text-error shrink-0" />
              <div className="flex-1">
                <p className="text-body-sm text-foreground font-medium">Delete Account</p>
                <p className="text-label-sm text-muted-foreground">Permanently delete your account and all data</p>
              </div>
              <button
                onClick={() => setDeleteConfirm(true)}
                className="px-4 py-2 rounded-lg bg-error/10 text-error text-sm font-medium hover:bg-error/20 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => !deleting && setDeleteConfirm(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-md p-6 rounded-2xl bg-surface border border-outline/20"
            >
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 text-error" />
                </div>
                <h3 className="text-title-lg font-semibold text-foreground mb-2">Delete Account?</h3>
                <p className="text-body-sm text-muted-foreground mb-6">
                  This action cannot be undone. All your data, API keys, and short URLs will be permanently deleted.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    disabled={deleting}
                    className="flex-1 py-2.5 rounded-xl border border-outline/30 text-body-sm font-medium text-muted-foreground hover:bg-surface-variant transition-colors disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="flex-1 py-2.5 rounded-xl bg-error text-error-foreground text-body-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {deleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Account'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
