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

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('Auth error:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Fetching payouts for provider:', user.id)

    // Fetch all payouts for this provider with invoice and job info
    const { data: payouts, error: payoutsError } = await supabase
      .from('payouts')
      .select(`
        id,
        invoice_id,
        provider_id,
        amount,
        status,
        notes,
        paid_at,
        created_at,
        updated_at
      `)
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false })

    if (payoutsError) {
      console.error('Error fetching payouts:', payoutsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch payouts' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Enrich with invoice and job data
    const enrichedPayouts = await Promise.all(
      (payouts || []).map(async (payout) => {
        // Get invoice info
        const { data: invoice } = await supabase
          .from('invoices')
          .select('id, job_id, status, subtotal_provider')
          .eq('id', payout.invoice_id)
          .single()

        let jobTitle = 'Sin título'
        if (invoice?.job_id) {
          const { data: job } = await supabase
            .from('jobs')
            .select('title')
            .eq('id', invoice.job_id)
            .single()
          if (job) jobTitle = job.title
        }

        return {
          ...payout,
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

    const paidPayouts = enrichedPayouts.filter(p => p.status === 'paid')
    const lastPaidAt = paidPayouts.length > 0 
      ? paidPayouts.sort((a, b) => new Date(b.paid_at!).getTime() - new Date(a.paid_at!).getTime())[0].paid_at
      : null

    console.log(`Found ${enrichedPayouts.length} payouts for provider ${user.id}`)

    return new Response(
      JSON.stringify({
        payouts: enrichedPayouts,
        summary: {
          totalPaid,
          pendingAmount,
          lastPaidAt,
          totalPayouts: enrichedPayouts.length,
          paidCount: paidPayouts.length,
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