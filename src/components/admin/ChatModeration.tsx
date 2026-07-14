'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trash2, Search, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { adminListChatMessages, adminDeleteChatMessage, type AdminChatMessage } from '@/lib/auth';
import { LoadingIndicator } from '@/components/shared/LoadingIndicator';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';

/**
 * Admin: Chat moderation — lists recent chat messages across ALL users, with
 * admin-delete. Uses admin_list_chat_messages + delete_message_admin RPCs
 * (both admin-verified). This is the dedicated moderation view the task asked
 * for; previously the only way to delete a message was inline in the chat
 * popup, and the RLS policy allowed ANY client to delete ANY message.
 */
export function ChatModeration() {
  const [messages, setMessages] = useState<AdminChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminChatMessage | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { messages, error } = await adminListChatMessages(200, 0);
    if (error) {
      toast.error(`Failed to load messages: ${error}`);
      setMessages([]);
    } else {
      setMessages(messages ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await adminDeleteChatMessage(deleteTarget.id);
    if (error) {
      toast.error(`Delete failed: ${error}`);
    } else {
      toast.success('Message deleted.');
      setMessages(prev => prev.filter(m => m.id !== deleteTarget.id));
    }
    setDeleting(false);
    setDeleteTarget(null);
  }

  const filtered = messages.filter(m =>
    !search ||
    m.message.toLowerCase().includes(search.toLowerCase()) ||
    m.user_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm text-muted-foreground">
          {messages.length} recent messages
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search content, user..."
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
        <div className="text-center py-12 text-sm text-muted-foreground">No messages found.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(m => (
            <div key={m.id} className="flex items-start gap-3 p-3 bg-surface-container rounded-lg">
              {(m.avatar_url || m.user_image) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.avatar_url || m.user_image || ''} alt={m.user_name} className="w-8 h-8 rounded-full shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary shrink-0">
                  {m.user_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{m.user_name}</span>
                  <span>·</span>
                  <span>{new Date(m.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-foreground mt-0.5 break-words whitespace-pre-wrap">{m.message}</p>
              </div>
              <button
                onClick={() => setDeleteTarget(m)}
                title="Delete message"
                className="p-1.5 rounded-md text-error hover:bg-error/10 transition-colors shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete message?"
        description={`This will permanently delete the message from ${deleteTarget?.user_name}. This cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
