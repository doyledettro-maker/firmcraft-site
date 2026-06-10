// set_time_off — block out a technician's availability ('Dave is off next
// Friday', 'Sarah's on vacation June 20-22'). Writes a technician_availability
// row of type time_off spanning the whole day(s) in the tenant's timezone,
// then reports how many scheduled jobs now need reassigning.

import { resolveTechnician } from "../lib/resolve.mjs";
import { parseDateRange, dayBoundsUtc } from "../lib/dates.mjs";
import { fmtDate, listNames } from "../lib/format.mjs";

export const definition = {
  name: "set_time_off",
  description:
    "Mark a technician as off / unavailable for a day or date range — 'Dave is off next " +
    "Friday', 'Sarah is on vacation June 20 through 22', 'Mike called in sick today'. " +
    "Reports any scheduled jobs in the window that need reassigning.",
  parameters: {
    type: "object",
    properties: {
      technician: { type: "string", description: "Technician name" },
      date_or_range: { type: "string", description: "Day or range: 'Friday', 'June 20-22', 'next week', 'today'" },
      reason: { type: "string", description: "Optional reason: 'vacation', 'sick', 'training'" },
    },
    required: ["technician", "date_or_range"],
  },
};

export async function run(args, api) {
  const tz = api.tenant.timezone;

  const tech = await resolveTechnician(api, args.technician);
  if (tech.none) {
    const sugg = tech.suggestions?.length ? ` Did you mean ${listNames(tech.suggestions)}?` : "";
    return { ok: false, message: `I couldn't find a technician named ${args.technician}.${sugg}` };
  }
  if (tech.ambiguous) {
    return { ok: false, message: `Which technician did you mean: ${listNames(tech.ambiguous)}?` };
  }

  const range = parseDateRange(args.date_or_range, tz);
  if (!range) {
    return { ok: false, message: `I couldn't understand the date(s) "${args.date_or_range}".` };
  }

  const startsAt = dayBoundsUtc(range.start, tz).start;
  const endsAt = dayBoundsUtc(range.end, tz).end; // exclusive end of the last day

  const rows = await api.rest(`technician_availability?select=id,starts_at,ends_at`, {
    method: "POST",
    body: {
      technician_id: tech.match.id,
      tenant_id: api.tenant.id,
      type: "time_off",
      title: args.reason ?? "Time off (via Hermes)",
      starts_at: startsAt,
      ends_at: endsAt,
      is_all_day: true,
    },
    prefer: "return=representation",
  });

  // Scheduled work caught inside the window.
  const affected = (await api.rest(
    `jobs?technician_id=eq.${tech.match.id}&tenant_id=eq.${api.tenant.id}&deleted_at=is.null` +
      `&status=in.(scheduled,dispatched)&scheduled_start=gte.${startsAt}&scheduled_start=lt.${endsAt}` +
      `&select=id,title,scheduled_start`,
  )) ?? [];

  const whenTxt = range.start === range.end
    ? fmtDate(range.start, tz)
    : `${fmtDate(range.start, tz)} through ${fmtDate(range.end, tz)}`;
  const jobsTxt = affected.length > 0
    ? ` ${tech.match.name} has ${affected.length} scheduled job${affected.length === 1 ? "" : "s"} in that window that need${affected.length === 1 ? "s" : ""} reassigning — want me to find coverage?`
    : ` No scheduled jobs conflict.`;

  return {
    ok: true,
    message: `Done — ${tech.match.name} is off ${whenTxt}${args.reason ? ` (${args.reason})` : ""}.${jobsTxt}`,
    data: {
      availability_id: rows?.[0]?.id ?? null,
      technician: tech.match.name,
      starts_at: startsAt,
      ends_at: endsAt,
      affected_jobs: affected.map((j) => ({ id: j.id, title: j.title, scheduled_start: j.scheduled_start })),
    },
  };
}
