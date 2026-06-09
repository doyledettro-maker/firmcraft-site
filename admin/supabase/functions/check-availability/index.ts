// check-availability — per-technician open slots for a date.
//
// Delegates the timezone-correct slot math to the public.check_availability()
// Postgres function (migration 008): tenant work hours minus assigned jobs minus
// time-off, optionally filtered to techs with the job type's required skills and/or
// a given zone.
//
// Auth: Clerk JWT, the trusted service-credential path (AI phone agent), OR a
// public widget key with the `check_availability` scope. The widget path is the
// forward-compatibility hook for the Phase 3 embeddable booking widget (build
// plan §6.2) — it needs no contract change to go live.

import { z } from "zod";
import { authenticate } from "../_shared/auth.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import { handlePreflight } from "../_shared/cors.ts";
import { HttpError, ok, withErrors } from "../_shared/response.ts";

const Body = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  duration_minutes: z.number().int().positive().max(24 * 60),
  job_type_id: z.string().uuid().optional(),
  zone_id: z.string().uuid().optional(),
});

export const handler = withErrors(async (req: Request): Promise<Response> => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST") throw new HttpError(405, "Method not allowed");

  const db = getServiceClient();
  const auth = await authenticate(req, db, {
    allow: ["jwt", "service", "widget"],
    widgetScope: "check_availability",
  });

  const raw = await req.json().catch(() => {
    throw new HttpError(400, "Invalid JSON body");
  });
  const parsed = Body.safeParse(raw);
  if (!parsed.success) throw new HttpError(400, "Validation failed", parsed.error.flatten());
  const input = parsed.data;

  const { data, error } = await db.rpc("check_availability", {
    p_tenant: auth.tenantId,
    p_date: input.date,
    p_duration_minutes: input.duration_minutes,
    p_job_type: input.job_type_id ?? null,
    p_zone: input.zone_id ?? null,
  });
  if (error) throw new HttpError(500, `Availability solve failed: ${error.message}`);

  return ok({
    date: input.date,
    duration_minutes: input.duration_minutes,
    technicians: data ?? [],
  });
});

if (import.meta.main) {
  Deno.serve(handler);
}
