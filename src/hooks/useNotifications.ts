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
    // Notifications system disabled - job_notifications table removed
    setLoading(false);
  };

  const markAsRead = async (notificationId: string) => {
    // Notifications system disabled
  };

  const markAllAsRead = async () => {
    // Notifications system disabled
  };

  useEffect(() => {
    fetchNotifications();
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
