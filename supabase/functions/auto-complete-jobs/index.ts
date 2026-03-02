import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const log = (step: string, details?: Record<string, unknown>) => {
  console.log(`[AUTO-COMPLETE-JOBS] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  try {
    log("Cron triggered");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find jobs where provider marked done > 24h ago and client hasn't confirmed
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("id, provider_id, client_id, completion_marked_at, has_open_dispute")
      .eq("completion_status", "provider_marked_done")
      .eq("has_open_dispute", false)
      .lt("completion_marked_at", cutoff);

    if (error) {
      log("Query error", { error: error.message });
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    if (!jobs || jobs.length === 0) {
      log("No jobs to auto-complete");
      return new Response(JSON.stringify({ processed: 0 }), { status: 200 });
    }

    log(`Found ${jobs.length} jobs to auto-complete`);

    let processed = 0;
    for (const job of jobs) {
      try {
        const now = new Date().toISOString();

        // Update job
        await supabase
          .from("jobs")
          .update({
            completion_status: "auto_completed",
            completion_confirmed_at: now,
            status: "completed",
            updated_at: now,
          })
          .eq("id", job.id);

        // System message
        if (job.provider_id) {
          await supabase.from("messages").insert({
            job_id: job.id,
            sender_id: job.provider_id,
            receiver_id: job.client_id,
            message_text: "⏰ El trabajo fue completado automáticamente tras 24 horas sin respuesta del cliente.",
            is_system_message: true,
            system_event_type: "auto_completed",
            read: false,
          });
        }

        // Trigger escrow release
        await triggerEscrowRelease(supabase, job.id, job.provider_id!);

        processed++;
        log(`Auto-completed job`, { jobId: job.id });
      } catch (jobErr) {
        log(`Failed to auto-complete job`, { jobId: job.id, error: String(jobErr) });
      }
    }

    log(`Done`, { processed, total: jobs.length });
    return new Response(JSON.stringify({ processed, total: jobs.length }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
});

async function triggerEscrowRelease(
  supabase: ReturnType<typeof createClient>,
  jobId: string,
  providerId: string
) {
  try {
    const { data: invoice } = await supabase
      .from("invoices")
      .select("id, subtotal_provider, status")
      .eq("job_id", jobId)
      .eq("status", "paid")
      .maybeSingle();

    if (!invoice) return;

    const { data: provider } = await supabase
      .from("providers")
      .select("stripe_account_id, stripe_onboarding_status, stripe_payouts_enabled, stripe_requirements_currently_due")
      .eq("user_id", providerId)
      .single();

    if (
      !provider?.stripe_account_id ||
      provider.stripe_onboarding_status !== "enabled" ||
      !provider.stripe_payouts_enabled
    ) {
      console.log(`[AUTO-COMPLETE] Provider not payout-enabled, marking as awaiting_provider_onboarding`, { providerId });

      // Create payout record in pending state
      await supabase.from("payouts").insert({
        invoice_id: invoice.id,
        provider_id: providerId,
        amount: invoice.subtotal_provider,
        status: "awaiting_provider_onboarding",
      });

      await supabase
        .from("invoices")
        .update({ status: "ready_to_release", updated_at: new Date().toISOString() })
        .eq("id", invoice.id);

      // Notify provider
      await supabase.from("notifications").insert({
        user_id: providerId,
        type: "payout_pending_onboarding",
        title: "Pago pendiente",
        message: "Tu pago está listo, pero Stripe requiere verificación para liberarlo. Completa tu verificación desde tu cuenta.",
        link: "/provider-portal/account",
        data: { job_id: jobId },
      });

      // Notify admins about blocked payout
      const currentlyDue = provider.stripe_requirements_currently_due ?? [];
      const dueItems = Array.isArray(currentlyDue) ? currentlyDue : [];
      const topItems = dueItems.slice(0, 3).join(", ") || "N/A";
      const summary = `${dueItems.length} requisito(s) pendiente(s): ${topItems}`;

      const { data: admins } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (admins && admins.length > 0) {
        const adminNotifications = admins.map((a: { user_id: string }) => ({
          user_id: a.user_id,
          type: "admin_payout_blocked",
          title: "Pago bloqueado por verificación",
          message: `Proveedor ${providerId} no puede recibir pagos. ${summary}`,
          link: "/admin/payouts",
          data: { job_id: jobId, provider_id: providerId, missing_count: dueItems.length, top_items: dueItems.slice(0, 5) },
        }));
        await supabase.from("notifications").insert(adminNotifications);
      }

      return;
    }

    // Create payout
    const { data: payout } = await supabase
      .from("payouts")
      .insert({
        invoice_id: invoice.id,
        provider_id: providerId,
        amount: invoice.subtotal_provider,
        status: "pending",
      })
      .select("id")
      .single();

    if (!payout) return;

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return;

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const amountCentavos = Math.round(invoice.subtotal_provider * 100);

    const transfer = await stripe.transfers.create({
      amount: amountCentavos,
      currency: "mxn",
      destination: provider.stripe_account_id,
      metadata: { payout_id: payout.id, job_id: jobId, provider_id: providerId },
    });

    await supabase
      .from("payouts")
      .update({ stripe_transfer_id: transfer.id, status: "paid", paid_at: new Date().toISOString() })
      .eq("id", payout.id);

    await supabase
      .from("invoices")
      .update({ status: "released", updated_at: new Date().toISOString() })
      .eq("id", invoice.id);

    // Notify provider
    await supabase.from("notifications").insert({
      user_id: providerId,
      type: "payout_released",
      title: "¡Pago liberado!",
      message: `Se depositaron $${invoice.subtotal_provider} MXN a tu cuenta (auto-completado).`,
      link: "/provider-portal/account",
      data: { job_id: jobId, payout_id: payout.id },
    });
  } catch (err) {
    console.log(`[AUTO-COMPLETE] Escrow release failed for job ${jobId}:`, err);
    await supabase
      .from("invoices")
      .update({ status: "ready_to_release", updated_at: new Date().toISOString() })
      .eq("job_id", jobId)
      .eq("status", "paid");
  }
}
