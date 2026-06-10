// Natural-language formatting for skill responses — everything rendered in the
// tenant's timezone.

import { utcToZoned } from "./dates.mjs";

const WEEKDAY_FULL = {
  Sun: "Sunday", Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday",
  Thu: "Thursday", Fri: "Friday", Sat: "Saturday",
};
const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June", "July",
  "August", "September", "October", "November", "December",
];

// '8:00am'
export function fmtTime(isoOrDate, tz) {
  if (!isoOrDate) return "unscheduled";
  const { hh, mm } = utcToZoned(new Date(isoOrDate), tz);
  const mer = hh >= 12 ? "pm" : "am";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${String(mm).padStart(2, "0")}${mer}`;
}

// 'Tuesday, June 16'
export function fmtDate(isoOrDateStr, tz) {
  if (!isoOrDateStr) return "unscheduled";
  let date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoOrDateStr)) {
    // calendar date — interpret as that tz-local day (noon avoids edge wobble)
    const [y, m, d] = isoOrDateStr.split("-").map(Number);
    const wd = WEEKDAY_FULL[
      new Date(Date.UTC(y, m - 1, d, 12)).toLocaleString("en-US", { weekday: "short", timeZone: "UTC" })
    ];
    return `${wd}, ${MONTH_NAMES[m]} ${d}`;
  }
  date = new Date(isoOrDateStr);
  const z = utcToZoned(date, tz);
  return `${WEEKDAY_FULL[z.weekday]}, ${MONTH_NAMES[z.m]} ${z.d}`;
}

// 'Tuesday, June 16 at 2:00pm'
export function fmtDateTime(iso, tz) {
  if (!iso) return "unscheduled";
  return `${fmtDate(iso, tz)} at ${fmtTime(iso, tz)}`;
}

// '123 Oak St, Houston'
export function fmtAddress(addr) {
  if (!addr || typeof addr !== "object") return "no address on file";
  const parts = [addr.street, addr.city].filter(Boolean);
  return parts.length ? parts.join(", ") : "no address on file";
}

// '1h 45m'
export function fmtDuration(minutes) {
  if (minutes === null || minutes === undefined || !Number.isFinite(minutes)) return "unknown";
  const m = Math.round(minutes);
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h === 0) return `${rem}m`;
  if (rem === 0) return `${h}h`;
  return `${h}h ${rem}m`;
}

export function fmtStatus(status) {
  return String(status || "").replace(/_/g, " ");
}

// One job as a schedule line: '8:00am — AC Tune-Up at 123 Oak St (Dave Martinez)'
export function fmtJobLine(job, tz) {
  const time = job.scheduled_start ? fmtTime(job.scheduled_start, tz) : "unscheduled";
  const tech = job.technician?.name ? ` (${job.technician.name})` : " (unassigned)";
  const extra = ["scheduled", "dispatched"].includes(job.status) ? "" : ` — ${fmtStatus(job.status)}`;
  return `${time} — ${job.title} at ${fmtAddress(job.address)}${tech}${extra}`;
}

export function listNames(rows) {
  return rows.map((r) => r.name).join(", ");
}
