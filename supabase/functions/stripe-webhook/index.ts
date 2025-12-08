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
    logStep("🔴 Using Stripe LIVE mode");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
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
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout session completed", { sessionId: session.id });

        const metadata = session.metadata || {};
        
        if (metadata.type === "visit_fee" && metadata.jobId) {
          const jobId = metadata.jobId;
          
          // Update job as paid
          const { error: updateError } = await supabaseClient
            .from("jobs")
            .update({
              visit_fee_paid: true,
              stripe_visit_payment_intent_id: session.payment_intent as string,
              status: "active",
            })
            .eq("id", jobId);

          if (updateError) {
            logStep("Failed to update job", { error: updateError.message });
          } else {
            logStep("Job updated - visit fee paid", { jobId });
          }

          // Create notification for client
          if (metadata.userId) {
            await supabaseClient
              .from("notifications")
              .insert({
                user_id: metadata.userId,
                type: "payment_confirmed",
                title: "Pago confirmado",
                message: "Tu tarifa de visita ha sido procesada. Estamos buscando proveedores.",
                link: `/esperando-proveedor?job_id=${jobId}`,
                data: { jobId, type: "visit_fee" },
              });
          }
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logStep("Payment intent succeeded", { paymentIntentId: paymentIntent.id });

        const metadata = paymentIntent.metadata || {};

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

          // Update job if exists
          if (metadata.jobId) {
            await supabaseClient
              .from("jobs")
              .update({ status: "completed" })
              .eq("id", metadata.jobId);
            logStep("Job marked as completed", { jobId: metadata.jobId });
          }

          // Create notification for provider
          if (metadata.providerId) {
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
          }

          // Create notification for client
          if (metadata.userId) {
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
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logStep("Payment intent failed", { paymentIntentId: paymentIntent.id });

        const metadata = paymentIntent.metadata || {};

        if (metadata.type === "invoice_payment" && metadata.invoiceId) {
          await supabaseClient
            .from("invoices")
            .update({ status: "failed" })
            .eq("id", metadata.invoiceId);
          logStep("Invoice marked as failed", { invoiceId: metadata.invoiceId });
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
