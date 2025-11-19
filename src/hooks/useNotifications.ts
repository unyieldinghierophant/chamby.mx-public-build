import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentProfile } from "@/lib/profile";

export interface Notification {
  id: string;
  read: boolean;
  type: string;
  title: string;
  message: string;
  created_at: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Get profile first to get profiles.id
    const profile = await getCurrentProfile();
    if (!profile) {
      console.error("No profile found for user");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("job_notifications")
      .select("id, sent_at, seen_at, job_id")
      .eq("provider_id", profile.id)
      .order("sent_at", { ascending: false });

    if (error) {
      console.error("fetchNotifications error:", error);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as any[];

    const formatted: Notification[] = rows.map((n) => ({
      id: n.id,
      read: !!n.seen_at,
      type: "new_job",
      title: "Nuevo trabajo disponible",
      message: "Un cliente ha solicitado un servicio.",
      created_at: n.sent_at,
    }));

    setNotifications(formatted);
    setUnreadCount(formatted.filter((n) => !n.read).length);
    setLoading(false);
  };

  const markAsRead = async (notificationId: string) => {
    // @ts-ignore
    await supabase.from("job_notifications").update({ seen_at: new Date().toISOString() }).eq("id", notificationId);

    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));

    setUnreadCount((prev) => Math.max(prev - 1, 0));
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const profile = await getCurrentProfile();
    if (!profile) return;

    await supabase
      .from("job_notifications")
      .update({ seen_at: new Date().toISOString() })
      .eq("provider_id", profile.id)
      .is("seen_at", null);

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  useEffect(() => {
    if (!user) return;

    let channel: any;

    const setupRealtimeSubscription = async () => {
      const profile = await getCurrentProfile();
      if (!profile) return;

      fetchNotifications();

      channel = supabase
        .channel("job_notifications_rt")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "job_notifications",
            filter: `provider_id=eq.${profile.id}`,
        },
        (payload) => {
          const n = payload.new as any;

          const newNotification: Notification = {
            id: n.id,
            read: false,
            type: "new_job",
            title: "Nuevo trabajo disponible",
            message: "Un cliente ha solicitado un servicio.",
            created_at: n.sent_at ?? new Date().toISOString(),
          };

          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        },
      )
      .subscribe();
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
};
