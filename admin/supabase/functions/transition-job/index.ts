// transition-job — move a job to a new lifecycle status.
//
// The Postgres trigger (migration 007) is the authority on which transitions are
// legal; this function just attempts the UPDATE and surfaces the trigger's
// rejection as a 422. It layers on the per-status side effects the build plan
// requires and the role rule that a technician may only transition their OWN jobs.
//
//   completed  → require actual_start is set, stamp actual_end = now()
//   en_route   → compute a straight-line ETA (skipped if location unknown)
//   cancelled  → carry the reason into the audit trail
//
// reason / metadata / changed_by are written onto the history row the AFTER
// trigger just created, so the audit entry is fully attributed.

import { z } from "zod";
import { authenticate, type AuthContext } from "../_shared/auth.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import { handlePreflight } from "../_shared/cors.ts";
import { HttpError, ok, withErrors } from "../_shared/response.ts";
import type { SupabaseClient } from "@supabase/supabase-js";

const STATUSES = [
  "created", "scheduled", "dispatched", "en_route", "arrived",
  "in_progress", "completed", "invoiced", "cancelled", "on_hold",
] as const;

const Body = z.object({
  job_id: z.string().uuid(),
  new_status: z.enum(STATUSES),
  reason: z.string().max(2000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Patch the freshly-logged history row with reason / merged metadata / actor.
async function annotateHistory(
  db: SupabaseClient,
  jobId: string,
  newStatus: string,
  reason: string | undefined,
  metadata: Record<string, unknown>,
  actor: string,
): Promise<void> {
  const { data: row } = await db
    .from("job_status_history")
    .select("id")
    .eq("job_id", jobId)
    .eq("new_status", newStatus)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!row) return;
  await db
    .from("job_status_history")
    .update({
      ...(reason !== undefined ? { reason } : {}),
      ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
      changed_by: actor,
    })
    .eq("id", row.id);
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
  const { job_id, new_status, reason } = parsed.data;
  const metadata: Record<string, unknown> = { ...(parsed.data.metadata ?? {}) };

  // Load the job (tenant-scoped) for the role check + side-effect inputs.
  const { data: job, error: getErr } = await db
    .from("jobs")
    .select("id, status, technician_id, actual_start")
    .eq("id", job_id)
    .eq("tenant_id", auth.tenantId)
    .is("deleted_at", null)
    .maybeSingle();
  if (getErr) throw new HttpError(500, `Job lookup failed: ${getErr.message}`);
  if (!job) throw new HttpError(404, "Job not found in this tenant");

  // Technicians may only transition jobs assigned to them; office staff can move any.
  const isOfficeRole = auth.role === "admin" || auth.role === "dispatcher" || auth.authType === "service";
  if (!isOfficeRole) {
    if (!auth.techId || job.technician_id !== auth.techId) {
      throw new HttpError(403, "Technicians can only transition their own jobs");
    }
  }

  const update: Record<string, unknown> = { status: new_status };

  // Per-status side effects.
  if (new_status === "in_progress") {
    // Work is starting — stamp the clock if it wasn't already (e.g. resuming from on_hold).
    if (!job.actual_start) update.actual_start = new Date().toISOString();
  } else if (new_status === "completed") {
    if (!job.actual_start) {
      throw new HttpError(409, "Cannot complete a job that has no actual_start (was it ever started?)");
    }
    update.actual_end = new Date().toISOString();
  } else if (new_status === "en_route") {
    const { data: eta } = await db.rpc("eta_minutes", {
      p_tenant: auth.tenantId,
      p_tech: job.technician_id,
      p_job: job_id,
    });
    if (typeof eta === "number") {
      metadata.eta_minutes = eta;
      metadata.eta_at = new Date(Date.now() + eta * 60_000).toISOString();
    }
  } else if (new_status === "cancelled") {
    if (reason) metadata.cancellation_reason = reason;
  }

  const { data: updated, error: updErr } = await db
    .from("jobs")
    .update(update)
    .eq("id", job_id)
    .eq("tenant_id", auth.tenantId)
    .select("*")
    .single();
  if (updErr) {
    // The trigger raises check_violation ("Invalid job status transition: ...").
    const status = /invalid job status transition/i.test(updErr.message) ? 422 : 500;
    throw new HttpError(status, updErr.message);
  }

  await annotateHistory(db, job_id, new_status, reason, metadata, auth.subject);

  return ok({ job: updated, transition: { from: job.status, to: new_status, metadata } });
});

if (import.meta.main) {
  Deno.serve(handler);
}
