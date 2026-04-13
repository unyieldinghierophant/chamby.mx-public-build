/**
 * _shared/rateLimit.ts — Simple Postgres-backed rate limiter for Supabase edge functions.
 *
 * Usage:
 *   const allowed = await checkRateLimit(supabase, `create-visit-payment:${userId}`, 5, 60);
 *   if (!allowed) return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429 });
 */

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

/**
 * @param supabase   Service-role Supabase client
 * @param key        Unique key: `function-name:user-id` or `function-name:ip`
 * @param limit      Max requests allowed in the window
 * @param windowSecs Window size in seconds
 */
export async function checkRateLimit(
  supabase: any,
  key: string,
  limit: number,
  windowSecs: number
): Promise<RateLimitResult> {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowSecs * 1000).toISOString();

    // Upsert the rate limit record — count requests in current window
    const { data, error } = await supabase.rpc("upsert_rate_limit", {
      p_key: key,
      p_window_secs: windowSecs,
      p_limit: limit,
    });

    if (error) {
      // On error, fail open (allow) to avoid blocking legitimate traffic
      console.warn("[rateLimit] DB error, failing open:", error.message);
      return { allowed: true, remaining: limit, resetInSeconds: windowSecs };
    }

    const count: number = data?.count ?? 1;
    const windowStartTs: string = data?.window_start ?? now.toISOString();
    const elapsed = (now.getTime() - new Date(windowStartTs).getTime()) / 1000;
    const resetInSeconds = Math.max(0, Math.round(windowSecs - elapsed));

    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetInSeconds,
    };
  } catch (err) {
    console.warn("[rateLimit] Unexpected error, failing open:", err);
    return { allowed: true, remaining: limit, resetInSeconds: windowSecs };
  }
}

/** Build a 429 response with Retry-After header */
export function rateLimitResponse(resetInSeconds: number, corsHeaders: Record<string, string> = {}): Response {
  return new Response(
    JSON.stringify({ error: "Demasiadas solicitudes. Intenta de nuevo en un momento." }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(resetInSeconds),
      },
    }
  );
}
