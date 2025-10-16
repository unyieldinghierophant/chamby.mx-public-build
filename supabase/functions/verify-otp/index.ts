import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyOTPRequest {
  phone: string;
  otp: string;
}

// Hash function using Web Crypto API
async function hashOTP(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Format phone number to international format
function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('52')) {
    return cleaned;
  }
  if (cleaned.length === 10) {
    return '52' + cleaned;
  }
  return cleaned;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    const { phone, otp }: VerifyOTPRequest = await req.json();

    if (!phone || !otp) {
      return new Response(
        JSON.stringify({ error: 'Teléfono y código son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formattedPhone = formatPhoneNumber(phone);
    const otpHash = await hashOTP(otp);

    // Check IP-based rate limiting (max 10 verification attempts per hour per IP)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: ipAttempts } = await supabase
      .from('otp_rate_limit_log')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', clientIp)
      .eq('action', 'verify_otp')
      .gte('created_at', oneHourAgo);

    if (ipAttempts && ipAttempts >= 10) {
      console.warn('IP rate limit exceeded:', clientIp);
      return new Response(
        JSON.stringify({ 
          error: 'Demasiados intentos desde esta dirección. Intenta más tarde.',
          code: 'RATE_LIMIT_EXCEEDED'
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log verification attempt
    await supabase
      .from('otp_rate_limit_log')
      .insert({
        ip_address: clientIp,
        phone_number: formattedPhone,
        action: 'verify_otp'
      });

    console.log('Verifying OTP for phone:', formattedPhone);

    // Find the most recent non-expired OTP for this phone
    const { data: otpRecord, error: fetchError } = await supabase
      .from('phone_verification_otps')
      .select('*')
      .eq('phone_number', formattedPhone)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching OTP:', fetchError);
      throw fetchError;
    }

    if (!otpRecord) {
      return new Response(
        JSON.stringify({ error: 'Código inválido o expirado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if maximum attempts exceeded (prevent brute-force)
    const MAX_ATTEMPTS = 5;
    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      console.warn('Max OTP attempts exceeded for phone:', formattedPhone);
      
      // Invalidate the OTP by marking it as expired
      await supabase
        .from('phone_verification_otps')
        .update({ verified: true }) // Mark as used to prevent further attempts
        .eq('id', otpRecord.id);
      
      return new Response(
        JSON.stringify({ 
          error: 'Demasiados intentos fallidos. Solicita un nuevo código.',
          code: 'MAX_ATTEMPTS_EXCEEDED'
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if OTP matches
    if (otpRecord.otp_hash !== otpHash) {
      // Increment attempts
      await supabase
        .from('phone_verification_otps')
        .update({ attempts: otpRecord.attempts + 1 })
        .eq('id', otpRecord.id);

      const remainingAttempts = MAX_ATTEMPTS - (otpRecord.attempts + 1);
      
      return new Response(
        JSON.stringify({ 
          error: 'Código incorrecto',
          remainingAttempts: Math.max(0, remainingAttempts)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark OTP as verified
    const { error: updateOTPError } = await supabase
      .from('phone_verification_otps')
      .update({ verified: true })
      .eq('id', otpRecord.id);

    if (updateOTPError) {
      console.error('Error updating OTP:', updateOTPError);
      throw updateOTPError;
    }

    // Update client phone_verified status
    const { error: updateClientError } = await supabase
      .from('clients')
      .update({ phone_verified: true })
      .eq('phone', phone);

    if (updateClientError) {
      console.error('Error updating client:', updateClientError);
      // Don't throw here, verification was successful
    }

    console.log('OTP verified successfully for phone:', formattedPhone);

    return new Response(
      JSON.stringify({ success: true, message: 'Teléfono verificado exitosamente' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in verify-otp function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
