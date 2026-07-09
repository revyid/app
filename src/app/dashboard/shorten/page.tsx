'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Plus, Trash2, Copy, Check, ExternalLink, BarChart3, Pencil } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { listShortUrls, deleteShortUrl, updateShortUrl } from '@/lib/auth';
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
}

export default function ShortenPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [urls, setUrls] = useState<ShortUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit state
  const [editingUrl, setEditingUrl] = useState<ShortUrl | null>(null);
  const [editOriginal, setEditOriginal] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Delete confirm
  const [deletingUrl, setDeletingUrl] = useState<ShortUrl | null>(null);

  // Realtime
  const channelRef = useRef<any>(null);

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
          .channel('short-urls-realtime')
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

  const handleDelete = async () => {
    if (!deletingUrl) return;
    const success = await deleteShortUrl(deletingUrl.slug);
    if (success) {
      setUrls(prev => prev.filter(u => u.id !== deletingUrl.id));
    }
    setDeletingUrl(null);
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
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-foreground">URL Shortener</h1>
        <p className="text-body-sm text-muted-foreground mt-1">Manage your shortened URLs and track clicks.</p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total URLs', value: urls.length, icon: Link2 },
          { label: 'Total Clicks', value: urls.reduce((s, u) => s + (u.clicks ?? 0), 0), icon: BarChart3 },
          { label: 'Active', value: urls.length, icon: Check },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-2xl bg-surface border border-outline/15 text-center">
            <stat.icon className="w-5 h-5 mx-auto mb-1.5 text-muted-foreground" />
            <p className="text-title-lg font-bold text-foreground">{stat.value}</p>
            <p className="text-label-sm text-muted-foreground">{stat.label}</p>
          </div>
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
                  className="p-4 bg-surface-variant/40 rounded-2xl border border-outline/10 hover:border-outline/25 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center flex-shrink-0">
                        <Link2 className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <code className="text-body-sm font-mono text-primary truncate">{url.short_url}</code>
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
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 self-end sm:self-center">
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

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={!!deletingUrl}
        title="Delete Short URL"
        description={`Delete "${deletingUrl?.short_url}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeletingUrl(null)}
      />

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
