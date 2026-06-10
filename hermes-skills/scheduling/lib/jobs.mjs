// Shared job plumbing for the skills: the embedded select used everywhere,
// "which job do you mean?" identification from a job id or customer+date, and
// the direct-PostgREST status transition (the fallback analog of the
// transition-job Edge Function — the Postgres trigger from migration 007/012
// remains the authority on which moves are legal).

import { ApiError } from "./api.mjs";
import { resolveCustomer } from "./resolve.mjs";
import { dayBoundsUtc, parseDate } from "./dates.mjs";
import { fmtDate, fmtTime, fmtStatus } from "./format.mjs";

// jobs has two FKs to technicians (technician_id, original_tech_id) — the
// embed must name the FK explicitly.
export const JOB_SELECT =
  "id,tenant_id,customer_id,technician_id,job_type_id,title,description,priority,status," +
  "source,scheduled_start,scheduled_end,arrival_window_start,arrival_window_end," +
  "estimated_duration,actual_start,actual_end,address,tech_notes,internal_notes," +
  "parts_used,photos,estimated_revenue,invoice_data,tags,created_at," +
  "customer:customers(id,name,phone,email,address)," +
  "technician:technicians!jobs_technician_id_fkey(id,name)," +
  "job_type:job_types(id,name,category,default_duration)";

export async function getJobById(api, jobId) {
  const rows = await api.rest(
    `jobs?id=eq.${jobId}&tenant_id=eq.${api.tenant.id}&deleted_at=is.null&select=${encodeURIComponent(JOB_SELECT)}`,
  );
  return rows?.[0] ?? null;
}

// Identify a single job from { job_id } or { customer_name (+ date) }.
// Returns { job } on success, or { message } when the caller should relay a
// clarification back to the user.
export async function identifyJob(api, { job_id, customer_name, date }, { activeOnly = true } = {}) {
  const tz = api.tenant.timezone;

  if (job_id) {
    const job = await getJobById(api, job_id);
    if (!job) return { message: `I couldn't find a job with ID ${job_id}.` };
    return { job };
  }

  if (!customer_name) {
    return { message: "I need either a job ID or a customer name (plus optionally a date) to find that job." };
  }

  const cust = await resolveCustomer(api, customer_name);
  if (cust.none) {
    const sugg = cust.suggestions?.length
      ? ` Did you mean ${cust.suggestions.map((c) => c.name).join(", ")}?`
      : "";
    return { message: `I couldn't find a customer named ${customer_name}.${sugg}` };
  }
  if (cust.ambiguous) {
    return {
      message: `I found several customers matching "${customer_name}": ${cust.ambiguous
        .map((c) => c.name)
        .join(", ")}. Which one?`,
    };
  }

  let q =
    `jobs?customer_id=eq.${cust.match.id}&tenant_id=eq.${api.tenant.id}` +
    `&deleted_at=is.null&select=${encodeURIComponent(JOB_SELECT)}&order=scheduled_start.asc.nullslast`;
  if (activeOnly) q += `&status=not.in.(cancelled,completed,invoiced)`;
  if (date) {
    const dateStr = parseDate(date, tz);
    if (!dateStr) return { message: `I couldn't understand the date "${date}".` };
    const { start, end } = dayBoundsUtc(dateStr, tz);
    q += `&scheduled_start=gte.${start}&scheduled_start=lt.${end}`;
  }

  const jobs = await api.rest(q);
  if (!jobs || jobs.length === 0) {
    const when = date ? ` on ${fmtDate(parseDate(date, tz) ?? date, tz)}` : "";
    return { message: `${cust.match.name} has no ${activeOnly ? "open " : ""}jobs${when}.` };
  }
  if (jobs.length > 1) {
    const lines = jobs
      .slice(0, 5)
      .map(
        (j) =>
          `• ${j.title} — ${j.scheduled_start ? `${fmtDate(j.scheduled_start, tz)} ${fmtTime(j.scheduled_start, tz)}` : "unscheduled"} (${fmtStatus(j.status)}, ID ${j.id})`,
      )
      .join("\n");
    return {
      message: `${cust.match.name} has ${jobs.length} matching jobs — which one?\n${lines}`,
    };
  }
  return { job: jobs[0] };
}

// Direct-path status transition: UPDATE jobs.status (the migration 007/012
// trigger validates the move and writes the audit row), then annotate that
// audit row with the actor/reason. Mirrors transition-job's side effects.
export async function transitionJobDirect(api, job, newStatus, { reason, metadata } = {}) {
  const update = { status: newStatus };
  if (newStatus === "in_progress" && !job.actual_start) {
    update.actual_start = new Date().toISOString();
  }
  if (newStatus === "completed") {
    if (!job.actual_start) {
      throw new ApiError(409, "Cannot complete a job that was never started (no actual_start).");
    }
    update.actual_end = new Date().toISOString();
  }

  let rows;
  try {
    rows = await api.rest(
      `jobs?id=eq.${job.id}&tenant_id=eq.${api.tenant.id}&select=${encodeURIComponent(JOB_SELECT)}`,
      { method: "PATCH", body: update, prefer: "return=representation" },
    );
  } catch (err) {
    if (/invalid job status transition/i.test(err.message)) {
      throw new ApiError(422, err.message);
    }
    throw err;
  }
  const updated = rows?.[0];
  if (!updated) throw new ApiError(404, "Job not found during transition");
  await api.annotateHistory(job.id, newStatus, { reason, metadata });
  return updated;
}

// The forward chain a job must walk to reach in_progress, per the status
// matrix (migration 012).
export const FORWARD_CHAIN = ["created", "scheduled", "dispatched", "en_route", "arrived", "in_progress"];
