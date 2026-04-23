import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChatAttachment { url: string; type: string; name: string }

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: 'admin' | 'client' | 'provider';
  message: string;
  attachments: ChatAttachment[] | null;
  is_read: boolean;
  created_at: string;
}

export interface ConversationRow {
  id: string;
  type: 'dispute_client' | 'dispute_provider' | 'support';
  booking_id: string | null;
  dispute_id: string | null;
  participant_user_id: string;
  participant_name: string | null;
  participant_role: 'client' | 'provider' | null;
  last_message_text: string | null;
  last_message_at: string | null;
  unread_count_admin: number;
  unread_count_user: number;
  created_at: string;
}

/**
 * Subscribe to a single conversation's messages with realtime INSERTs.
 * Marks new inbound messages as read when rendered.
 */
export function useChat(conversationId: string | null, viewerRole: 'admin' | 'participant' = 'admin') {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const loadedFor = useRef<string | null>(null);

  const markRead = useCallback(async (ids: string[]) => {
    if (!ids.length || !conversationId) return;
    await (supabase as any).from('chat_messages').update({ is_read: true }).in('id', ids);
    const counterField = viewerRole === 'admin' ? 'unread_count_admin' : 'unread_count_user';
    await (supabase as any).from('conversations').update({ [counterField]: 0 }).eq('id', conversationId);
  }, [conversationId, viewerRole]);

  useEffect(() => {
    if (!conversationId) { setMessages([]); setLoading(false); return; }
    loadedFor.current = conversationId;
    setLoading(true);

    (async () => {
      const { data } = await (supabase as any)
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      if (loadedFor.current !== conversationId) return;
      const rows = (data ?? []) as ChatMessage[];
      setMessages(rows);
      setLoading(false);

      const unreadFromOther = rows
        .filter(m => !m.is_read && (viewerRole === 'admin' ? m.sender_role !== 'admin' : m.sender_role === 'admin'))
        .map(m => m.id);
      if (unreadFromOther.length) markRead(unreadFromOther);
    })();

    const channel = supabase
      .channel(`chat_${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const msg = payload.new as ChatMessage;
          setMessages(prev => (prev.some(m => m.id === msg.id) ? prev : [...prev, msg]));
          const isFromOther = viewerRole === 'admin' ? msg.sender_role !== 'admin' : msg.sender_role === 'admin';
          if (isFromOther) markRead([msg.id]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, viewerRole, markRead]);

  const sendMessage = useCallback(async (opts: {
    senderId: string;
    senderRole: 'admin' | 'client' | 'provider';
    message: string;
    attachments?: ChatAttachment[];
  }) => {
    if (!conversationId || !opts.message.trim()) return;
    const { error } = await (supabase as any).from('chat_messages').insert({
      conversation_id: conversationId,
      sender_id: opts.senderId,
      sender_role: opts.senderRole,
      message: opts.message.trim(),
      attachments: opts.attachments?.length ? opts.attachments : null,
      is_read: false,
    });
    if (error) throw error;
  }, [conversationId]);

  return { messages, loading, sendMessage, markRead };
}

/**
 * Fetch the list of conversations for a given type. Subscribes to realtime
 * updates on the conversations table so the list stays fresh.
 */
export function useConversations(type: 'support' | 'dispute_client' | 'dispute_provider' | 'all') {
  const [rows, setRows] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    let q = (supabase as any).from('conversations').select('*').order('last_message_at', { ascending: false, nullsFirst: false });
    if (type !== 'all') q = q.eq('type', type);
    const { data } = await q;
    setRows((data ?? []) as ConversationRow[]);
    setLoading(false);
  }, [type]);

  useEffect(() => {
    refetch();
    const channel = supabase
      .channel(`conversations_${type}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => { refetch(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [type, refetch]);

  return { conversations: rows, loading, refetch };
}

/**
 * Ensure a conversation exists (no-op if it already does). Returns the id.
 * Admin-only — uses the caller's auth. Fails silently for non-admins.
 */
export async function ensureConversation(row: Partial<ConversationRow> & {
  id: string;
  type: 'dispute_client' | 'dispute_provider' | 'support';
  participant_user_id: string;
}) {
  await (supabase as any).from('conversations').upsert(row, { onConflict: 'id', ignoreDuplicates: true });
}
