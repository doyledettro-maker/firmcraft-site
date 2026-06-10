// tech-location — ingest a technician GPS ping.
//
// Upserts the one-row-per-tech current-location cache and appends to the location
// history trail. The tech identity comes from the auth context (the JWT's tech_id,
// or the x-tech-id header on the service path), never from the request body, so a
// tech can only post their own location.
//
// Rate limit: max 2 updates/sec per tech (architecture §9.5, "Edge Function dedup").

import { z } from "npm:zod";
import { authenticate } from "../_shared/auth.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import { handlePreflight } from "../_shared/cors.ts";
import { HttpError, ok, withErrors } from "../_shared/response.ts";
import { pointEwkt } from "../_shared/geo.ts";
import { rateLimit } from "../_shared/ratelimit.ts";

const Body = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().nonnegative().optional(),
  speed: z.number().optional(),
  heading: z.number().optional(),
});

export const handler = withErrors(async (req: Request): Promise<Response> => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST") throw new HttpError(405, "Method not allowed");

  const db = getServiceClient();
  const auth = await authenticate(req, db, { allow: ["jwt", "service"] });

  const techId = auth.techId;
  if (!techId) {
    throw new HttpError(403, "No technician identity on this credential (missing tech_id)");
  }

  // 2 updates/sec/tech. Best-effort per isolate; matches the documented dedup limit.
  const { allowed, retryAfterMs } = rateLimit(`techloc:${techId}`, 2, 1000);
  if (!allowed) {
    return new Response(
      JSON.stringify({ ok: false, error: "Rate limit exceeded (max 2/sec)" }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil(retryAfterMs / 1000)),
        },
      },
    );
  }

  const raw = await req.json().catch(() => {
    throw new HttpError(400, "Invalid JSON body");
  });
  const parsed = Body.safeParse(raw);
  if (!parsed.success) throw new HttpError(400, "Validation failed", parsed.error.flatten());
  const { lat, lng, accuracy, speed, heading } = parsed.data;

  // Defensive: confirm the tech belongs to the caller's tenant (guards a stale or
  // mismatched tech_id claim from writing into the wrong tenant).
  const { data: tech, error: techErr } = await db
    .from("technicians")
    .select("id")
    .eq("id", techId)
    .eq("tenant_id", auth.tenantId)
    .maybeSingle();
  if (techErr) throw new HttpError(500, `Technician lookup failed: ${techErr.message}`);
  if (!tech) throw new HttpError(404, "Technician not found in this tenant");

  const location = pointEwkt(lng, lat);
  const recordedAt = new Date().toISOString();
  const status = typeof speed === "number" && speed > 1.5 ? "driving" : "idle";

  // History append.
  const { error: histErr } = await db.from("technician_locations").insert({
    technician_id: techId,
    tenant_id: auth.tenantId,
    location,
    accuracy: accuracy ?? null,
    speed: speed ?? null,
    heading: heading ?? null,
    recorded_at: recordedAt,
  });
  if (histErr) throw new HttpError(500, `Location history insert failed: ${histErr.message}`);

  // Current-location upsert. current_job_id is intentionally omitted so an existing
  // assignment is preserved across pings (upsert only updates supplied columns).
  const { error: curErr } = await db
    .from("technician_current_location")
    .upsert(
      {
        technician_id: techId,
        tenant_id: auth.tenantId,
        location,
        accuracy: accuracy ?? null,
        speed: speed ?? null,
        heading: heading ?? null,
        status,
        updated_at: recordedAt,
      },
      { onConflict: "technician_id" },
    );
  if (curErr) throw new HttpError(500, `Current-location upsert failed: ${curErr.message}`);

  return ok({ recorded_at: recordedAt });
});

if (import.meta.main) {
  Deno.serve(handler);
}
