import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;
let _initPromise: Promise<SupabaseClient> | null = null;
let _initError: Error | null = null;

const MAX_RETRIES = 3;
const RETRY_DELAY = 500;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createSupabaseClientWithRetry(attempt = 1): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Supabase environment variables not configured. ' +
      'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  try {
    const client = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: { 'x-client-info': 'revy-portfolio' },
      },
      // Add request timeout via fetch
      db: {
        schema: 'public',
      },
    });

    // Verify connection with a lightweight health check
    const { error } = await client.from('portfolio_data').select('count', { count: 'exact', head: true });
    // Connection works even if table doesn't exist or no data
    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows, which is fine. Other errors might indicate connection issues
      console.warn(`[Supabase] Health check warning (attempt ${attempt}):`, error.message);
    }

    return client;
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      console.warn(`[Supabase] Connection attempt ${attempt} failed, retrying in ${RETRY_DELAY}ms...`);
      await delay(RETRY_DELAY * attempt);
      return createSupabaseClientWithRetry(attempt + 1);
    }
    throw err instanceof Error
      ? err
      : new Error('Failed to initialize Supabase client after ' + MAX_RETRIES + ' attempts');
  }
}

export async function getSupabase(): Promise<SupabaseClient> {
  // Return cached instance
  if (_supabase) return _supabase;

  // Return existing promise if initialization is in progress
  if (_initPromise) return _initPromise;

  // If we previously failed, try again (don't cache permanent failure)
  if (_initError) {
    _initError = null;
  }

  _initPromise = createSupabaseClientWithRetry()
    .then(client => {
      _supabase = client;
      _initError = null;
      return client;
    })
    .catch(err => {
      _initError = err instanceof Error ? err : new Error('Unknown Supabase init error');
      _initPromise = null;
      throw _initError;
    });

  return _initPromise;
}

/**
 * Synchronous access to the Supabase client.
 * Throws if not yet initialized. Use getSupabase() for async access.
 */
export function supabase(): SupabaseClient {
  if (!_supabase) {
    throw new Error(
      'Supabase not initialized. Call getSupabase() first and await it, ' +
      'or use supabase() only after initialization is confirmed.'
    );
  }
  return _supabase;
}

/**
 * Reset the Supabase client (useful for testing or reconnection scenarios)
 */
export function resetSupabase(): void {
  _supabase = null;
  _initPromise = null;
  _initError = null;
}

// Pre-warm the connection in browser environments
if (typeof window !== 'undefined') {
  getSupabase().catch(() => {
    // Pre-warm failure is non-fatal; will retry on actual usage
  });
}

// ─── Chat Types & Helpers ───────────────────────────────────────────

export interface ChatMessage {
  id: string;
  user_id: string;
  user_name: string;
  user_image?: string;
  message: string;
  created_at: string;
}

export async function fetchMessages(): Promise<ChatMessage[]> {
  try {
    const client = await getSupabase();
    const { data, error } = await client
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Error fetching messages:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Failed to fetch messages:', err instanceof Error ? err.message : 'Unknown error');
    return [];
  }
}

export function subscribeToMessages(
  onInsert: (message: ChatMessage) => void,
  onDelete?: (id: string) => void
) {
  // Use supabase() directly for realtime since it should be initialized by now
  const client = _supabase;
  if (!client) {
    console.error('[Supabase] Cannot subscribe to messages: client not initialized');
    return { unsubscribe: () => {} };
  }

  return client
    .channel('chat_messages')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages' },
      (payload) => {
        onInsert(payload.new as ChatMessage);
      }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'chat_messages' },
      (payload) => {
        if (onDelete) onDelete(payload.old.id as string);
      }
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        console.error('[Supabase] Chat subscription channel error');
      }
    });
}

export async function sendMessage(
  userId: string,
  userName: string,
  userImage: string | null,
  message: string
): Promise<boolean> {
  const trimmed = message.trim();
  if (!trimmed || trimmed.length > 500) return false;

  try {
    const client = await getSupabase();
    const { error } = await client.from('chat_messages').insert({
      user_id: userId,
      user_name: userName,
      user_image: userImage,
      message: trimmed,
    });

    if (error) {
      console.error('Error sending message:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to send message:', err instanceof Error ? err.message : 'Unknown error');
    return false;
  }
}

export async function deleteMessage(messageId: string, _userId: string): Promise<boolean> {
  // Phase 7b security fix: the chat_delete RLS policy is now `using (false)`
  // (denies all direct deletes). Self-deletes must go through the
  // delete_own_message RPC, which validates the session token AND checks
  // ownership server-side. The _userId param is kept for API compatibility
  // but no longer trusted — the server re-checks ownership.
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('app_session_token') : null;
    if (!token) return false;
    const client = await getSupabase();
    const { data, error } = await client.rpc('delete_own_message', {
      p_token: token,
      p_message_id: messageId,
    });
    if (error) {
      console.error('Error deleting message:', error.message);
      return false;
    }
    return (data as { success?: boolean })?.success === true;
  } catch (err) {
    console.error('Failed to delete message:', err instanceof Error ? err.message : 'Unknown error');
    return false;
  }
}

export async function deleteMessageAdmin(messageId: string): Promise<boolean> {
  // Phase 7b security fix: previously this did a direct client-side delete
  // relying on the permissive `chat_delete` RLS policy (`using (true)`), which
  // meant ANY client (not just admins) could delete ANY message. Now it goes
  // through the delete_message_admin RPC, which calls verify_admin_internal.
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('app_session_token') : null;
    if (!token) return false;
    const client = await getSupabase();
    const { data, error } = await client.rpc('delete_message_admin', {
      p_token: token,
      p_message_id: messageId,
    });
    if (error) {
      console.error('Error deleting message (admin):', error.message);
      return false;
    }
    return (data as { success?: boolean })?.success === true;
  } catch (err) {
    console.error('Failed to delete message (admin):', err instanceof Error ? err.message : 'Unknown error');
    return false;
  }
}
