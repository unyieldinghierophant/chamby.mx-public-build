import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Checking for expired reschedule requests...');

    // Find expired reschedule requests (pending and past deadline)
    const { data: expiredReschedules, error: fetchError } = await supabase
      .from('booking_reschedules')
      .select(`
        *,
        bookings:booking_id (
          id,
          tasker_id,
          customer_id,
          title,
          status
        )
      `)
      .eq('status', 'pending')
      .not('bookings.reschedule_response_deadline', 'is', null)
      .lt('bookings.reschedule_response_deadline', new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching expired reschedules:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiredReschedules?.length || 0} expired reschedule requests`);

    let processedCount = 0;
    let errorCount = 0;

    for (const reschedule of expiredReschedules || []) {
      try {
        // Mark reschedule as expired
        await supabase
          .from('booking_reschedules')
          .update({ status: 'expired' })
          .eq('id', reschedule.id);

        // Transfer job back to pool (remove provider assignment)
        await supabase
          .from('bookings')
          .update({
            tasker_id: null,
            status: 'pending',
            scheduled_date: reschedule.requested_date, // Use new date customer requested
            reschedule_requested_at: null,
            reschedule_requested_date: null,
            reschedule_response_deadline: null,
          })
          .eq('id', reschedule.booking_id);

        // Notify original provider
        await supabase
          .from('notifications')
          .insert({
            user_id: reschedule.bookings.tasker_id,
            type: 'job_transferred',
            title: 'Trabajo reasignado',
            message: `No respondiste a tiempo la reprogramación de "${reschedule.bookings.title}". El trabajo fue reasignado.`,
            link: '/provider-portal/jobs',
          });

        // Notify customer
        await supabase
          .from('notifications')
          .insert({
            user_id: reschedule.bookings.customer_id,
            type: 'provider_changed',
            title: 'Buscando nuevo profesional',
            message: `Estamos asignando "${reschedule.bookings.title}" a otro profesional verificado.`,
            link: `/bookings/${reschedule.booking_id}`,
          });

        processedCount++;
        console.log(`Processed reschedule ${reschedule.id}`);

      } catch (error) {
        console.error(`Error processing reschedule ${reschedule.id}:`, error);
        errorCount++;
      }
    }

    // Also check for reschedules that need 30-minute warning
    const { data: warningReschedules } = await supabase
      .from('booking_reschedules')
      .select(`
        id,
        bookings:booking_id (
          reschedule_response_deadline
        )
      `)
      .eq('status', 'pending')
      .not('bookings.reschedule_response_deadline', 'is', null)
      .gt('bookings.reschedule_response_deadline', new Date().toISOString())
      .lt('bookings.reschedule_response_deadline', new Date(Date.now() + 35 * 60 * 1000).toISOString());

    // Send WhatsApp warnings for these (if not already sent)
    for (const reschedule of warningReschedules || []) {
      try {
        // Check if warning already sent
        const { data: existingNotif } = await supabase
          .from('notifications')
          .select('id')
          .eq('type', 'transfer_warning')
          .eq('link', `/provider-portal/reschedule/${reschedule.id}`)
          .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
          .maybeSingle();

        if (!existingNotif) {
          // Call WhatsApp function
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-whatsapp-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            },
            body: JSON.stringify({
              reschedule_id: reschedule.id,
              type: 'transfer_warning',
            }),
          });
        }
      } catch (error) {
        console.error(`Error sending warning for ${reschedule.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        errors: errorCount,
        total: expiredReschedules?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-expired-reschedules:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
