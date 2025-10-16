import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const paymentRequestSchema = z.object({
  serviceType: z.enum(['limpieza-del-hogar', 'reparaciones', 'jardineria'], {
    errorMap: () => ({ message: "Tipo de servicio no válido" })
  }),
  providerId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (HH:MM)"),
  duration: z.number().int().min(1).max(8).default(2)
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
      validatedData = paymentRequestSchema.parse(requestBody);
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

    const { serviceType, providerId, date, time, duration } = validatedData;

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

    // Visit fee pricing - fixed 300 pesos for initial visit
    const visitFee = 300;

    // Create line item for visit fee only
    const lineItem = {
      price_data: {
        currency: 'mxn',
        product_data: {
          name: `Cuota de Visita - ${serviceInfo.name}`,
          description: `Cuota de visita para servicio programado el ${date} a las ${time}. El costo final se calculará por horas trabajadas.`,
          images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500'],
        },
        unit_amount: visitFee * 100, // Convert to cents
      },
      quantity: 1,
    };

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

    // Create checkout session for visit fee only
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user?.email,
      line_items: [lineItem],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/payment-canceled`,
      metadata: {
        serviceType,
        providerId: providerId || "unknown",
        date,
        time,
        duration: duration.toString(),
        userId: user?.id || "guest",
        paymentType: "visit_fee",
        hourlyRate: serviceInfo.baseRate.toString(),
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
        error: "No se pudo procesar el pago. Por favor intenta nuevamente."
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});