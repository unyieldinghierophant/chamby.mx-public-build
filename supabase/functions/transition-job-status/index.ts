import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Valid transitions map (mirrors jobStateMachine.ts)
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["searching", "cancelled"],
  searching: ["assigned", "no_match", "cancelled"],
  assigned: ["on_site", "cancelled", "disputed"],
  on_site: ["quoted", "disputed"],
  quoted: ["quote_accepted", "quote_rejected", "disputed"],
  quote_accepted: ["job_paid", "cancelled"],
  quote_rejected: ["cancelled"],
  job_paid: ["in_progress"],
  in_progress: ["provider_done", "disputed"],
  provider_done: ["completed", "disputed"],
  completed: [],
  cancelled: [],
  no_match: ["cancelled"],
  disputed: ["completed", "cancelled"],
};

// Who can trigger which transitions
const PROVIDER_TRANSITIONS = ["on_site", "provider_done"];
const CLIENT_TRANSITIONS = ["completed"];

const NOTIFICATION_MESSAGES: Record<string, { toClient?: string; toProvider?: string }> = {
  on_site: { toClient: "📌 El proveedor llegó a tu domicilio." },
  provider_done: { toClient: "✔️ El proveedor terminó el trabajo. Por favor confirma." },
  completed: { toProvider: "🎉 El cliente confirmó. ¡Trabajo completado!" },
};

const STATUS_LABELS: Record<string, string> = {
  on_site: "En sitio",
  provider_done: "Trabajo terminado",
  completed: "Completado",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get caller
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { job_id, new_status } = await req.json();
    if (!job_id || !new_status) {
      return new Response(JSON.stringify({ error: "job_id y new_status son requeridos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch job
    const { data: job, error: jobErr } = await supabaseAdmin
      .from("jobs")
      .select("id, status, provider_id, client_id")
      .eq("id", job_id)
      .single();

    if (jobErr || !job) {
      return new Response(JSON.stringify({ error: "Trabajo no encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate transition
    const allowed = VALID_TRANSITIONS[job.status] || [];
    if (!allowed.includes(new_status)) {
      return new Response(
        JSON.stringify({ error: `No se puede cambiar de "${job.status}" a "${new_status}"` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Authorization check
    if (PROVIDER_TRANSITIONS.includes(new_status)) {
      if (user.id !== job.provider_id) {
        return new Response(JSON.stringify({ error: "Solo el proveedor asignado puede realizar esta acción" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Must be verified
      const { data: pd } = await supabaseAdmin
        .from("provider_details")
        .select("verification_status")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!pd || pd.verification_status !== "verified") {
        return new Response(JSON.stringify({ error: "Solo proveedores verificados pueden realizar esta acción" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else if (CLIENT_TRANSITIONS.includes(new_status)) {
      if (user.id !== job.client_id) {
        return new Response(JSON.stringify({ error: "Solo el cliente puede realizar esta acción" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Build update payload
    const updatePayload: Record<string, any> = {
      status: new_status,
      updated_at: new Date().toISOString(),
    };

    if (new_status === "provider_done") {
      updatePayload.completion_marked_at = new Date().toISOString();
      updatePayload.completion_status = "provider_marked_done";
    }
    if (new_status === "completed") {
      updatePayload.completion_confirmed_at = new Date().toISOString();
      updatePayload.completion_status = "completed";
    }

    const { error: updateErr } = await supabaseAdmin
      .from("jobs")
      .update(updatePayload)
      .eq("id", job_id);

    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Notifications & system messages
    const notifConfig = NOTIFICATION_MESSAGES[new_status];
    if (notifConfig) {
      const notifyUserId = notifConfig.toClient ? job.client_id : job.provider_id;
      const msgText = notifConfig.toClient || notifConfig.toProvider || "";

      // System message in chat
      if (notifyUserId) {
        await supabaseAdmin.from("messages").insert({
          job_id: job.id,
          sender_id: user.id,
          receiver_id: notifyUserId,
          message_text: msgText,
          is_system_message: true,
          system_event_type: new_status,
          read: false,
        });

        // Notification
        await supabaseAdmin.from("notifications").insert({
          user_id: notifyUserId,
          type: `job_${new_status}`,
          title: STATUS_LABELS[new_status] || new_status,
          message: msgText,
          link: notifConfig.toProvider
            ? `/provider-portal/jobs/${job.id}`
            : `/active-jobs`,
          data: { job_id: job.id },
        });
      }
    }

    // If completed, trigger settlement via complete-job
    if (new_status === "completed") {
      try {
        await supabaseAdmin.functions.invoke("complete-job", {
          body: { job_id: job.id, action: "client_confirm" },
        });
      } catch (e) {
        console.error("Settlement trigger error:", e);
        // Don't fail the transition — settlement can be retried
      }
    }

    return new Response(
      JSON.stringify({ success: true, job_id: job.id, new_status }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("transition-job-status error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
