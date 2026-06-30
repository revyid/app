import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

export async function getSupabase(): Promise<SupabaseClient> {
  if (_supabase) return _supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars not configured');
  _supabase = createClient(url, key);
  return _supabase;
}

export function supabase(): SupabaseClient {
  if (!_supabase) throw new Error('Supabase not initialized. Call getSupabase() first.');
  return _supabase;
}

getSupabase().catch(() => {});

export interface ChatMessage {
  id: string;
  user_id: string;
  user_name: string;
  user_image?: string;
  message: string;
  created_at: string;
}

export async function fetchMessages(): Promise<ChatMessage[]> {
  const client = await getSupabase();
  const { data, error } = await client
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return data || [];
}

export function subscribeToMessages(
  onInsert: (message: ChatMessage) => void,
  onDelete?: (id: string) => void
) {
  const client = supabase();
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
    .subscribe();
}

export async function sendMessage(
  userId: string,
  userName: string,
  userImage: string | null,
  message: string
): Promise<boolean> {
  const trimmed = message.trim();
  if (!trimmed || trimmed.length > 500) return false;

  const client = await getSupabase();
  const { error } = await client.from('chat_messages').insert({
    user_id: userId,
    user_name: userName,
    user_image: userImage,
    message: trimmed,
  });

  if (error) {
    console.error('Error sending message:', error);
    return false;
  }

  return true;
}

export async function deleteMessage(messageId: string, userId: string): Promise<boolean> {
  const client = await getSupabase();
  const { error } = await client
    .from('chat_messages')
    .delete()
    .eq('id', messageId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting message:', error);
    return false;
  }

  return true;
}

export async function deleteMessageAdmin(messageId: string): Promise<boolean> {
  const client = await getSupabase();
  const { error } = await client
    .from('chat_messages')
    .delete()
    .eq('id', messageId);

  if (error) {
    console.error('Error deleting message (admin):', error);
    return false;
  }

  return true;
}
