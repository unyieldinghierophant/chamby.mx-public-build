import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[RESPOND-TO-QUOTE] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const { data: userData, error: userError } = await anonClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Authentication failed");
    const userId = userData.user.id;
    logStep("Authenticated", { userId });

    const { job_id, invoice_id, action, rejection_reason } = await req.json();

    // Validate inputs
    if (!job_id || typeof job_id !== "string") throw new Error("job_id is required");
    if (!invoice_id || typeof invoice_id !== "string") throw new Error("invoice_id is required");
    if (action !== "accept" && action !== "reject") throw new Error("action must be 'accept' or 'reject'");

    // Fetch job
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, status, client_id, provider_id, title")
      .eq("id", job_id)
      .single();

    if (jobError || !job) throw new Error(`Job not found: ${jobError?.message}`);
    if (job.status !== "quoted") throw new Error(`Job must be in quoted status (current: ${job.status})`);
    if (job.client_id !== userId) throw new Error("Only the client can respond to a quote");

    // Fetch invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("id, status, total_customer_amount, subtotal_provider")
      .eq("id", invoice_id)
      .single();

    if (invoiceError || !invoice) throw new Error(`Invoice not found: ${invoiceError?.message}`);
    if (invoice.status !== "sent") throw new Error(`Invoice must be in sent status (current: ${invoice.status})`);

    logStep("Validated", { jobId: job.id, invoiceId: invoice.id, action });

    if (action === "accept") {
      // Update invoice
      const { error: invUpdateErr } = await supabase
        .from("invoices")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", invoice_id);
      if (invUpdateErr) throw new Error(`Failed to update invoice: ${invUpdateErr.message}`);

      // Update job
      const { error: jobUpdateErr } = await supabase
        .from("jobs")
        .update({ status: "quote_accepted", updated_at: new Date().toISOString() })
        .eq("id", job_id);
      if (jobUpdateErr) logStep("Failed to update job status", { error: jobUpdateErr.message });

      // Notify provider
      if (job.provider_id) {
        await supabase.from("notifications").insert({
          user_id: job.provider_id,
          type: "quote_accepted",
          title: "Cotización aceptada",
          message: "El cliente aceptó tu cotización. El siguiente paso es el pago.",
          link: `/provider-portal/jobs/${job.id}`,
          data: { jobId: job.id, invoiceId: invoice.id },
        });
      }

      // System message in chat
      await supabase.from("messages").insert({
        job_id: job.id,
        sender_id: userId,
        receiver_id: job.provider_id,
        message_text: "✅ Cotización aceptada",
        is_system_message: true,
        system_event_type: "quote_accepted",
      });

      logStep("Quote accepted", { jobId: job.id, invoiceId: invoice.id });
    } else {
      // Reject
      const reason = typeof rejection_reason === "string" && rejection_reason.trim().length > 0
        ? rejection_reason.trim().slice(0, 500)
        : "Rechazada por el cliente";

      // Update invoice
      const { error: invUpdateErr } = await supabase
        .from("invoices")
        .update({
          status: "rejected",
          rejection_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", invoice_id);
      if (invUpdateErr) throw new Error(`Failed to update invoice: ${invUpdateErr.message}`);

      // Update job
      const { error: jobUpdateErr } = await supabase
        .from("jobs")
        .update({ status: "quote_rejected", updated_at: new Date().toISOString() })
        .eq("id", job_id);
      if (jobUpdateErr) logStep("Failed to update job status", { error: jobUpdateErr.message });

      // Notify provider
      if (job.provider_id) {
        await supabase.from("notifications").insert({
          user_id: job.provider_id,
          type: "quote_rejected",
          title: "Cotización rechazada",
          message: `El cliente rechazó tu cotización. Motivo: ${reason}`,
          link: `/provider-portal/jobs/${job.id}`,
          data: { jobId: job.id, invoiceId: invoice.id, reason },
        });
      }

      // System message in chat
      await supabase.from("messages").insert({
        job_id: job.id,
        sender_id: userId,
        receiver_id: job.provider_id,
        message_text: `❌ Cotización rechazada: ${reason}`,
        is_system_message: true,
        system_event_type: "quote_rejected",
      });

      logStep("Quote rejected", { jobId: job.id, reason });
    }

    return new Response(
      JSON.stringify({ success: true, action }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
