import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Chat message type
export interface ChatMessage {
  id: string;
  user_id: string;
  user_name: string;
  user_image?: string;
  message: string;
  created_at: string;
}

// Fetch all messages
export async function fetchMessages(): Promise<ChatMessage[]> {
  const { data, error } = await supabase
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

// Subscribe to new messages and deletions
export function subscribeToMessages(
  onInsert: (message: ChatMessage) => void,
  onDelete?: (id: string) => void
) {
  return supabase
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

// Send a message
export async function sendMessage(
  userId: string,
  userName: string,
  userImage: string | null,
  message: string
): Promise<boolean> {
  const { error } = await supabase.from('chat_messages').insert({
    user_id: userId,
    user_name: userName,
    user_image: userImage,
    message: message.trim(),
  });

  if (error) {
    console.error('Error sending message:', error);
    return false;
  }

  return true;
}

// Delete a message — only own messages (client-side verification)
export async function deleteMessage(messageId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('id', messageId)
    .eq('user_id', userId); // Only delete if the message belongs to this user

  if (error) {
    console.error('Error deleting message:', error);
    return false;
  }

  return true;
}
