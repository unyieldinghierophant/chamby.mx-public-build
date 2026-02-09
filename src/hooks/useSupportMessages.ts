import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SupportMessage {
  id: string;
  provider_id: string;
  sender_id: string;
  message_text: string;
  read: boolean;
  created_at: string;
}

/** Hook for provider-side support chat */
export const useSupportMessages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await (supabase as any)
        .from('support_messages')
        .select('*')
        .eq('provider_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('[useSupportMessages] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Mark unread messages from admins as read
  const markAsRead = useCallback(async () => {
    if (!user || messages.length === 0) return;
    const unread = messages.filter(m => !m.read && m.sender_id !== user.id);
    if (unread.length === 0) return;

    await (supabase as any)
      .from('support_messages')
      .update({ read: true })
      .eq('provider_id', user.id)
      .neq('sender_id', user.id)
      .eq('read', false);

    setMessages(prev => prev.map(m => ({ ...m, read: true })));
  }, [user, messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!user || !text.trim()) return;
    setSending(true);
    try {
      const { data, error } = await (supabase as any)
        .from('support_messages')
        .insert({
          provider_id: user.id,
          sender_id: user.id,
          message_text: text.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      setMessages(prev => [...prev, data]);
    } catch (err) {
      console.error('[useSupportMessages] send error:', err);
      throw err;
    } finally {
      setSending(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('support_messages_provider')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `provider_id=eq.${user.id}`,
        },
        (payload) => {
          const newMsg = payload.new as SupportMessage;
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const unreadCount = messages.filter(m => !m.read && m.sender_id !== user?.id).length;

  return { messages, loading, sending, sendMessage, markAsRead, unreadCount, refetch: fetchMessages };
};

/** Hook for admin-side support chat */
export const useAdminSupportMessages = (providerId?: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!providerId) { setLoading(false); return; }
    try {
      const { data, error } = await (supabase as any)
        .from('support_messages')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('[useAdminSupportMessages] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  const markAsRead = useCallback(async () => {
    if (!providerId || !user) return;
    await (supabase as any)
      .from('support_messages')
      .update({ read: true })
      .eq('provider_id', providerId)
      .neq('sender_id', user.id)
      .eq('read', false);
    
    setMessages(prev => prev.map(m => ({ ...m, read: true })));
  }, [providerId, user]);

  const sendMessage = useCallback(async (text: string) => {
    if (!user || !providerId || !text.trim()) return;
    setSending(true);
    try {
      const { data, error } = await (supabase as any)
        .from('support_messages')
        .insert({
          provider_id: providerId,
          sender_id: user.id,
          message_text: text.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      setMessages(prev => [...prev, data]);
    } catch (err) {
      console.error('[useAdminSupportMessages] send error:', err);
      throw err;
    } finally {
      setSending(false);
    }
  }, [user, providerId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime
  useEffect(() => {
    if (!providerId) return;
    const channel = supabase
      .channel(`support_messages_admin_${providerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `provider_id=eq.${providerId}`,
        },
        (payload) => {
          const newMsg = payload.new as SupportMessage;
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [providerId]);

  return { messages, loading, sending, sendMessage, markAsRead, refetch: fetchMessages };
};

/** Hook to get all provider threads for admin inbox */
export const useAdminSupportInbox = () => {
  const [threads, setThreads] = useState<Array<{
    provider_id: string;
    provider_name: string | null;
    last_message: string;
    last_message_at: string;
    unread_count: number;
  }>>([]);
  const [loading, setLoading] = useState(true);

  const fetchThreads = useCallback(async () => {
    try {
      // Get all unique provider_ids with messages
      const { data: allMessages, error } = await (supabase as any)
        .from('support_messages')
        .select('provider_id, message_text, created_at, read, sender_id')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by provider_id
      const providerMap = new Map<string, {
        provider_id: string;
        last_message: string;
        last_message_at: string;
        unread_count: number;
      }>();

      for (const msg of allMessages || []) {
        if (!providerMap.has(msg.provider_id)) {
          providerMap.set(msg.provider_id, {
            provider_id: msg.provider_id,
            last_message: msg.message_text,
            last_message_at: msg.created_at,
            unread_count: 0,
          });
        }
        // Count unread from providers (not from admin)
        if (!msg.read && msg.sender_id === msg.provider_id) {
          const entry = providerMap.get(msg.provider_id)!;
          entry.unread_count++;
        }
      }

      // Fetch provider names
      const providerIds = Array.from(providerMap.keys());
      const { data: providers } = await supabase
        .from('providers')
        .select('user_id, display_name')
        .in('user_id', providerIds);

      const nameMap = new Map<string, string | null>();
      for (const p of providers || []) {
        nameMap.set(p.user_id, p.display_name);
      }

      const result = Array.from(providerMap.values())
        .map(t => ({ ...t, provider_name: nameMap.get(t.provider_id) || null }))
        .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

      setThreads(result);
    } catch (err) {
      console.error('[useAdminSupportInbox] error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  return { threads, loading, refetch: fetchThreads };
};
