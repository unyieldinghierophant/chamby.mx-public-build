import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[LIST-PROVIDER-INVOICES] ${step}${detailsStr}`);
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

    // Verify user is a provider
    const { data: providerRole } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "provider")
      .maybeSingle();

    if (!providerRole) {
      throw new Error("User is not a provider");
    }
    logStep("Provider role verified");

    // Fetch invoices for this provider
    const { data: invoices, error: invoicesError } = await supabaseClient
      .from("invoices")
      .select(`
        id,
        job_id,
        user_id,
        status,
        total_customer_amount,
        created_at
      `)
      .eq("provider_id", user.id)
      .order("created_at", { ascending: false });

    if (invoicesError) {
      throw new Error(`Error fetching invoices: ${invoicesError.message}`);
    }

    logStep("Invoices fetched", { count: invoices?.length || 0 });

    // Enrich with job and client data
    const enrichedInvoices = await Promise.all(
      (invoices || []).map(async (invoice) => {
        // Get job title
        const { data: job } = await supabaseClient
          .from("jobs")
          .select("title")
          .eq("id", invoice.job_id)
          .maybeSingle();

        // Get client name
        const { data: client } = await supabaseClient
          .from("users")
          .select("full_name")
          .eq("id", invoice.user_id)
          .maybeSingle();

        return {
          id: invoice.id,
          job_id: invoice.job_id,
          job_title: job?.title || "Trabajo sin título",
          client_name: client?.full_name || "Cliente",
          status: invoice.status,
          total_customer_amount: invoice.total_customer_amount,
          created_at: invoice.created_at,
        };
      })
    );

    logStep("Invoices enriched successfully", { count: enrichedInvoices.length });

    return new Response(
      JSON.stringify({
        success: true,
        invoices: enrichedInvoices,
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
