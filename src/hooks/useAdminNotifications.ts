import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAdminNotifications(enabled: boolean) {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!enabled) return;
    const { count } = await (supabase as any)
      .from("admin_notifications")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false);
    setUnreadCount(count ?? 0);
  }, [enabled]);

  const markAllRead = useCallback(async () => {
    if (!enabled) return;
    await (supabase as any)
      .from("admin_notifications")
      .update({ is_read: true })
      .eq("is_read", false);
    setUnreadCount(0);
  }, [enabled]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  return { unreadCount, markAllRead, refetch: fetchCount };
}
