import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationRequest {
  job_id?: string;
  user_ids?: string[];
  type: 'new_job_available' | 'job_reminder' | 'job_update';
  title: string;
  body: string;
  data?: Record<string, string>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify caller is admin
    const { data: adminRole } = await supabaseAuth
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!adminRole) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role for DB operations
    const supabase = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { job_id, user_ids, type, title, body, data } = await req.json() as PushNotificationRequest;

    let targetTokens: string[] = [];

    if (job_id && type === 'new_job_available') {
      // Get all verified providers with FCM tokens
      const { data: providers } = await supabase
        .from('providers')
        .select('fcm_token, user_id, display_name')
        .eq('verified', true)
        .not('fcm_token', 'is', null);

      targetTokens = providers?.map(p => p.fcm_token).filter(Boolean) || [];
      console.log(`Found ${targetTokens.length} providers with FCM tokens`);
    } else if (user_ids) {
      // Get specific users' FCM tokens
      const { data: users } = await supabase
        .from('providers')
        .select('fcm_token')
        .in('user_id', user_ids)
        .not('fcm_token', 'is', null);

      targetTokens = users?.map(u => u.fcm_token).filter(Boolean) || [];
      console.log(`Found ${targetTokens.length} specific user tokens`);
    }

    if (targetTokens.length === 0) {
      console.log('No FCM tokens found for notification');
      return new Response(
        JSON.stringify({ success: true, message: 'No FCM tokens found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send push notifications using FCM REST API
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');
    if (!fcmServerKey) {
      throw new Error('FCM_SERVER_KEY not configured');
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

    console.log('Push notifications sent:', results.filter(r => r.success).length, '/', results.length);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending push notifications:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
