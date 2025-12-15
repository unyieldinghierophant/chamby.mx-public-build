import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SEND-INVOICE-TO-CLIENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error(`Authentication error: ${userError?.message || "User not found"}`);
    }
    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    // Parse request body
    const { invoiceId } = await req.json();
    if (!invoiceId) {
      throw new Error("invoiceId is required");
    }
    logStep("Request parsed", { invoiceId });

    // Fetch invoice
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .maybeSingle();

    if (invoiceError) {
      throw new Error(`Error fetching invoice: ${invoiceError.message}`);
    }

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // Verify provider owns this invoice
    if (invoice.provider_id !== user.id) {
      throw new Error("You do not have permission to send this invoice");
    }
    logStep("Provider ownership verified");

    // Check if already sent or paid
    if (invoice.status === 'paid') {
      throw new Error("This invoice has already been paid");
    }

    if (invoice.status === 'pending_payment') {
      logStep("Invoice already sent, returning success");
      return new Response(
        JSON.stringify({
          success: true,
          message: "Invoice was already sent to client",
          invoice_id: invoiceId,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Update invoice status to pending_payment
    const { error: updateError } = await supabaseClient
      .from("invoices")
      .update({ 
        status: "pending_payment",
        updated_at: new Date().toISOString()
      })
      .eq("id", invoiceId);

    if (updateError) {
      throw new Error(`Error updating invoice status: ${updateError.message}`);
    }
    logStep("Invoice status updated to pending_payment");

    // Fetch job info for notification
    const { data: job } = await supabaseClient
      .from("jobs")
      .select("title")
      .eq("id", invoice.job_id)
      .maybeSingle();

    // Fetch provider info for notification
    const { data: providerInfo } = await supabaseClient
      .from("users")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    // Create notification for client
    const notificationResult = await supabaseClient
      .from("notifications")
      .insert({
        user_id: invoice.user_id,
        type: "invoice_received",
        title: "Nueva factura recibida",
        message: `${providerInfo?.full_name || 'Tu proveedor'} te ha enviado una factura por $${invoice.total_customer_amount.toFixed(2)} MXN${job ? ` para "${job.title}"` : ''}`,
        link: `/invoice/${invoiceId}`,
        data: {
          invoice_id: invoiceId,
          job_id: invoice.job_id,
          amount: invoice.total_customer_amount,
          provider_name: providerInfo?.full_name || null
        },
        read: false
      });

    if (notificationResult.error) {
      logStep("Warning: Failed to create notification", { error: notificationResult.error.message });
    } else {
      logStep("Notification created for client");
    }

    // Send email notification using Postmark
    const postmarkApiKey = Deno.env.get("POSTMARK_API_KEY");
    if (postmarkApiKey) {
      try {
        // Fetch client email
        const { data: clientData } = await supabaseClient
          .from("users")
          .select("email, full_name")
          .eq("id", invoice.user_id)
          .maybeSingle();

        if (clientData?.email) {
          const invoiceUrl = `https://chamby.mx/invoice/${invoiceId}`;
          
          const emailHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">Nueva factura recibida</h1>
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Hola ${clientData.full_name || 'Cliente'},
              </p>
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                ${providerInfo?.full_name || 'Tu proveedor'} te ha enviado una factura${job ? ` por el trabajo "${job.title}"` : ''}.
              </p>
              <div style="background: #f4f4f5; border-radius: 12px; padding: 24px; margin: 24px 0;">
                <p style="margin: 0; color: #666; font-size: 14px;">Monto a pagar:</p>
                <p style="margin: 8px 0 0; color: #1a1a1a; font-size: 32px; font-weight: bold;">$${invoice.total_customer_amount.toFixed(2)} MXN</p>
              </div>
              <a href="${invoiceUrl}" style="display: inline-block; background: #7c3aed; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Ver y pagar factura
              </a>
              <p style="color: #999; font-size: 14px; margin-top: 32px;">
                Si tienes preguntas sobre esta factura, contacta directamente a tu proveedor.
              </p>
            </div>
          `;

          const emailText = `Nueva factura recibida

Hola ${clientData.full_name || 'Cliente'},

${providerInfo?.full_name || 'Tu proveedor'} te ha enviado una factura${job ? ` por el trabajo "${job.title}"` : ''}.

Monto a pagar: $${invoice.total_customer_amount.toFixed(2)} MXN

Ver y pagar factura: ${invoiceUrl}

Si tienes preguntas sobre esta factura, contacta directamente a tu proveedor.

© 2025 Chamby - chamby.mx`;

          const emailResponse = await fetch("https://api.postmarkapp.com/email", {
            method: "POST",
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json",
              "X-Postmark-Server-Token": postmarkApiKey,
            },
            body: JSON.stringify({
              From: "Chamby <notificaciones@chamby.mx>",
              To: clientData.email,
              Subject: `Nueva factura de ${providerInfo?.full_name || 'tu proveedor'} - $${invoice.total_customer_amount.toFixed(2)} MXN`,
              HtmlBody: emailHtml,
              TextBody: emailText,
              MessageStream: "outbound",
              Tag: "invoice_notification",
            }),
          });

          const emailData = await emailResponse.json();

          if (emailResponse.ok) {
            logStep("Email notification sent to client via Postmark", { email: clientData.email, messageId: emailData.MessageID });
          } else {
            logStep("Warning: Postmark email send failed", { error: emailData.Message });
          }
        }
      } catch (emailError) {
        logStep("Warning: Email notification failed", { error: String(emailError) });
        // Don't throw - email is optional
      }
    } else {
      logStep("Postmark API key not configured, skipping email");
    }

    logStep("Invoice sent successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Invoice sent to client",
        invoice_id: invoiceId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
