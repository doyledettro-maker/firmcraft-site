// Fuzzy entity resolution: spoken names → rows. The dispatcher says "the
// Johnson job", "Dave", "AC tune up" — we ILIKE-search first, then score
// everything with token-prefix + edit-distance similarity and decide between
// a confident match, an ambiguity (top 3 back to the user), or a miss with
// suggestions.

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return prev[n];
}

function norm(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

// 0..1 similarity between a spoken query and a candidate name.
export function scoreMatch(query, candidate) {
  const q = norm(query), c = norm(candidate);
  if (!q || !c) return 0;
  if (q === c) return 1;

  let best = 0;
  if (c.includes(q)) best = Math.max(best, 0.75 + 0.25 * (q.length / c.length));
  if (q.includes(c)) best = Math.max(best, 0.7 + 0.2 * (c.length / q.length));

  // token coverage: every query token prefix-matches some candidate token
  // ("dave" → "Dave Martinez"; "ac tune" → "AC Tune-Up")
  const qTokens = q.split(" ");
  const cTokens = c.split(" ");
  const covered = qTokens.filter((qt) =>
    cTokens.some((ct) => ct.startsWith(qt) || qt.startsWith(ct)),
  ).length;
  if (covered === qTokens.length) {
    best = Math.max(best, 0.6 + 0.3 * (covered / cTokens.length));
  } else if (covered > 0) {
    best = Math.max(best, 0.45 * (covered / qTokens.length));
  }

  const dist = levenshtein(q, c);
  best = Math.max(best, (1 - dist / Math.max(q.length, c.length)) * 0.7);
  return best;
}

// Generic resolver. Returns one of:
//   { match: row }
//   { ambiguous: [rows] }   — top candidates, caller asks the user
//   { none: true, suggestions: [rows] }
async function resolveByName(api, table, name, { select = "id,name", filters = "" } = {}) {
  const safe = norm(name);
  if (!safe) return { none: true, suggestions: [] };

  const base = `${table}?select=${select}&tenant_id=eq.${api.tenant.id}${filters}`;
  let rows = await api.rest(
    `${base}&name=ilike.${encodeURIComponent(`*${safe}*`)}&limit=8`,
  );
  if (!rows || rows.length === 0) {
    // no substring hit — pull the (small) full set and fuzzy-rank it
    rows = (await api.rest(`${base}&limit=300`)) ?? [];
  }

  const scored = rows
    .map((r) => ({ row: r, score: scoreMatch(name, r.name) }))
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return { none: true, suggestions: [] };

  const [top, second] = scored;
  if (top.score >= 0.55 && (!second || second.score < top.score - 0.15 || second.score < 0.55)) {
    return { match: top.row };
  }
  const plausible = scored.filter((s) => s.score >= 0.4).slice(0, 3);
  if (plausible.length > 1) return { ambiguous: plausible.map((s) => s.row) };
  if (plausible.length === 1) return { match: plausible[0].row };
  return { none: true, suggestions: scored.slice(0, 3).map((s) => s.row) };
}

export function resolveCustomer(api, name) {
  return resolveByName(api, "customers", name, {
    select: "id,name,phone,email,address",
    filters: "&deleted_at=is.null",
  });
}

export function resolveTechnician(api, name) {
  return resolveByName(api, "technicians", name, {
    select: "id,name,color",
    filters: "&deleted_at=is.null&is_active=is.true",
  });
}

export function resolveJobType(api, name) {
  return resolveByName(api, "job_types", name, {
    select: "id,name,category,default_duration,estimated_revenue",
    filters: "&is_active=is.true",
  });
}

// Skill names → skill rows ({id, name}); returns { matched, missing }.
export async function resolveSkills(api, names) {
  const all = await api.rest(`skills?select=id,name&tenant_id=eq.${api.tenant.id}&limit=300`);
  const matched = [];
  const missing = [];
  for (const n of names) {
    const scored = (all ?? [])
      .map((s) => ({ s, score: scoreMatch(n, s.name) }))
      .sort((a, b) => b.score - a.score);
    if (scored[0] && scored[0].score >= 0.5) matched.push(scored[0].s);
    else missing.push(n);
  }
  return { matched, missing };
}
