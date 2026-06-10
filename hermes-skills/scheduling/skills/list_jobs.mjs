// list_jobs — the day's schedule, optionally filtered by technician or status.

import { resolveTechnician } from "../lib/resolve.mjs";
import { parseDate, dayBoundsUtc } from "../lib/dates.mjs";
import { fmtDate, fmtJobLine, listNames } from "../lib/format.mjs";
import { JOB_SELECT } from "../lib/jobs.mjs";

const STATUSES = [
  "created", "scheduled", "dispatched", "en_route", "arrived",
  "in_progress", "completed", "invoiced", "cancelled", "on_hold",
];

export const definition = {
  name: "list_jobs",
  description:
    "List jobs for a day, ordered by start time. Defaults to today; can filter by " +
    "technician and/or status. Use for 'what's on the schedule tomorrow', " +
    "'what does Dave have Friday', 'any unassigned jobs today'.",
  parameters: {
    type: "object",
    properties: {
      date: { type: "string", description: "Day to list: 'today' (default), 'tomorrow', a weekday, or a date" },
      technician: { type: "string", description: "Optional technician name filter" },
      status: { type: "string", enum: STATUSES, description: "Optional status filter" },
    },
    required: [],
  },
};

export async function run(args, api) {
  const tz = api.tenant.timezone;

  const dateStr = parseDate(args.date ?? "today", tz);
  if (!dateStr) return { ok: false, message: `I couldn't understand the date "${args.date}".` };
  const { start, end } = dayBoundsUtc(dateStr, tz);

  let q =
    `jobs?tenant_id=eq.${api.tenant.id}&deleted_at=is.null` +
    `&scheduled_start=gte.${start}&scheduled_start=lt.${end}` +
    `&select=${encodeURIComponent(JOB_SELECT)}&order=scheduled_start.asc`;

  let techLabel = "";
  if (args.technician) {
    const tech = await resolveTechnician(api, args.technician);
    if (tech.none) {
      const sugg = tech.suggestions?.length ? ` Did you mean ${listNames(tech.suggestions)}?` : "";
      return { ok: false, message: `I couldn't find a technician named ${args.technician}.${sugg}` };
    }
    if (tech.ambiguous) {
      return { ok: false, message: `Which technician did you mean: ${listNames(tech.ambiguous)}?` };
    }
    q += `&technician_id=eq.${tech.match.id}`;
    techLabel = ` for ${tech.match.name}`;
  }
  if (args.status) q += `&status=eq.${args.status}`;
  else q += `&status=neq.cancelled`;

  const jobs = (await api.rest(q)) ?? [];
  const day = fmtDate(dateStr, tz);

  if (jobs.length === 0) {
    return {
      ok: true,
      message: `Nothing on the schedule${techLabel} for ${day}${args.status ? ` with status ${args.status}` : ""}.`,
      data: { date: dateStr, jobs: [] },
    };
  }

  const lines = jobs.map((j) => fmtJobLine(j, tz)).join("\n");
  return {
    ok: true,
    message: `${day}${techLabel} (${jobs.length} job${jobs.length === 1 ? "" : "s"}):\n${lines}`,
    data: {
      date: dateStr,
      jobs: jobs.map((j) => ({
        id: j.id,
        title: j.title,
        status: j.status,
        scheduled_start: j.scheduled_start,
        customer: j.customer?.name ?? null,
        technician: j.technician?.name ?? null,
      })),
    },
  };
}
