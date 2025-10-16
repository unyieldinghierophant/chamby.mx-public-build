import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendOTPRequest {
  phone: string;
  recaptchaToken: string;
}

// Hash function using Web Crypto API
async function hashOTP(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Format phone number to international format (assumes Mexican number if no country code)
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If it starts with 52 (Mexico country code), it's already in international format
  if (cleaned.startsWith('52')) {
    return cleaned;
  }
  
  // If it's 10 digits, add Mexico country code
  if (cleaned.length === 10) {
    return '52' + cleaned;
  }
  
  // Return as is if it already looks international
  return cleaned;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const recaptchaSecret = Deno.env.get('RECAPTCHA_SECRET_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { phone, recaptchaToken }: SendOTPRequest = await req.json();

    if (!phone || !recaptchaToken) {
      return new Response(
        JSON.stringify({ error: 'Phone number and reCAPTCHA token are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify reCAPTCHA token
    console.log('Verifying reCAPTCHA token...');
    const recaptchaResponse = await fetch(
      `https://recaptchaenterprise.googleapis.com/v1/projects/chamby-1749086959890/assessments?key=${recaptchaSecret}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: {
            token: recaptchaToken,
            expectedAction: 'SEND_OTP',
            siteKey: '6LcpcesrAAAAAPn49ViC1bMP73VUMIN7uqmVwRgZ',
          },
        }),
      }
    );

    const recaptchaResult = await recaptchaResponse.json();
    console.log('reCAPTCHA result:', recaptchaResult);

    // Check reCAPTCHA score (0.0 - 1.0, higher is more likely human)
    if (!recaptchaResult.tokenProperties?.valid) {
      console.error('Invalid reCAPTCHA token');
      return new Response(
        JSON.stringify({ error: 'Verificación de seguridad fallida. Por favor intenta nuevamente.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (recaptchaResult.riskAnalysis?.score < 0.5) {
      console.error('Low reCAPTCHA score:', recaptchaResult.riskAnalysis?.score);
      return new Response(
        JSON.stringify({ error: 'Verificación de seguridad fallida. Por favor intenta nuevamente.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formattedPhone = formatPhoneNumber(phone);
    console.log('Sending OTP to phone:', formattedPhone);

    // Check rate limiting
    const { data: rateLimitData, error: rateLimitError } = await supabase
      .rpc('check_otp_rate_limit', { phone: formattedPhone });

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
      throw rateLimitError;
    }

    if (!rateLimitData) {
      return new Response(
        JSON.stringify({ error: 'Demasiados intentos. Por favor intenta en una hora.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate and hash OTP
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);

    // Store hashed OTP in database
    const { error: insertError } = await supabase
      .from('phone_verification_otps')
      .insert({
        phone_number: formattedPhone,
        otp_hash: otpHash,
      });

    if (insertError) {
      console.error('Error storing OTP:', insertError);
      throw insertError;
    }

    // Send OTP via LabsMobile API
    const labsMobileUsername = 'armando@chamby.mx';
    const labsMobilePassword = Deno.env.get('LABSMOBILE_API_TOKEN')!;

    const labsMobilePayload = {
      username: labsMobileUsername,
      password: labsMobilePassword,
      message: `Tu código de verificación Chamby es ${otp}`,
      msisdn: [formattedPhone],
    };

    console.log('Sending to LabsMobile API...');
    const labsMobileResponse = await fetch('https://api.labsmobile.com/json/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(labsMobilePayload),
    });

    const labsMobileResult = await labsMobileResponse.json();
    console.log('LabsMobile response:', labsMobileResult);

    if (labsMobileResult.code !== '0') {
      console.error('LabsMobile API error:', labsMobileResult);
      return new Response(
        JSON.stringify({ error: 'Error al enviar el código. Por favor intenta nuevamente.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Código enviado exitosamente' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in send-otp function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
