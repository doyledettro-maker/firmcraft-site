// update_job — reschedule, reassign, or edit a job. Two-step: called without
// confirm=true it returns a preview of the change for the dispatcher to
// approve; with confirm=true it executes (via the update-job Edge Function or
// the direct PostgREST equivalent — the created→scheduled promotion and the
// status-transition trigger behave identically on both paths).

import { resolveTechnician } from "../lib/resolve.mjs";
import { identifyJob, JOB_SELECT } from "../lib/jobs.mjs";
import { parseDate, parseTime, parseDateTime, isoAt, utcToZoned } from "../lib/dates.mjs";
import { fmtDateTime, listNames } from "../lib/format.mjs";

export const definition = {
  name: "update_job",
  description:
    "Modify an existing job: move it to a new date/time, assign or change the technician, " +
    "change priority, or update notes. 'Move the Johnson job to Wednesday', 'Assign Mike " +
    "to the 3pm at Oak St'. ALWAYS call once without confirm to show the user what will " +
    "change, then again with confirm=true after they approve.",
  parameters: {
    type: "object",
    properties: {
      job_id: { type: "string", description: "Job UUID, if known" },
      customer_name: { type: "string", description: "Customer name to find the job by, when no ID" },
      date: { type: "string", description: "Date the job is currently on (helps find it)" },
      new_date: { type: "string", description: "New date, e.g. 'Wednesday', 'June 20'" },
      new_time: { type: "string", description: "New time, e.g. '2pm'. Omit to keep the current time of day" },
      technician: { type: "string", description: "Technician to (re)assign" },
      priority: { type: "string", enum: ["emergency", "urgent", "standard", "flexible"] },
      description: { type: "string", description: "Replace the job description" },
      internal_notes: { type: "string", description: "Office/dispatcher notes to set" },
      confirm: { type: "boolean", description: "true = execute. Omit/false = preview the change and ask the user" },
    },
    required: [],
  },
};

async function updateDirect(api, jobId, update) {
  const rows = await api.rest(
    `jobs?id=eq.${jobId}&tenant_id=eq.${api.tenant.id}&select=${encodeURIComponent(JOB_SELECT)}`,
    { method: "PATCH", body: update, prefer: "return=representation" },
  );
  return rows?.[0];
}

export async function run(args, api) {
  const tz = api.tenant.timezone;

  const found = await identifyJob(api, args);
  if (!found.job) return { ok: false, message: found.message };
  const job = found.job;

  const update = {};
  const changes = [];

  // --- reschedule -----------------------------------------------------------
  if (args.new_date || args.new_time) {
    let dateStr = args.new_date ? parseDate(args.new_date, tz) : null;
    let timeStr = args.new_time ? parseTime(args.new_time) : null;
    if (args.new_date && !dateStr) {
      const combo = parseDateTime(args.new_date, tz);
      dateStr = combo.date;
      timeStr = timeStr ?? combo.time;
    }
    if (args.new_date && !dateStr) {
      return { ok: false, message: `I couldn't understand the new date "${args.new_date}".` };
    }
    if (args.new_time && !timeStr) {
      return { ok: false, message: `I couldn't understand the new time "${args.new_time}".` };
    }

    const cur = job.scheduled_start ? utcToZoned(new Date(job.scheduled_start), tz) : null;
    if (!dateStr) {
      if (!cur) return { ok: false, message: "The job has no current date — give me a new_date too." };
      dateStr = `${cur.y}-${String(cur.m).padStart(2, "0")}-${String(cur.d).padStart(2, "0")}`;
    }
    if (!timeStr) {
      if (!cur) return { ok: false, message: "The job has no current time — give me a new_time too." };
      timeStr = `${String(cur.hh).padStart(2, "0")}:${String(cur.mm).padStart(2, "0")}`;
    }

    const startIso = isoAt(dateStr, timeStr, tz);
    const durMin = job.scheduled_start && job.scheduled_end
      ? (new Date(job.scheduled_end) - new Date(job.scheduled_start)) / 60_000
      : job.estimated_duration ?? 60;
    update.scheduled_start = startIso;
    update.scheduled_end = new Date(new Date(startIso).getTime() + durMin * 60_000).toISOString();
    changes.push(
      `move it from ${job.scheduled_start ? fmtDateTime(job.scheduled_start, tz) : "unscheduled"} to ${fmtDateTime(startIso, tz)}`,
    );
  }

  // --- reassign ---------------------------------------------------------------
  let newTech = null;
  if (args.technician) {
    const tech = await resolveTechnician(api, args.technician);
    if (tech.none) {
      const sugg = tech.suggestions?.length ? ` Did you mean ${listNames(tech.suggestions)}?` : "";
      return { ok: false, message: `I couldn't find a technician named ${args.technician}.${sugg}` };
    }
    if (tech.ambiguous) {
      return { ok: false, message: `Which technician did you mean: ${listNames(tech.ambiguous)}?` };
    }
    newTech = tech.match;
    if (newTech.id !== job.technician_id) {
      update.technician_id = newTech.id;
      changes.push(
        `assign ${newTech.name}${job.technician?.name ? ` (currently ${job.technician.name})` : ""}`,
      );
    }
  }

  if (args.priority && args.priority !== job.priority) {
    update.priority = args.priority;
    changes.push(`set priority to ${args.priority}`);
  }
  if (args.description !== undefined) {
    update.description = args.description;
    changes.push("update the description");
  }
  if (args.internal_notes !== undefined) {
    update.internal_notes = args.internal_notes;
    changes.push("update the office notes");
  }

  if (Object.keys(update).length === 0) {
    return { ok: false, message: "Nothing to change — tell me a new time, technician, priority, or notes." };
  }

  const summary = `${job.title} for ${job.customer?.name ?? "unknown customer"}`;

  if (!args.confirm) {
    return {
      ok: true,
      needs_confirmation: true,
      message: `I'll ${changes.join(", and ")} on the ${summary}. Confirm?`,
      data: { job_id: job.id, proposed: update },
    };
  }

  // created → scheduled promotion when assigning a tech (same rule as update-job)
  if (update.technician_id && job.status === "created") update.status = "scheduled";

  const updated = await api.edge(
    "update-job",
    { job_id: job.id, ...Object.fromEntries(Object.entries(update).filter(([k]) => k !== "status")) },
    () => updateDirect(api, job.id, update),
  );

  return {
    ok: true,
    message: `Done — ${changes.join(", and ")} on the ${summary}.`,
    data: { job_id: updated.id, status: updated.status, scheduled_start: updated.scheduled_start, technician_id: updated.technician_id },
  };
}
