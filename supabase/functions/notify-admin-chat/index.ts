/**
 * notify-admin-chat
 *
 * Triggered by the `chat_messages_after_insert` DB trigger whenever a user
 * (non-admin) inserts a chat message. Waits 30 seconds and, if the message
 * is still unread, fires a WhatsApp notification to the admin support line.
 *
 * No direct user auth — the trigger calls with the service role key.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const ADMIN_WHATSAPP = "523325520551";
const UNREAD_DELAY_MS = 30_000;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: { "Access-Control-Allow-Origin": "*" } });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { message_id } = await req.json();
    if (!message_id) return new Response(JSON.stringify({ error: "message_id required" }), { status: 400 });

    // Return immediately — the 30s wait happens in the background so the DB
    // trigger's HTTP call doesn't block.
    const work = (async () => {
      await new Promise((r) => setTimeout(r, UNREAD_DELAY_MS));

      const { data: msg } = await supabase
        .from("chat_messages")
        .select("id, conversation_id, sender_role, message, is_read, sender_id")
        .eq("id", message_id)
        .maybeSingle();

      if (!msg || msg.is_read || msg.sender_role === "admin") return;

      const { data: conv } = await supabase
        .from("conversations")
        .select("type, dispute_id, participant_name, participant_role")
        .eq("id", msg.conversation_id)
        .maybeSingle();

      const name = conv?.participant_name ?? "Usuario";
      const role = conv?.participant_role === "provider" ? "proveedor" : "cliente";
      const preview = (msg.message ?? "").slice(0, 140);

      const whatsappText = conv?.type === "support"
        ? `Nuevo mensaje de soporte de ${name}: ${preview}`
        : `Nuevo mensaje en disputa #${(conv?.dispute_id ?? "").slice(0, 8)} de ${name} (${role}): ${preview}`;

      // Best-effort hand-off to the shared WhatsApp function.
      // If it's unavailable the attempt is logged and we still record an
      // admin_notifications row so the admin sees the alert in-app.
      try {
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-whatsapp-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({ to: ADMIN_WHATSAPP, message: whatsappText }),
        });
      } catch (e) {
        console.error("[notify-admin-chat] WhatsApp hand-off failed:", e);
      }

      await supabase.from("admin_notifications").insert({
        type: "chat_message_unread",
        booking_id: null,
        triggered_by_user_id: msg.sender_id,
        message: whatsappText,
        is_read: false,
      }).select().maybeSingle().catch(() => null);
    })();

    // Deno edge: let the work run without making the HTTP call wait for it.
    // @ts-ignore — EdgeRuntime.waitUntil is Supabase-specific
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(work);
    } else {
      // Fallback for local dev — actually await so the runtime doesn't kill us early.
      await work;
    }

    return new Response(JSON.stringify({ scheduled: true }), {
      status: 202,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[notify-admin-chat] error:", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
