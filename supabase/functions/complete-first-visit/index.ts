import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[COMPLETE-FIRST-VISIT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }
    logStep("Using Stripe LIVE mode");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error(`Authentication error: ${userError?.message || "User not found"}`);
    }
    const authenticatedUser = userData.user;
    logStep("User authenticated", { userId: authenticatedUser.id });

    // Parse request body
    const { jobId, action = "capture", disputeReason } = await req.json();
    if (!jobId) {
      throw new Error("jobId is required");
    }
    logStep("Request parsed", { jobId, action });

    // Validate action
    const validActions = ["capture", "release", "provider_confirm", "client_confirm", "client_dispute", "admin_resolve_capture", "admin_resolve_release"];
    if (!validActions.includes(action)) {
      throw new Error(`Invalid action. Must be one of: ${validActions.join(", ")}`);
    }

    // Fetch job
    const { data: job, error: jobError } = await supabaseClient
      .from("jobs")
      .select("id, title, provider_id, client_id, provider_visited, provider_confirmed_visit, client_confirmed_visit, visit_confirmation_deadline, visit_dispute_status, stripe_visit_payment_intent_id, visit_fee_amount, visit_fee_paid, status")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      throw new Error(`Job not found: ${jobError?.message || "Unknown error"}`);
    }
    logStep("Job fetched", { jobId: job.id, title: job.title });

    // ===== PROVIDER CONFIRM ACTION =====
    if (action === "provider_confirm") {
      // Verify user is the provider
      if (job.provider_id !== authenticatedUser.id) {
        throw new Error("You are not assigned to this job");
      }

      if (job.provider_confirmed_visit === true) {
        return new Response(
          JSON.stringify({ 
            success: true,
            message: "Provider already confirmed visit",
            already_confirmed: true
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      // Set provider confirmation and 48h deadline
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + 48);

      const { error: updateError } = await supabaseClient
        .from("jobs")
        .update({ 
          provider_confirmed_visit: true,
          visit_confirmation_deadline: deadline.toISOString()
        })
        .eq("id", jobId);

      if (updateError) {
        throw new Error(`Failed to update job: ${updateError.message}`);
      }

      // Send notification to client
      await supabaseClient.from("notifications").insert({
        user_id: job.client_id,
        type: "visit_confirmation_required",
        title: "Confirma la visita del proveedor",
        message: `El proveedor ha confirmado que completó la visita para "${job.title}". Por favor confirma si estás satisfecho.`,
        link: "/active-jobs",
        data: { job_id: jobId }
      });

      logStep("Provider confirmed visit", { deadline: deadline.toISOString() });

      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Visit confirmed by provider. Waiting for client confirmation.",
          confirmation_deadline: deadline.toISOString()
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ===== CLIENT CONFIRM ACTION =====
    if (action === "client_confirm") {
      // Verify user is the client
      if (job.client_id !== authenticatedUser.id) {
        throw new Error("You are not the client for this job");
      }

      if (!job.provider_confirmed_visit) {
        throw new Error("Provider has not confirmed the visit yet");
      }

      if (job.client_confirmed_visit === true) {
        return new Response(
          JSON.stringify({ 
            success: true,
            message: "Client already confirmed visit",
            already_confirmed: true
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      // Capture payment
      const paymentIntentId = job.stripe_visit_payment_intent_id;
      let paymentAction = "none";

      if (paymentIntentId) {
        const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (paymentIntent.status === "requires_capture") {
          await stripe.paymentIntents.capture(paymentIntentId);
          paymentAction = "captured";
          logStep("Payment captured", { paymentIntentId });
        } else if (paymentIntent.status === "succeeded") {
          paymentAction = "already_captured";
        }
      }

      // Update job
      const { error: updateError } = await supabaseClient
        .from("jobs")
        .update({ 
          client_confirmed_visit: true,
          provider_visited: true,
          visit_fee_paid: paymentAction === "captured" || paymentAction === "already_captured"
        })
        .eq("id", jobId);

      if (updateError) {
        throw new Error(`Failed to update job: ${updateError.message}`);
      }

      // Notify provider
      await supabaseClient.from("notifications").insert({
        user_id: job.provider_id,
        type: "visit_confirmed_by_client",
        title: "¡Visita confirmada!",
        message: `El cliente confirmó la visita para "${job.title}". El pago ha sido procesado.`,
        link: "/provider-portal/jobs",
        data: { job_id: jobId }
      });

      logStep("Client confirmed visit and payment captured");

      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Visit confirmed by client. Payment captured.",
          payment_action: paymentAction
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ===== CLIENT DISPUTE ACTION =====
    if (action === "client_dispute") {
      // Verify user is the client
      if (job.client_id !== authenticatedUser.id) {
        throw new Error("You are not the client for this job");
      }

      if (!job.provider_confirmed_visit) {
        throw new Error("Provider has not confirmed the visit yet");
      }

      // Update job with dispute status
      const { error: updateError } = await supabaseClient
        .from("jobs")
        .update({ 
          visit_dispute_status: "pending_support",
          visit_dispute_reason: disputeReason || "No reason provided"
        })
        .eq("id", jobId);

      if (updateError) {
        throw new Error(`Failed to update job: ${updateError.message}`);
      }

      // Notify admins
      const { data: admins } = await supabaseClient
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (admins && admins.length > 0) {
        const notifications = admins.map(admin => ({
          user_id: admin.user_id,
          type: "visit_dispute_opened",
          title: "Nueva disputa de visita",
          message: `El cliente ha abierto una disputa para "${job.title}". Razón: ${disputeReason || "No especificada"}`,
          link: "/admin-dashboard",
          data: { job_id: jobId }
        }));
        await supabaseClient.from("notifications").insert(notifications);
      }

      // Notify provider
      await supabaseClient.from("notifications").insert({
        user_id: job.provider_id,
        type: "visit_disputed",
        title: "Disputa abierta",
        message: `El cliente ha reportado un problema con la visita para "${job.title}". El equipo de soporte revisará el caso.`,
        link: "/provider-portal/jobs",
        data: { job_id: jobId }
      });

      logStep("Client dispute opened", { reason: disputeReason });

      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Dispute opened. Support will review the case."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ===== ADMIN RESOLVE CAPTURE =====
    if (action === "admin_resolve_capture") {
      // Verify user is admin
      const { data: adminRole } = await supabaseClient
        .from("user_roles")
        .select("role")
        .eq("user_id", authenticatedUser.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!adminRole) {
        throw new Error("Admin privileges required");
      }

      const paymentIntentId = job.stripe_visit_payment_intent_id;
      let paymentAction = "none";

      if (paymentIntentId) {
        const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (paymentIntent.status === "requires_capture") {
          await stripe.paymentIntents.capture(paymentIntentId);
          paymentAction = "captured";
        } else if (paymentIntent.status === "succeeded") {
          paymentAction = "already_captured";
        }
      }

      const { error: updateError } = await supabaseClient
        .from("jobs")
        .update({ 
          visit_dispute_status: "resolved_provider",
          provider_visited: true,
          visit_fee_paid: true
        })
        .eq("id", jobId);

      if (updateError) {
        throw new Error(`Failed to update job: ${updateError.message}`);
      }

      // Notify both parties
      await supabaseClient.from("notifications").insert([
        {
          user_id: job.client_id,
          type: "dispute_resolved",
          title: "Disputa resuelta",
          message: `La disputa para "${job.title}" ha sido resuelta a favor del proveedor. El pago ha sido procesado.`,
          data: { job_id: jobId }
        },
        {
          user_id: job.provider_id,
          type: "dispute_resolved",
          title: "Disputa resuelta a tu favor",
          message: `La disputa para "${job.title}" ha sido resuelta a tu favor. El pago ha sido procesado.`,
          data: { job_id: jobId }
        }
      ]);

      logStep("Admin resolved dispute - captured payment");

      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Dispute resolved. Payment captured.",
          payment_action: paymentAction
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ===== ADMIN RESOLVE RELEASE =====
    if (action === "admin_resolve_release") {
      // Verify user is admin
      const { data: adminRole } = await supabaseClient
        .from("user_roles")
        .select("role")
        .eq("user_id", authenticatedUser.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!adminRole) {
        throw new Error("Admin privileges required");
      }

      const paymentIntentId = job.stripe_visit_payment_intent_id;
      let paymentAction = "none";

      if (paymentIntentId) {
        const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (["requires_capture", "requires_payment_method", "requires_confirmation"].includes(paymentIntent.status)) {
          await stripe.paymentIntents.cancel(paymentIntentId);
          paymentAction = "released";
        } else if (paymentIntent.status === "canceled") {
          paymentAction = "already_released";
        }
      }

      const { error: updateError } = await supabaseClient
        .from("jobs")
        .update({ 
          visit_dispute_status: "resolved_client",
          visit_fee_paid: false
        })
        .eq("id", jobId);

      if (updateError) {
        throw new Error(`Failed to update job: ${updateError.message}`);
      }

      // Notify both parties
      await supabaseClient.from("notifications").insert([
        {
          user_id: job.client_id,
          type: "dispute_resolved",
          title: "Disputa resuelta",
          message: `La disputa para "${job.title}" ha sido resuelta a tu favor. Los fondos han sido liberados.`,
          data: { job_id: jobId }
        },
        {
          user_id: job.provider_id,
          type: "dispute_resolved",
          title: "Disputa resuelta",
          message: `La disputa para "${job.title}" ha sido resuelta a favor del cliente. Los fondos han sido liberados.`,
          data: { job_id: jobId }
        }
      ]);

      logStep("Admin resolved dispute - released payment");

      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Dispute resolved. Payment released.",
          payment_action: paymentAction
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ===== LEGACY: CAPTURE/RELEASE ACTIONS (for backwards compatibility) =====
    // Verify provider is assigned to this job
    if (job.provider_id !== authenticatedUser.id) {
      throw new Error("You are not assigned to this job");
    }

    // Check if first visit already completed
    if (job.provider_visited === true) {
      logStep("First visit already completed for this job");
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "First visit already completed",
          already_completed: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const paymentIntentId = job.stripe_visit_payment_intent_id;
    
    if (!paymentIntentId) {
      logStep("No PaymentIntent found for this job, marking visit complete without payment action");
      
      const { error: updateError } = await supabaseClient
        .from("jobs")
        .update({ provider_visited: true })
        .eq("id", jobId);

      if (updateError) {
        throw new Error(`Failed to update job: ${updateError.message}`);
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          message: "First visit marked complete (no payment authorization existed)",
          payment_action: "none"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    logStep("PaymentIntent retrieved", { id: paymentIntent.id, status: paymentIntent.status });

    let paymentAction = "";
    let paymentResult;

    if (action === "capture") {
      if (paymentIntent.status === "requires_capture") {
        paymentResult = await stripe.paymentIntents.capture(paymentIntentId);
        paymentAction = "captured";
      } else if (paymentIntent.status === "succeeded") {
        paymentAction = "already_captured";
      } else {
        throw new Error(`Cannot capture PaymentIntent with status: ${paymentIntent.status}`);
      }
    } else if (action === "release") {
      if (["requires_capture", "requires_payment_method", "requires_confirmation"].includes(paymentIntent.status)) {
        paymentResult = await stripe.paymentIntents.cancel(paymentIntentId);
        paymentAction = "released";
      } else if (paymentIntent.status === "canceled") {
        paymentAction = "already_released";
      } else {
        throw new Error(`Cannot release PaymentIntent with status: ${paymentIntent.status}`);
      }
    }

    const updateData: Record<string, unknown> = { provider_visited: true };
    if (paymentAction === "captured" || paymentAction === "already_captured") {
      updateData.visit_fee_paid = true;
    }

    const { error: jobUpdateError } = await supabaseClient
      .from("jobs")
      .update(updateData)
      .eq("id", jobId);

    if (jobUpdateError) {
      throw new Error(`Failed to update job: ${jobUpdateError.message}`);
    }

    logStep("Job updated successfully", updateData);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `First visit completed. Payment ${paymentAction}.`,
        payment_action: paymentAction,
        payment_intent_id: paymentIntentId,
        payment_intent_status: paymentResult?.status || paymentIntent.status
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
