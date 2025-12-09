import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching invoices for client:', user.id);

    // Fetch invoices where user_id matches (client)
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('id, status, total_customer_amount, created_at, job_id, provider_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch invoices' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found invoices:', invoices?.length || 0);

    // Enrich invoices with job and provider data
    const enrichedInvoices = await Promise.all(
      (invoices || []).map(async (invoice) => {
        let jobTitle = 'Sin título';
        let providerName = 'Proveedor';

        // Get job info
        if (invoice.job_id) {
          const { data: job } = await supabase
            .from('jobs')
            .select('title')
            .eq('id', invoice.job_id)
            .single();
          
          if (job) {
            jobTitle = job.title;
          }
        }

        // Get provider info
        if (invoice.provider_id) {
          const { data: provider } = await supabase
            .from('providers')
            .select('display_name')
            .eq('user_id', invoice.provider_id)
            .single();
          
          if (provider) {
            providerName = provider.display_name || 'Proveedor';
          }
        }

        return {
          id: invoice.id,
          status: invoice.status,
          total_customer_amount: invoice.total_customer_amount,
          created_at: invoice.created_at,
          job_title: jobTitle,
          provider_name: providerName,
        };
      })
    );

    console.log('Returning enriched invoices:', enrichedInvoices.length);

    return new Response(
      JSON.stringify({ invoices: enrichedInvoices }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
