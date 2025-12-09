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

    // Parse request body
    const { payoutId } = await req.json()
    if (!payoutId) {
      console.error('No payoutId provided')
      return new Response(
        JSON.stringify({ error: 'payoutId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Fetching payout detail for:', payoutId)

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

    // Check if user is admin
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    const isAdmin = !!adminRole

    // Fetch the payout
    const { data: payout, error: payoutError } = await supabase
      .from('payouts')
      .select('*')
      .eq('id', payoutId)
      .single()

    if (payoutError || !payout) {
      console.error('Payout not found:', payoutError)
      return new Response(
        JSON.stringify({ error: 'Payout not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check authorization: must be admin or the provider who owns this payout
    if (!isAdmin && payout.provider_id !== user.id) {
      console.error('User not authorized to view this payout')
      return new Response(
        JSON.stringify({ error: 'Not authorized to view this payout' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch related invoice
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', payout.invoice_id)
      .single()

    // Fetch invoice items
    let invoiceItems: any[] = []
    if (invoice) {
      const { data: items } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoice.id)
        .order('created_at', { ascending: true })
      invoiceItems = items || []
    }

    // Fetch related job
    let job: any = null
    if (invoice?.job_id) {
      const { data: jobData } = await supabase
        .from('jobs')
        .select('id, title, category, description, location, status, client_id')
        .eq('id', invoice.job_id)
        .single()
      job = jobData
    }

    // Fetch client info if admin and job exists
    let client: any = null
    if (isAdmin && job?.client_id) {
      const { data: clientData } = await supabase
        .from('users')
        .select('id, full_name, email, phone')
        .eq('id', job.client_id)
        .single()
      client = clientData
    }

    // Fetch provider info
    let provider: any = null
    const { data: providerData } = await supabase
      .from('providers')
      .select('user_id, display_name, business_email, business_phone')
      .eq('user_id', payout.provider_id)
      .single()
    
    if (providerData) {
      // Also get user info for provider
      const { data: providerUserData } = await supabase
        .from('users')
        .select('full_name, email, phone')
        .eq('id', payout.provider_id)
        .single()
      
      provider = {
        ...providerData,
        full_name: providerData.display_name || providerUserData?.full_name || 'Sin nombre',
        email: providerData.business_email || providerUserData?.email,
        phone: providerData.business_phone || providerUserData?.phone
      }
    }

    console.log(`Successfully fetched payout ${payoutId} for ${isAdmin ? 'admin' : 'provider'}`)

    return new Response(
      JSON.stringify({
        payout: {
          id: payout.id,
          invoice_id: payout.invoice_id,
          provider_id: payout.provider_id,
          amount: payout.amount,
          status: payout.status,
          notes: payout.notes,
          paid_at: payout.paid_at,
          created_at: payout.created_at,
          updated_at: payout.updated_at
        },
        invoice: invoice ? {
          id: invoice.id,
          job_id: invoice.job_id,
          status: invoice.status,
          subtotal_provider: invoice.subtotal_provider,
          chamby_commission_amount: invoice.chamby_commission_amount,
          total_customer_amount: invoice.total_customer_amount,
          provider_notes: invoice.provider_notes,
          created_at: invoice.created_at,
          items: invoiceItems
        } : null,
        job: job,
        provider: provider,
        client: isAdmin ? client : null,
        isAdmin
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