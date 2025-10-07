import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Get request body
    const { job_id } = await req.json();

    if (!job_id) {
      throw new Error("job_id es requerido");
    }

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

    console.log("Creating visit payment for job:", job_id, "user:", user.email);

    // Fetch job details
    const { data: job, error: jobError } = await supabaseClient
      .from("jobs")
      .select("*")
      .eq("id", job_id)
      .eq("client_id", user.id)
      .single();

    if (jobError || !job) {
      throw new Error("Solicitud no encontrada");
    }

    // Check if already paid
    if (job.visit_fee_paid) {
      throw new Error("La visita ya ha sido pagada");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

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

    // Create checkout session for visit fee (250 MXN)
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
      success_url: `${req.headers.get("origin")}/esperando-proveedor?job_id=${job_id}`,
      cancel_url: `${req.headers.get("origin")}/nueva-solicitud`,
      metadata: {
        job_id,
        client_id: user.id,
        type: "visit_fee",
      },
    });

    console.log("Visit payment session created:", session.id);

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
    console.error("Visit payment creation error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Error desconocido"
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
