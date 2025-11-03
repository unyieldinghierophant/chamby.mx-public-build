import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppNotificationRequest {
  reschedule_id?: string;
  booking_id?: string;
  type: 'reschedule_request' | 'job_reminder' | 'transfer_warning';
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

    const { reschedule_id, booking_id, type } = await req.json() as WhatsAppNotificationRequest;

    let phoneNumber: string;
    let message: string;
    let linkUrl: string;

    if (type === 'reschedule_request' && reschedule_id) {
      // Get reschedule request details
      const { data: reschedule, error: rescheduleError } = await supabase
        .from('booking_reschedules')
        .select(`
          *,
          bookings:booking_id (
            title,
            tasker_id,
            customer_id,
            profiles!bookings_customer_id_fkey (full_name)
          )
        `)
        .eq('id', reschedule_id)
        .single();

      if (rescheduleError || !reschedule) {
        throw new Error('Reschedule request not found');
      }

      // Get provider phone
      const { data: provider } = await supabase
        .from('profiles')
        .select('phone, full_name')
        .eq('user_id', reschedule.bookings.tasker_id)
        .single();

      if (!provider?.phone) {
        throw new Error('Provider phone not found');
      }

      phoneNumber = provider.phone;
      const customerName = reschedule.bookings.profiles.full_name;
      const jobTitle = reschedule.bookings.title;
      const originalDate = new Date(reschedule.original_date).toLocaleString('es-MX');
      const newDate = new Date(reschedule.requested_date).toLocaleString('es-MX');
      
      linkUrl = `https://chamby.mx/provider-portal/reschedule/${reschedule_id}`;
      message = `Hola ${provider.full_name}, ${customerName} quiere reprogramar "${jobTitle}" del ${originalDate} al ${newDate}. Tienes 2 horas para responder: ${linkUrl}`;

    } else if (type === 'job_reminder' && booking_id) {
      // Get booking details
      const { data: booking } = await supabase
        .from('bookings')
        .select(`
          *,
          customer:profiles!bookings_customer_id_fkey (full_name),
          provider:profiles!bookings_tasker_id_fkey (phone, full_name)
        `)
        .eq('id', booking_id)
        .single();

      if (!booking?.provider?.phone) {
        throw new Error('Provider phone not found');
      }

      phoneNumber = booking.provider.phone;
      const scheduledTime = new Date(booking.scheduled_date).toLocaleString('es-MX');
      linkUrl = `https://chamby.mx/provider-portal/calendar`;
      message = `Recordatorio: Tienes "${booking.title}" con ${booking.customer.full_name} programado para ${scheduledTime}. Ver detalles: ${linkUrl}`;

    } else if (type === 'transfer_warning' && reschedule_id) {
      // Get reschedule request for warning
      const { data: reschedule } = await supabase
        .from('booking_reschedules')
        .select(`
          *,
          bookings:booking_id (
            tasker_id,
            profiles!bookings_tasker_id_fkey (phone, full_name)
          )
        `)
        .eq('id', reschedule_id)
        .single();

      if (!reschedule?.bookings?.profiles?.phone) {
        throw new Error('Provider phone not found');
      }

      phoneNumber = reschedule.bookings.profiles.phone;
      linkUrl = `https://chamby.mx/provider-portal/reschedule/${reschedule_id}`;
      message = `⚠️ Atención ${reschedule.bookings.profiles.full_name}, solo tienes 30 minutos para responder la reprogramación o el trabajo será reasignado: ${linkUrl}`;

    } else {
      throw new Error('Invalid request type or missing IDs');
    }

    // Send WhatsApp message via LabsMobile API
    const labsMobileToken = Deno.env.get('LABSMOBILE_API_TOKEN');
    if (!labsMobileToken) {
      throw new Error('LabsMobile API token not configured');
    }

    // Clean phone number (remove + and spaces)
    const cleanPhone = phoneNumber.replace(/[\s+]/g, '');

    const response = await fetch('https://api.labsmobile.com/json/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({
        bearer: labsMobileToken,
        message: message,
        tpoa: 'Chamby',
        recipient: [{
          msisdn: cleanPhone,
        }],
      }),
    });

    const result = await response.json();
    
    console.log('WhatsApp sent:', { type, phone: cleanPhone, result });

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending WhatsApp:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
