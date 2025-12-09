import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header provided')
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    // First verify user with anon key
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser()
    if (userError || !user) {
      console.error('Auth error:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: roles } = await supabaseAuth
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')

    if (!roles || roles.length === 0) {
      console.error('User is not an admin:', user.id)
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Admin fetching paid invoices for payout creation:', user.id)

    // Use service role client for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch all paid invoices
    const { data: invoices, error: invoicesError } = await supabaseAdmin
      .from('invoices')
      .select('id, job_id, provider_id, subtotal_provider, status, created_at')
      .eq('status', 'paid')
      .order('created_at', { ascending: false })

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch invoices' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get existing payouts to check which invoices already have payouts
    const { data: existingPayouts } = await supabaseAdmin
      .from('payouts')
      .select('invoice_id')

    const invoiceIdsWithPayouts = new Set((existingPayouts || []).map(p => p.invoice_id))

    // Enrich invoices with provider and job data
    const enrichedInvoices = await Promise.all(
      (invoices || []).map(async (invoice) => {
        // Get provider info
        const { data: provider } = await supabaseAdmin
          .from('providers')
          .select('display_name')
          .eq('user_id', invoice.provider_id)
          .single()

        let jobTitle = 'Sin título'
        if (invoice.job_id) {
          const { data: job } = await supabaseAdmin
            .from('jobs')
            .select('title')
            .eq('id', invoice.job_id)
            .single()
          if (job) jobTitle = job.title
        }

        return {
          ...invoice,
          provider_name: provider?.display_name || 'Proveedor desconocido',
          job_title: jobTitle,
          has_payout: invoiceIdsWithPayouts.has(invoice.id)
        }
      })
    )

    console.log(`Found ${enrichedInvoices.length} paid invoices`)

    return new Response(
      JSON.stringify({ invoices: enrichedInvoices }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})