// Service-role Supabase client for the scheduling Edge Functions.
//
// Edge Functions are trusted server code: they connect with the service-role key
// (which has BYPASSRLS) and enforce tenant isolation + role rules EXPLICITLY in
// application code, scoping every query by the tenant_id resolved by the auth
// layer. RLS (migration 006) remains the hard boundary for the *direct* PostgREST
// access used by the Clerk-authenticated client app — it is defense-in-depth here,
// not the mechanism these functions rely on.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Supabase injects SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY into the function
// runtime automatically. Locally (deno test) they come from the loaded env.
export function getServiceClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase not configured: need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getServiceRoleKey(): string | undefined {
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
}
