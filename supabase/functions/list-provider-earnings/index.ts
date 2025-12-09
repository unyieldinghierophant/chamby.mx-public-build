import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[LIST-PROVIDER-EARNINGS] ${step}${detailsStr}`);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("No authorization header");
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      logStep("Authentication failed", { error: authError?.message });
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("User authenticated", { userId: user.id });

    // Verify the user is a provider
    const { data: providerRole, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "provider")
      .single();

    if (roleError || !providerRole) {
      logStep("User is not a provider", { error: roleError?.message });
      return new Response(
        JSON.stringify({ error: "User is not a provider" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Provider role verified");

    // Fetch all paid invoices for total lifetime earnings
    const { data: paidInvoices, error: paidError } = await supabase
      .from("invoices")
      .select("id, subtotal_provider, created_at, job_id, status")
      .eq("provider_id", user.id)
      .eq("status", "paid");

    if (paidError) {
      logStep("Error fetching paid invoices", { error: paidError.message });
      throw paidError;
    }

    logStep("Paid invoices fetched", { count: paidInvoices?.length || 0 });

    // Calculate total lifetime earnings (subtotal_provider is what the provider receives)
    const totalLifetimeEarnings = paidInvoices?.reduce(
      (sum, inv) => sum + Number(inv.subtotal_provider || 0),
      0
    ) || 0;

    // Calculate YTD earnings
    const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString();
    const ytdEarnings = paidInvoices?.filter(
      (inv) => inv.created_at && inv.created_at >= startOfYear
    ).reduce((sum, inv) => sum + Number(inv.subtotal_provider || 0), 0) || 0;

    // Group by month for monthly earnings
    const monthlyMap: Record<string, number> = {};
    paidInvoices?.forEach((inv) => {
      if (inv.created_at) {
        const date = new Date(inv.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + Number(inv.subtotal_provider || 0);
      }
    });

    const monthlyEarnings = Object.entries(monthlyMap)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));

    logStep("Monthly earnings calculated", { months: monthlyEarnings.length });

    // Fetch recent paid invoices with job details (limit 10)
    const recentPaidInvoiceIds = paidInvoices
      ?.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 10)
      .map((inv) => inv.id) || [];

    const recentPaid: Array<{
      invoiceId: string;
      jobTitle: string;
      paidDate: string;
      amountReceived: number;
    }> = [];

    for (const invoiceId of recentPaidInvoiceIds) {
      const invoice = paidInvoices?.find((inv) => inv.id === invoiceId);
      if (!invoice) continue;

      // Get job title
      let jobTitle = "Trabajo";
      if (invoice.job_id) {
        const { data: job } = await supabase
          .from("jobs")
          .select("title")
          .eq("id", invoice.job_id)
          .single();
        if (job) jobTitle = job.title;
      }

      recentPaid.push({
        invoiceId: invoice.id,
        jobTitle,
        paidDate: invoice.created_at || "",
        amountReceived: Number(invoice.subtotal_provider || 0),
      });
    }

    logStep("Recent paid invoices processed", { count: recentPaid.length });

    // Fetch outstanding invoices (pending_payment)
    const { data: outstandingInvoices, error: outstandingError } = await supabase
      .from("invoices")
      .select("id, subtotal_provider, created_at, job_id, total_customer_amount")
      .eq("provider_id", user.id)
      .eq("status", "pending_payment");

    if (outstandingError) {
      logStep("Error fetching outstanding invoices", { error: outstandingError.message });
      throw outstandingError;
    }

    const outstanding: Array<{
      invoiceId: string;
      jobTitle: string;
      amountOwed: number;
      createdAt: string;
    }> = [];

    for (const invoice of outstandingInvoices || []) {
      let jobTitle = "Trabajo";
      if (invoice.job_id) {
        const { data: job } = await supabase
          .from("jobs")
          .select("title")
          .eq("id", invoice.job_id)
          .single();
        if (job) jobTitle = job.title;
      }

      outstanding.push({
        invoiceId: invoice.id,
        jobTitle,
        amountOwed: Number(invoice.subtotal_provider || 0),
        createdAt: invoice.created_at || "",
      });
    }

    const outstandingTotal = outstanding.reduce((sum, inv) => sum + inv.amountOwed, 0);

    logStep("Outstanding invoices processed", { count: outstanding.length, total: outstandingTotal });

    const response = {
      totals: {
        lifetimeEarnings: totalLifetimeEarnings,
        ytdEarnings,
        outstandingAmount: outstandingTotal,
        paidInvoicesCount: paidInvoices?.length || 0,
      },
      monthly: monthlyEarnings,
      recentPaid,
      outstanding,
    };

    logStep("Response prepared successfully");

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    logStep("Error in function", { error: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
