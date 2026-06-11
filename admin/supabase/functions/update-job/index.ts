// update-job — partial update of a job's editable fields.
//
// Auth: dispatcher or admin (Clerk JWT or trusted service credential). Status is
// NOT edited here (use transition-job) EXCEPT for the one implicit promotion the
// build plan calls out: assigning a technician to a `created` job auto-transitions
// it to `scheduled`. That UPDATE still passes through the status-transition
// trigger, so the move is validated and audited like any other.

import { z } from "npm:zod";
import { authenticate } from "../_shared/auth.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import { handlePreflight } from "../_shared/cors.ts";
import { HttpError, ok, withErrors } from "../_shared/response.ts";

const Body = z.object({
  job_id: z.string().uuid(),
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(5000).nullable().optional(),
  priority: z.enum(["emergency", "urgent", "standard", "flexible"]).optional(),
  scheduled_start: z.string().datetime({ offset: true }).nullable().optional(),
  scheduled_end: z.string().datetime({ offset: true }).nullable().optional(),
  arrival_window_start: z.string().datetime({ offset: true }).nullable().optional(),
  arrival_window_end: z.string().datetime({ offset: true }).nullable().optional(),
  technician_id: z.string().uuid().nullable().optional(),
  tech_notes: z.string().max(10000).nullable().optional(),
  internal_notes: z.string().max(10000).nullable().optional(),
  tags: z.array(z.string()).optional(),
  checklist: z.array(z.record(z.unknown())).optional(),
  parts_used: z.array(z.record(z.unknown())).optional(),
}).strict();

// Columns the caller is allowed to set (job_id is the selector, not a column).
const EDITABLE = [
  "title", "description", "priority", "scheduled_start", "scheduled_end",
  "arrival_window_start", "arrival_window_end", "technician_id", "tech_notes",
  "internal_notes", "tags", "checklist", "parts_used",
] as const;

export const handler = withErrors(async (req: Request): Promise<Response> => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST") throw new HttpError(405, "Method not allowed");

  const db = getServiceClient();
  const auth = await authenticate(req, db, {
    allow: ["jwt", "service"],
    requireRole: ["admin", "dispatcher"],
  });

  const raw = await req.json().catch(() => {
    throw new HttpError(400, "Invalid JSON body");
  });
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    throw new HttpError(400, "Validation failed", parsed.error.flatten());
  }
  const input = parsed.data;

  // Load the existing job (tenant-scoped) so we can validate merged scheduling
  // values and detect the created→scheduled promotion.
  const { data: existing, error: getErr } = await db
    .from("jobs")
    .select("id, status, scheduled_start, scheduled_end, technician_id")
    .eq("id", input.job_id)
    .eq("tenant_id", auth.tenantId)
    .is("deleted_at", null)
    .maybeSingle();
  if (getErr) throw new HttpError(500, `Job lookup failed: ${getErr.message}`);
  if (!existing) throw new HttpError(404, "Job not found in this tenant");

  const update: Record<string, unknown> = {};
  for (const key of EDITABLE) {
    if (key in input) update[key] = (input as Record<string, unknown>)[key];
  }
  if (Object.keys(update).length === 0) {
    throw new HttpError(400, "No editable fields supplied");
  }

  // Validate scheduled_start < scheduled_end against the merged (post-update) values.
  const nextStart = "scheduled_start" in input ? input.scheduled_start : existing.scheduled_start;
  const nextEnd = "scheduled_end" in input ? input.scheduled_end : existing.scheduled_end;
  if (nextStart && nextEnd && new Date(nextStart as string) >= new Date(nextEnd as string)) {
    throw new HttpError(400, "scheduled_start must be before scheduled_end");
  }

  // Assignment changes ripple into status (status itself is otherwise owned by
  // transition-job):
  //   • assigning a tech to a still-`created` job promotes it to scheduled
  //   • clearing the tech (technician_id: null) returns the job to the `created`
  //     backlog and drops its schedule, so it doesn't orphan at scheduled/
  //     dispatched with no technician (renders on neither board surface).
  if ("technician_id" in input) {
    if (input.technician_id) {
      const { data: tech, error: techErr } = await db
        .from("technicians")
        .select("id")
        .eq("id", input.technician_id as string)
        .eq("tenant_id", auth.tenantId)
        .maybeSingle();
      if (techErr) throw new HttpError(500, `Technician lookup failed: ${techErr.message}`);
      if (!tech) throw new HttpError(404, "Technician not found in this tenant");

      if (existing.status === "created") {
        update.status = "scheduled";
      }
    } else {
      // Unassigning. The lifecycle trigger allows created from scheduled/dispatched;
      // a job already in the field can't be dropped back to the backlog this way.
      if (existing.status === "scheduled" || existing.status === "dispatched") {
        update.status = "created";
        update.scheduled_start = null;
        update.scheduled_end = null;
      } else if (existing.status !== "created") {
        throw new HttpError(409, `Cannot unassign a job that is ${existing.status}. Change its status first.`);
      }
    }
  }

  const { data: job, error: updErr } = await db
    .from("jobs")
    .update(update)
    .eq("id", input.job_id)
    .eq("tenant_id", auth.tenantId)
    .select("*")
    .single();
  if (updErr) {
    // The status-transition trigger raises check_violation for an illegal move.
    const status = /invalid job status transition/i.test(updErr.message) ? 422 : 500;
    throw new HttpError(status, `Job update failed: ${updErr.message}`);
  }

  return ok(job);
});

if (import.meta.main) {
  Deno.serve(handler);
}
