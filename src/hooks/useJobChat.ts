import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ChatMessage {
  id: string;
  job_id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  is_system_message: boolean;
  system_event_type: string | null;
  read: boolean;
  created_at: string;
}

export const useJobChat = (jobId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherParty, setOtherParty] = useState<{ id: string; full_name: string | null } | null>(null);
  const fetchedRef = useRef(false);

  const fetchMessages = useCallback(async () => {
    if (!jobId || !user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[useJobChat] fetch error:', error);
    }
    setMessages((data || []) as ChatMessage[]);

    // Mark unread as read
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('job_id', jobId)
      .eq('receiver_id', user.id)
      .eq('read', false);

    // Fetch the other party info
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      const { data: jobData } = await supabase
        .from('jobs')
        .select('client_id, provider_id')
        .eq('id', jobId)
        .single();

      if (jobData) {
        const otherId = jobData.client_id === user.id ? jobData.provider_id : jobData.client_id;
        if (otherId) {
          const { data: userData } = await supabase
            .from('users')
            .select('id, full_name')
            .eq('id', otherId)
            .maybeSingle();
          if (userData) {
            // If it's a provider, try to get display_name
            const { data: providerData } = await supabase
              .from('providers')
              .select('display_name')
              .eq('user_id', otherId)
              .maybeSingle();
            setOtherParty({
              id: userData.id,
              full_name: providerData?.display_name || userData.full_name,
            });
          }
        }
      }
    }

    setLoading(false);
  }, [jobId, user]);

  const sendMessage = useCallback(async (text: string) => {
    if (!user || !jobId || !text.trim()) return;
    setSending(true);

    // Get receiver from job
    const { data: jobData } = await supabase
      .from('jobs')
      .select('client_id, provider_id')
      .eq('id', jobId)
      .single();

    if (!jobData || !jobData.provider_id) {
      setSending(false);
      throw new Error('No se puede enviar mensaje: trabajo sin proveedor asignado');
    }

    const receiverId = jobData.client_id === user.id ? jobData.provider_id : jobData.client_id;

    const { error } = await supabase.from('messages').insert({
      job_id: jobId,
      sender_id: user.id,
      receiver_id: receiverId,
      message_text: text.trim(),
      is_system_message: false,
      read: false,
    });

    if (error) {
      console.error('[useJobChat] send error:', error);
      setSending(false);
      throw error;
    }
    setSending(false);
  }, [user, jobId]);

  useEffect(() => {
    fetchedRef.current = false;
    fetchMessages();
  }, [fetchMessages]);

  // Realtime
  useEffect(() => {
    if (!jobId || !user) return;
    const channel = supabase
      .channel(`job-chat-${jobId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `job_id=eq.${jobId}`,
      }, (payload) => {
        const msg = payload.new as ChatMessage;
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        // Mark as read if we're the receiver
        if (msg.receiver_id === user.id) {
          supabase.from('messages').update({ read: true }).eq('id', msg.id);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [jobId, user]);

  return { messages, loading, sending, sendMessage, otherParty, refetch: fetchMessages };
};

/** Hook to list all job conversations for the current user */
export const useJobConversations = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Array<{
    job_id: string;
    job_title: string;
    job_category: string;
    job_status: string;
    other_party_id: string;
    other_party_name: string | null;
    last_message: string;
    last_message_at: string;
    unread_count: number;
  }>>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    try {
      // Get all jobs where user is client or provider AND has messages
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, title, category, status, client_id, provider_id')
        .or(`client_id.eq.${user.id},provider_id.eq.${user.id}`)
        .not('provider_id', 'is', null);

      if (!jobs || jobs.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const jobIds = jobs.map(j => j.id);

      // Get messages for these jobs
      const { data: allMessages } = await supabase
        .from('messages')
        .select('job_id, message_text, created_at, read, receiver_id, is_system_message')
        .in('job_id', jobIds)
        .order('created_at', { ascending: false });

      if (!allMessages || allMessages.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Group by job_id
      const jobMsgMap = new Map<string, {
        last_message: string;
        last_message_at: string;
        unread_count: number;
      }>();

      for (const msg of allMessages) {
        if (!jobMsgMap.has(msg.job_id)) {
          jobMsgMap.set(msg.job_id, {
            last_message: msg.message_text,
            last_message_at: msg.created_at,
            unread_count: 0,
          });
        }
        if (!msg.read && msg.receiver_id === user.id && !msg.is_system_message) {
          const entry = jobMsgMap.get(msg.job_id)!;
          entry.unread_count++;
        }
      }

      // Only include jobs that have messages
      const jobsWithMessages = jobs.filter(j => jobMsgMap.has(j.id));

      // Fetch other party names
      const otherIds = jobsWithMessages.map(j => 
        j.client_id === user.id ? j.provider_id : j.client_id
      ).filter(Boolean) as string[];

      const uniqueOtherIds = [...new Set(otherIds)];

      const { data: users } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', uniqueOtherIds);

      const { data: providers } = await supabase
        .from('providers')
        .select('user_id, display_name')
        .in('user_id', uniqueOtherIds);

      const nameMap = new Map<string, string | null>();
      for (const u of users || []) nameMap.set(u.id, u.full_name);
      for (const p of providers || []) {
        if (p.display_name) nameMap.set(p.user_id, p.display_name);
      }

      const result = jobsWithMessages.map(j => {
        const otherId = j.client_id === user.id ? j.provider_id! : j.client_id;
        const msgInfo = jobMsgMap.get(j.id)!;
        return {
          job_id: j.id,
          job_title: j.title,
          job_category: j.category,
          job_status: j.status || 'pending',
          other_party_id: otherId,
          other_party_name: nameMap.get(otherId) || null,
          ...msgInfo,
        };
      }).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

      setConversations(result);
    } catch (err) {
      console.error('[useJobConversations] error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return { conversations, loading, refetch: fetchConversations };
};
