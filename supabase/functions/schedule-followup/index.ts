import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SCHEDULE-FOLLOWUP] ${step}${detailsStr}`);
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
    const { job_id, invoice_id, scheduled_at } = await req.json();
    if (!job_id) throw new Error("job_id is required");
    if (!invoice_id) throw new Error("invoice_id is required");
    if (!scheduled_at) throw new Error("scheduled_at is required");
    logStep("Request parsed", { job_id, invoice_id, scheduled_at });

    // Fetch job
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", job_id)
      .maybeSingle();

    if (jobError) throw new Error(`Error fetching job: ${jobError.message}`);
    if (!job) throw new Error("Job not found");

    // Validate caller is client or provider on the job
    if (job.client_id !== userId && job.provider_id !== userId) {
      throw new Error("You do not have permission to schedule a follow-up for this job");
    }

    // Check if follow-up already scheduled
    if (job.followup_scheduled_at) {
      throw new Error("Follow-up already scheduled");
    }

    // Fetch invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoice_id)
      .maybeSingle();

    if (invoiceError) throw new Error(`Error fetching invoice: ${invoiceError.message}`);
    if (!invoice) throw new Error("Invoice not found");

    // Validate invoice is linked to job
    if (invoice.job_id !== job_id) {
      throw new Error("Invoice is not linked to this job");
    }

    // Validate requires_followup_visit
    if (!invoice.requires_followup_visit) {
      throw new Error("Invoice does not require a follow-up visit");
    }

    // Validate invoice status
    if (!["accepted", "paid"].includes(invoice.status)) {
      throw new Error(`Invoice status must be 'accepted' or 'paid', current: '${invoice.status}'`);
    }

    logStep("Validations passed");

    // Update job
    const { data: updatedJob, error: updateError } = await supabase
      .from("jobs")
      .update({
        followup_scheduled_at: scheduled_at,
        followup_status: "scheduled",
        followup_invoice_id: invoice_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", job_id)
      .select()
      .single();

    if (updateError) throw new Error(`Error updating job: ${updateError.message}`);
    logStep("Job updated with follow-up");

    // Format date for messages
    const formattedDate = new Date(scheduled_at).toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Insert system message
    const { error: msgError } = await supabase.from("messages").insert({
      job_id,
      sender_id: userId,
      receiver_id: userId === job.client_id ? job.provider_id : job.client_id,
      is_system_message: true,
      system_event_type: "followup_scheduled",
      message_text: `Follow-up visit scheduled for ${formattedDate}.`,
    });

    if (msgError) {
      logStep("Warning: Failed to insert system message", { error: msgError.message });
    } else {
      logStep("System message inserted");
    }

    // Insert notifications for both parties
    const notifications = [
      {
        user_id: job.client_id,
        type: "followup_scheduled",
        title: "Follow-up Visit Scheduled",
        message: `A follow-up visit has been scheduled for ${formattedDate}.`,
        link: `/jobs/${job_id}`,
        data: { job_id, invoice_id, scheduled_at },
        read: false,
      },
      {
        user_id: job.provider_id,
        type: "followup_scheduled",
        title: "Follow-up Visit Scheduled",
        message: `A follow-up visit has been scheduled for ${formattedDate}.`,
        link: `/jobs/${job_id}`,
        data: { job_id, invoice_id, scheduled_at },
        read: false,
      },
    ];

    const { error: notifError } = await supabase.from("notifications").insert(notifications);
    if (notifError) {
      logStep("Warning: Failed to insert notifications", { error: notifError.message });
    } else {
      logStep("Notifications inserted");
    }

    logStep("Follow-up scheduled successfully");

    return new Response(
      JSON.stringify({ success: true, job: updatedJob }),
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
