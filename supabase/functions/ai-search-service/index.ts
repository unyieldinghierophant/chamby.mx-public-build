import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `Eres un asistente para clasificar servicios del hogar en México. 
    
Categorías disponibles:
- Auto y Lavado: lavado de auto, aspirado, encerado, cambio de batería, mantenimiento básico
- Fontanería: fugas de agua, reparación de WC, instalación de bombas, destapado de cañerías
- Electricidad: instalación de apagadores, reparación de cortos circuitos, instalación de lámparas, problemas eléctricos
- Handyman: arreglos generales, pintura, colgar TV, mover muebles, montaje de muebles, reparaciones menores

Analiza la consulta del usuario y responde SOLO con un JSON en este formato exacto:
{
  "category": "nombre de la categoría",
  "service": "servicio específico",
  "description": "descripción breve del problema"
}

Ejemplos:
- "mi lavabo está goteando" → {"category": "Fontanería", "service": "Reparación de fugas", "description": "Lavabo con goteo"}
- "necesito cambiar una batería de coche" → {"category": "Auto y Lavado", "service": "Cambio de batería", "description": "Reemplazo de batería de vehículo"}
- "tengo un corto circuito en casa" → {"category": "Electricidad", "service": "Reparación de cortos", "description": "Corto circuito eléctrico"}
- "quiero colgar mi televisión" → {"category": "Handyman", "service": "Colgar TV", "description": "Instalación de televisión en pared"}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('Error al procesar la búsqueda');
    }

    const data = await response.json();
    let content = data.choices[0].message.content;

    // Remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse the JSON response
    const result = JSON.parse(content);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-search-service:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Error desconocido',
        category: 'Handyman',
        service: 'Servicio general',
        description: 'Búsqueda de servicio'
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
