import { useMemo } from "react";
import { useNotifications, Notification } from "@/hooks/useNotifications";

// Provider-relevant notification types
const PROVIDER_NOTIFICATION_TYPES = [
  'job_assigned',
  'job_cancelled',
  'new_job',
  'new_job_available',
  'payment_received',
  'payment',
  'review_received',
  'payout_completed',
  'verification_approved',
  'verification_rejected',
  'reschedule_request',
  'reschedule_approved',
  'reschedule_rejected',
  'visit_confirmed',
  'client_confirmed_visit',
  'invoice_paid',
];

export const useProviderNotifications = () => {
  const { 
    notifications, 
    unreadCount: totalUnreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    refetch 
  } = useNotifications();

  // Filter notifications to only show provider-relevant types
  const providerNotifications = useMemo(() => {
    return notifications.filter((notification: Notification) => 
      PROVIDER_NOTIFICATION_TYPES.includes(notification.type)
    );
  }, [notifications]);

  // Calculate unread count for provider notifications only
  const unreadCount = useMemo(() => {
    return providerNotifications.filter((n: Notification) => !n.read).length;
  }, [providerNotifications]);

  return {
    notifications: providerNotifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch,
  };
};
