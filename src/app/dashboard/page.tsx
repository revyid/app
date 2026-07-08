'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Activity, Shield, ArrowRight, ExternalLink, Link2, Trash2, Copy, Check, Pencil, X, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getSupabase } from '@/lib/supabase';
import { listApiKeys, getApiUsageToday, getShortenUsageToday, getSiteSetting, listShortUrls, deleteShortUrl, updateShortUrl } from '@/lib/auth';
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
  const { user, isLoading } = useAuth();
  const [keyCount, setKeyCount] = useState(0);
  const [ghUsage, setGhUsage] = useState(0);
  const [shortenUsage, setShortenUsage] = useState(0);
  const [ghLimit, setGhLimit] = useState(100);
  const [shortenLimit, setShortenLimit] = useState(100);
  const [shortUrls, setShortUrls] = useState<ShortUrl[]>([]);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [editingUrl, setEditingUrl] = useState<ShortUrl | null>(null);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const channelRef = useRef<any>(null);

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
        .channel('dashboard-realtime')
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

        <Link href="/docs" className="group block p-6 rounded-2xl bg-surface border border-outline/20 hover:border-secondary/40 hover:bg-surface-container/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center">
                <ExternalLink className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="text-title-sm font-semibold text-foreground">API Docs</h3>
                <p className="text-body-sm text-muted-foreground">View endpoints and examples</p>
              </div>
            </div>
            <motion.div whileHover={{ x: 4 }} transition={SPRING_BOUNCY}>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-secondary transition-colors" />
            </motion.div>
          </div>
        </Link>
      </motion.div>

      {/* Short URLs */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-title-sm font-semibold text-foreground">Short URLs</h2>
          <Link href="/docs/api-reference/shorten" className="text-label-sm text-primary hover:underline">API Docs</Link>
        </div>

        {shortUrls.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="py-10 text-center rounded-2xl border border-outline/15 bg-surface-variant/20"
          >
            <Link2 className="w-8 h-8 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-body-sm text-muted-foreground">No short URLs yet</p>
          </motion.div>
        ) : (
          <div className="rounded-2xl border border-outline/20 overflow-hidden">
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-surface-variant/50 border-b border-outline/15">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Short URL</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Original</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Clicks</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {shortUrls.map(url => (
                      <motion.tr
                        key={url.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-b border-outline/10 last:border-0 hover:bg-surface-variant/30 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <code className="text-primary font-mono text-[12px]">/s/{url.slug}</code>
                            <button onClick={() => handleCopy(url.short_url, url.slug)}
                              className="p-1 rounded hover:bg-surface-variant transition-colors">
                              {copiedSlug === url.slug
                                ? <Check className="w-3 h-3 text-success" />
                                : <Copy className="w-3 h-3 text-muted-foreground" />}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground max-w-[200px]">
                          <span className="truncate block">{url.original_url}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-foreground">{url.clicks}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setEditingUrl(url)}
                              className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(url.slug)}
                              disabled={deletingSlug === url.slug}
                              className="p-1.5 rounded-lg hover:bg-error/10 text-muted-foreground hover:text-error transition-colors disabled:opacity-50"
                            >
                              {deletingSlug === url.slug
                                ? <span className="animate-spin w-3.5 h-3.5 border-2 border-error/30 border-t-error rounded-full inline-block" />
                                : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-outline/10">
              <AnimatePresence initial={false}>
                {shortUrls.map(url => (
                  <motion.div
                    key={url.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <code className="text-primary font-mono text-[12px]">/s/{url.slug}</code>
                        <button onClick={() => handleCopy(url.short_url, url.slug)} className="p-1 rounded hover:bg-surface-variant transition-colors">
                          {copiedSlug === url.slug ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                        </button>
                      </div>
                      <span className="text-label-sm text-muted-foreground font-mono">{url.clicks} clicks</span>
                    </div>
                    <p className="text-label-sm text-muted-foreground truncate">{url.original_url}</p>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => setEditingUrl(url)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-sm bg-primary/10 text-primary hover:bg-primary/15 transition-colors">
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(url.slug)}
                        disabled={deletingSlug === url.slug}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-sm bg-error/10 text-error hover:bg-error/15 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </motion.div>

      {/* Edit modal */}
      <AnimatePresence>
        {editingUrl && (
          <EditUrlModal
            url={editingUrl}
            onSave={handleEditSave}
            onClose={() => setEditingUrl(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
