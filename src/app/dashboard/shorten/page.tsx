'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Plus, Trash2, Copy, Check, ExternalLink, BarChart3, Pencil, Clock, RotateCcw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { listShortUrls, deleteShortUrl, updateShortUrl, reactivateShortUrl } from '@/lib/auth';
import { containerVariants, itemVariants, SPRING_BOUNCY } from '@/lib/motion-presets';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';

interface ShortUrl {
  id: string;
  slug: string;
  short_url: string;
  original_url: string;
  clicks: number;
  created_at: string;
  expires_at?: string | null;
  is_active?: boolean;
}

export default function ShortenPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [urls, setUrls] = useState<ShortUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Create state
  const [showCreate, setShowCreate] = useState(false);
  const [createUrl, setCreateUrl] = useState('');
  const [createSlug, setCreateSlug] = useState('');
  const [createExpiry, setCreateExpiry] = useState('never');
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createdShort, setCreatedShort] = useState('');
  const [copiedCreated, setCopiedCreated] = useState(false);

  // Edit state
  const [editingUrl, setEditingUrl] = useState<ShortUrl | null>(null);
  const [editOriginal, setEditOriginal] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Delete confirm
  const [deletingUrl, setDeletingUrl] = useState<ShortUrl | null>(null);

  // Extend/reactivate
  const [extendingUrl, setExtendingUrl] = useState<ShortUrl | null>(null);
  const [extendExpiry, setExtendExpiry] = useState('30d');

  // Realtime
  const channelRef = useRef<any>(null);
  const channelIdRef = useRef(`short-urls-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    if (!authLoading && !user) window.location.href = '/';
  }, [user, authLoading]);

  const fetchUrls = useCallback(async () => {
    if (!user) return;
    const result = await listShortUrls();
    setUrls(result);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchUrls();

    // Realtime via Supabase channel (if available)
    import('@/lib/supabase').then(({ getSupabase }) => {
      getSupabase().then(client => {
        channelRef.current = client
          .channel(channelIdRef.current)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'short_urls' }, () => {
            fetchUrls();
          })
          .subscribe();
      });
    }).catch(() => {});

    return () => {
      if (channelRef.current) {
        import('@/lib/supabase').then(({ getSupabase }) => {
          getSupabase().then(c => c.removeChannel(channelRef.current));
        }).catch(() => {});
      }
    };
  }, [user, fetchUrls]);

  const copyUrl = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEdit = (url: ShortUrl) => {
    setEditingUrl(url);
    setEditOriginal(url.original_url);
    setEditSlug(url.slug);
  };

  const handleSaveEdit = async () => {
    if (!editingUrl) return;
    setEditSaving(true);
    const result = await updateShortUrl(editingUrl.slug, editOriginal, editSlug !== editingUrl.slug ? editSlug : undefined);
    setEditSaving(false);
    if (result.error) {
      setError(result.error);
    } else {
      setEditingUrl(null);
      fetchUrls();
    }
  };

  const handleCreate = async () => {
    if (!createUrl.trim()) return;
    setCreateSaving(true);
    setCreateError('');
    try {
      const token = localStorage.getItem('app_session_token') ?? '';
      const res = await fetch('/api/short-urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: createUrl.trim(), slug: createSlug.trim() || undefined, token, expires_in: createExpiry === 'never' ? undefined : createExpiry }),
      });
      const data = await res.json();
      if (data.error) {
        setCreateError(data.error);
      } else {
        setCreatedShort(data.short_url || `https://revy.my.id/s/${data.slug}`);
        setCreateUrl('');
        setCreateSlug('');
        setShowCreate(false);
        fetchUrls();
      }
    } catch (e: any) {
      setCreateError(e.message);
    }
    setCreateSaving(false);
  };

  const handleDelete = async () => {
    if (!deletingUrl) return;
    const success = await deleteShortUrl(deletingUrl.slug);
    if (success) {
      setUrls(prev => prev.filter(u => u.id !== deletingUrl.id));
    }
    setDeletingUrl(null);
  };

  const handleExtend = async () => {
    if (!extendingUrl) return;
    const result = await reactivateShortUrl(extendingUrl.slug, extendExpiry);
    if (result.ok) {
      setExtendingUrl(null);
      fetchUrls();
    } else if (result.error) {
      setError(result.error);
      setExtendingUrl(null);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">URL Shortener</h1>
          <p className="text-body-sm text-muted-foreground mt-1">Manage your shortened URLs and track clicks.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreate(true)}
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create URL
        </motion.button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total URLs', value: urls.length, icon: Link2 },
          { label: 'Total Clicks', value: urls.reduce((s, u) => s + (u.clicks ?? 0), 0), icon: BarChart3 },
          { label: 'Active', value: urls.filter(u => u.is_active !== false && (!u.expires_at || new Date(u.expires_at) >= new Date())).length, icon: Check },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, type: 'spring', stiffness: 300, damping: 25 }}
            className="p-4 rounded-2xl bg-surface border border-outline/15 text-center">
            <stat.icon className="w-5 h-5 mx-auto mb-1.5 text-muted-foreground" />
            <p className="text-title-lg font-bold text-foreground">{stat.value}</p>
            <p className="text-label-sm text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* URL List */}
      <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-surface border border-outline/20 space-y-4">
        <h2 className="text-title-sm font-semibold text-foreground">Your URLs</h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-2xl bg-surface-variant/50 animate-pulse" />
            ))}
          </div>
        ) : urls.length === 0 ? (
          <div className="text-center py-10">
            <Link2 className="w-8 h-8 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-body-md text-muted-foreground">No short URLs yet</p>
            <p className="text-body-sm text-muted-foreground/60 mt-1">Create one via the API to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {urls.map(url => (
                <motion.div
                  key={url.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className={`p-4 rounded-2xl border transition-colors ${url.is_active === false || (url.expires_at && new Date(url.expires_at) < new Date())
                    ? 'bg-error/5 border-error/20 opacity-80'
                    : 'bg-surface-variant/40 border-outline/10 hover:border-outline/25'}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${url.is_active === false || (url.expires_at && new Date(url.expires_at) < new Date()) ? 'bg-error/10' : 'bg-surface'}`}>
                        {url.is_active === false || (url.expires_at && new Date(url.expires_at) < new Date())
                          ? <Clock className="w-5 h-5 text-error" />
                          : <Link2 className="w-5 h-5 text-muted-foreground" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <code className={`text-body-sm font-mono truncate ${url.is_active === false || (url.expires_at && new Date(url.expires_at) < new Date()) ? 'text-muted-foreground' : 'text-primary'}`}>{url.short_url}</code>
                          <button
                            onClick={() => copyUrl(url.short_url, url.id)}
                            className="p-0.5 rounded hover:bg-surface-variant transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
                            title="Copy short URL"
                          >
                            {copiedId === url.id ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        <p className="text-label-sm text-muted-foreground/60 truncate mt-0.5" title={url.original_url}>
                          {url.original_url}
                        </p>
                        <p className="text-label-sm text-muted-foreground/60 mt-0.5">
                          {url.clicks} clicks · {formatDate(url.created_at)}
                          {url.expires_at && (url.is_active === false || new Date(url.expires_at) < new Date())
                            ? <span className="ml-2 text-error font-medium">· expired {formatDate(url.expires_at)}</span>
                            : url.expires_at && <span className="ml-2 text-warning">· expires {formatDate(url.expires_at)}</span>
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 self-end sm:self-center">
                      {(url.is_active === false || (url.expires_at && new Date(url.expires_at) < new Date())) ? (
                        <>
                          <button
                            onClick={() => setExtendingUrl(url)}
                            className="px-3 py-1.5 rounded-xl text-label-sm font-medium bg-success/10 text-success hover:bg-success/20 transition-colors flex items-center gap-1"
                            title="Extend / Reactivate"
                          >
                            <RotateCcw className="w-3 h-3" /> Extend
                          </button>
                          <button
                            onClick={() => setDeletingUrl(url)}
                            className="p-2 rounded-xl hover:bg-error/10 text-muted-foreground hover:text-error transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => window.open(url.short_url, '_blank')}
                            className="p-2 rounded-xl hover:bg-surface-variant text-muted-foreground hover:text-foreground transition-colors"
                        title="Open"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(url)}
                        className="p-2 rounded-xl hover:bg-surface-variant text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingUrl(url)}
                        className="p-2 rounded-xl hover:bg-error/10 text-muted-foreground hover:text-error transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Edit Dialog */}
      <ConfirmDialog
        open={!!editingUrl}
        title="Edit Short URL"
        description="Update the original URL or slug for this short link."
        confirmLabel={editSaving ? 'Saving…' : 'Save'}
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={handleSaveEdit}
        onCancel={() => setEditingUrl(null)}
      />
      {editingUrl && (
        <div className="fixed inset-0 z-[71] flex items-center justify-center p-4 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md bg-surface rounded-2xl border border-outline/20 shadow-elevation-5 p-6 space-y-4 pointer-events-auto"
          >
            <h3 className="text-title-sm font-semibold text-foreground">Edit Short URL</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Original URL</label>
                <input
                  type="url"
                  value={editOriginal}
                  onChange={e => setEditOriginal(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Slug</label>
                <input
                  type="text"
                  value={editSlug}
                  onChange={e => setEditSlug(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outlined" size="sm" onClick={() => setEditingUrl(null)}>Cancel</Button>
              <Button size="sm" onClick={handleSaveEdit} disabled={editSaving}>
                {editSaving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Extend/Reactivate Dialog */}
      <AnimatePresence>
        {extendingUrl && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50" onClick={() => setExtendingUrl(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="relative w-full max-w-md bg-surface rounded-2xl border border-outline/20 shadow-elevation-5 p-6 space-y-4">
              <h3 className="text-title-sm font-semibold text-foreground">Extend Short URL</h3>
              <p className="text-body-sm text-muted-foreground">Reactivate <strong>{extendingUrl.short_url}</strong> with a new expiry.</p>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">New Expiry</label>
                <select value={extendExpiry} onChange={e => setExtendExpiry(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="30d">30 days</option>
                  <option value="90d">90 days</option>
                  <option value="180d">6 months</option>
                  <option value="365d">1 year</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outlined" size="sm" onClick={() => setExtendingUrl(null)}>Cancel</Button>
                <Button size="sm" onClick={handleExtend}>Extend</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={!!deletingUrl}
        title="Delete Short URL"
        description={`Delete "${deletingUrl?.short_url}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeletingUrl(null)}
      />

      {/* Created URL Alert */}
      <AnimatePresence>
        {createdShort && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} className="fixed top-4 right-4 z-[70] p-4 bg-success/10 border border-success/30 rounded-2xl space-y-2 max-w-sm">
            <p className="text-body-sm text-success font-medium">URL created!</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono text-foreground break-all">{createdShort}</code>
              <button onClick={() => { navigator.clipboard.writeText(createdShort); setCopiedCreated(true); setTimeout(() => setCopiedCreated(false), 2000); }}
                className="p-1 rounded hover:bg-surface-variant transition-colors text-muted-foreground">
                {copiedCreated ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <button onClick={() => setCreatedShort('')} className="text-xs text-muted-foreground hover:text-foreground">Dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create URL Popup */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50" onClick={() => setShowCreate(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="relative w-full max-w-md bg-surface rounded-2xl border border-outline/20 shadow-elevation-5 p-6 space-y-4">
              <h3 className="text-title-sm font-semibold text-foreground">Create Short URL</h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Original URL</label>
                  <input type="url" value={createUrl} onChange={e => setCreateUrl(e.target.value)}
                    placeholder="https://example.com/long-url" autoFocus
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Slug (optional)</label>
                  <input type="text" value={createSlug} onChange={e => setCreateSlug(e.target.value)}
                    placeholder="auto-generated if empty"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Expiry</label>
                  <select value={createExpiry} onChange={e => setCreateExpiry(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="never">Never</option>
                    <option value="1d">1 day</option>
                    <option value="7d">7 days</option>
                    <option value="30d">30 days</option>
                    <option value="90d">90 days</option>
                  </select>
                </div>
              </div>
              {createError && <p className="text-xs text-destructive">{createError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outlined" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button size="sm" onClick={handleCreate} disabled={createSaving || !createUrl.trim()}>
                  {createSaving ? 'Creating…' : 'Create'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 bg-error/10 border border-error/30 rounded-2xl text-body-sm text-error"
          >
            {error}
            <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
