import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: Record<string, unknown>) => {
  console.log(`[OPEN-DISPUTE] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log("Function started");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Authenticate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Authentication failed");

    const userId = userData.user.id;
    const { job_id, reason_code, reason_text } = await req.json();

    if (!job_id) throw new Error("job_id is required");
    if (!reason_code) throw new Error("reason_code is required");

    const validCodes = ["no_show", "bad_service", "pricing_dispute", "damage", "other"];
    if (!validCodes.includes(reason_code)) {
      throw new Error(`Invalid reason_code. Must be one of: ${validCodes.join(", ")}`);
    }

    log("Request", { job_id, reason_code, userId });

    // Fetch job
    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .select("id, status, client_id, provider_id, has_open_dispute")
      .eq("id", job_id)
      .single();

    if (jobErr || !job) throw new Error("Job not found");

    // Check if user is part of the job
    let role: string;
    if (job.client_id === userId) {
      role = "client";
    } else if (job.provider_id === userId) {
      role = "provider";
    } else {
      throw new Error("You are not part of this job");
    }

    // Check no existing open dispute
    if (job.has_open_dispute) {
      throw new Error("There is already an open dispute for this job");
    }

    // Check invoice is paid and not yet released
    const { data: invoice } = await supabase
      .from("invoices")
      .select("id, status")
      .eq("job_id", job_id)
      .in("status", ["paid", "ready_to_release"])
      .maybeSingle();

    if (!invoice) {
      throw new Error("No eligible invoice found. Invoice must be paid and not yet released.");
    }

    // Insert dispute
    const { data: dispute, error: insertErr } = await supabase
      .from("disputes")
      .insert({
        job_id,
        invoice_id: invoice.id,
        opened_by_user_id: userId,
        opened_by_role: role,
        reason_code,
        reason_text: reason_text || null,
      })
      .select("id")
      .single();

    if (insertErr) throw new Error(insertErr.message);

    // Update job
    await supabase
      .from("jobs")
      .update({
        has_open_dispute: true,
        dispute_status: "open",
        updated_at: new Date().toISOString(),
      })
      .eq("id", job_id);

    // Notify other party
    const otherPartyId = role === "client" ? job.provider_id : job.client_id;
    if (otherPartyId) {
      await supabase.from("notifications").insert({
        user_id: otherPartyId,
        type: "dispute_opened",
        title: "Disputa abierta",
        message: `Se abrió una disputa para el trabajo. Razón: ${reason_code}`,
        link: role === "client" ? "/provider-portal/jobs" : "/active-jobs",
        data: { job_id, dispute_id: dispute.id },
      });
    }

    // Notify admins — find admin user IDs
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (adminRoles) {
      for (const admin of adminRoles) {
        await supabase.from("notifications").insert({
          user_id: admin.user_id,
          type: "dispute_opened",
          title: "Nueva disputa abierta",
          message: `Disputa en trabajo ${job_id.slice(0, 8)}. Razón: ${reason_code}`,
          link: "/admin",
          data: { job_id, dispute_id: dispute.id },
        });
      }
    }

    log("Dispute opened", { dispute_id: dispute.id, role });

    return new Response(
      JSON.stringify({ success: true, dispute_id: dispute.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
