import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const visitPaymentRequestSchema = z.object({
  job_id: z.string().uuid("ID de trabajo inválido")
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get and validate request body
    const requestBody = await req.json();
    
    let validatedData;
    try {
      validatedData = visitPaymentRequestSchema.parse(requestBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", error.errors);
        return new Response(
          JSON.stringify({ 
            error: "Datos inválidos",
            details: error.errors.map(e => e.message).join(", ")
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }
      throw error;
    }

    const { job_id } = validatedData;

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No autorizado");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("No autorizado");
    }

    console.log("🔵 [VISIT-PAYMENT] Starting payment for job:", job_id, "user:", user.email);

    // First, get the client_id from the clients table
    const { data: clientData, error: clientError } = await supabaseClient
      .from("clients")
      .select("id")
      .eq("email", user.email)
      .single();

    if (clientError || !clientData) {
      console.error("❌ [VISIT-PAYMENT] Error fetching client:", {
        email: user.email,
        error: clientError?.message,
        code: clientError?.code
      });
      throw new Error("Cliente no encontrado");
    }

    console.log("✅ [VISIT-PAYMENT] Client found:", clientData.id);

    // Fetch job details using the correct client_id
    const { data: job, error: jobError } = await supabaseClient
      .from("jobs")
      .select("*")
      .eq("id", job_id)
      .eq("client_id", clientData.id)
      .single();

    if (jobError || !job) {
      console.error("❌ [VISIT-PAYMENT] Error fetching job:", {
        job_id,
        client_id: clientData.id,
        error: jobError?.message,
        code: jobError?.code
      });
      throw new Error("Solicitud no encontrada");
    }

    console.log("✅ [VISIT-PAYMENT] Job found:", {
      job_id: job.id,
      status: job.status,
      visit_fee_paid: job.visit_fee_paid,
      payment_status: job.payment_status
    });

    // Check if already paid
    if (job.visit_fee_paid) {
      console.log("⚠️ [VISIT-PAYMENT] Job already paid");
      throw new Error("La visita ya ha sido pagada");
    }

    // Initialize Stripe with TEST key for sandbox mode
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY_test") || "", {
      apiVersion: "2025-08-27.basil",
    });
    
    console.log("🧪 [VISIT-PAYMENT] Using Stripe TEST mode (sandbox)");

    // Check if user has existing Stripe customer
    let customerId;
    if (user.email) {
      const customers = await stripe.customers.list({ 
        email: user.email, 
        limit: 1 
      });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }

    // Create checkout session for visit fee (250 MXN) with manual capture for escrow
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: "Visita técnica Chamby",
              description: "Un experto acudirá a tu domicilio para diagnosticar el problema y ofrecer una cotización precisa. Este pago será reembolsable si el servicio se completa satisfactoriamente.",
            },
            unit_amount: 25000, // 250 MXN in cents
          },
          quantity: 1,
        }
      ],
      mode: "payment",
      payment_intent_data: {
        capture_method: 'manual', // Authorize but don't capture - escrow mode
        metadata: {
          job_id,
          client_id: clientData.id,
          type: "visit_fee",
        },
      },
      success_url: `${req.headers.get("origin")}/esperando-proveedor?job_id=${job_id}`,
      cancel_url: `${req.headers.get("origin")}/book-job`,
      metadata: {
        job_id,
        client_id: clientData.id,
        type: "visit_fee",
      },
    });

    console.log("✅ [VISIT-PAYMENT] Stripe session created:", {
      sessionId: session.id,
      jobId: job_id,
      amount: 25000,
      client: customerId || user.email
    });

    return new Response(
      JSON.stringify({ 
        url: session.url,
        sessionId: session.id
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ [VISIT-PAYMENT] Error:", {
      message: error.message,
      stack: error.stack
    });
    return new Response(
      JSON.stringify({ 
        error: error.message || "No se pudo procesar el pago. Por favor intenta nuevamente."
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
