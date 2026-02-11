import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (limit.count >= maxRequests) return false;
  limit.count++;
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limit by IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!checkRateLimit(clientIp, 10, 60000)) {
      return new Response(
        JSON.stringify({ error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { query } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `Eres un experto clasificador de servicios del hogar en México. Tu trabajo es entender consultas en español, spanglish, con errores de ortografía, y conectarlas con las categorías correctas.

CATEGORÍAS Y SERVICIOS DISPONIBLES:

🚗 Auto y Lavado:
- lavado completo, lavado interior, lavado exterior, aspirado profundo, lavado a presión
- encerado, pulido, detallado automotriz, limpieza de motor, limpieza de tapicería
- cambio de batería, cambio de aceite, revisión de llantas, mantenimiento básico
- carro, coche, auto, vehículo, camioneta

💧 Fontanería:
- fugas de agua: lavabo, regadera, llave, tubería, WC, tinaco, boiler
- destapado: baño, coladera, drenaje, cañería, tubería tapada, WC tapado
- instalación: bomba de agua, tinaco, boiler, calentador, llave mezcladora
- reparación: llave, flotador, válvula, manguera, tubería rota
- problemas: presión de agua baja, sin agua caliente, goteo, fuga

⚡ Electricidad:
- instalación: apagador, contacto, lámpara, foco, ventilador, luz
- reparación: corto circuito, falla eléctrica, luz que parpadea, apagón
- revisión: tablero, fusibles, interruptor, breaker, cableado
- problemas: sin luz, enchufe no funciona, chispazo, corriente

🔧 Handyman (Trabajos Generales):
- colgar: TV, cuadros, repisas, espejo, cortinas, persianas
- pintura: pared, recámara, sala, exterior, retoques, barniz
- montaje: muebles IKEA, estantes, libreros, escritorio, cama
- reparaciones: puerta, ventana, bisagra, chapa, manija, cerradura
- otros: mover muebles, limpieza profunda, organización, arreglos menores

VARIACIONES Y ERRORES COMUNES:
- "lavavo" → lavabo | "regadero" → regadera | "tina de baño" → bañera
- "está tirando agua" → fuga | "goteando" → goteo | "se sale el agua" → fuga
- "no prende" → no funciona | "no jala" → no funciona
- "quiero poner" → instalar | "necesito que pongan" → instalar
- "se descompuso" → reparar | "se rompió" → reparar
- "WC tapado" → destapado | "no baja el agua" → WC tapado
- "my sink is leaking" → fuga en lavabo (Spanglish)
- "el shower no funciona" → regadera no funciona (Spanglish)

REGLAS DE CLASIFICACIÓN:
1. Si menciona agua/WC/lavabo/regadera/tubería/fuga/goteo → Fontanería
2. Si menciona luz/corriente/apagador/enchufe/lámpara/corto → Electricidad
3. Si menciona auto/carro/coche/vehículo/lavado de auto/batería de coche → Auto y Lavado
4. Si menciona pintura/TV/muebles/colgar/cuadros/repisas → Handyman
5. Si es ambiguo o no está claro, usa Handyman como default

CONFIANZA (0-100):
- Alta (85-100): Palabras clave claras y específicas del servicio
- Media (60-84): Descripción razonable pero algo ambigua
- Baja (0-59): Muy vago, falta información crítica

Extrae palabras clave importantes que detectaste en la consulta.`;

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
        temperature: 0.5,
        tools: [{
          type: "function",
          function: {
            name: "categorize_service",
            description: "Categoriza una solicitud de servicio del hogar",
            parameters: {
              type: "object",
              properties: {
                category: {
                  type: "string",
                  enum: ["Auto y Lavado", "Fontanería", "Electricidad", "Handyman"],
                  description: "La categoría del servicio"
                },
                service: {
                  type: "string",
                  description: "El nombre específico del servicio solicitado"
                },
                description: {
                  type: "string",
                  description: "Descripción breve y clara del problema"
                },
                confidence: {
                  type: "number",
                  minimum: 0,
                  maximum: 100,
                  description: "Nivel de confianza en la clasificación (0-100)"
                },
                keywords_detected: {
                  type: "array",
                  items: { type: "string" },
                  description: "Palabras clave importantes detectadas en la consulta"
                }
              },
              required: ["category", "service", "description", "confidence", "keywords_detected"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "categorize_service" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('Error al procesar la búsqueda');
    }

    const data = await response.json();
    
    // Extract tool call result (structured output)
    const toolCall = data.choices[0].message.tool_calls?.[0];
    
    if (!toolCall || !toolCall.function.arguments) {
      console.error('No tool call found in response:', data);
      throw new Error('La IA no pudo clasificar el servicio');
    }

    // Parse the structured output
    const result = JSON.parse(toolCall.function.arguments);

    console.log('AI Search Result:', {
      query,
      category: result.category,
      confidence: result.confidence,
      keywords: result.keywords_detected
    });

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
