// cancel_job — cancel a job (with confirmation). The status trigger permits
// cancellation from any pre-completion state; the freed slot is reported back.

import { identifyJob, transitionJobDirect } from "../lib/jobs.mjs";
import { fmtDateTime, fmtAddress } from "../lib/format.mjs";

export const definition = {
  name: "cancel_job",
  description:
    "Cancel a job, with an optional reason ('customer called to cancel'). Identify the job " +
    "by ID or customer name + date. ALWAYS call once without confirm to show what will be " +
    "cancelled, then again with confirm=true after the user approves.",
  parameters: {
    type: "object",
    properties: {
      job_id: { type: "string", description: "Job UUID, if known" },
      customer_name: { type: "string", description: "Customer name to find the job by" },
      date: { type: "string", description: "Date of the job, e.g. 'today', 'Thursday'" },
      reason: { type: "string", description: "Optional cancellation reason for the record" },
      confirm: { type: "boolean", description: "true = execute. Omit/false = preview and ask the user" },
    },
    required: [],
  },
};

export async function run(args, api) {
  const tz = api.tenant.timezone;

  const found = await identifyJob(api, args);
  if (!found.job) return { ok: false, message: found.message };
  const job = found.job;

  if (["cancelled", "completed", "invoiced"].includes(job.status)) {
    return { ok: false, message: `That job is already ${job.status}.` };
  }

  const when = job.scheduled_start ? fmtDateTime(job.scheduled_start, tz) : "unscheduled";
  const summary = `${job.title} for ${job.customer?.name ?? "unknown customer"} (${when}${job.technician?.name ? `, ${job.technician.name}` : ""})`;

  if (!args.confirm) {
    return {
      ok: true,
      needs_confirmation: true,
      message: `Cancel the ${summary}${args.reason ? ` — reason: ${args.reason}` : ""}? This frees the slot.`,
      data: { job_id: job.id },
    };
  }

  await api.edge(
    "transition-job",
    { job_id: job.id, new_status: "cancelled", reason: args.reason },
    () =>
      transitionJobDirect(api, job, "cancelled", {
        reason: args.reason,
        metadata: args.reason ? { cancellation_reason: args.reason } : undefined,
      }),
  );

  const slot = job.scheduled_start
    ? ` The ${fmtDateTime(job.scheduled_start, tz)} slot${job.technician?.name ? ` on ${job.technician.name}'s schedule` : ""} is now open.`
    : "";
  return {
    ok: true,
    message: `Cancelled the ${job.title} at ${fmtAddress(job.address)}.${slot}`,
    data: { job_id: job.id, status: "cancelled" },
  };
}
