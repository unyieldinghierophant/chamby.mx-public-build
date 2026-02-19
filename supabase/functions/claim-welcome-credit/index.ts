import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, phone, urgency } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "Email inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine amount: 200 if urgency flag, else 150
    const amount = urgency ? 200 : 150;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if email already has an active (unredeemed) credit
    const { data: existing } = await supabase
      .from("user_credits")
      .select("id, amount, expires_at")
      .eq("email", email.toLowerCase().trim())
      .is("redeemed_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({
          success: true,
          already_exists: true,
          credit: existing,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check phone duplicate if provided
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, "").slice(0, 10);
      const { data: phoneExisting } = await supabase
        .from("user_credits")
        .select("id")
        .eq("phone", cleanPhone)
        .is("redeemed_at", null)
        .maybeSingle();

      if (phoneExisting) {
        return new Response(
          JSON.stringify({
            error: "Ya existe un crédito activo con este teléfono",
          }),
          {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Check if a user with this email already exists → attach user_id
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    const { data: credit, error } = await supabase
      .from("user_credits")
      .insert({
        email: email.toLowerCase().trim(),
        phone: phone ? phone.replace(/\D/g, "").slice(0, 10) : null,
        amount,
        reason: "welcome",
        user_id: existingUser?.id || null,
        expires_at: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000
        ).toISOString(),
      })
      .select()
      .single();

    if (error) {
      // Unique constraint violation = duplicate
      if (error.code === "23505") {
        return new Response(
          JSON.stringify({ error: "Ya tienes un crédito activo" }),
          {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      throw error;
    }

    return new Response(JSON.stringify({ success: true, credit }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("claim-welcome-credit error:", err);
    return new Response(JSON.stringify({ error: "Error interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
