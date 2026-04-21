import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Recursively list every object path under a user's folder in `bucket`
// and delete them in a single batch call.
async function purgeUserFolder(
  supabaseAdmin: ReturnType<typeof createClient>,
  bucket: string,
  userId: string,
): Promise<number> {
  const paths: string[] = []
  const queue: string[] = [userId]

  while (queue.length > 0) {
    const prefix = queue.shift() as string
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .list(prefix, { limit: 1000 })

    if (error) continue // folder may not exist in this bucket — skip
    for (const item of data ?? []) {
      const full = `${prefix}/${item.name}`
      // id === null means the item is a folder in Supabase storage
      if ((item as any).id === null) {
        queue.push(full)
      } else {
        paths.push(full)
      }
    }
  }

  if (paths.length === 0) return 0
  const { error } = await supabaseAdmin.storage.from(bucket).remove(paths)
  if (error) {
    console.error(`Failed to delete from ${bucket}:`, error)
    return 0
  }
  return paths.length
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Verify caller identity
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json().catch(() => ({}))
    const targetUserId: string | undefined = body?.p_user_id
    if (!targetUserId || typeof targetUserId !== 'string') {
      return new Response(JSON.stringify({ error: 'p_user_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Authorization: self OR admin
    if (user.id !== targetUserId) {
      const { data: roles } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')

      if (!roles || roles.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Not authorized to delete this account' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
    }

    // Purge storage first — if the DB delete fails (active job/dispute guard),
    // the user still exists and can re-upload. Losing their files while the
    // account survives is preferable to orphaned files forever.
    // Actually no — reverse it. Run DB delete first so the guard-trigger can
    // abort the whole thing before we touch storage.

    // Step 1: delete auth user. FK cascade fires the BEFORE DELETE trigger on
    // public.users, which blocks if there's an active job or open dispute.
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)
    if (deleteError) {
      const msg = deleteError.message || ''
      // Surface the trigger's friendly message to the client
      if (msg.includes('active job')) {
        return new Response(
          JSON.stringify({ error: 'active_job', message: msg }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
      if (msg.includes('open dispute')) {
        return new Response(
          JSON.stringify({ error: 'open_dispute', message: msg }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
      console.error('auth.admin.deleteUser failed:', deleteError)
      return new Response(
        JSON.stringify({ error: msg || 'Delete failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Step 2: DB delete succeeded. Clean up storage objects under the user's
    // folders. Failures here don't roll back — they just leak files, which
    // is recoverable but logged.
    const [docsCount, avatarsCount] = await Promise.all([
      purgeUserFolder(supabaseAdmin, 'user-documents', targetUserId),
      purgeUserFolder(supabaseAdmin, 'avatars', targetUserId),
    ])

    console.log(
      `Deleted user ${targetUserId} by ${user.id}. ` +
      `Purged ${docsCount} docs, ${avatarsCount} avatar files.`,
    )

    return new Response(
      JSON.stringify({ success: true, storage_deleted: { docs: docsCount, avatars: avatarsCount } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
