import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CHECK-VISIT-CONFIRMATIONS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started - checking for expired visit confirmations");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Find jobs where:
    // - provider_confirmed_visit = true
    // - client_confirmed_visit = false
    // - visit_dispute_status IS NULL
    // - visit_confirmation_deadline < now()
    const now = new Date().toISOString();
    
    const { data: expiredJobs, error: fetchError } = await supabaseClient
      .from("jobs")
      .select("id, title, client_id, provider_id, visit_confirmation_deadline")
      .eq("provider_confirmed_visit", true)
      .eq("client_confirmed_visit", false)
      .is("visit_dispute_status", null)
      .lt("visit_confirmation_deadline", now);

    if (fetchError) {
      throw new Error(`Failed to fetch expired jobs: ${fetchError.message}`);
    }

    logStep("Found expired jobs", { count: expiredJobs?.length || 0 });

    if (!expiredJobs || expiredJobs.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "No expired confirmations found",
          processed: 0
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Get all admin users
    const { data: admins } = await supabaseClient
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    const adminIds = admins?.map(a => a.user_id) || [];
    logStep("Found admins", { count: adminIds.length });

    let processedCount = 0;

    for (const job of expiredJobs) {
      logStep("Processing expired job", { jobId: job.id, title: job.title });

      // Update job to pending_support
      const { error: updateError } = await supabaseClient
        .from("jobs")
        .update({ 
          visit_dispute_status: "pending_support",
          visit_dispute_reason: "Cliente no respondió dentro del tiempo límite (48h)"
        })
        .eq("id", job.id);

      if (updateError) {
        logStep("Error updating job", { jobId: job.id, error: updateError.message });
        continue;
      }

      // Notify admins
      if (adminIds.length > 0) {
        const adminNotifications = adminIds.map(adminId => ({
          user_id: adminId,
          type: "visit_confirmation_expired",
          title: "Confirmación de visita expirada",
          message: `El cliente no confirmó la visita para "${job.title}" dentro del tiempo límite. Requiere revisión manual.`,
          link: "/admin-dashboard",
          data: { job_id: job.id }
        }));

        const { error: notifyError } = await supabaseClient
          .from("notifications")
          .insert(adminNotifications);

        if (notifyError) {
          logStep("Error notifying admins", { error: notifyError.message });
        }
      }

      // Notify client
      await supabaseClient.from("notifications").insert({
        user_id: job.client_id,
        type: "visit_confirmation_escalated",
        title: "Tu confirmación ha sido escalada",
        message: `No confirmaste la visita para "${job.title}" a tiempo. El caso ha sido enviado al equipo de soporte.`,
        data: { job_id: job.id }
      });

      // Notify provider
      await supabaseClient.from("notifications").insert({
        user_id: job.provider_id,
        type: "visit_confirmation_escalated",
        title: "Caso escalado a soporte",
        message: `El cliente no confirmó la visita para "${job.title}" a tiempo. El equipo de soporte revisará el caso.`,
        data: { job_id: job.id }
      });

      processedCount++;
    }

    logStep("Processing complete", { processedCount });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Processed ${processedCount} expired confirmations`,
        processed: processedCount
      }),
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
