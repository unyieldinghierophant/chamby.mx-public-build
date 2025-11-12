import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get the signature from headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No stripe-signature header");
    }

    // Get raw body
    const body = await req.text();
    
    // Verify webhook signature
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET not configured");
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Webhook verified", { type: event.type });
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err.message });
      return new Response(
        JSON.stringify({ error: "Webhook signature verification failed" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout session completed", { sessionId: session.id });

        if (session.metadata?.type === "visit_fee" && session.metadata?.job_id) {
          const jobId = session.metadata.job_id;
          const paymentIntentId = session.payment_intent as string;

          // Update job with payment intent and mark as authorized
          const { error: updateError } = await supabaseClient
            .from("jobs")
            .update({
              stripe_payment_intent_id: paymentIntentId,
              payment_status: "authorized",
              visit_fee_paid: true,
              updated_at: new Date().toISOString(),
            })
            .eq("id", jobId);

          if (updateError) {
            logStep("Error updating job", { error: updateError });
          } else {
            logStep("Job updated to authorized", { jobId });
          }
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logStep("Payment intent succeeded", { paymentIntentId: paymentIntent.id });

        // Find job by payment intent ID
        const { data: job, error: jobError } = await supabaseClient
          .from("jobs")
          .select("*")
          .eq("stripe_payment_intent_id", paymentIntent.id)
          .single();

        if (job && !jobError) {
          // Update payment status to authorized (escrow held)
          const { error: updateError } = await supabaseClient
            .from("jobs")
            .update({
              payment_status: "authorized",
              updated_at: new Date().toISOString(),
            })
            .eq("id", job.id);

          if (updateError) {
            logStep("Error updating job payment status", { error: updateError });
          } else {
            logStep("Job payment status updated to authorized", { jobId: job.id });
          }
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Invoice paid", { invoiceId: invoice.id });

        // Find job by invoice ID
        const { data: job, error: jobError } = await supabaseClient
          .from("jobs")
          .select("*")
          .eq("stripe_invoice_id", invoice.id)
          .single();

        if (job && !jobError && job.stripe_payment_intent_id) {
          logStep("Processing refund for job", { jobId: job.id });

          try {
            // Refund the booking fee since invoice was paid
            const refund = await stripe.refunds.create({
              payment_intent: job.stripe_payment_intent_id,
              reason: "requested_by_customer",
            });

            logStep("Refund created", { refundId: refund.id });

            // Update job status
            const { error: updateError } = await supabaseClient
              .from("jobs")
              .update({
                payment_status: "invoice_paid",
                escrow_refunded: true,
                amount_service_total: invoice.amount_paid / 100, // Convert from cents
                updated_at: new Date().toISOString(),
              })
              .eq("id", job.id);

            if (updateError) {
              logStep("Error updating job after refund", { error: updateError });
            } else {
              logStep("Job updated - refund completed", { jobId: job.id });
            }
          } catch (refundError) {
            logStep("Error processing refund", { error: refundError.message });
          }
        }
        break;
      }

      case "payment_intent.canceled": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logStep("Payment intent canceled", { paymentIntentId: paymentIntent.id });

        // Find and update job
        const { error: updateError } = await supabaseClient
          .from("jobs")
          .update({
            payment_status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_payment_intent_id", paymentIntent.id);

        if (updateError) {
          logStep("Error updating canceled payment", { error: updateError });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logStep("Payment intent failed", { paymentIntentId: paymentIntent.id });

        const { error: updateError } = await supabaseClient
          .from("jobs")
          .update({
            payment_status: "payment_failed",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_payment_intent_id", paymentIntent.id);

        if (updateError) {
          logStep("Error updating failed payment", { error: updateError });
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in webhook handler", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
