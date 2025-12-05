import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppNotificationRequest {
  reschedule_id?: string;
  booking_id?: string;
  job_id?: string;
  type: 'reschedule_request' | 'job_reminder' | 'transfer_warning' | 'new_job_available' | 'new_job_request';
}

// Company phone number for job request notifications
const COMPANY_PHONE = '523325520551';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { reschedule_id, booking_id, job_id, type } = await req.json() as WhatsAppNotificationRequest;

    let phoneNumber: string;
    let message: string;
    let linkUrl: string;

    if (type === 'new_job_request' && job_id) {
      // Handle new job request notification to company
      console.log('Processing new_job_request for job_id:', job_id);

      // Fetch job details with client info
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', job_id)
        .single();

      if (jobError || !job) {
        console.error('Error fetching job:', jobError);
        throw new Error('Job not found');
      }

      console.log('Job found:', job);

      // Fetch client info
      const { data: client, error: clientError } = await supabase
        .from('users')
        .select('full_name, phone, email')
        .eq('id', job.client_id)
        .single();

      if (clientError) {
        console.error('Error fetching client:', clientError);
      }

      console.log('Client found:', client);

      // Shorten photo URLs if any
      const shortenedPhotos: string[] = [];
      if (job.photos && job.photos.length > 0) {
        for (const photoUrl of job.photos) {
          try {
            // Generate short code
            const { data: shortCode, error: codeError } = await supabase
              .rpc('generate_short_code');

            if (codeError || !shortCode) {
              console.error('Error generating short code:', codeError);
              shortenedPhotos.push(photoUrl); // Fallback to full URL
              continue;
            }

            // Insert into photo_short_links
            const { error: insertError } = await supabase
              .from('photo_short_links')
              .insert({
                full_url: photoUrl,
                short_code: shortCode,
              });

            if (insertError) {
              console.error('Error inserting short link:', insertError);
              shortenedPhotos.push(photoUrl);
            } else {
              shortenedPhotos.push(`https://chamby.mx/p/${shortCode}`);
            }
          } catch (e) {
            console.error('Error shortening URL:', e);
            shortenedPhotos.push(photoUrl);
          }
        }
      }

      // Format date
      let formattedDate = 'No especificada';
      if (job.scheduled_at) {
        const date = new Date(job.scheduled_at);
        formattedDate = date.toLocaleDateString('es-MX', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }

      // Format time preference
      let timeInfo = job.time_preference || 'No especificado';
      if (job.exact_time) {
        timeInfo = job.exact_time;
      }

      // Build the message
      const clientName = client?.full_name || 'No disponible';
      const clientPhone = client?.phone || 'No disponible';
      const clientEmail = client?.email || 'No disponible';

      message = `🔔 *NUEVA SOLICITUD DE TRABAJO*

📋 *Servicio:* ${job.title || 'Sin título'}
📁 *Categoría:* ${job.category || 'Sin categoría'}

📝 *Descripción:*
${job.description || job.problem || 'Sin descripción'}

📅 *Fecha:* ${formattedDate}
⏰ *Horario:* ${timeInfo}

📍 *Ubicación:*
${job.location || 'No especificada'}

👤 *Cliente:* ${clientName}
📱 *Teléfono:* ${clientPhone}
📧 *Email:* ${clientEmail}`;

      // Add photos section if any
      if (shortenedPhotos.length > 0) {
        message += `\n\n📷 *Fotos:* ${shortenedPhotos.length}`;
        shortenedPhotos.forEach((url, index) => {
          message += `\n• ${url}`;
        });
      }

      // Add urgency if applicable
      if (job.urgent) {
        message = `🚨 *URGENTE* 🚨\n\n` + message;
      }

      phoneNumber = COMPANY_PHONE;
      console.log('Sending WhatsApp to:', phoneNumber);
      console.log('Message:', message);

    } else if (type === 'reschedule_request' && reschedule_id) {
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

    } else if (type === 'new_job_available' && job_id) {
      // Get job details
      const { data: job } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', job_id)
        .single();

      if (!job) {
        throw new Error('Job not found');
      }

      // Get all verified providers
      const { data: providers } = await supabase
        .from('profiles')
        .select('phone, full_name')
        .eq('is_tasker', true)
        .eq('verification_status', 'verified')
        .not('phone', 'is', null);

      if (!providers || providers.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: 'No providers to notify' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Send to all providers (batch operation)
      const labsMobileToken = Deno.env.get('LABSMOBILE_API_TOKEN');
      if (!labsMobileToken) {
        throw new Error('LabsMobile API token not configured');
      }

      const results = [];
      for (const provider of providers) {
        linkUrl = `https://chamby.mx/provider-portal/jobs`;
        message = `🔔 Nuevo trabajo: "${job.title}" - ${job.category || 'Sin categoría'} en ${job.location || 'ubicación no especificada'}. Ver detalles: ${linkUrl}`;
        
        const cleanPhone = provider.phone.replace(/[\s+]/g, '');
        
        try {
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
              recipient: [{ msisdn: cleanPhone }],
            }),
          });

          const result = await response.json();
          results.push({ phone: cleanPhone, success: response.ok, result });
          console.log('WhatsApp sent to provider:', provider.full_name, cleanPhone);
        } catch (error) {
          console.error('Error sending to provider:', provider.full_name, error);
          results.push({ phone: cleanPhone, success: false, error: error.message });
        }
      }

      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

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
