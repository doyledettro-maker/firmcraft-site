// create_job — book a new job from natural language: fuzzy-match the customer,
// service type, and (optional) preferred tech; parse the spoken date/time;
// derive the end time from the job type's default duration; check the tech is
// actually free (offering alternatives when not); then create the job via the
// create-job Edge Function or the direct PostgREST equivalent.

import { ewktFromAddress } from "../lib/api.mjs";
import { resolveCustomer, resolveJobType, resolveTechnician } from "../lib/resolve.mjs";
import { parseDate, parseTime, parseDateTime, isoAt } from "../lib/dates.mjs";
import { fmtDate, fmtTime, listNames } from "../lib/format.mjs";

export const definition = {
  name: "create_job",
  description:
    "Book a new job for a customer. Matches the customer, service type, and optional " +
    "preferred technician by name (fuzzy), understands natural dates like 'Thursday', " +
    "'next Tuesday', or 'tomorrow 2pm', and schedules for the job type's default duration. " +
    "If the preferred tech is booked it reports who else is free or alternative times.",
  parameters: {
    type: "object",
    properties: {
      customer_name: { type: "string", description: "Customer name as spoken, e.g. 'Mrs. Johnson' or 'Tom Wilson'" },
      service_type: { type: "string", description: "Service / job type, e.g. 'AC tune-up', 'drain cleaning'" },
      date: { type: "string", description: "Natural-language date: 'Thursday', 'next Tuesday', 'tomorrow', 'June 18'" },
      time: { type: "string", description: "Time of day: '2pm', '10:30am', 'morning'. May be omitted if included in date" },
      preferred_tech: { type: "string", description: "Optional preferred technician name" },
      priority: { type: "string", enum: ["emergency", "urgent", "standard", "flexible"], description: "Optional priority, default standard" },
      description: { type: "string", description: "Optional job notes / problem description" },
    },
    required: ["customer_name", "service_type", "date"],
  },
};

async function createDirect(api, row) {
  const rows = await api.rest(`jobs?select=*`, {
    method: "POST",
    body: row,
    prefer: "return=representation",
  });
  return rows?.[0];
}

// Does `tech` have a conflicting active job in [start, end)?
async function techConflict(api, techId, startIso, endIso) {
  const rows = await api.rest(
    `jobs?technician_id=eq.${techId}&tenant_id=eq.${api.tenant.id}&deleted_at=is.null` +
      `&status=not.in.(cancelled,completed,invoiced)` +
      `&scheduled_start=lt.${endIso}&scheduled_end=gt.${startIso}` +
      `&select=id,title,scheduled_start,scheduled_end&limit=3`,
  );
  return rows ?? [];
}

// Free techs covering [start, end) on that date, from the availability solver.
async function freeTechsAt(api, dateStr, durationMin, jobTypeId, startIso, endIso) {
  const slots = await api.rpc("check_availability", {
    p_tenant: api.tenant.id,
    p_date: dateStr,
    p_duration_minutes: durationMin,
    p_job_type: jobTypeId ?? null,
    p_zone: null,
  });
  const covers = [];
  const otherSlots = [];
  for (const t of slots ?? []) {
    const fits = (t.available_slots ?? []).some(
      (s) => s.start <= startIso && s.end >= endIso,
    );
    if (fits) covers.push(t);
    else if ((t.available_slots ?? []).length > 0) otherSlots.push(t);
  }
  return { covers, otherSlots };
}

export async function run(args, api) {
  const tz = api.tenant.timezone;

  // --- resolve entities -----------------------------------------------------
  const cust = await resolveCustomer(api, args.customer_name);
  if (cust.none) {
    const sugg = cust.suggestions?.length ? ` Did you mean ${listNames(cust.suggestions)}?` : "";
    return {
      ok: false,
      message: `I couldn't find a customer named ${args.customer_name}.${sugg} Or should I create a new customer?`,
    };
  }
  if (cust.ambiguous) {
    return {
      ok: false,
      message: `I found several customers matching "${args.customer_name}": ${listNames(cust.ambiguous)}. Which one?`,
    };
  }
  const customer = cust.match;

  const jt = await resolveJobType(api, args.service_type);
  if (jt.none || jt.ambiguous) {
    const all = await api.rest(
      `job_types?select=name&tenant_id=eq.${api.tenant.id}&is_active=is.true&order=name`,
    );
    return {
      ok: false,
      message: `I couldn't match the service "${args.service_type}". Available job types: ${listNames(all ?? [])}.`,
    };
  }
  const jobType = jt.match;

  let technician = null;
  if (args.preferred_tech) {
    const tech = await resolveTechnician(api, args.preferred_tech);
    if (tech.none) {
      const sugg = tech.suggestions?.length ? ` Did you mean ${listNames(tech.suggestions)}?` : "";
      return { ok: false, message: `I couldn't find a technician named ${args.preferred_tech}.${sugg}` };
    }
    if (tech.ambiguous) {
      return { ok: false, message: `Which technician did you mean: ${listNames(tech.ambiguous)}?` };
    }
    technician = tech.match;
  }

  // --- parse when -----------------------------------------------------------
  let dateStr = parseDate(args.date, tz);
  let timeStr = args.time ? parseTime(args.time) : null;
  if (!dateStr) {
    const combo = parseDateTime(args.date, tz);
    dateStr = combo.date;
    timeStr = timeStr ?? combo.time;
  }
  if (!dateStr) return { ok: false, message: `I couldn't understand the date "${args.date}".` };
  if (!timeStr) {
    return {
      ok: false,
      message: `What time on ${fmtDate(dateStr, tz)} should I book the ${jobType.name} for ${customer.name}?`,
    };
  }

  const duration = jobType.default_duration ?? 60;
  const startIso = isoAt(dateStr, timeStr, tz);
  const endIso = new Date(new Date(startIso).getTime() + duration * 60_000).toISOString();

  // --- availability ---------------------------------------------------------
  if (technician) {
    const conflicts = await techConflict(api, technician.id, startIso, endIso);
    if (conflicts.length > 0) {
      const { covers, otherSlots } = await freeTechsAt(api, dateStr, duration, jobType.id, startIso, endIso);
      const alts = covers.filter((t) => t.tech_id !== technician.id);
      let msg = `${technician.name} is booked at ${fmtTime(startIso, tz)} on ${fmtDate(dateStr, tz)} (${conflicts[0].title}).`;
      if (alts.length > 0) {
        msg += ` ${alts.map((t) => t.tech_name).join(" or ")} ${alts.length === 1 ? "is" : "are"} available at that time.`;
      }
      const mySlots = otherSlots.find((t) => t.tech_id === technician.id) ??
        covers.find((t) => t.tech_id === technician.id);
      if (mySlots?.available_slots?.length) {
        const s = mySlots.available_slots[0];
        msg += ` Or ${technician.name} is free ${fmtTime(s.start, tz)}–${fmtTime(s.end, tz)}.`;
      }
      msg += " What would you prefer?";
      return { ok: false, message: msg };
    }
  } else {
    // no preference — pick the first tech free for the whole window
    const { covers } = await freeTechsAt(api, dateStr, duration, jobType.id, startIso, endIso);
    if (covers.length > 0) {
      technician = { id: covers[0].tech_id, name: covers[0].tech_name };
    }
  }

  // --- create ---------------------------------------------------------------
  const title = jobType.name;
  const payload = {
    customer_id: customer.id,
    job_type_id: jobType.id,
    title,
    description: args.description ?? undefined,
    priority: args.priority ?? "standard",
    scheduled_start: startIso,
    scheduled_end: endIso,
    technician_id: technician?.id ?? undefined,
    source: "hermes",
  };

  const job = await api.edge("create-job", payload, () =>
    createDirect(api, {
      tenant_id: api.tenant.id,
      customer_id: customer.id,
      job_type_id: jobType.id,
      technician_id: technician?.id ?? null,
      title,
      description: args.description ?? null,
      priority: args.priority ?? "standard",
      status: technician ? "scheduled" : "created",
      source: "hermes",
      scheduled_start: startIso,
      scheduled_end: endIso,
      estimated_duration: duration,
      estimated_revenue: jobType.estimated_revenue ?? null,
      address: customer.address ?? null,
      location: ewktFromAddress(customer.address),
    }),
  );

  const when = `${fmtDate(dateStr, tz)} at ${fmtTime(startIso, tz)}`;
  const message = technician
    ? `Booked ${jobType.name} for ${customer.name} on ${when}. Assigned to ${technician.name}.`
    : `Booked ${jobType.name} for ${customer.name} on ${when}. No technician was free for that slot — it's unassigned; want me to find another time?`;

  return {
    ok: true,
    message,
    data: { job_id: job.id, status: job.status, scheduled_start: job.scheduled_start, technician: technician?.name ?? null },
  };
}
