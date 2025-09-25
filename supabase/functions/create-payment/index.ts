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
    const { serviceType, providerId, date, time, duration = 2 } = await req.json();

    // Authenticate user (optional for guest checkout)
    let user = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      user = data.user;
    }

    console.log("Creating payment for:", { serviceType, providerId, date, time, user: user?.email });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Service pricing mapping
    const servicePricing = {
      "limpieza-del-hogar": {
        priceId: "price_1SBNaLEZPwoUz41xOXGxByfK",
        name: "Limpieza del Hogar",
        baseRate: 300
      },
      "reparaciones": {
        priceId: "price_1SBNaoEZPwoUz41xjMz5dasa", 
        name: "Reparaciones",
        baseRate: 400
      },
      "jardineria": {
        priceId: "price_1SBNayEZPwoUz41xPkanWVHR",
        name: "Jardinería",
        baseRate: 350
      }
    };

    const serviceInfo = servicePricing[serviceType as keyof typeof servicePricing];
    if (!serviceInfo) {
      throw new Error("Tipo de servicio no válido");
    }

    // Calculate total amount (base rate * duration)
    const totalAmount = serviceInfo.baseRate * duration;

    // Check if user has existing Stripe customer
    let customerId;
    if (user?.email) {
      const customers = await stripe.customers.list({ 
        email: user.email, 
        limit: 1 
      });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user?.email,
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: `${serviceInfo.name} - ${duration} horas`,
              description: `Servicio programado para ${date} a las ${time}`,
              images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500'],
            },
            unit_amount: totalAmount * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/payment-canceled`,
      metadata: {
        serviceType,
        providerId: providerId || "unknown",
        date,
        time,
        duration: duration.toString(),
        userId: user?.id || "guest"
      },
    });

    console.log("Payment session created:", session.id);

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
    console.error("Payment creation error:", error);
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