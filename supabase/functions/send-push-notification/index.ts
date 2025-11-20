import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationRequest {
  job_id?: string;
  user_ids?: string[];
  type: 'new_job_available' | 'job_reminder' | 'job_update' | 'payment_received' | 'job_assigned';
  title: string;
  body: string;
  data?: Record<string, string>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { job_id, user_ids, type, title, body, data } = await req.json() as PushNotificationRequest;
    console.log('📲 [PUSH-NOTIFICATION] Request:', { type, job_id, user_ids, title });

    let targetTokens: string[] = [];
    let targetUserIds: string[] = [];

    if (job_id && type === 'new_job_available') {
      // Get all verified providers with FCM tokens from provider_profiles
      const { data: providers, error: providersError } = await supabase
        .from('provider_profiles')
        .select('fcm_token, user_id')
        .eq('verified', true)
        .eq('verification_status', 'verified')
        .not('fcm_token', 'is', null);

      if (providersError) {
        console.error('Error fetching providers:', providersError);
      }

      targetTokens = providers?.map(p => p.fcm_token).filter(Boolean) || [];
      targetUserIds = providers?.map(p => p.user_id).filter(Boolean) || [];
      console.log(`Found ${targetTokens.length} verified providers with FCM tokens`);
    } else if (user_ids) {
      // Get specific users' FCM tokens from provider_profiles
      const { data: providers, error: providersError } = await supabase
        .from('provider_profiles')
        .select('fcm_token, user_id')
        .in('user_id', user_ids)
        .not('fcm_token', 'is', null);

      if (providersError) {
        console.error('Error fetching user tokens:', providersError);
      }

      targetTokens = providers?.map(p => p.fcm_token).filter(Boolean) || [];
      targetUserIds = providers?.map(p => p.user_id).filter(Boolean) || [];
      console.log(`Found ${targetTokens.length} specific provider tokens`);
    }

    if (targetTokens.length === 0) {
      console.log('⚠️ No FCM tokens found for notification');
      return new Response(
        JSON.stringify({ success: true, message: 'No FCM tokens found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create in-app notifications for each user
    if (targetUserIds.length > 0) {
      const notifications = targetUserIds.map(userId => ({
        user_id: userId,
        type,
        title,
        message: body,
        link: data?.link || '/provider-portal/jobs',
        data: {
          job_id,
          ...data
        }
      }));

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifError) {
        console.error('Error creating notifications:', notifError);
      } else {
        console.log(`✅ Created ${notifications.length} in-app notifications`);
      }
    }

    // Send push notifications using FCM REST API
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');
    if (!fcmServerKey) {
      console.warn('⚠️ FCM_SERVER_KEY not configured, skipping push notifications');
      return new Response(
        JSON.stringify({ success: true, message: 'In-app notifications created, push notifications skipped' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = await Promise.all(
      targetTokens.map(async (token) => {
        try {
          const response = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `key=${fcmServerKey}`,
            },
            body: JSON.stringify({
              to: token,
              notification: {
                title,
                body,
                icon: '/chamby-logo.png',
                badge: '/chamby-logo.png',
                click_action: data?.link || '/provider-portal/jobs',
              },
              data: {
                type,
                job_id,
                ...data,
              },
              priority: 'high',
            }),
          });

          const result = await response.json();
          console.log('FCM response:', result);
          return { token: token.slice(0, 10) + '...', success: response.ok, result };
        } catch (error) {
          console.error('Error sending to token:', error);
          return { token: token.slice(0, 10) + '...', success: false, error: error.message };
        }
      })
    );

    console.log('✅ Push notifications sent:', results.filter(r => r.success).length, '/', results.length);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error sending push notifications:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
