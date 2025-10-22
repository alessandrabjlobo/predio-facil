// supabase/functions/_shared/cors.ts
export function buildCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") ?? "*";
  const requested = req.headers.get("Access-Control-Request-Headers") ?? "";
  const whitelist = ["authorization", "content-type", "apikey", "x-client-info", "cache-control"];

  const merged = Array.from(
    new Set((requested ? requested.split(",").map(h => h.trim().toLowerCase()) : []).concat(whitelist)),
  ).join(", ");

  return {
    "Access-Control-Allow-Origin": origin,
    "Vary": "Origin",
    "Access-Control-Allow-Headers": merged,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}
