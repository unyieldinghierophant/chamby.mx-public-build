console.log("🚀 useFCMToken file loaded");
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { firebaseConfig, VAPID_KEY } from "@/lib/firebase";

export const useFCMToken = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    console.log("🔍 useFCMToken useEffect running");
    if (!user) return;

    const registerFCM = async () => {
      try {
        // Check if service worker and Firebase are supported
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
          console.log("Push notifications not supported");
          return;
        }

        // Request notification permission
        const permission = await Notification.requestPermission();

        if (permission !== "granted") {
          console.log("Notification permission denied");
          return;
        }

        console.log("Notification permission granted");

        // Dynamically import Firebase to avoid type checker issues
        const { initializeApp } = await import("firebase/app");
        const { getMessaging, getToken, onMessage } = await import("firebase/messaging");

        const app = initializeApp(firebaseConfig);
        const messaging = getMessaging(app);

        // Get FCM token
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });

        if (token) {
          console.log("FCM token obtained");

          // Store token in Supabase provider_details
          const { error } = await supabase.from("provider_details").update({ fcm_token: token }).eq("user_id", user.id);

          if (error) {
            console.error("Error storing FCM token:", error);
          } else {
            console.log("FCM token registered successfully");
          }

          // Handle foreground messages
          onMessage(messaging, (payload: any) => {
            console.log("Foreground message received:", payload);

            toast({
              title: payload.notification?.title || "Nueva notificación",
              description: payload.notification?.body,
              duration: 5000,
            });
          });
        }
      } catch (error) {
        console.error("Error setting up FCM:", error);
      }
    };

    registerFCM();
  }, [user, toast]);
};
