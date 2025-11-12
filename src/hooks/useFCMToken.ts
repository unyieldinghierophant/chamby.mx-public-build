import { useEffect, useState } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "@/lib/firebase";

/**
 * useFCMToken hook
 * Requests permission for notifications, retrieves the FCM token,
 * and listens for incoming messages (foreground notifications).
 */
export function useFCMToken() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    async function requestPermissionAndToken() {
      try {
        // Ask browser for notification permission
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.warn("🔕 Notification permission not granted by user.");
          return;
        }

        // Get registration token from Firebase Messaging
        const currentToken = await getToken(messaging, {
          vapidKey: "BCK5XVCFGLZVgxpbDA2DwfTLcHk0o2bJma-0t6i434_PhLnD5M1dAf7VNl_Zk8bWV2Gb0ZQUbG32ULgU5_uBcHA",
        });

        if (currentToken) {
          console.log("✅ FCM Token acquired:", currentToken);
          setToken(currentToken);
        } else {
          console.warn("⚠️ No registration token available (permission blocked or missing SW).");
        }
      } catch (error) {
        console.error("❌ Error while retrieving FCM token:", error);
      }
    }

    requestPermissionAndToken();

    // Listen for foreground notifications
    onMessage(messaging, (payload) => {
      console.log("📨 Foreground message received:", payload);
      if (payload?.notification) {
        const { title, body } = payload.notification;
        new Notification(title || "Chamby", { body: body || "Tienes una nueva notificación." });
      }
    });
  }, []);

  return token;
}
