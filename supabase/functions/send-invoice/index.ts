import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SEND-INVOICE] ${step}${detailsStr}`);
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

    // Authenticate
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error(`Authentication error: ${userError?.message || "User not found"}`);
    }
    const userId = userData.user.id;
    logStep("User authenticated", { userId });

    // Parse body
    const { invoice_id } = await req.json();
    if (!invoice_id) throw new Error("invoice_id is required");
    logStep("Request parsed", { invoice_id });

    // Fetch invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoice_id)
      .maybeSingle();

    if (invoiceError) throw new Error(`Error fetching invoice: ${invoiceError.message}`);
    if (!invoice) throw new Error("Invoice not found");

    // Validate ownership
    if (invoice.provider_id !== userId) {
      throw new Error("You do not have permission to send this invoice");
    }

    // Validate status
    if (invoice.status !== "draft") {
      throw new Error(`Invoice status must be 'draft' to send, current status: '${invoice.status}'`);
    }
    logStep("Invoice validated", { invoiceId: invoice.id, status: invoice.status });

    // Update invoice: status → sent, valid_until → 72h from now
    const validUntil = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
    const { data: updatedInvoice, error: updateError } = await supabase
      .from("invoices")
      .update({
        status: "sent",
        valid_until: validUntil,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoice_id)
      .select()
      .single();

    if (updateError) throw new Error(`Error updating invoice: ${updateError.message}`);
    logStep("Invoice updated to sent", { validUntil });

    // Fetch job for context
    const { data: job } = await supabase
      .from("jobs")
      .select("id, title, description, client_id")
      .eq("id", invoice.job_id)
      .maybeSingle();

    // Insert system message
    if (job) {
      const { error: msgError } = await supabase
        .from("messages")
        .insert({
          job_id: invoice.job_id,
          sender_id: userId,
          receiver_id: job.client_id,
          is_system_message: true,
          system_event_type: "invoice_sent",
          message_text: `Provider sent an invoice for review. Total: $${invoice.total_customer_amount.toFixed(2)}`,
        });

      if (msgError) {
        logStep("Warning: Failed to insert system message", { error: msgError.message });
      } else {
        logStep("System message inserted");
      }
    }

    // Insert notification for client
    const clientId = invoice.user_id;
    const jobDescription = job?.title || job?.description || "your job";
    const { error: notifError } = await supabase
      .from("notifications")
      .insert({
        user_id: clientId,
        type: "invoice_sent",
        title: "New Invoice",
        message: `Your provider sent an invoice for ${jobDescription}`,
        link: `/jobs/${invoice.job_id}`,
        data: {
          invoice_id: invoice.id,
          job_id: invoice.job_id,
          amount: invoice.total_customer_amount,
        },
        read: false,
      });

    if (notifError) {
      logStep("Warning: Failed to create notification", { error: notifError.message });
    } else {
      logStep("Notification created for client");
    }

    logStep("Invoice sent successfully");

    return new Response(
      JSON.stringify({ success: true, invoice: updatedInvoice }),
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
