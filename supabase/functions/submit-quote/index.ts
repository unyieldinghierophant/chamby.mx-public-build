import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[SUBMIT-QUOTE] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
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

    const { job_id, provider_quote_cents } = await req.json();

    // Validate inputs
    if (!job_id || typeof job_id !== "string") {
      throw new Error("job_id is required");
    }
    if (typeof provider_quote_cents !== "number" || provider_quote_cents <= 0 || provider_quote_cents > 10_000_000) {
      throw new Error("provider_quote_cents must be between 1 and 10,000,000 (max $100k MXN)");
    }
    if (!Number.isInteger(provider_quote_cents)) {
      throw new Error("provider_quote_cents must be an integer (centavos)");
    }

    // Fetch job
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, status, provider_id, client_id, title")
      .eq("id", job_id)
      .single();

    if (jobError || !job) throw new Error(`Job not found: ${jobError?.message}`);
    if (job.status !== "on_site") throw new Error(`Job must be in on_site status (current: ${job.status})`);
    if (job.provider_id !== userId) throw new Error("Only the assigned provider can submit a quote");

    // Verified providers only
    const { data: providerDetails } = await supabase
      .from("provider_details")
      .select("verification_status")
      .eq("user_id", userId)
      .maybeSingle();
    if (!providerDetails || providerDetails.verification_status !== "verified") {
      throw new Error("Solo proveedores verificados pueden enviar cotizaciones");
    }

    logStep("Job validated", { jobId: job.id, status: job.status });

    // Calculate breakdown — mirrors src/utils/pricingConfig.ts calculateJobPayment()
    const clientSurcharge = Math.round(provider_quote_cents * 0.10);
    const providerDeduction = Math.round(provider_quote_cents * 0.10);
    const chambyGrossMargin = clientSurcharge + providerDeduction;
    const subtotalBeforeIVA = provider_quote_cents + clientSurcharge;
    const ivaAmount = Math.round(subtotalBeforeIVA * 0.16);
    const estimatedStripeFee = Math.round(subtotalBeforeIVA * 0.036) + 300;
    const clientTotal = Math.round((subtotalBeforeIVA + ivaAmount + estimatedStripeFee) / 100) * 100;
    const providerPayout = provider_quote_cents - providerDeduction;

    logStep("Breakdown calculated", {
      providerQuoteCents: provider_quote_cents,
      clientSurcharge,
      providerDeduction,
      clientTotal,
      providerPayout,
    });

    // Insert invoice (amounts stored in pesos for backward compatibility)
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        job_id: job.id,
        provider_id: job.provider_id,
        user_id: job.client_id,
        status: "sent",
        subtotal_provider: provider_quote_cents / 100,
        chamby_commission_amount: chambyGrossMargin / 100,
        client_surcharge_amount: clientSurcharge / 100,
        vat_amount: ivaAmount / 100,
        vat_rate: 0.16,
        total_customer_amount: clientTotal / 100,
        provider_payout_amount: providerPayout / 100,
      })
      .select("id")
      .single();

    if (invoiceError) throw new Error(`Failed to create invoice: ${invoiceError.message}`);
    logStep("Invoice created", { invoiceId: invoice.id });

    // Update job status to 'quoted'
    const { error: jobUpdateError } = await supabase
      .from("jobs")
      .update({ status: "quoted", updated_at: new Date().toISOString() })
      .eq("id", job.id);

    if (jobUpdateError) {
      logStep("Failed to update job status", { error: jobUpdateError.message });
    }

    // Format amount for notification
    const formattedAmount = "$" + (provider_quote_cents / 100).toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    // Notify client
    await supabase.from("notifications").insert({
      user_id: job.client_id,
      type: "quote_received",
      title: "Nueva cotización recibida",
      message: `El proveedor envió una cotización de ${formattedAmount}. Revísala para continuar.`,
      link: `/active-jobs?job_id=${job.id}`,
      data: { jobId: job.id, invoiceId: invoice.id, providerQuoteCents: provider_quote_cents },
    });

    logStep("Client notified");

    // Send system message in chat
    await supabase.from("messages").insert({
      job_id: job.id,
      sender_id: userId,
      receiver_id: job.client_id,
      message_text: `💰 Cotización enviada: ${formattedAmount} MXN`,
      is_system_message: true,
      system_event_type: "quote_submitted",
    });

    return new Response(
      JSON.stringify({
        invoice_id: invoice.id,
        breakdown: {
          provider_quote_cents: provider_quote_cents,
          client_surcharge_cents: clientSurcharge,
          provider_deduction_cents: providerDeduction,
          chamby_gross_margin_cents: chambyGrossMargin,
          subtotal_before_iva_cents: subtotalBeforeIVA,
          iva_cents: ivaAmount,
          estimated_stripe_fee_cents: estimatedStripeFee,
          client_total_cents: clientTotal,
          provider_payout_cents: providerPayout,
        },
      }),
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
