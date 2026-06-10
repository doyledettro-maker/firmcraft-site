// check_availability — open slots per technician for a date + duration, via
// the check-availability Edge Function or the public.check_availability()
// solver directly. Optional filters: a job type (drives the solver's
// required-skills constraint) and/or explicit skill names (filtered here).

import { resolveJobType, resolveSkills } from "../lib/resolve.mjs";
import { parseDate, parseDuration } from "../lib/dates.mjs";
import { fmtDate, fmtTime, fmtDuration, listNames } from "../lib/format.mjs";

export const definition = {
  name: "check_availability",
  description:
    "Find which technicians have an open block on a given day — 'when can we fit in a " +
    "2-hour install next week?', 'who's free Tuesday afternoon?'. Optionally constrain by " +
    "job type (applies its required certifications) or by named skills.",
  parameters: {
    type: "object",
    properties: {
      date: { type: "string", description: "Day to check: 'tomorrow', 'Tuesday', 'June 18'" },
      duration: { type: "string", description: "Needed block, e.g. '2 hours', '90 minutes'. Default 1 hour" },
      job_type: { type: "string", description: "Optional job type name — applies its skill requirements" },
      skills: {
        type: "array", items: { type: "string" },
        description: "Optional skill/certification names the tech must hold, e.g. ['EPA 608']",
      },
    },
    required: ["date"],
  },
};

export async function run(args, api) {
  const tz = api.tenant.timezone;

  const dateStr = parseDate(args.date, tz);
  if (!dateStr) return { ok: false, message: `I couldn't understand the date "${args.date}".` };

  const duration = parseDuration(args.duration ?? 60);
  if (!duration || duration <= 0) {
    return { ok: false, message: `I couldn't understand the duration "${args.duration}".` };
  }

  let jobTypeId = null;
  if (args.job_type) {
    const jt = await resolveJobType(api, args.job_type);
    if (jt.match) jobTypeId = jt.match.id;
    else return { ok: false, message: `I couldn't match the job type "${args.job_type}".` };
  }

  const result = await api.edge(
    "check-availability",
    { date: dateStr, duration_minutes: duration, ...(jobTypeId ? { job_type_id: jobTypeId } : {}) },
    async () => ({
      date: dateStr,
      duration_minutes: duration,
      technicians: await api.rpc("check_availability", {
        p_tenant: api.tenant.id,
        p_date: dateStr,
        p_duration_minutes: duration,
        p_job_type: jobTypeId,
        p_zone: null,
      }),
    }),
  );

  let techs = (result.technicians ?? []).filter((t) => (t.available_slots ?? []).length > 0);

  // Explicit skill-name filter: keep techs holding ALL the named skills.
  if (args.skills?.length) {
    const { matched, missing } = await resolveSkills(api, args.skills);
    if (missing.length > 0) {
      const all = await api.rest(`skills?select=name&tenant_id=eq.${api.tenant.id}&order=name`);
      return {
        ok: false,
        message: `I don't know the skill${missing.length > 1 ? "s" : ""} "${missing.join('", "')}". Defined skills: ${listNames(all ?? [])}.`,
      };
    }
    const skillIds = matched.map((s) => s.id);
    const techIds = techs.map((t) => t.tech_id);
    if (techIds.length > 0) {
      const have = (await api.rest(
        `technician_skills?technician_id=in.(${techIds.join(",")})&skill_id=in.(${skillIds.join(",")})&select=technician_id,skill_id`,
      )) ?? [];
      techs = techs.filter((t) =>
        skillIds.every((sid) => have.some((h) => h.technician_id === t.tech_id && h.skill_id === sid)),
      );
    }
  }

  const day = fmtDate(dateStr, tz);
  if (techs.length === 0) {
    return {
      ok: true,
      message: `Nobody has a ${fmtDuration(duration)} block free on ${day}${args.job_type ? ` for a ${args.job_type}` : ""}. Want me to check another day?`,
      data: { date: dateStr, duration_minutes: duration, technicians: [] },
    };
  }

  const lines = techs.map((t) => {
    const slots = t.available_slots
      .map((s) => `${fmtTime(s.start, tz)}–${fmtTime(s.end, tz)}`)
      .join(", ");
    return `${t.tech_name} (${slots})`;
  });
  const count = ["Zero", "One", "Two", "Three", "Four", "Five"][techs.length] ?? techs.length;
  return {
    ok: true,
    message: `${count} tech${techs.length === 1 ? " is" : "s are"} available on ${day} for ${fmtDuration(duration)}: ${lines.join("; ")}.`,
    data: { date: dateStr, duration_minutes: duration, technicians: techs },
  };
}
