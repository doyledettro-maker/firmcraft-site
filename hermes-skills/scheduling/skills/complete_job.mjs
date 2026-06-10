// complete_job — dispatcher/owner path to mark a job done (techs normally
// complete from the mobile app). If the tech never advanced the status, the
// skill walks the job forward through the legal chain (scheduled → dispatched
// → en_route → arrived → in_progress) with an audit note on each hop, then
// completes it — assembling the same §6.3 invoice_data package complete-job
// builds, so Phase 4 invoicing sees no difference.

import { ApiError } from "../lib/api.mjs";
import { identifyJob, transitionJobDirect, getJobById, FORWARD_CHAIN } from "../lib/jobs.mjs";
import { fmtDuration, fmtDateTime } from "../lib/format.mjs";

export const definition = {
  name: "complete_job",
  description:
    "Mark a job as completed, with optional closing notes and parts used. For dispatcher/" +
    "owner use — 'Dave finished the furnace install', 'mark the Johnson job complete'. " +
    "If the job's status was never advanced by the tech, it is walked through the " +
    "lifecycle automatically. ALWAYS call once without confirm to preview, then with " +
    "confirm=true after the user approves.",
  parameters: {
    type: "object",
    properties: {
      job_id: { type: "string", description: "Job UUID, if known" },
      customer_name: { type: "string", description: "Customer name to find the job by" },
      date: { type: "string", description: "Date of the job, e.g. 'today'" },
      notes: { type: "string", description: "Optional completion notes" },
      parts_used: {
        type: "array",
        description: "Optional parts used, e.g. [{\"name\": \"capacitor\", \"qty\": 1, \"cost\": 24.5}] or plain strings",
        items: {},
      },
      confirm: { type: "boolean", description: "true = execute. Omit/false = preview and ask the user" },
    },
    required: [],
  },
};

function normalizeParts(parts) {
  return (parts ?? []).map((p) => {
    if (typeof p === "string") return { name: p, qty: 1, cost: 0, price: 0 };
    const cost = typeof p.cost === "number" ? p.cost : 0;
    return {
      name: p.name ?? p.part_name ?? "Part",
      qty: p.qty ?? p.quantity ?? 1,
      cost,
      price: typeof p.price === "number" ? p.price : cost,
    };
  });
}

// Direct-path equivalent of the complete-job Edge Function: persist completion
// fields + invoice_data, then transition in_progress → completed.
async function completeDirect(api, job, { notes, parts }) {
  const fresh = await getJobById(api, job.id);
  if (!fresh.actual_start) throw new ApiError(409, "Job has no actual_start; cannot compute labor");

  const tech = fresh.technician_id
    ? (await api.rest(`technicians?id=eq.${fresh.technician_id}&select=id,name,hourly_rate`))?.[0]
    : null;

  const completedAt = new Date();
  const actualEnd = completedAt.toISOString();
  const partsNorm = parts.length > 0 ? parts : normalizeParts(fresh.parts_used);
  const photos = fresh.photos ?? [];

  const hours = Math.round(((completedAt.getTime() - new Date(fresh.actual_start).getTime()) / 3_600_000) * 100) / 100;
  const rate = typeof tech?.hourly_rate === "number" ? tech.hourly_rate : null;

  // travel time from the en_route → arrived audit gap, when both exist
  const hist = (await api.rest(
    `job_status_history?job_id=eq.${job.id}&new_status=in.(en_route,arrived)&select=new_status,created_at&order=created_at.asc`,
  )) ?? [];
  const enRoute = hist.find((r) => r.new_status === "en_route");
  const arrived = hist.find((r) => r.new_status === "arrived");
  const travelMs = enRoute && arrived ? new Date(arrived.created_at) - new Date(enRoute.created_at) : 0;
  const travel = travelMs > 0 ? Math.round(travelMs / 60_000) : null;

  const invoiceData = {
    job_id: fresh.id,
    tenant_id: fresh.tenant_id,
    customer: {
      id: fresh.customer?.id ?? null,
      name: fresh.customer?.name ?? null,
      email: fresh.customer?.email ?? null,
      phone: fresh.customer?.phone ?? null,
      address: fresh.customer?.address ?? null,
    },
    job_type: fresh.job_type ? { name: fresh.job_type.name ?? null, category: fresh.job_type.category ?? null } : null,
    services: fresh.job_type
      ? [{ name: fresh.job_type.name ?? "Service", flat_rate: fresh.estimated_revenue ?? null }]
      : [],
    parts: partsNorm,
    labor: {
      actual_start: fresh.actual_start,
      actual_end: actualEnd,
      hours,
      rate,
      total: rate !== null ? Math.round(hours * rate * 100) / 100 : null,
    },
    travel_time_minutes: travel,
    photos,
    signature_url: null,
    completed_at: actualEnd,
  };

  const fieldUpdate = {
    actual_end: actualEnd,
    parts_used: partsNorm,
    photos,
    invoice_data: invoiceData,
  };
  if (notes !== undefined) fieldUpdate.tech_notes = notes;

  await api.rest(`jobs?id=eq.${job.id}&tenant_id=eq.${api.tenant.id}`, {
    method: "PATCH",
    body: fieldUpdate,
  });

  const completed = await transitionJobDirect(api, { ...fresh, actual_start: fresh.actual_start }, "completed", {
    reason: "completed via Hermes",
  });
  return { job: completed, invoice_data: invoiceData };
}

export async function run(args, api) {
  const tz = api.tenant.timezone;

  const found = await identifyJob(api, args);
  if (!found.job) return { ok: false, message: found.message };
  let job = found.job;

  if (job.status === "completed" || job.status === "invoiced") {
    return { ok: false, message: `That job is already ${job.status}.` };
  }
  if (job.status === "cancelled") {
    return { ok: false, message: "That job was cancelled — it can't be completed." };
  }
  if (job.status === "created") {
    return {
      ok: false,
      message: `The ${job.title} for ${job.customer?.name ?? "?"} was never scheduled or assigned. Schedule it first, or cancel it if the work didn't happen.`,
    };
  }

  const chainStart = FORWARD_CHAIN.indexOf(job.status);
  const hops = FORWARD_CHAIN.slice(chainStart + 1);
  const summary = `${job.title} for ${job.customer?.name ?? "unknown customer"}${job.technician?.name ? ` (${job.technician.name})` : ""}`;

  if (!args.confirm) {
    const walk = hops.length > 0
      ? ` The tech never updated the status (currently ${job.status}), so I'll advance it through the normal lifecycle first.`
      : "";
    return {
      ok: true,
      needs_confirmation: true,
      message: `Mark the ${summary} as complete${args.parts_used?.length ? ` with ${args.parts_used.length} part(s) logged` : ""}?${walk}`,
      data: { job_id: job.id },
    };
  }

  // Walk the job forward to in_progress when the tech didn't.
  for (const status of hops) {
    if (status === "in_progress") {
      // backdate the clock to the scheduled start when it's in the past, so
      // labor hours don't read as zero
      const start = job.scheduled_start && new Date(job.scheduled_start) < new Date()
        ? job.scheduled_start
        : new Date().toISOString();
      await api.rest(`jobs?id=eq.${job.id}&tenant_id=eq.${api.tenant.id}`, {
        method: "PATCH",
        body: { actual_start: start },
      });
      job.actual_start = start;
    }
    job = await api.edge(
      "transition-job",
      { job_id: job.id, new_status: status, reason: "auto-advanced by Hermes complete_job" },
      () => transitionJobDirect(api, job, status, { reason: "auto-advanced by Hermes complete_job" }),
    );
    if (job.job) job = job.job; // edge returns { job, transition }
  }

  const parts = normalizeParts(args.parts_used);
  const result = await api.edge(
    "complete-job",
    {
      job_id: job.id,
      ...(args.notes !== undefined ? { tech_notes: args.notes } : {}),
      ...(parts.length > 0 ? { parts_used: parts } : {}),
    },
    () => completeDirect(api, job, { notes: args.notes, parts }),
  );

  const labor = result.invoice_data?.labor;
  const durationTxt = labor?.hours !== undefined ? ` Duration: ${fmtDuration(labor.hours * 60)}.` : "";
  return {
    ok: true,
    message: `Marked the ${summary} as complete.${durationTxt}${parts.length ? ` Logged ${parts.length} part(s).` : ""} Invoice data is ready for billing.`,
    data: {
      job_id: job.id,
      status: "completed",
      completed_at: result.invoice_data?.completed_at ?? null,
      labor_hours: labor?.hours ?? null,
    },
  };
}
