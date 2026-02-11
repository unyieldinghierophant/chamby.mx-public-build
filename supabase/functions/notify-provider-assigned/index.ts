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
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #16a34a; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 22px;">¡Proveedor asignado!</h1>
            </div>
            <div style="padding: 24px; background: #fff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="color: #374151; font-size: 16px;">
                Hola ${clientUser.full_name || ""},
              </p>
              <p style="color: #374151; font-size: 16px;">
                <strong>${providerName}</strong> ha aceptado tu solicitud de servicio.
              </p>
              <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
                  <strong>Servicio:</strong> ${job.category} — ${job.title}
                </p>
                <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
                  <strong>Fecha:</strong> ${scheduledText}
                </p>
              </div>
              <p style="color: #374151; font-size: 14px;">
                Abre la app para ver los detalles y chatear con tu proveedor.
              </p>
              <div style="text-align: center; margin-top: 24px;">
                <a href="https://chambymk1.lovable.app/active-jobs" style="display: inline-block; background: #16a34a; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Ver mi trabajo
                </a>
              </div>
            </div>
          </div>
        `,
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
