import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { ConfirmationEmail } from "./_templates/confirmation.tsx";

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
    const { email, redirectTo } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[send-signup-confirmation] Generating link for: ${email}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const postmarkApiKey = Deno.env.get("POSTMARK_API_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Generate a confirmation link using the admin API
    // Use 'magiclink' type which works for existing unconfirmed users without needing a password
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: redirectTo || `${supabaseUrl}/auth/v1/verify`,
      },
    });

    if (linkError) {
      console.error("[send-signup-confirmation] generateLink error:", linkError);
      return new Response(
        JSON.stringify({ error: linkError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const properties = linkData?.properties;
    const token_hash = properties?.hashed_token;
    const token = (linkData as any)?.properties?.email_otp || "";
    const email_action_type = "signup";
    const redirect_to = redirectTo || `${supabaseUrl}/auth/v1/verify`;

    console.log(`[send-signup-confirmation] Link generated, token_hash present: ${!!token_hash}, otp present: ${!!token}`);

    // Render the branded email template
    const html = await renderAsync(
      React.createElement(ConfirmationEmail, {
        supabase_url: supabaseUrl,
        token,
        token_hash: token_hash || "",
        redirect_to,
        email_action_type,
        user_email: email,
      })
    );

    const confirmationUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to)}`;

    const textContent = `¡Bienvenido a Chamby!

Gracias por registrarte en Chamby, tu plataforma de confianza para conectar con profesionales verificados.

Para completar tu registro y comenzar a disfrutar de nuestros servicios, confirma tu correo electrónico haciendo clic en el siguiente enlace:

${confirmationUrl}

O copia y pega este código de confirmación: ${token}

Este enlace y código son válidos por 24 horas.

Si no solicitaste esta cuenta, puedes ignorar este correo de forma segura.

© 2025 Chamby - Conectando profesionales con clientes
chamby.mx`;

    console.log(`[send-signup-confirmation] Sending email to: ${email}`);

    // Send email via Postmark
    const emailResponse = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": postmarkApiKey,
      },
      body: JSON.stringify({
        From: "Chamby <notificaciones@chamby.mx>",
        To: email,
        Subject: "Confirma tu correo - Chamby",
        HtmlBody: html,
        TextBody: textContent,
        MessageStream: "outbound",
        Tag: "email_confirmation",
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("[send-signup-confirmation] Postmark error:", emailData);
      return new Response(
        JSON.stringify({ error: emailData.Message || "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[send-signup-confirmation] Email sent successfully:", emailData.MessageID);

    return new Response(
      JSON.stringify({ success: true, messageId: emailData.MessageID }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[send-signup-confirmation] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
