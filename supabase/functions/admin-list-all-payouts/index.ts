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

    console.log('Admin fetching all payouts:', user.id)

    // Use service role client for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch all payouts
    const { data: payouts, error: payoutsError } = await supabaseAdmin
      .from('payouts')
      .select('*')
      .order('created_at', { ascending: false })

    if (payoutsError) {
      console.error('Error fetching payouts:', payoutsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch payouts' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Enrich with provider, invoice, and job data
    const enrichedPayouts = await Promise.all(
      (payouts || []).map(async (payout) => {
        // Get provider info
        const { data: provider } = await supabaseAdmin
          .from('providers')
          .select('display_name, user_id')
          .eq('user_id', payout.provider_id)
          .single()

        // Get invoice info
        const { data: invoice } = await supabaseAdmin
          .from('invoices')
          .select('id, job_id, status, subtotal_provider')
          .eq('id', payout.invoice_id)
          .single()

        let jobTitle = 'Sin título'
        if (invoice?.job_id) {
          const { data: job } = await supabaseAdmin
            .from('jobs')
            .select('title')
            .eq('id', invoice.job_id)
            .single()
          if (job) jobTitle = job.title
        }

        return {
          ...payout,
          provider_name: provider?.display_name || 'Proveedor desconocido',
          invoice_status: invoice?.status || 'unknown',
          job_title: jobTitle
        }
      })
    )

    // Calculate summary stats
    const totalPaid = enrichedPayouts
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0)

    const pendingAmount = enrichedPayouts
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + Number(p.amount), 0)

    console.log(`Found ${enrichedPayouts.length} total payouts`)

    return new Response(
      JSON.stringify({
        payouts: enrichedPayouts,
        summary: {
          totalPaid,
          pendingAmount,
          totalPayouts: enrichedPayouts.length,
          paidCount: enrichedPayouts.filter(p => p.status === 'paid').length,
          pendingCount: enrichedPayouts.filter(p => p.status === 'pending').length
        }
      }),
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