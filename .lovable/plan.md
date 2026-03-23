

## Fix: Add Input Validation to Chatbot Edge Function

### Problem
The chatbot edge function accepts the `messages` array from the request body with zero validation — no length limits, no role checking, no content sanitization. This enables prompt injection, token exhaustion, and malformed input attacks.

### Solution
Add server-side validation to `supabase/functions/chatbot/index.ts` before passing messages to the AI gateway. No client-side or other file changes needed.

### Changes (single file: `supabase/functions/chatbot/index.ts`)

After parsing `const { messages } = await req.json();`, add validation:

1. **Verify `messages` is a non-empty array** with max 20 entries (prevents token exhaustion)
2. **Validate each message's `role`** — only allow `"user"` and `"assistant"` (blocks injected `"system"` roles)
3. **Validate `content` is a string** and truncate to 2,000 characters (prevents oversized payloads)
4. **Strip control characters** from content (prevents encoding-based attacks)
5. Return `400 Bad Request` with a user-friendly Spanish error for invalid input

```typescript
// Validation constants
const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 2000;
const ALLOWED_ROLES = ['user', 'assistant'];

// Validate messages array
if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
  return new Response(
    JSON.stringify({ error: "Solicitud inválida." }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Sanitize each message
const sanitized = messages.map(m => {
  if (!m || !ALLOWED_ROLES.includes(m.role) || typeof m.content !== 'string') {
    throw new Error("Invalid message format");
  }
  return {
    role: m.role,
    content: m.content.slice(0, MAX_CONTENT_LENGTH).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ''),
  };
});
```

Then pass `sanitized` instead of `messages` to the AI gateway call.

### What Won't Change
- Client-side `ChatBot.tsx` sends well-formed messages already — no changes needed there
- The system prompt, model, and response handling remain identical
- No database or migration changes

### Risk Assessment
- **Very low risk**: The client already sends properly formatted messages with `user`/`assistant` roles. This only rejects malformed or oversized requests that wouldn't come from the legitimate UI.

