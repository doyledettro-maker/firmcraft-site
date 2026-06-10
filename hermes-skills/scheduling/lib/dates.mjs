// Natural-language date/time parsing and timezone math for the scheduling
// skills. All wall-clock interpretation happens in the TENANT's timezone
// (tenants.timezone), never the server's — the dispatcher says "Thursday 2pm"
// meaning their shop's clock.
//
// No dependencies: zone offsets come from Intl.DateTimeFormat via the standard
// two-pass offset trick (correct across DST transitions).

const DAY_MS = 24 * 60 * 60 * 1000;

const WEEKDAYS = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

const MONTHS = {
  january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3, april: 4, apr: 4,
  may: 5, june: 6, jun: 6, july: 7, jul: 7, august: 8, aug: 8,
  september: 9, sep: 9, sept: 9, october: 10, oct: 10,
  november: 11, nov: 11, december: 12, dec: 12,
};

const WORD_TIMES = {
  noon: "12:00", midday: "12:00", midnight: "00:00",
  morning: "09:00", afternoon: "13:00", evening: "17:00",
  "first thing": "08:00", eod: "16:00",
};

// Offset of `tz` from UTC (ms) at the given UTC instant.
function tzOffsetMs(utcDate, tz) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const p = Object.fromEntries(dtf.formatToParts(utcDate).map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  return asUtc - utcDate.getTime();
}

// A wall-clock (y, m, d, hh, mm) in `tz` → UTC Date.
export function zonedToUtc(y, m, d, hh, mm, tz) {
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let t = guess - tzOffsetMs(new Date(guess), tz);
  const off = tzOffsetMs(new Date(t), tz);
  if (guess - off !== t) t = guess - off;
  return new Date(t);
}

// UTC Date → wall-clock parts in `tz`.
export function utcToZoned(date, tz) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", weekday: "short",
  });
  const p = Object.fromEntries(dtf.formatToParts(date).map((x) => [x.type, x.value]));
  return {
    y: +p.year, m: +p.month, d: +p.day, hh: +p.hour % 24, mm: +p.minute,
    weekday: p.weekday,
  };
}

// Today's date in `tz` as {y, m, d}.
export function todayInTz(tz, now = new Date()) {
  const { y, m, d } = utcToZoned(now, tz);
  return { y, m, d };
}

function ymdToString({ y, m, d }) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function addDays(ymd, days) {
  const t = Date.UTC(ymd.y, ymd.m - 1, ymd.d) + days * DAY_MS;
  const dt = new Date(t);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

function dowOf(ymd) {
  return new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d)).getUTCDay();
}

// Parse a time-of-day fragment → "HH:MM" or null.
export function parseTime(text) {
  if (!text) return null;
  const t = String(text).trim().toLowerCase().replace(/^at\s+/, "");
  if (WORD_TIMES[t]) return WORD_TIMES[t];
  // 2pm / 2 pm / 2:30pm / 14:30 / 1430? (no — keep to colon forms) / 9a
  const m = t.match(/^(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?|a|p)?$/);
  if (!m) return null;
  let hh = parseInt(m[1], 10);
  const mm = m[2] ? parseInt(m[2], 10) : 0;
  const mer = m[3] ? m[3][0] : null;
  if (mm > 59) return null;
  if (mer === "p" && hh < 12) hh += 12;
  if (mer === "a" && hh === 12) hh = 0;
  if (!mer && hh <= 6) hh += 12; // bare "2" or "3:30" in a scheduling context means afternoon
  if (hh > 23) return null;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

// Parse a natural-language date (no time) → "YYYY-MM-DD" or null.
// Handles: today, tomorrow, day after tomorrow, weekday names ("Thursday" =
// soonest Thursday, today included), "next <weekday>" (= the upcoming one),
// ISO dates, "6/18", "June 18", "18 June".
export function parseDate(text, tz, now = new Date()) {
  if (!text) return null;
  const t = String(text).trim().toLowerCase().replace(/,/g, "").replace(/\s+/g, " ");
  const today = todayInTz(tz, now);

  if (t === "today" || t === "tonight") return ymdToString(today);
  if (t === "tomorrow" || t === "tmrw") return ymdToString(addDays(today, 1));
  if (t === "day after tomorrow") return ymdToString(addDays(today, 2));
  if (t === "yesterday") return ymdToString(addDays(today, -1));

  // ISO
  let m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return t;

  // weekday, with optional this/next prefix
  m = t.match(/^(?:(this|next)\s+)?([a-z]+)$/);
  if (m && WEEKDAYS[m[2]] !== undefined) {
    const target = WEEKDAYS[m[2]];
    let delta = (target - dowOf(today) + 7) % 7;
    // bare "Thursday" / "this Thursday" = soonest occurrence (today counts);
    // "next Thursday" = never today — the upcoming one.
    if (m[1] === "next" && delta === 0) delta = 7;
    return ymdToString(addDays(today, delta));
  }

  // m/d or m/d/yyyy
  m = t.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (m) {
    const mo = +m[1], d = +m[2];
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    let y = m[3] ? +m[3] : today.y;
    if (y < 100) y += 2000;
    let ymd = { y, m: mo, d };
    if (!m[3] && ymdToString(ymd) < ymdToString(today)) ymd = { y: y + 1, m: mo, d };
    return ymdToString(ymd);
  }

  // "June 18" / "June 18th" / "18 June" / "June 18 2026"
  m = t.match(/^([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(\d{4}))?$/);
  let mo = null, d = null, yr = null;
  if (m && MONTHS[m[1]]) {
    mo = MONTHS[m[1]]; d = +m[2]; yr = m[3] ? +m[3] : null;
  } else {
    m = t.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?([a-z]+)(?:\s+(\d{4}))?$/);
    if (m && MONTHS[m[2]]) {
      mo = MONTHS[m[2]]; d = +m[1]; yr = m[3] ? +m[3] : null;
    }
  }
  if (mo) {
    if (d < 1 || d > 31) return null;
    let y = yr ?? today.y;
    let ymd = { y, m: mo, d };
    if (!yr && ymdToString(ymd) < ymdToString(today)) ymd = { y: y + 1, m: mo, d };
    return ymdToString(ymd);
  }

  return null;
}

// Parse a phrase that may carry both a date and a time ("tomorrow 2pm",
// "next tuesday at 10:30am", "friday morning") → { date, time } with either
// side null when absent.
export function parseDateTime(text, tz, now = new Date()) {
  if (!text) return { date: null, time: null };
  const t = String(text).trim();

  // whole thing is just a date or just a time?
  const asDate = parseDate(t, tz, now);
  if (asDate) return { date: asDate, time: null };
  const asTime = parseTime(t);
  if (asTime) return { date: null, time: asTime };

  // split from the right: try progressively longer time suffixes
  const words = t.split(/\s+/);
  for (let i = words.length - 1; i >= 1; i--) {
    const datePart = words.slice(0, i).join(" ").replace(/\s+at$/i, "");
    const timePart = words.slice(i).join(" ");
    const dd = parseDate(datePart, tz, now);
    const tt = parseTime(timePart) ?? WORD_TIMES[timePart.toLowerCase()];
    if (dd && tt) return { date: dd, time: tt };
  }
  return { date: null, time: null };
}

// Parse a date or date range ("Friday", "June 20-22", "Friday through Monday",
// "next week") → { start: "YYYY-MM-DD", end: "YYYY-MM-DD" } inclusive, or null.
export function parseDateRange(text, tz, now = new Date()) {
  if (!text) return null;
  const t = String(text).trim().toLowerCase();
  const today = todayInTz(tz, now);

  if (t === "next week") {
    const delta = ((1 - dowOf(today) + 7) % 7) || 7; // upcoming Monday
    const start = addDays(today, delta);
    return { start: ymdToString(start), end: ymdToString(addDays(start, 6)) };
  }
  if (t === "this week") {
    const monday = addDays(today, -((dowOf(today) + 6) % 7));
    return { start: ymdToString(monday), end: ymdToString(addDays(monday, 6)) };
  }

  // "X - Y" / "X to Y" / "X through Y"
  const m = t.match(/^(.+?)\s*(?:\bto\b|\bthrough\b|\bthru\b|[-–—])\s*(.+)$/);
  if (m) {
    const start = parseDate(m[1].trim(), tz, now);
    let end = parseDate(m[2].trim(), tz, now);
    // "June 20-22": right side may be a bare day number
    if (start && !end && /^\d{1,2}$/.test(m[2].trim())) {
      end = `${start.slice(0, 8)}${String(+m[2].trim()).padStart(2, "0")}`;
    }
    if (start && end && end >= start) return { start, end };
  }

  const single = parseDate(t, tz, now);
  if (single) return { start: single, end: single };
  return null;
}

// Parse "2 hours" / "90 minutes" / "1.5 hr" / "2h30m" / plain number (minutes)
// → integer minutes, or null.
export function parseDuration(text) {
  if (text === null || text === undefined) return null;
  if (typeof text === "number" && Number.isFinite(text)) return Math.round(text);
  const t = String(text).trim().toLowerCase();
  if (/^\d+$/.test(t)) return parseInt(t, 10);
  let m = t.match(/^(\d+(?:\.\d+)?)\s*(hours?|hrs?|h)$/);
  if (m) return Math.round(parseFloat(m[1]) * 60);
  m = t.match(/^(\d+(?:\.\d+)?)\s*(minutes?|mins?|m)$/);
  if (m) return Math.round(parseFloat(m[1]));
  m = t.match(/^(\d+)\s*(?:hours?|hrs?|h)\s*(?:and\s*)?(\d+)\s*(?:minutes?|mins?|m)?$/);
  if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  m = t.match(/^(\d+)h(\d+)m?$/);
  if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  if (t === "half hour" || t === "half an hour") return 30;
  if (t === "an hour" || t === "one hour" || t === "1 hour") return 60;
  return null;
}

// "YYYY-MM-DD" + "HH:MM" in tz → ISO UTC string.
export function isoAt(dateStr, timeStr, tz) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  return zonedToUtc(y, m, d, hh, mm, tz).toISOString();
}

// The UTC [start, end) instant pair covering a tz-local calendar day.
export function dayBoundsUtc(dateStr, tz) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const start = zonedToUtc(y, m, d, 0, 0, tz);
  const next = addDays({ y, m, d }, 1);
  const end = zonedToUtc(next.y, next.m, next.d, 0, 0, tz);
  return { start: start.toISOString(), end: end.toISOString() };
}
