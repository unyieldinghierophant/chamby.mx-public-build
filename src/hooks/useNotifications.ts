import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
    if (!user) return;

    const { data, error } = await supabase
      .from<any>("job_notifications")
      .select(
        `
        id,
        job_id,
        provider_id,
        sent_at,
        seen_at,
        jobs (
          title,
          description
        )
      `,
      )
      .eq("provider_id", user.id)
      .order("sent_at", { ascending: false });

    if (error) {
      console.error("fetchNotifications error:", error);
      setLoading(false);
      return;
    }

    const formatted = data.map((n: any) => ({
      id: n.id,
      read: n.seen_at !== null,
      type: "new_job",
      title: n.jobs?.title ?? "Nuevo trabajo disponible",
      message: n.jobs?.description ?? "Un cliente ha solicitado un servicio.",
      created_at: n.sent_at,
    }));

    setNotifications(formatted);
    setUnreadCount(formatted.filter((n) => !n.read).length);
    setLoading(false);
  };

  const markAsRead = async (notificationId: string) => {
    await supabase.from("job_notifications").update({ seen_at: new Date().toISOString() }).eq("id", notificationId);

    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));

    setUnreadCount((prev) => Math.max(prev - 1, 0));
  };

  const markAllAsRead = async () => {
    if (!user) return;

    await supabase
      .from("job_notifications")
      .update({ seen_at: new Date().toISOString() })
      .eq("provider_id", user.id)
      .is("seen_at", null);

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    const channel = supabase
      .channel("job_notifications_rt")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "job_notifications",
          filter: `provider_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as any;

          const newNotification: Notification = {
            id: n.id,
            read: false,
            type: "new_job",
            title: "Nuevo trabajo disponible",
            message: "Un cliente ha solicitado un servicio.",
            created_at: n.sent_at,
          };

          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
