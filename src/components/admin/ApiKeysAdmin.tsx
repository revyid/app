'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trash2, Search, RefreshCw, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { adminListApiKeys, adminDeleteApiKey, type AdminApiKey } from '@/lib/auth';
import { LoadingIndicator } from '@/components/shared/LoadingIndicator';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';

/**
 * Admin: API key oversight — lists ALL API keys across ALL users, with owner
 * email, last-used time, expiry, active state, and admin-revoke. Uses the
 * admin_list_api_keys and admin_delete_api_key RPCs (both admin-verified).
 *
 * Does NOT support creating keys on behalf of users (admins should not mint
 * keys for users — that's the user's own job from /dashboard/api-keys).
 */
export function ApiKeysAdmin() {
  const [keys, setKeys] = useState<AdminApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminApiKey | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { keys, error } = await adminListApiKeys();
    if (error) {
      toast.error(`Failed to load API keys: ${error}`);
      setKeys([]);
    } else {
      setKeys(keys ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await adminDeleteApiKey(deleteTarget.id);
    if (error) {
      toast.error(`Revoke failed: ${error}`);
    } else {
      toast.success(`Revoked key "${deleteTarget.name}"`);
      setKeys(prev => prev.filter(k => k.id !== deleteTarget.id));
    }
    setDeleting(false);
    setDeleteTarget(null);
  }

  const filtered = keys.filter(k =>
    !search ||
    k.name.toLowerCase().includes(search.toLowerCase()) ||
    k.key_prefix.toLowerCase().includes(search.toLowerCase()) ||
    (k.owner_email ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = keys.filter(k => k.is_active).length;
  const usedToday = keys.filter(k => k.last_used_at && (Date.now() - new Date(k.last_used_at).getTime()) < 86400000).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{keys.length} keys ({activeCount} active)</span>
          <span>{usedToday} used in last 24h</span>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, prefix, owner..."
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
        <div className="text-center py-12 text-sm text-muted-foreground">No API keys found.</div>
      ) : (
        <div className="rounded-xl border border-outline/20 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-variant/50 border-b border-outline/15">
              <tr>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Prefix</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Owner</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Created</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Last Used</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Expires</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(k => (
                <tr key={k.id} className="border-b border-outline/10 hover:bg-surface-variant/30">
                  <td className="py-2 px-3 text-foreground flex items-center gap-2">
                    <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
                    {k.name || <span className="text-muted-foreground/50">unnamed</span>}
                  </td>
                  <td className="py-2 px-3 font-mono text-muted-foreground">{k.key_prefix}…</td>
                  <td className="py-2 px-3 text-muted-foreground">{k.owner_email ?? <span className="text-muted-foreground/50">unknown</span>}</td>
                  <td className="py-2 px-3">
                    {k.is_active ? (
                      <span className="px-2 py-0.5 rounded bg-success/15 text-success text-xs font-medium">active</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-error/15 text-error text-xs font-medium">revoked</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-muted-foreground whitespace-nowrap">{new Date(k.created_at).toLocaleDateString()}</td>
                  <td className="py-2 px-3 text-muted-foreground whitespace-nowrap">
                    {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : <span className="text-muted-foreground/50">never</span>}
                  </td>
                  <td className="py-2 px-3 text-muted-foreground whitespace-nowrap">
                    {k.expires_at ? new Date(k.expires_at).toLocaleDateString() : <span className="text-muted-foreground/50">never</span>}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={() => setDeleteTarget(k)}
                      title="Revoke key"
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
        title="Revoke API key?"
        description={`This will permanently revoke "${deleteTarget?.name}" (${deleteTarget?.key_prefix}…). The owner will need to create a new key. This cannot be undone.`}
        confirmLabel="Revoke"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
