// Environment / configuration loading for the scheduling skills.
//
// Config resolution order: process env wins, then the skill-local .env file
// (same convention as the other Firmcraft Hermes skills — drop a .env next to
// SKILL.md on the box). SCHEDULING_ENV_FILE overrides the .env location, which
// lets the repo integration test point at admin/.env.local.

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SKILL_DIR = dirname(dirname(fileURLToPath(import.meta.url)));

function applyEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m || m[1].startsWith("#")) continue;
    let value = m[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = value;
  }
}

export function loadConfig() {
  applyEnvFile(process.env.SCHEDULING_ENV_FILE || join(SKILL_DIR, ".env"));

  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "")
    .replace(/\/+$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY must be set " +
        "— put them in the skill's .env file or the environment.",
    );
  }

  return {
    url,
    serviceKey,
    // Each Hermes instance serves one contractor; pin it by slug (or id).
    tenantSlug: process.env.SCHEDULING_TENANT_SLUG || "demo",
    tenantId: process.env.SCHEDULING_TENANT_ID || null,
    // auto: probe whether the Edge Functions are deployed and fall back to
    // direct PostgREST when they aren't (Sprint 2 functions exist as code only).
    // always / never force one path.
    edgeMode: process.env.SCHEDULING_EDGE_MODE || "auto",
    actor: process.env.SCHEDULING_ACTOR || "hermes",
  };
}
