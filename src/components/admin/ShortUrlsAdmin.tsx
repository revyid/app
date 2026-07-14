'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trash2, ExternalLink, Search, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { adminListShortUrls, adminDeleteShortUrl, type AdminShortUrl } from '@/lib/auth';
import { LoadingIndicator } from '@/components/shared/LoadingIndicator';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';

/**
 * Admin: Short URL oversight — lists ALL short URLs across ALL users, with
 * click counts, owner email, expiry, and admin-delete. Uses the admin_list_short_urls
 * and admin_delete_short_url RPCs (both admin-verified via verify_admin_internal).
 */
export function ShortUrlsAdmin() {
  const [urls, setUrls] = useState<AdminShortUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminShortUrl | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { urls, error } = await adminListShortUrls(200, 0);
    if (error) {
      toast.error(`Failed to load short URLs: ${error}`);
      setUrls([]);
    } else {
      setUrls(urls ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await adminDeleteShortUrl(deleteTarget.slug);
    if (error) {
      toast.error(`Delete failed: ${error}`);
    } else {
      toast.success(`Deleted /s/${deleteTarget.slug}`);
      setUrls(prev => prev.filter(u => u.slug !== deleteTarget.slug));
    }
    setDeleting(false);
    setDeleteTarget(null);
  }

  const filtered = urls.filter(u =>
    !search ||
    u.slug.toLowerCase().includes(search.toLowerCase()) ||
    u.original_url.toLowerCase().includes(search.toLowerCase()) ||
    (u.owner_email ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const totalClicks = urls.reduce((sum, u) => sum + (u.clicks || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{urls.length} URLs</span>
          <span>{totalClicks.toLocaleString()} total clicks</span>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search slug, URL, owner..."
              className="pl-7 pr-3 py-1.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <Button variant="outlined" size="sm" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><LoadingIndicator className="w-6 h-6" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">No short URLs found.</div>
      ) : (
        <div className="rounded-xl border border-outline/20 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-variant/50 border-b border-outline/15">
              <tr>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Slug</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Original URL</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Owner</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Clicks</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Created</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Expires</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-outline/10 hover:bg-surface-variant/30">
                  <td className="py-2 px-3 font-mono text-foreground">
                    <a href={u.short_url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                      /s/{u.slug}
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </a>
                  </td>
                  <td className="py-2 px-3 text-muted-foreground max-w-xs truncate" title={u.original_url}>{u.original_url}</td>
                  <td className="py-2 px-3 text-muted-foreground">{u.owner_email ?? <span className="text-muted-foreground/50">unknown</span>}</td>
                  <td className="py-2 px-3 text-right tabular-nums">{u.clicks.toLocaleString()}</td>
                  <td className="py-2 px-3 text-muted-foreground whitespace-nowrap">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="py-2 px-3 text-muted-foreground whitespace-nowrap">
                    {u.expires_at ? new Date(u.expires_at).toLocaleDateString() : <span className="text-muted-foreground/50">never</span>}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={() => setDeleteTarget(u)}
                      title="Delete"
                      className="p-1.5 rounded-md text-error hover:bg-error/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete short URL?"
        description={`This will permanently remove /s/${deleteTarget?.slug}. All future visits to this short URL will 404. This cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
