import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const invoiceRequestSchema = z.object({
  job_request_id: z.string().uuid("ID de solicitud inválido")
});

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-VISIT-INVOICE] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get and validate request body
    const requestBody = await req.json();
    
    let validatedData;
    try {
      validatedData = invoiceRequestSchema.parse(requestBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        logStep("Validation error", error.errors);
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

    const { job_request_id } = validatedData;
    logStep("Request validated", { job_request_id });

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

    logStep("User authenticated", { userId: user.id, email: user.email });

    // Fetch client profile
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("full_name, phone")
      .eq("user_id", user.id)
      .single();

    if (profileError) {
      logStep("Profile fetch error", profileError);
    }

    const clientName = profile?.full_name || user.email || "Cliente";
    const clientPhone = profile?.phone || null;
    logStep("Client profile fetched", { clientName, hasPhone: !!clientPhone });

    // Fetch job request details
    const { data: jobRequest, error: jobError } = await supabaseClient
      .from("job_requests")
      .select("*")
      .eq("id", job_request_id)
      .eq("user_id", user.id)
      .single();

    if (jobError || !jobRequest) {
      logStep("Job request fetch error", jobError);
      throw new Error("Solicitud no encontrada");
    }

    logStep("Job request fetched", { 
      service: jobRequest.service, 
      location: jobRequest.location 
    });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });
    logStep("Stripe initialized");

    // Create or get Stripe Customer
    let customer;
    const customers = await stripe.customers.list({ 
      email: user.email, 
      limit: 1 
    });

    if (customers.data.length > 0) {
      customer = customers.data[0];
      logStep("Existing customer found", { customerId: customer.id });
      
      // Update customer with latest info
      await stripe.customers.update(customer.id, {
        name: clientName,
        phone: clientPhone || undefined,
        metadata: {
          user_id: user.id,
          supabase_user: user.email || "",
          updated_at: new Date().toISOString()
        }
      });
      logStep("Customer updated");
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        name: clientName,
        phone: clientPhone || undefined,
        metadata: {
          user_id: user.id,
          supabase_user: user.email || "",
          created_at: new Date().toISOString()
        }
      });
      logStep("New customer created", { customerId: customer.id });
    }

    // Build detailed description for invoice
    const descriptionParts = [
      `📋 Servicio: ${jobRequest.service}`,
      jobRequest.details ? `❓ Problema: ${jobRequest.details}` : '',
      `📍 Ubicación: ${jobRequest.location || 'Por definir'}`,
      jobRequest.date ? `📅 Fecha programada: ${jobRequest.date}` : '',
      jobRequest.time_preference ? `⏰ Horario: ${jobRequest.time_preference}` : '',
      jobRequest.photo_count && jobRequest.photo_count > 0 ? `📸 Fotos adjuntas: ${jobRequest.photo_count}` : ''
    ].filter(Boolean).join('\n');

    logStep("Invoice description built", { 
      descriptionLength: descriptionParts.length 
    });

    // Create Invoice Item
    const invoiceItem = await stripe.invoiceItems.create({
      customer: customer.id,
      amount: 25000, // 250 MXN in centavos
      currency: 'mxn',
      description: `Visita técnica - ${jobRequest.service}`,
    });
    logStep("Invoice item created", { invoiceItemId: invoiceItem.id });

    // Create Invoice
    const invoice = await stripe.invoices.create({
      customer: customer.id,
      collection_method: 'send_invoice',
      days_until_due: 0, // Due immediately
      auto_advance: false, // Don't auto-finalize (we do it manually)
      description: 'Visita técnica Chamby',
      footer: '✅ Gracias por confiar en Chamby. Este pago es reembolsable si el servicio se completa satisfactoriamente.\n\n🏠 Chamby.mx - Servicios técnicos a domicilio',
      metadata: {
        job_request_id: job_request_id,
        user_id: user.id,
        service_type: jobRequest.service || 'general',
        type: 'visit_fee',
        client_name: clientName
      },
      custom_fields: [
        {
          name: 'Detalles del servicio',
          value: descriptionParts.length > 1000 
            ? descriptionParts.substring(0, 997) + '...' 
            : descriptionParts
        }
      ]
    });
    logStep("Invoice created", { invoiceId: invoice.id });

    // Finalize invoice (makes it viewable but doesn't send)
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
    logStep("Invoice finalized", { 
      invoiceId: finalizedInvoice.id,
      status: finalizedInvoice.status,
      hostedUrl: finalizedInvoice.hosted_invoice_url
    });

    // Update job_requests table with invoice data
    const { error: updateError } = await supabaseClient
      .from("job_requests")
      .update({
        stripe_invoice_id: finalizedInvoice.id,
        stripe_invoice_url: finalizedInvoice.hosted_invoice_url,
        stripe_invoice_pdf: finalizedInvoice.invoice_pdf,
        invoice_due_date: finalizedInvoice.due_date 
          ? new Date(finalizedInvoice.due_date * 1000).toISOString()
          : new Date().toISOString()
      })
      .eq("id", job_request_id);

    if (updateError) {
      logStep("Warning: Failed to update job_requests table", updateError);
      // Don't throw - invoice is created successfully
    } else {
      logStep("Job request updated with invoice data");
    }

    // Return invoice URLs
    const response = {
      success: true,
      invoice_id: finalizedInvoice.id,
      invoice_url: finalizedInvoice.hosted_invoice_url,
      invoice_pdf: finalizedInvoice.invoice_pdf,
      customer_id: customer.id,
      amount: 250,
      currency: 'MXN'
    };

    logStep("Invoice creation completed successfully", response);

    return new Response(
      JSON.stringify(response), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-visit-invoice", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: "No se pudo generar la factura. Por favor intenta nuevamente.",
        details: errorMessage
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
