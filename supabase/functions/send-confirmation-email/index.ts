import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "npm:resend@4.0.0";
import React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { ConfirmationEmail } from "./_templates/confirmation.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
const hookSecret = (Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string).replace("v1,whsec_", "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    
    console.log("Received webhook request");

    // Verify webhook signature if secret is configured
    if (hookSecret) {
      const wh = new Webhook(hookSecret);
      try {
        wh.verify(payload, headers);
        console.log("Webhook signature verified");
      } catch (err) {
        console.error("Webhook verification failed:", err);
        return new Response(
          JSON.stringify({ error: "Invalid webhook signature" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const data = JSON.parse(payload);
    console.log("Webhook event type:", data.email_data?.email_action_type);

    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = data;

    if (!user?.email) {
      throw new Error("User email not found in webhook payload");
    }

    console.log(`Sending confirmation email to: ${user.email}`);

    // Render the email template
    const html = await renderAsync(
      React.createElement(ConfirmationEmail, {
        supabase_url: Deno.env.get("SUPABASE_URL") ?? "",
        token,
        token_hash,
        redirect_to,
        email_action_type,
        user_email: user.email,
      })
    );

    // Create plain text version for better deliverability
    const confirmationUrl = `${Deno.env.get("SUPABASE_URL")}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;
    const text = `¡Bienvenido a Chamby!

Gracias por registrarte en Chamby, tu plataforma de confianza para conectar con profesionales verificados.

Para completar tu registro y comenzar a disfrutar de nuestros servicios, confirma tu correo electrónico haciendo clic en el siguiente enlace:

${confirmationUrl}

O copia y pega este código de confirmación: ${token}

Este enlace y código son válidos por 24 horas.

¿Qué puedes hacer en Chamby?
- Encuentra profesionales verificados cerca de ti
- Agenda servicios de forma rápida y segura
- Paga de manera protegida
- Califica y comparte tu experiencia

Si no solicitaste esta cuenta, puedes ignorar este correo de forma segura.

© 2025 Chamby - Conectando profesionales con clientes
chamby.mx`;

    // Send email via Resend with both HTML and plain text
    const { data: emailData, error } = await resend.emails.send({
      from: "Chamby <notificaciones@chamby.mx>",
      to: [user.email],
      subject: "Confirma tu correo - Chamby",
      html,
      text,
      headers: {
        'X-Entity-Ref-ID': `user-${user.email}`,
      },
      tags: [
        {
          name: 'category',
          value: 'email_confirmation',
        },
      ],
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    console.log("Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, emailId: emailData?.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-confirmation-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send email",
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
