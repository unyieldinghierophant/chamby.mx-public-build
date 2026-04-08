import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobId, providerId } = await req.json();
    if (!jobId) {
      return new Response(JSON.stringify({ error: "jobId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get job + client info
    const { data: job } = await supabaseClient
      .from("jobs")
      .select("id, title, category, client_id, scheduled_at")
      .eq("id", jobId)
      .single();

    if (!job?.client_id) {
      return new Response(JSON.stringify({ ok: false, reason: "no client" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get client email
    const { data: clientUser } = await supabaseClient
      .from("users")
      .select("email, full_name")
      .eq("id", job.client_id)
      .single();

    if (!clientUser?.email) {
      return new Response(JSON.stringify({ ok: false, reason: "no email" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get provider name
    let providerName = "Tu proveedor";
    if (providerId) {
      const { data: provider } = await supabaseClient
        .from("providers")
        .select("display_name")
        .eq("user_id", providerId)
        .single();
      if (provider?.display_name) providerName = provider.display_name;
    }

    // Send email via Postmark
    const postmarkKey = Deno.env.get("POSTMARK_API_KEY");
    if (!postmarkKey) {
      console.log("[notify-provider-assigned] POSTMARK_API_KEY not set, skipping email");
      return new Response(JSON.stringify({ ok: false, reason: "no postmark key" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scheduledText = job.scheduled_at
      ? new Date(job.scheduled_at).toLocaleDateString("es-MX", {
          weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
        })
      : "Por confirmar";

    const emailRes = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": postmarkKey,
      },
      body: JSON.stringify({
        From: "Chamby <notificaciones@chamby.mx>",
        To: clientUser.email,
        Subject: `✅ Proveedor asignado — ${job.category}`,
        HtmlBody: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:'DM Sans',Arial,sans-serif;background:#f5f4f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;">
        <tr><td style="background:#16a34a;padding:28px;text-align:center;">
          <img src="https://chamby.mx/chamby-logo-white.png" alt="Chamby" width="120" style="display:block;margin:0 auto 12px;height:auto;" />
          <h1 style="color:white;margin:0;font-size:20px;font-weight:700;">¡Proveedor asignado!</h1>
        </td></tr>
        <tr><td style="padding:28px 28px 0;">
          <p style="margin:0 0 16px;font-size:15px;color:#374151;">
            Hola ${clientUser.full_name || ""},
          </p>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;">
            <strong>${providerName}</strong> ha aceptado tu solicitud de servicio.
          </p>
          <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:0 0 16px;">
            <p style="margin:4px 0;color:#6b7280;font-size:14px;"><strong>Servicio:</strong> ${job.category} — ${job.title}</p>
            <p style="margin:4px 0;color:#6b7280;font-size:14px;"><strong>Fecha:</strong> ${scheduledText}</p>
          </div>
          <p style="margin:0 0 24px;font-size:14px;color:#374151;">
            Abre la app para ver los detalles y chatear con tu proveedor.
          </p>
        </td></tr>
        <tr><td style="padding:0 28px 28px;" align="center">
          <a href="https://chamby.mx/active-jobs" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:50px;">
            Ver mi trabajo
          </a>
        </td></tr>
        <tr><td style="padding:20px 28px;border-top:1px solid #eee;">
          <p style="margin:0;font-size:12px;color:#999;text-align:center;">
            Chamby.mx — Servicios del hogar en Guadalajara
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
        TextBody: `Hola ${clientUser.full_name || ""}, ${providerName} ha aceptado tu solicitud de servicio "${job.category} — ${job.title}" para el ${scheduledText}. Abre la app para ver los detalles: https://chamby.mx/active-jobs`,
        MessageStream: "outbound",
      }),
    });

    const emailResult = await emailRes.json();
    console.log("[notify-provider-assigned] Email sent:", emailResult);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[notify-provider-assigned] ERROR:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
