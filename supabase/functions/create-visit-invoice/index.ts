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
  job_id: z.string().uuid("ID de trabajo inválido"),
  amount: z.number().positive("El monto debe ser positivo"),
  description: z.string().optional(),
  line_items: z.array(z.object({
    description: z.string(),
    amount: z.number().positive(),
    quantity: z.number().int().positive().default(1)
  })).optional()
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

    // Create Supabase client with service role for provider verification
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
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

    const { job_id, amount, description, line_items } = validatedData;
    logStep("Request validated", { job_id, amount });

    // Authenticate provider
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No autorizado");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("No autorizado");
    }

    logStep("Provider authenticated", { userId: user.id, email: user.email });

    // Fetch job details and verify provider owns this job
    const { data: job, error: jobError } = await supabaseClient
      .from("jobs")
      .select("*, clients!inner(email, phone)")
      .eq("id", job_id)
      .single();

    if (jobError || !job) {
      logStep("Job fetch error", jobError);
      throw new Error("Trabajo no encontrado");
    }

    // Verify the authenticated user is the provider for this job
    const { data: providerClient, error: providerError } = await supabaseClient
      .from("clients")
      .select("id")
      .eq("email", user.email)
      .single();

    if (providerError || !providerClient || providerClient.id !== job.provider_id) {
      logStep("Authorization failed", { 
        providerClient: providerClient?.id, 
        jobProvider: job.provider_id 
      });
      throw new Error("No autorizado para crear factura para este trabajo");
    }

    // Check if visit fee was paid
    if (!job.visit_fee_paid || job.payment_status !== 'authorized') {
      logStep("Visit fee not paid", { 
        visit_fee_paid: job.visit_fee_paid, 
        payment_status: job.payment_status 
      });
      throw new Error("El cliente debe pagar la visita antes de generar la factura");
    }

    // Check if invoice already exists
    if (job.stripe_invoice_id) {
      logStep("Invoice already exists", { invoiceId: job.stripe_invoice_id });
      throw new Error("Ya existe una factura para este trabajo");
    }

    logStep("Job verified", { 
      title: job.title,
      clientEmail: job.clients.email
    });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });
    logStep("Stripe initialized");

    // Get or create Stripe Customer for the client
    let customer;
    const customers = await stripe.customers.list({ 
      email: job.clients.email, 
      limit: 1 
    });

    if (customers.data.length > 0) {
      customer = customers.data[0];
      logStep("Existing customer found", { customerId: customer.id });
    } else {
      customer = await stripe.customers.create({
        email: job.clients.email,
        phone: job.clients.phone || undefined,
        metadata: {
          client_id: job.client_id,
          created_at: new Date().toISOString()
        }
      });
      logStep("New customer created", { customerId: customer.id });
    }

    // Create invoice items
    if (line_items && line_items.length > 0) {
      // Create separate line items if provided
      for (const item of line_items) {
        await stripe.invoiceItems.create({
          customer: customer.id,
          amount: Math.round(item.amount * 100), // Convert to cents
          currency: 'mxn',
          description: item.description,
          quantity: item.quantity
        });
      }
      logStep("Invoice items created", { count: line_items.length });
    } else {
      // Create single invoice item with total amount
      await stripe.invoiceItems.create({
        customer: customer.id,
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'mxn',
        description: description || `Servicio completado - ${job.title}`,
        quantity: 1
      });
      logStep("Invoice item created");
    }

    // Create Invoice
    const invoice = await stripe.invoices.create({
      customer: customer.id,
      collection_method: 'send_invoice',
      days_until_due: 3, // 3 days to pay
      auto_advance: false, // Manual finalization
      description: `Factura de servicio - ${job.title}`,
      footer: '✅ Gracias por usar Chamby. Al pagar esta factura, se reembolsará automáticamente el costo de la visita técnica.\n\n🏠 Chamby.mx - Servicios técnicos a domicilio',
      metadata: {
        job_id: job_id,
        client_id: job.client_id,
        provider_id: job.provider_id,
        payment_intent_id: job.stripe_payment_intent_id || '',
        type: 'service_completion',
        service_type: job.category
      }
    });
    logStep("Invoice created", { invoiceId: invoice.id });

    // Finalize invoice
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
    logStep("Invoice finalized", { 
      invoiceId: finalizedInvoice.id,
      status: finalizedInvoice.status,
      hostedUrl: finalizedInvoice.hosted_invoice_url
    });

    // Send invoice to customer
    await stripe.invoices.sendInvoice(finalizedInvoice.id);
    logStep("Invoice sent to customer");

    // Update jobs table with invoice data
    const { error: updateError } = await supabaseClient
      .from("jobs")
      .update({
        stripe_invoice_id: finalizedInvoice.id,
        stripe_invoice_url: finalizedInvoice.hosted_invoice_url,
        stripe_invoice_pdf: finalizedInvoice.invoice_pdf,
        invoice_due_date: finalizedInvoice.due_date 
          ? new Date(finalizedInvoice.due_date * 1000).toISOString()
          : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        amount_service_total: amount,
        updated_at: new Date().toISOString()
      })
      .eq("id", job_id);

    if (updateError) {
      logStep("ERROR: Failed to update jobs table", updateError);
      throw new Error("No se pudo actualizar el trabajo con los datos de la factura");
    }
    
    logStep("Job updated with invoice data");

    // Return invoice details
    const response = {
      success: true,
      invoice_id: finalizedInvoice.id,
      invoice_url: finalizedInvoice.hosted_invoice_url,
      invoice_pdf: finalizedInvoice.invoice_pdf,
      customer_id: customer.id,
      amount: amount,
      currency: 'MXN',
      due_date: finalizedInvoice.due_date 
        ? new Date(finalizedInvoice.due_date * 1000).toISOString()
        : null
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
        error: errorMessage
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
