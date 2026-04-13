import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const POSTMARK_API_KEY = Deno.env.get("POSTMARK_API_KEY") as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobId } = await req.json();
    if (!jobId) {
      return new Response(JSON.stringify({ error: "jobId required" }), { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get job and client info
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, title, category, client_id")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      console.error("Job not found:", jobError?.message);
      return new Response(JSON.stringify({ error: "Job not found" }), { status: 404, headers: corsHeaders });
    }

    // Cancel the visit fee hold in Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", { apiVersion: "2025-03-31.basil" });

    const { data: visitFeePayment } = await supabase
      .from("payments")
      .select("stripe_payment_intent_id, id")
      .eq("job_id", jobId)
      .eq("type", "visit_fee")
      .eq("status", "authorized")
      .maybeSingle();

    if (visitFeePayment?.stripe_payment_intent_id) {
      await stripe.paymentIntents.cancel(visitFeePayment.stripe_payment_intent_id);

      await supabase
        .from("payments")
        .update({ status: "cancelled" })
        .eq("id", visitFeePayment.id);
    }

    // Get client email
    const { data: userData } = await supabase
      .from("users")
      .select("email, full_name")
      .eq("id", job.client_id)
      .single();

    if (!userData?.email) {
      console.log("No email found for client", job.client_id);
      return new Response(JSON.stringify({ error: "No client email" }), { status: 404, headers: corsHeaders });
    }

    const clientName = userData.full_name || "Cliente";
    const jobTitle = job.title || job.category || "tu solicitud";
    const retryUrl = `https://chamby.mx/esperando-proveedor?job_id=${job.id}`;
    const whatsappUrl = "https://wa.me/523325520551";

    const htmlBody = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:'DM Sans',Arial,sans-serif;background:#f5f4f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;">
        <tr><td style="background:#0f0f0f;padding:28px;text-align:center;">
          <img src="https://chamby.mx/chamby-logo-white.png" alt="Chamby" width="120" style="display:block;margin:0 auto;height:auto;" />
        </td></tr>
        <tr><td style="padding:32px 28px 0;">
          <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f0f0f;">
            No encontramos un Chambynauta
          </h1>
          <p style="margin:0 0 20px;font-size:14px;color:#666;line-height:1.6;">
            Hola ${clientName}, lamentamos informarte que ningún proveedor pudo tomar tu solicitud 
            <strong>"${jobTitle}"</strong> en este momento.
          </p>
          <p style="margin:0 0 24px;font-size:14px;color:#666;line-height:1.6;">
            Esto puede pasar en horarios de alta demanda o cuando no hay técnicos disponibles en tu zona. 
            Te recomendamos intentar de nuevo — muchas veces un proveedor se libera poco después.
          </p>
        </td></tr>
        <tr><td style="padding:0 28px 16px;" align="center">
          <a href="${retryUrl}" style="display:inline-block;background:#0f0f0f;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:50px;">
            Intentar de nuevo
          </a>
        </td></tr>
        <tr><td style="padding:0 28px 28px;" align="center">
          <a href="${whatsappUrl}" style="display:inline-block;background:#25D366;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:50px;">
            Contactar por WhatsApp
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
</html>`;

    // Send via Postmark
    const postmarkRes = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": POSTMARK_API_KEY,
      },
      body: JSON.stringify({
        From: "Chamby <notificaciones@chamby.mx>",
        To: userData.email,
        Subject: "No encontramos un Chambynauta para tu solicitud",
        HtmlBody: htmlBody,
        TextBody: `Hola ${clientName}, lamentamos informarte que ningún proveedor pudo tomar tu solicitud "${jobTitle}" en este momento. Puedes intentar de nuevo aquí: ${retryUrl} o contactarnos por WhatsApp: ${whatsappUrl}`,
        MessageStream: "outbound",
      }),
    });

    const postmarkData = await postmarkRes.json();
    console.log("Postmark response:", JSON.stringify(postmarkData));

    if (!postmarkRes.ok) {
      return new Response(JSON.stringify({ error: "Email send failed", details: postmarkData }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
