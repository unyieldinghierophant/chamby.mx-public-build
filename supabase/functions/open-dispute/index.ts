import { getCorsHeaders } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const log = (step: string, details?: Record<string, unknown>) => {
  console.log(`[OPEN-DISPUTE] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

const VALID_REASON_CODES = ["no_show", "incomplete", "bad_work", "client_not_home", "payment_issue", "other"];
const ALLOWED_STATUSES = ["cancelled", "completed", "in_progress"];

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const respond = (status: number, data: Record<string, unknown>) =>
    new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return respond(401, { error: "No authorization header" });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) return respond(401, { error: "Authentication failed" });
    const userId = userData.user.id;

    const { job_id, reason_code, description } = await req.json();

    if (!job_id) return respond(400, { error: "job_id is required" });
    if (!reason_code || !VALID_REASON_CODES.includes(reason_code)) {
      return respond(400, { error: `reason_code must be one of: ${VALID_REASON_CODES.join(", ")}` });
    }
    if (!description || description.trim().length < 20) {
      return respond(400, { error: "description must be at least 20 characters" });
    }

    log("Request", { job_id, reason_code, userId });

    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .select("id, status, client_id, provider_id, has_open_dispute, title")
      .eq("id", job_id)
      .single();

    if (jobErr || !job) return respond(404, { error: "Job not found" });

    let role: string;
    if (job.client_id === userId) role = "client";
    else if (job.provider_id === userId) role = "provider";
    else return respond(403, { error: "You are not part of this job" });

    if (!ALLOWED_STATUSES.includes(job.status)) {
      return respond(400, { error: `Disputes can only be opened on jobs with status: ${ALLOWED_STATUSES.join(", ")}` });
    }

    if (job.has_open_dispute) {
      return respond(400, { error: "There is already an open dispute for this job" });
    }

    const { data: invoice } = await supabase
      .from("invoices")
      .select("id")
      .eq("job_id", job_id)
      .not("status", "eq", "cancelled")
      .maybeSingle();

    const { data: dispute, error: insertErr } = await supabase
      .from("disputes")
      .insert({
        job_id,
        invoice_id: invoice?.id ?? null,
        opened_by_user_id: userId,
        opened_by_role: role,
        opened_by: role,
        reason_code,
        reason: reason_code,
        reason_text: description,
        description,
        status: "open",
      })
      .select("id")
      .single();

    if (insertErr) throw new Error(insertErr.message);

    await supabase.from("jobs").update({
      has_open_dispute: true,
      dispute_status: "open",
      updated_at: new Date().toISOString(),
    }).eq("id", job_id);

    const otherPartyId = role === "client" ? job.provider_id : job.client_id;
    if (otherPartyId) {
      await supabase.from("notifications").insert({
        user_id: otherPartyId,
        type: "dispute_opened",
        title: "Disputa abierta",
        message: `Se abrió una disputa en el trabajo "${job.title || job_id.slice(0, 8)}". Un administrador la revisará pronto.`,
        link: role === "client" ? `/provider-portal/jobs/${job_id}` : `/active-jobs`,
        data: { job_id, dispute_id: dispute.id },
      });
    }

    await (supabase as any).from("admin_notifications").insert({
      type: "dispute_opened",
      booking_id: job_id,
      triggered_by_user_id: userId,
      message: `Nueva disputa abierta por ${role} en trabajo ${job_id.slice(0, 8)}. Motivo: ${reason_code}.`,
      is_read: false,
    });

    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (adminRoles?.length) {
      await supabase.from("notifications").insert(
        adminRoles.map((a: { user_id: string }) => ({
          user_id: a.user_id,
          type: "dispute_opened",
          title: "Nueva disputa — acción requerida",
          message: `Disputa en trabajo ${job_id.slice(0, 8)} (${role}). Motivo: ${reason_code}.`,
          link: "/admin/console",
          data: { job_id, dispute_id: dispute.id },
        }))
      );
    }

    log("Dispute opened", { dispute_id: dispute.id, role });

    return respond(200, { success: true, dispute_id: dispute.id, role });
  } catch (e: any) {
    log("ERROR", { message: e.message });
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
