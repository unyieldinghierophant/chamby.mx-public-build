import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Verify caller identity
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify admin role using service role (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')

    if (!roles || roles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const { action, provider_user_id, admin_notes } = body

    if (!action || !provider_user_id) {
      return new Response(
        JSON.stringify({ error: 'action and provider_user_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'approve') {
      // Check provider exists
      const { data: provider } = await supabaseAdmin
        .from('providers')
        .select('id')
        .eq('user_id', provider_user_id)
        .maybeSingle()

      if (!provider) {
        return new Response(
          JSON.stringify({ error: 'El perfil del proveedor no existe.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check required documents
      const { data: details } = await supabaseAdmin
        .from('provider_details')
        .select('ine_front_url, ine_back_url, selfie_url, selfie_with_id_url')
        .eq('user_id', provider_user_id)
        .maybeSingle()

      const docLabels: Record<string, string> = {
        ine_front_url: 'INE frente',
        ine_back_url: 'INE reverso',
        selfie_url: 'Selfie',
        selfie_with_id_url: 'Selfie con INE',
      }
      const missingDocs: string[] = []
      for (const [field, label] of Object.entries(docLabels)) {
        const val = (details as any)?.[field]
        if (!val || (typeof val === 'string' && val.trim() === '')) {
          missingDocs.push(label)
        }
      }
      if (missingDocs.length > 0) {
        return new Response(
          JSON.stringify({ error: `No se puede aprobar. Faltan documentos: ${missingDocs.join(', ')}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update provider_details (upsert with service role – no RLS issues)
      const { error: detailsError } = await supabaseAdmin
        .from('provider_details')
        .upsert({
          user_id: provider_user_id,
          provider_id: provider.id,
          verification_status: 'verified',
          admin_notes: admin_notes || null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      if (detailsError) {
        console.error('Error updating provider_details:', detailsError)
        return new Response(
          JSON.stringify({ error: `No se pudo actualizar detalles: ${detailsError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update providers.verified
      const { error: providerError } = await supabaseAdmin
        .from('providers')
        .update({ verified: true, updated_at: new Date().toISOString() })
        .eq('user_id', provider_user_id)

      if (providerError) {
        console.error('Error updating providers:', providerError)
        return new Response(
          JSON.stringify({ error: `No se pudo actualizar proveedor: ${providerError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update legacy documents table
      await supabaseAdmin
        .from('documents')
        .update({ verification_status: 'verified' })
        .eq('provider_id', provider_user_id)

      console.log(`Admin ${user.id} approved provider ${provider_user_id}`)

      return new Response(
        JSON.stringify({ success: true, action: 'approved' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else if (action === 'reject') {
      if (!admin_notes || admin_notes.trim() === '') {
        return new Response(
          JSON.stringify({ error: 'Se requieren notas de administrador para rechazar.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error: detailsError } = await supabaseAdmin
        .from('provider_details')
        .update({
          verification_status: 'rejected',
          admin_notes: admin_notes,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', provider_user_id)

      if (detailsError) {
        console.error('Error rejecting provider_details:', detailsError)
        return new Response(
          JSON.stringify({ error: `No se pudo rechazar: ${detailsError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      await supabaseAdmin
        .from('providers')
        .update({ verified: false, updated_at: new Date().toISOString() })
        .eq('user_id', provider_user_id)

      await supabaseAdmin
        .from('documents')
        .update({ verification_status: 'rejected', rejection_reason: admin_notes })
        .eq('provider_id', provider_user_id)

      console.log(`Admin ${user.id} rejected provider ${provider_user_id}`)

      return new Response(
        JSON.stringify({ success: true, action: 'rejected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "approve" or "reject".' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
