// create-job — create a new job for the authenticated tenant.
//
// Auth: Clerk JWT (any authenticated role), the trusted service-credential path
// (the AI phone agent), OR a public widget key with the `create_job` scope
// (Phase 3 online booking). All three resolve to a tenant_id; the job is always
// written under that tenant.
//
// Auto-population: estimated_duration / estimated_revenue come from the job_type
// default; address + location are denormalized from the customer record. If a
// technician is supplied the job opens as `scheduled`, otherwise `created`.

import { z } from "npm:zod";
import { authenticate } from "../_shared/auth.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import { handlePreflight } from "../_shared/cors.ts";
import { HttpError, ok, withErrors } from "../_shared/response.ts";
import { ewktFromAddress } from "../_shared/geo.ts";

const KNOWN_SOURCES = ["phone_ai", "online_booking", "dispatcher", "api", "manual", "hermes", "recurring"] as const;

const Body = z.object({
  customer_id: z.string().uuid(),
  job_type_id: z.string().uuid().optional(),
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
  priority: z.enum(["emergency", "urgent", "standard", "flexible"]).default("standard"),
  scheduled_start: z.string().datetime({ offset: true }).optional(),
  scheduled_end: z.string().datetime({ offset: true }).optional(),
  arrival_window_start: z.string().datetime({ offset: true }).optional(),
  arrival_window_end: z.string().datetime({ offset: true }).optional(),
  technician_id: z.string().uuid().optional(),
  estimated_duration: z.number().int().positive().optional(),
  source: z.enum(KNOWN_SOURCES).optional(),
  tags: z.array(z.string()).optional(),
});

export const handler = withErrors(async (req: Request): Promise<Response> => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST") throw new HttpError(405, "Method not allowed");

  const db = getServiceClient();
  const auth = await authenticate(req, db, {
    allow: ["jwt", "service", "widget"],
    widgetScope: "create_job",
  });

  const raw = await req.json().catch(() => {
    throw new HttpError(400, "Invalid JSON body");
  });
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    throw new HttpError(400, "Validation failed", parsed.error.flatten());
  }
  const input = parsed.data;

  if (input.scheduled_start && input.scheduled_end &&
      new Date(input.scheduled_start) >= new Date(input.scheduled_end)) {
    throw new HttpError(400, "scheduled_start must be before scheduled_end");
  }
  if (input.arrival_window_start && input.arrival_window_end &&
      new Date(input.arrival_window_start) >= new Date(input.arrival_window_end)) {
    throw new HttpError(400, "arrival_window_start must be before arrival_window_end");
  }

  // The public widget cannot self-assign a technician and is always tagged as
  // an online booking regardless of any client-supplied source.
  const isWidget = auth.authType === "widget";
  const technicianId = isWidget ? undefined : input.technician_id;
  const source = isWidget
    ? "online_booking"
    : input.source ?? (auth.authType === "service" ? "api" : "dispatcher");

  // Customer must belong to the caller's tenant; pull its address/location.
  const { data: customer, error: custErr } = await db
    .from("customers")
    .select("id, address")
    .eq("id", input.customer_id)
    .eq("tenant_id", auth.tenantId)
    .is("deleted_at", null)
    .maybeSingle();
  if (custErr) throw new HttpError(500, `Customer lookup failed: ${custErr.message}`);
  if (!customer) throw new HttpError(404, "Customer not found in this tenant");

  // Optional job type → defaults for duration / revenue. Must be same tenant.
  let estimatedDuration = input.estimated_duration ?? null;
  let estimatedRevenue: number | null = null;
  if (input.job_type_id) {
    const { data: jobType, error: jtErr } = await db
      .from("job_types")
      .select("id, default_duration, estimated_revenue")
      .eq("id", input.job_type_id)
      .eq("tenant_id", auth.tenantId)
      .maybeSingle();
    if (jtErr) throw new HttpError(500, `Job type lookup failed: ${jtErr.message}`);
    if (!jobType) throw new HttpError(404, "Job type not found in this tenant");
    estimatedDuration = estimatedDuration ?? jobType.default_duration ?? null;
    estimatedRevenue = jobType.estimated_revenue ?? null;
  }

  // If a tech is assigned, validate it belongs to the tenant before scheduling.
  if (technicianId) {
    const { data: tech, error: techErr } = await db
      .from("technicians")
      .select("id")
      .eq("id", technicianId)
      .eq("tenant_id", auth.tenantId)
      .maybeSingle();
    if (techErr) throw new HttpError(500, `Technician lookup failed: ${techErr.message}`);
    if (!tech) throw new HttpError(404, "Technician not found in this tenant");
  }

  const status = technicianId ? "scheduled" : "created";
  const location = ewktFromAddress(customer.address);

  const insertRow = {
    tenant_id: auth.tenantId,
    customer_id: input.customer_id,
    job_type_id: input.job_type_id ?? null,
    technician_id: technicianId ?? null,
    title: input.title,
    description: input.description ?? null,
    priority: input.priority,
    status,
    source,
    scheduled_start: input.scheduled_start ?? null,
    scheduled_end: input.scheduled_end ?? null,
    arrival_window_start: input.arrival_window_start ?? null,
    arrival_window_end: input.arrival_window_end ?? null,
    estimated_duration: estimatedDuration,
    estimated_revenue: estimatedRevenue,
    address: customer.address ?? null,
    location,
    tags: input.tags ?? [],
  };

  const { data: job, error: insErr } = await db
    .from("jobs")
    .insert(insertRow)
    .select("*")
    .single();
  if (insErr) throw new HttpError(500, `Job creation failed: ${insErr.message}`);

  return ok(job, 201);
});

if (import.meta.main) {
  Deno.serve(handler);
}
