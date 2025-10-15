import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

  const url = new URL(req.url);
  const query = url.searchParams.get('query')?.trim();
  
  // Validate query length to prevent DoS
  if (query && query.length > 100) {
    return new Response(
      JSON.stringify({ error: 'Búsqueda demasiado larga' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

    console.log('Search query:', query);

    if (!query || query.length < 2) {
      return new Response(
        JSON.stringify([]), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Search in services table using name, category, and tags
    const { data: services, error } = await supabase
      .from('services')
      .select('id, name, category, tags, description, price_from, price_to')
      .or(`name.ilike.%${query}%,category.ilike.%${query}%,tags.cs.{${query}}`)
      .limit(10);

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log('Found services:', services?.length || 0);

    // Sort results by relevance (exact matches first, then partial matches)
    const sortedResults = (services || []).sort((a, b) => {
      const queryLower = query.toLowerCase();
      
      // Exact name match gets highest priority
      if (a.name.toLowerCase() === queryLower) return -1;
      if (b.name.toLowerCase() === queryLower) return 1;
      
      // Exact category match gets second priority
      if (a.category.toLowerCase() === queryLower) return -1;
      if (b.category.toLowerCase() === queryLower) return 1;
      
      // Name starts with query gets third priority
      if (a.name.toLowerCase().startsWith(queryLower)) return -1;
      if (b.name.toLowerCase().startsWith(queryLower)) return 1;
      
      // Category starts with query gets fourth priority
      if (a.category.toLowerCase().startsWith(queryLower)) return -1;
      if (b.category.toLowerCase().startsWith(queryLower)) return 1;
      
      return 0;
    });

    return new Response(
      JSON.stringify(sortedResults),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});