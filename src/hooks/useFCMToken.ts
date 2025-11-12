import { useEffect } from 'react';
import { getToken, messaging, onMessage } from '@/lib/firebase';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useFCMToken = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user || !messaging) return;

    const requestPermissionAndRegister = async () => {
      try {
        // Request notification permission
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          console.log('Notification permission granted');
          
          // Get FCM token
          const token = await getToken(messaging, {
            vapidKey: 'YOUR_VAPID_KEY' // Replace with your VAPID key from Firebase Console
          });

          if (token) {
            console.log('FCM token obtained:', token.slice(0, 20) + '...');
            
            // Store token in Supabase
            const { error } = await supabase
              .from('profiles')
              .update({ fcm_token: token })
              .eq('user_id', user.id);

            if (error) {
              console.error('Error storing FCM token:', error);
            } else {
              console.log('FCM token registered successfully');
            }
          }
        } else {
          console.log('Notification permission denied');
        }
      } catch (error) {
        console.error('Error registering FCM token:', error);
      }
    };

    requestPermissionAndRegister();

    // Handle foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      
      toast({
        title: payload.notification?.title || 'Nueva notificación',
        description: payload.notification?.body,
        duration: 5000,
      });
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [user, toast]);
};
