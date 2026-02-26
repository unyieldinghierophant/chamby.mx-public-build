import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[EXPIRE-INVOICES] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Fetch all expired invoices (sent or countered past valid_until)
    const { data: expiredInvoices, error: fetchError } = await supabase
      .from("invoices")
      .select("id, job_id, provider_id, user_id, status, total_customer_amount")
      .in("status", ["sent", "countered"])
      .not("valid_until", "is", null)
      .lt("valid_until", new Date().toISOString());

    if (fetchError) throw new Error(`Error fetching expired invoices: ${fetchError.message}`);

    const invoices = expiredInvoices || [];
    logStep("Found expired invoices", { count: invoices.length });

    if (invoices.length === 0) {
      return new Response(
        JSON.stringify({ success: true, expired_count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Batch update all expired invoices
    const invoiceIds = invoices.map((i) => i.id);
    const { error: updateError } = await supabase
      .from("invoices")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .in("id", invoiceIds);

    if (updateError) throw new Error(`Error batch-updating invoices: ${updateError.message}`);
    logStep("Batch updated invoices to expired", { count: invoiceIds.length });

    // Build system messages and notifications in bulk
    const messages = invoices.map((inv) => ({
      job_id: inv.job_id,
      sender_id: inv.provider_id,
      receiver_id: inv.user_id,
      is_system_message: true,
      system_event_type: "invoice_expired",
      message_text: "The invoice has expired without a response.",
    }));

    const notifications = invoices.flatMap((inv) => [
      {
        user_id: inv.provider_id,
        type: "invoice_expired",
        title: "Invoice Expired",
        message: `Your invoice for $${inv.total_customer_amount.toFixed(2)} expired without a client response.`,
        link: `/jobs/${inv.job_id}`,
        data: { invoice_id: inv.id, job_id: inv.job_id },
        read: false,
      },
      {
        user_id: inv.user_id,
        type: "invoice_expired",
        title: "Invoice Expired",
        message: `An invoice for $${inv.total_customer_amount.toFixed(2)} has expired.`,
        link: `/jobs/${inv.job_id}`,
        data: { invoice_id: inv.id, job_id: inv.job_id },
        read: false,
      },
    ]);

    // Batch insert messages
    const { error: msgError } = await supabase.from("messages").insert(messages);
    if (msgError) {
      logStep("Warning: Failed to insert system messages", { error: msgError.message });
    } else {
      logStep("System messages inserted", { count: messages.length });
    }

    // Batch insert notifications
    const { error: notifError } = await supabase.from("notifications").insert(notifications);
    if (notifError) {
      logStep("Warning: Failed to insert notifications", { error: notifError.message });
    } else {
      logStep("Notifications inserted", { count: notifications.length });
    }

    logStep("Completed", { expired_count: invoices.length });

    return new Response(
      JSON.stringify({ success: true, expired_count: invoices.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
