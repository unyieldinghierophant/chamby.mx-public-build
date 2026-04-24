// notify-no-provider
//
// Two invocation modes:
//   1. Cron mode (no body / empty body) — scans all `searching` jobs whose
//      `assignment_deadline` has passed, cancels each Stripe visit-fee hold,
//      moves the job to `no_match`, emails the client.
//   2. Single-job mode (`{ jobId: "..." }`) — processes one specific job,
//      same conditions. Used by EsperandoProveedor.tsx when the client-side
//      countdown hits zero so the user sees the "no match" state immediately.
//
// Idempotent: the filter requires status='searching' + deadline past, so
// re-running on an already-processed job is a no-op.
//
// Auth: service role key is used internally; no user auth is enforced because
// the function only operates on DB state (expired searching jobs) and cannot
// be abused to cancel arbitrary Stripe holds.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const POSTMARK_API_KEY = Deno.env.get("POSTMARK_API_KEY") as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: Record<string, unknown>) => {
  console.log(`[NOTIFY-NO-PROVIDER] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

interface ExpiredJob {
  id: string;
  title: string | null;
  category: string | null;
  client_id: string;
}

async function processExpiredJob(
  supabase: ReturnType<typeof createClient>,
  stripe: Stripe,
  job: ExpiredJob
) {
  // 1. Cancel the visit fee hold (idempotent — Stripe returns error if already
  //    cancelled, we swallow it).
  const { data: visitFeePayment } = await supabase
    .from("payments")
    .select("id, stripe_payment_intent_id")
    .eq("job_id", job.id)
    .eq("type", "visit_fee")
    .eq("status", "authorized")
    .maybeSingle();

  if (visitFeePayment?.stripe_payment_intent_id) {
    try {
      await stripe.paymentIntents.cancel(visitFeePayment.stripe_payment_intent_id);
    } catch (err) {
      log("PI cancel failed (may already be cancelled)", { job_id: job.id, error: String(err) });
    }
    await supabase
      .from("payments")
      .update({ status: "cancelled" })
      .eq("id", visitFeePayment.id);
  }

  // 2. Move job to no_match
  await supabase
    .from("jobs")
    .update({ status: "no_match", updated_at: new Date().toISOString() })
    .eq("id", job.id);

  // 3. Email client
  const { data: userData } = await supabase
    .from("users")
    .select("email, full_name")
    .eq("id", job.client_id)
    .single();

  if (!userData?.email) {
    log("No email for client, skipping notification", { job_id: job.id, client_id: job.client_id });
    return;
  }

  const clientName = (userData.full_name as string | null) || "Cliente";
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

  try {
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
    if (!postmarkRes.ok) {
      const body = await postmarkRes.json();
      log("Postmark error", { job_id: job.id, body });
    }
  } catch (err) {
    log("Postmark send threw", { job_id: job.id, error: String(err) });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2025-03-31.basil",
    });

    // Parse optional jobId from body (single-job mode)
    let targetJobId: string | null = null;
    try {
      const body = await req.json();
      if (body && typeof body.jobId === "string") targetJobId = body.jobId;
    } catch { /* no body — scan mode */ }

    const nowIso = new Date().toISOString();
    const fields = "id, title, category, client_id";

    let jobs: ExpiredJob[] = [];
    if (targetJobId) {
      const { data } = await supabase
        .from("jobs")
        .select(fields)
        .eq("id", targetJobId)
        .eq("status", "searching")
        .lte("assignment_deadline", nowIso)
        .maybeSingle();
      if (data) jobs = [data as unknown as ExpiredJob];
    } else {
      const { data, error } = await supabase
        .from("jobs")
        .select(fields)
        .eq("status", "searching")
        .lte("assignment_deadline", nowIso);
      if (error) {
        log("Scan query failed", { error: error.message });
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      jobs = (data ?? []) as unknown as ExpiredJob[];
    }

    log(`Processing ${jobs.length} expired job(s)`, { mode: targetJobId ? "single" : "scan" });

    let processed = 0;
    let failed = 0;
    for (const job of jobs) {
      try {
        await processExpiredJob(supabase, stripe, job);
        processed++;
      } catch (err) {
        failed++;
        log("Failed to process expired job", { job_id: job.id, error: String(err) });
      }
    }

    return new Response(
      JSON.stringify({ processed, failed, total: jobs.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    log("Unhandled error", { error: String(err) });
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
