import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { urls, jobRequestId } = await req.json();

    console.log('Shortening URLs:', { urlCount: urls?.length, jobRequestId });

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No URLs provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Generate short codes for each URL
    const shortLinks = await Promise.all(
      urls.map(async (fullUrl: string, index: number) => {
        try {
          let shortCode = '';
          let attempts = 0;
          
          console.log(`Processing URL ${index + 1}/${urls.length}:`, fullUrl.substring(0, 50) + '...');
          
          // Try to generate unique short code (max 10 attempts)
          while (attempts < 10) {
            const { data: codeData, error: codeError } = await supabase.rpc('generate_short_code');
            
            if (codeError) {
              console.error('Error generating code:', codeError);
              throw codeError;
            }
            
            shortCode = codeData;
            
            // Check if code already exists
            const { data: existing } = await supabase
              .from('photo_short_links')
              .select('id')
              .eq('short_code', shortCode)
              .maybeSingle();
            
            if (!existing) break;
            attempts++;
            console.log(`Collision on attempt ${attempts}, retrying...`);
          }

          if (attempts >= 10) {
            throw new Error('Failed to generate unique short code after 10 attempts');
          }

          // Insert short link
          const { data, error } = await supabase
            .from('photo_short_links')
            .insert({
              short_code: shortCode,
              full_url: fullUrl,
              job_request_id: jobRequestId
            })
            .select('short_code')
            .single();

          if (error) {
            console.error('Error inserting short link:', error);
            throw error;
          }

          const shortUrl = `https://chamby.mx/p/${data.short_code}`;
          console.log(`Successfully created short link ${index + 1}:`, { shortCode, shortUrl });

          return {
            original: fullUrl,
            short: shortUrl
          };
        } catch (urlError) {
          console.error(`Failed to shorten URL ${index + 1}:`, urlError);
          throw urlError; // Re-throw to fail the entire batch
        }
      })
    );

    console.log(`Successfully shortened all ${shortLinks.length} URLs`);

    return new Response(
      JSON.stringify({ shortLinks }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Shorten URL error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
