// complete-job — finish an in-progress job and assemble the Phase 4 invoice package.
//
// Sets actual_end, computes labor hours and travel time, stores tech notes / parts
// / photos / signature, transitions the job to `completed`, and assembles the
// invoice_data JSON contract (build plan §6.3) — persisted on jobs.invoice_data and
// returned to the caller. A technician may only complete their own job.

import { z } from "zod";
import { authenticate, type AuthContext } from "../_shared/auth.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import { handlePreflight } from "../_shared/cors.ts";
import { HttpError, ok, withErrors } from "../_shared/response.ts";
import type { SupabaseClient } from "@supabase/supabase-js";

const PartSchema = z.object({
  name: z.string().optional(),
  part_name: z.string().optional(),
  qty: z.number().optional(),
  quantity: z.number().optional(),
  cost: z.number().optional(),
  price: z.number().optional(),
}).passthrough();

const Body = z.object({
  job_id: z.string().uuid(),
  tech_notes: z.string().max(10000).optional(),
  parts_used: z.array(PartSchema).optional(),
  photos: z.array(z.string()).optional(),
  customer_signature: z.string().optional(),
});

// Minutes between the en_route and arrived audit entries, if both exist.
async function travelMinutes(db: SupabaseClient, jobId: string): Promise<number | null> {
  const { data } = await db
    .from("job_status_history")
    .select("new_status, created_at")
    .eq("job_id", jobId)
    .in("new_status", ["en_route", "arrived"])
    .order("created_at", { ascending: true });
  if (!data) return null;
  const enRoute = data.find((r) => r.new_status === "en_route");
  const arrived = data.find((r) => r.new_status === "arrived");
  if (!enRoute || !arrived) return null;
  const ms = new Date(arrived.created_at).getTime() - new Date(enRoute.created_at).getTime();
  if (!(ms > 0)) return null;
  return Math.round(ms / 60000);
}

function normalizeParts(parts: z.infer<typeof PartSchema>[] | undefined) {
  return (parts ?? []).map((p) => {
    const cost = typeof p.cost === "number" ? p.cost : 0;
    return {
      name: p.name ?? p.part_name ?? "Part",
      qty: p.qty ?? p.quantity ?? 1,
      cost,
      price: typeof p.price === "number" ? p.price : cost,
    };
  });
}

export const handler = withErrors(async (req: Request): Promise<Response> => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST") throw new HttpError(405, "Method not allowed");

  const db = getServiceClient();
  const auth: AuthContext = await authenticate(req, db, { allow: ["jwt", "service"] });

  const raw = await req.json().catch(() => {
    throw new HttpError(400, "Invalid JSON body");
  });
  const parsed = Body.safeParse(raw);
  if (!parsed.success) throw new HttpError(400, "Validation failed", parsed.error.flatten());
  const input = parsed.data;

  // Load the job with the relations needed for the invoice package.
  const { data: job, error: getErr } = await db
    .from("jobs")
    .select(`
      id, tenant_id, status, technician_id, actual_start, estimated_revenue,
      parts_used, photos,
      customer:customers ( id, name, email, phone, address ),
      job_type:job_types ( name, category ),
      technician:technicians!jobs_technician_id_fkey ( id, name, hourly_rate )
    `)
    .eq("id", input.job_id)
    .eq("tenant_id", auth.tenantId)
    .is("deleted_at", null)
    .maybeSingle();
  if (getErr) throw new HttpError(500, `Job lookup failed: ${getErr.message}`);
  if (!job) throw new HttpError(404, "Job not found in this tenant");

  // Technicians may only complete their own jobs.
  const isOfficeRole = auth.role === "admin" || auth.role === "dispatcher" || auth.authType === "service";
  if (!isOfficeRole && (!auth.techId || job.technician_id !== auth.techId)) {
    throw new HttpError(403, "Technicians can only complete their own jobs");
  }

  // Only an in-progress job can be completed (the lifecycle's only path to completed).
  if (job.status !== "in_progress") {
    throw new HttpError(409, `Job must be in_progress to complete (currently ${job.status})`);
  }
  if (!job.actual_start) {
    throw new HttpError(409, "Job has no actual_start; cannot compute labor");
  }

  const completedAt = new Date();
  const actualEnd = completedAt.toISOString();
  const parts = normalizeParts(input.parts_used ?? (job.parts_used as never));
  const photos = input.photos ?? (job.photos as string[] | null) ?? [];

  // Persist the completion fields (parts/photos/signature/notes), set actual_end.
  const fieldUpdate: Record<string, unknown> = {
    actual_end: actualEnd,
    parts_used: parts,
    photos,
  };
  if (input.tech_notes !== undefined) fieldUpdate.tech_notes = input.tech_notes;
  if (input.customer_signature !== undefined) {
    fieldUpdate.customer_signature = input.customer_signature;
    fieldUpdate.signed_at = actualEnd;
  }

  // Assemble the invoice_data contract (§6.3).
  // To-one FK embeds return a single object at runtime; supabase-js types them as
  // arrays, so cast through unknown.
  const customer = (job.customer ?? {}) as unknown as Record<string, unknown>;
  const jobType = (job.job_type ?? null) as unknown as Record<string, unknown> | null;
  const technician = (job.technician ?? {}) as unknown as Record<string, unknown>;

  const startMs = new Date(job.actual_start).getTime();
  const hours = Math.round(((completedAt.getTime() - startMs) / 3_600_000) * 100) / 100;
  const rate = typeof technician.hourly_rate === "number" ? technician.hourly_rate : null;
  const laborTotal = rate !== null ? Math.round(hours * rate * 100) / 100 : null;
  const travel = await travelMinutes(db, input.job_id);

  const invoiceData = {
    job_id: job.id,
    tenant_id: job.tenant_id,
    customer: {
      id: customer.id ?? null,
      name: customer.name ?? null,
      email: customer.email ?? null,
      phone: customer.phone ?? null,
      address: customer.address ?? null,
    },
    job_type: jobType ? { name: jobType.name ?? null, category: jobType.category ?? null } : null,
    services: jobType
      ? [{ name: jobType.name ?? "Service", flat_rate: job.estimated_revenue ?? null }]
      : [],
    parts,
    labor: {
      actual_start: job.actual_start,
      actual_end: actualEnd,
      hours,
      rate,
      total: laborTotal,
    },
    travel_time_minutes: travel,
    photos,
    signature_url: input.customer_signature ?? null,
    completed_at: actualEnd,
  };
  fieldUpdate.invoice_data = invoiceData;

  // 1) write completion fields, 2) transition to completed (separate UPDATE so the
  // status trigger validates the in_progress → completed move).
  const { error: fErr } = await db
    .from("jobs")
    .update(fieldUpdate)
    .eq("id", input.job_id)
    .eq("tenant_id", auth.tenantId);
  if (fErr) throw new HttpError(500, `Failed to save completion fields: ${fErr.message}`);

  const { data: completed, error: tErr } = await db
    .from("jobs")
    .update({ status: "completed" })
    .eq("id", input.job_id)
    .eq("tenant_id", auth.tenantId)
    .select("*")
    .single();
  if (tErr) {
    const status = /invalid job status transition/i.test(tErr.message) ? 422 : 500;
    throw new HttpError(status, tErr.message);
  }

  return ok({ job: completed, invoice_data: invoiceData });
});

if (import.meta.main) {
  Deno.serve(handler);
}
