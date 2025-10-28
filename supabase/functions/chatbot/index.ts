import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Eres un asistente virtual de Chamby, una plataforma mexicana que conecta clientes con profesionales verificados para servicios del hogar como plomería, electricidad, limpieza, reparaciones y más.

Información importante sobre Chamby:
- Somos una plataforma que conecta clientes con profesionales verificados (Chambynautas)
- Ofrecemos servicios de: Handyman, Electricidad, Plomería, Auto y lavado, Limpieza, Jardinería, y más
- Todos los profesionales están verificados y tienen calificaciones reales
- Calificación promedio: 4.9 estrellas
- Más de 500 profesionales disponibles
- Más de 10,000 servicios completados
- El proceso es simple: busca el servicio, selecciona un profesional, agenda y listo
- Los clientes pueden ganar dinero como Chambynautas ofreciendo sus servicios

Si el usuario pregunta sobre:
- CÓMO FUNCIONA: Explica que es simple - buscan el servicio que necesitan, seleccionan un profesional verificado, agendan la fecha/hora, y el profesional llega a su domicilio
- SERVICIOS: Menciona las categorías principales (plomería, electricidad, handyman, limpieza, jardinería, auto)
- PRECIOS: Explica que los precios varían según el servicio y el profesional, pero pueden ver precios estimados antes de contratar
- SER CHAMBYNAUTA: Diles que pueden registrarse para ofrecer sus servicios y ganar dinero
- SEGURIDAD: Todos los profesionales están verificados con documentos y tienen calificaciones reales de clientes

Si el usuario quiere hablar con un humano o necesita ayuda que no puedes resolver, responde EXACTAMENTE con este JSON:
{"action": "contact_human", "message": "Te voy a conectar con nuestro equipo de soporte por WhatsApp"}

Sé amigable, conciso y usa emojis ocasionalmente. Habla siempre en español mexicano.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Demasiadas solicitudes, intenta de nuevo en un momento." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Servicio temporalmente no disponible." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Error al procesar la solicitud" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    return new Response(JSON.stringify({ message: assistantMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Chatbot error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
