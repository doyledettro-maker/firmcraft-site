// get_job — full detail on one job: customer, address, type, tech, status,
// notes, and the status history trail.

import { identifyJob } from "../lib/jobs.mjs";
import { fmtDateTime, fmtTime, fmtAddress, fmtStatus, fmtDuration } from "../lib/format.mjs";

export const definition = {
  name: "get_job",
  description:
    "Look up the details of one job — customer, address, job type, technician, status, " +
    "schedule, notes, and history. Identify the job by its ID, or by customer name " +
    "(optionally plus a date when the customer has several jobs).",
  parameters: {
    type: "object",
    properties: {
      job_id: { type: "string", description: "Job UUID, if known" },
      customer_name: { type: "string", description: "Customer name, when no job ID is at hand" },
      date: { type: "string", description: "Optional date to disambiguate, e.g. 'tomorrow', 'June 18'" },
    },
    required: [],
  },
};

export async function run(args, api) {
  const tz = api.tenant.timezone;

  const found = await identifyJob(api, args, { activeOnly: false });
  if (!found.job) return { ok: false, message: found.message };
  const job = found.job;

  const history = (await api.rest(
    `job_status_history?job_id=eq.${job.id}&select=previous_status,new_status,changed_by,reason,created_at&order=created_at.asc`,
  )) ?? [];

  const lines = [
    `${job.title} — ${fmtStatus(job.status)} (${job.priority})`,
    `Customer: ${job.customer?.name ?? "unknown"}${job.customer?.phone ? `, ${job.customer.phone}` : ""}`,
    `Address: ${fmtAddress(job.address)}`,
    `Type: ${job.job_type?.name ?? "—"}${job.estimated_duration ? ` (~${fmtDuration(job.estimated_duration)})` : ""}`,
    `Technician: ${job.technician?.name ?? "unassigned"}`,
    `Scheduled: ${job.scheduled_start ? `${fmtDateTime(job.scheduled_start, tz)}${job.scheduled_end ? `–${fmtTime(job.scheduled_end, tz)}` : ""}` : "not scheduled"}`,
  ];
  if (job.description) lines.push(`Description: ${job.description}`);
  if (job.tech_notes) lines.push(`Tech notes: ${job.tech_notes}`);
  if (job.internal_notes) lines.push(`Office notes: ${job.internal_notes}`);
  if (history.length > 0) {
    lines.push(
      `History: ${history
        .map((h) => `${fmtStatus(h.new_status)} (${fmtDateTime(h.created_at, tz)})`)
        .join(" → ")}`,
    );
  }
  lines.push(`Job ID: ${job.id}`);

  return {
    ok: true,
    message: lines.join("\n"),
    data: {
      job: {
        id: job.id,
        title: job.title,
        status: job.status,
        priority: job.priority,
        customer: job.customer?.name ?? null,
        technician: job.technician?.name ?? null,
        scheduled_start: job.scheduled_start,
        scheduled_end: job.scheduled_end,
      },
      history,
    },
  };
}
