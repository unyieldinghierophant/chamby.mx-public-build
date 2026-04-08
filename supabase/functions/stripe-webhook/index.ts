import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }
    const isTestMode = stripeKey.startsWith('sk_test_');
    logStep(isTestMode ? "🟢 Using Stripe TEST mode" : "🔴 Using Stripe LIVE mode");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    if (webhookSecret && signature) {
      try {
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
        logStep("Webhook signature verified");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        logStep("Webhook signature verification failed", { error: message });
        return new Response(JSON.stringify({ error: `Webhook Error: ${message}` }), {
          status: 400,
        });
      }
    } else {
      // Parse event without verification (not recommended for production)
      event = JSON.parse(body);
      logStep("⚠️ Webhook processed without signature verification");
    }

    logStep("Event received", { type: event.type, id: event.id });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    switch (event.type) {
      // ── Provider onboarding status ──────────────────────────
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        logStep("Account updated", {
          accountId: account.id,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted,
        });

        const chargesEnabled = account.charges_enabled ?? false;
        const payoutsEnabled = account.payouts_enabled ?? false;
        const detailsSubmitted = account.details_submitted ?? false;

        const requirements = account.requirements ?? {};
        const currentlyDue = requirements.currently_due ?? [];
        const eventuallyDue = requirements.eventually_due ?? [];
        const disabledReason = requirements.disabled_reason ?? null;

        let onboardingStatus = "onboarding";
        if (payoutsEnabled && chargesEnabled) {
          onboardingStatus = "enabled";
        }

        // Fetch previous DB state to detect transitions
        const { data: prevProvider } = await supabaseClient
          .from("providers")
          .select("stripe_payouts_enabled, user_id")
          .eq("stripe_account_id", account.id)
          .maybeSingle();

        const wasPreviouslyDisabled = prevProvider && !prevProvider.stripe_payouts_enabled;

        const updatePayload = {
          stripe_onboarding_status: onboardingStatus,
          stripe_charges_enabled: chargesEnabled,
          stripe_payouts_enabled: payoutsEnabled,
          stripe_details_submitted: detailsSubmitted,
          stripe_requirements_currently_due: currentlyDue,
          stripe_requirements_eventually_due: eventuallyDue,
          stripe_disabled_reason: disabledReason,
        };

        const { error: providerUpdateErr } = await supabaseClient
          .from("providers")
          .update(updatePayload)
          .eq("stripe_account_id", account.id);

        if (providerUpdateErr) {
          logStep("Failed to update provider onboarding status", { error: providerUpdateErr.message });
        } else {
          logStep("Provider onboarding status updated", {
            accountId: account.id,
            status: onboardingStatus,
            currentlyDue,
          });

          // ── Edge transition: payouts became enabled ──
          if (wasPreviouslyDisabled && payoutsEnabled && prevProvider) {
            logStep("Payout transition: disabled → enabled", { providerId: prevProvider.user_id });

            // Find pending payouts for this provider
            const { data: pendingPayouts } = await supabaseClient
              .from("payouts")
              .select("id")
              .eq("provider_id", prevProvider.user_id)
              .eq("status", "awaiting_provider_onboarding");

            const pendingCount = pendingPayouts?.length ?? 0;

            // Notify provider
            await supabaseClient.from("notifications").insert({
              user_id: prevProvider.user_id,
              type: "payout_enabled",
              title: "¡Ya puedes recibir pagos!",
              message: pendingCount > 0
                ? `Listo. Tu verificación fue aprobada. Tienes ${pendingCount} pago(s) pendiente(s) por liberar.`
                : "Tu verificación de Stripe fue completada. Ya puedes recibir pagos.",
              link: "/provider-portal/account",
              data: { pending_payouts: pendingCount },
            });

            // Notify admins
            if (pendingCount > 0) {
              const { data: admins } = await supabaseClient
                .from("user_roles")
                .select("user_id")
                .eq("role", "admin");

              if (admins && admins.length > 0) {
                const adminNotifs = admins.map((a: { user_id: string }) => ({
                  user_id: a.user_id,
                  type: "admin_provider_payout_enabled",
                  title: "Proveedor habilitado para pagos",
                  message: `Proveedor habilitado. ${pendingCount} payout(s) listos para liberar.`,
                  link: "/admin/payouts",
                  data: { provider_id: prevProvider.user_id, pending_payouts: pendingCount },
                }));
                await supabaseClient.from("notifications").insert(adminNotifs);
              }
            }

            logStep("Payout-enabled notifications sent", { providerId: prevProvider.user_id, pendingCount });
          }
        }
        break;
      }

      // ── Checkout completed (visit fee) ──────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout session completed", { sessionId: session.id });

        const metadata = session.metadata || {};
        
        if (metadata.type === "visit_fee" && metadata.jobId) {
          const jobId = metadata.jobId;

          // Idempotency guard: only process if job is still 'draft' or 'pending'
          const { data: currentJob, error: jobLookupError } = await supabaseClient
            .from("jobs")
            .select("status")
            .eq("id", jobId)
            .single();

          if (jobLookupError || !currentJob) {
            // Job not found or DB error — throw so Stripe retries this webhook
            throw new Error(`Job lookup failed for id ${jobId}: ${jobLookupError?.message ?? "not found"}`);
          }

          if (currentJob.status !== "draft" && currentJob.status !== "pending") {
            logStep("Skipping visit_fee processing — job already processed", { jobId, currentStatus: currentJob.status });
          } else {
            // Update job status — enters 'searching' state with 4-hour assignment window
            const assignmentDeadline = new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString();
            // Extract payment intent ID — handle both string ID and expanded object
            const paymentIntentId = typeof session.payment_intent === "string"
              ? session.payment_intent
              : (session.payment_intent as any)?.id ?? null;

            const { error: updateError } = await supabaseClient
              .from("jobs")
              .update({
                stripe_visit_payment_intent_id: paymentIntentId,
                status: "searching",
                visit_fee_paid: true,
                assignment_deadline: assignmentDeadline,
              })
              .eq("id", jobId);

            if (updateError) {
              // Throw so Stripe retries — do NOT return 200 on DB failure
              throw new Error(`Failed to update job ${jobId}: ${updateError.message}`);
            }
            logStep("Job updated - visit fee paid, status → searching", { jobId });

            // Record in payments ledger — $406 MXN ($350 + IVA 16%)
            // SYNC WITH src/utils/pricingConfig.ts PRICING.VISIT_FEE
            await supabaseClient
              .from("payments")
              .insert({
                job_id: jobId,
                provider_id: null,
                stripe_payment_intent_id: paymentIntentId,
                stripe_checkout_session_id: session.id,
                amount: 406,
                currency: "mxn",
                type: "visit_fee",
                status: "authorized",  // hold — not yet captured
                metadata: metadata,
                base_amount_cents: 35000,
                vat_amount_cents: 5600,
                total_amount_cents: 40600,
                pricing_version: "visit_v5_406_hold",
              });

            // Create notification for client
            if (metadata.userId) {
              await supabaseClient
                .from("notifications")
                .insert({
                  user_id: metadata.userId,
                  type: "payment_confirmed",
                  title: "Pago confirmado",
                  message: "Tu diagnóstico a domicilio ha sido procesado. Estamos buscando proveedores.",
                  link: `/active-jobs?job_id=${jobId}`,
                  data: { jobId, type: "visit_fee" },
                });
            }
          }
        }

        // ── Invoice payment via checkout ──────────────────────────
        if (metadata.type === "invoice_payment" && metadata.invoiceId) {
          const invoiceId = metadata.invoiceId;

          // Mark invoice as paid
          const { error: invError } = await supabaseClient
            .from("invoices")
            .update({
              status: "paid",
              stripe_payment_intent_id: session.payment_intent as string,
              updated_at: new Date().toISOString(),
            })
            .eq("id", invoiceId);

          if (invError) {
            logStep("Failed to update invoice to paid", { error: invError.message });
          } else {
            logStep("Invoice marked as paid via checkout", { invoiceId });
          }

          // Update payments ledger
          await supabaseClient
            .from("payments")
            .update({ status: "succeeded" })
            .eq("stripe_checkout_session_id", session.id);

          // Transition job to in_progress (idempotent — only if quote_accepted)
          if (metadata.jobId) {
            const { data: currentJob } = await supabaseClient
              .from("jobs")
              .select("status")
              .eq("id", metadata.jobId)
              .single();

            if (currentJob?.status === "quote_accepted") {
              const { error: jobUpdateErr } = await supabaseClient
                .from("jobs")
                .update({
                  status: "in_progress",
                  updated_at: new Date().toISOString(),
                })
                .eq("id", metadata.jobId);

              if (jobUpdateErr) {
                logStep("Failed to transition job to in_progress", { error: jobUpdateErr.message });
              } else {
                logStep("Job transitioned to in_progress", { jobId: metadata.jobId });
              }
            } else {
              logStep("Skipping job transition — not in quote_accepted", {
                jobId: metadata.jobId,
                currentStatus: currentJob?.status,
              });
            }
          }

          // Notify provider
          if (metadata.providerId) {
            await supabaseClient
              .from("notifications")
              .insert({
                user_id: metadata.providerId,
                type: "payment_received",
                title: "El cliente pagó — comienza el trabajo",
                message: "El cliente pagó. Ya puedes comenzar el trabajo.",
                link: `/provider-portal/jobs`,
                data: { invoiceId, jobId: metadata.jobId },
              });
          }

          // Notify client
          if (metadata.userId) {
            await supabaseClient
              .from("notifications")
              .insert({
                user_id: metadata.userId,
                type: "payment_confirmed",
                title: "Pago procesado",
                message: "Tu pago fue procesado. El proveedor comenzará pronto.",
                link: `/active-jobs`,
                data: { invoiceId, type: "invoice_payment" },
              });
          }
        }
        break;
      }

      // ── Payment intent succeeded (invoice payments) ─────────
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logStep("Payment intent succeeded", { paymentIntentId: paymentIntent.id });

        const metadata = paymentIntent.metadata || {};

        // Update payments ledger
        await supabaseClient
          .from("payments")
          .update({ status: "succeeded" })
          .eq("stripe_payment_intent_id", paymentIntent.id);

        if (metadata.type === "invoice_payment" && metadata.invoiceId) {
          const invoiceId = metadata.invoiceId;

          // Update invoice as paid
          const { error: updateError } = await supabaseClient
            .from("invoices")
            .update({ status: "paid" })
            .eq("id", invoiceId);

          if (updateError) {
            logStep("Failed to update invoice", { error: updateError.message });
          } else {
            logStep("Invoice marked as paid", { invoiceId });
          }

          // Do NOT auto-complete job here — completion handshake handles this
          // Job stays in current status until provider marks done + client confirms

          // Create notification for provider (skip if checkout.session.completed already sent one)
          if (metadata.providerId) {
            const { data: existingProvNotif } = await supabaseClient
              .from("notifications")
              .select("id")
              .eq("user_id", metadata.providerId)
              .eq("type", "payment_received")
              .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
              .limit(1);

            if (!existingProvNotif || existingProvNotif.length === 0) {
              await supabaseClient
                .from("notifications")
                .insert({
                  user_id: metadata.providerId,
                  type: "payment_received",
                  title: "Pago recibido",
                  message: "El cliente ha pagado tu factura",
                  link: `/provider-portal/invoices`,
                  data: { invoiceId, jobId: metadata.jobId },
                });
            } else {
              logStep("Skipped duplicate provider notification", { invoiceId });
            }
          }

          // Create notification for client (skip if checkout.session.completed already sent one)
          if (metadata.userId) {
            const { data: existingClientNotif } = await supabaseClient
              .from("notifications")
              .select("id")
              .eq("user_id", metadata.userId)
              .eq("type", "payment_confirmed")
              .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
              .limit(1);

            if (!existingClientNotif || existingClientNotif.length === 0) {
              await supabaseClient
                .from("notifications")
                .insert({
                  user_id: metadata.userId,
                  type: "payment_confirmed",
                  title: "Pago confirmado",
                  message: "Tu pago ha sido procesado exitosamente",
                  link: `/invoices/${invoiceId}`,
                  data: { invoiceId, type: "invoice_payment" },
                });
            } else {
              logStep("Skipped duplicate client notification", { invoiceId });
            }
          }
        }
        break;
      }

      // ── Payment intent failed ───────────────────────────────
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logStep("Payment intent failed", { paymentIntentId: paymentIntent.id });

        const metadata = paymentIntent.metadata || {};

        // Update payments ledger
        await supabaseClient
          .from("payments")
          .update({ status: "failed" })
          .eq("stripe_payment_intent_id", paymentIntent.id);

        if (metadata.type === "invoice_payment" && metadata.invoiceId) {
          await supabaseClient
            .from("invoices")
            .update({ status: "failed" })
            .eq("id", metadata.invoiceId);
          logStep("Invoice marked as failed", { invoiceId: metadata.invoiceId });
        }
        break;
      }

      // ── Transfer created (payout to provider) ───────────────
      case "transfer.created": {
        const transfer = event.data.object as Stripe.Transfer;
        logStep("Transfer created", { transferId: transfer.id, amount: transfer.amount });

        const transferMeta = transfer.metadata || {};
        if (transferMeta.payout_id) {
          await supabaseClient
            .from("payouts")
            .update({
              stripe_transfer_id: transfer.id,
              status: "paid",
              paid_at: new Date().toISOString(),
            })
            .eq("id", transferMeta.payout_id);
          logStep("Payout updated from transfer webhook", { payoutId: transferMeta.payout_id });
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
