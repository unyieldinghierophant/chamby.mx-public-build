/**
 * _shared/cors.ts — CORS origin validation for Chamby edge functions.
 *
 * Restricts requests to known frontend origins instead of wildcard *.
 * Usage:
 *   const corsHeaders = getCorsHeaders(req);
 *   if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
 */

const ALLOWED_ORIGINS = [
  "https://chamby.mx",
  "https://www.chamby.mx",
  "https://app.chamby.mx",
  // Allow localhost for local dev
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080",
];

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const isAllowed = ALLOWED_ORIGINS.includes(origin) ||
    // Allow any *.chamby.mx subdomain
    /^https:\/\/[a-z0-9-]+\.chamby\.mx$/.test(origin);

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "https://chamby.mx",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
