// Shared CORS handling for the scheduling Edge Functions.
//
// The booking-widget endpoints (check-availability, create-job) are called from
// arbitrary contractor websites, so CORS is permissive on origin. The allowed
// request headers cover all three auth paths: Clerk JWT (`authorization`), the
// trusted service-credential path (`authorization` + `x-*` actor headers), and
// the public widget-key path (`x-firmcraft-widget-key`).

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-firmcraft-widget-key, x-tenant-id, x-role, x-tech-id, x-actor",
  "Access-Control-Max-Age": "86400",
};

// Returns a 204 preflight response if the request is an OPTIONS probe, else null.
export function handlePreflight(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 204, headers: corsHeaders });
  }
  return null;
}
