// Realtime verification (Sprint 3 task 9): subscribe to postgres_changes on a
// published table, write a row, and assert the event arrives.
//
// Uses @supabase/supabase-js from the admin app's node_modules (CJS so
// NODE_PATH resolution works). Run from the repo root:
//   NODE_PATH=admin/node_modules SCHEDULING_ENV_FILE=admin/.env.local \
//     node hermes-skills/scheduling/test/realtime.cjs

const path = require("node:path");
const fs = require("node:fs");

// minimal .env loader (same semantics as lib/config.mjs)
const envFile = process.env.SCHEDULING_ENV_FILE || path.join(__dirname, "..", ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m || m[1].startsWith("#")) continue;
    let v = m[2].replace(/^["']|["']$/g, "");
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
}

const { createClient } = require("@supabase/supabase-js");

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TENANT = "00000000-0000-0000-0000-0000000000d0"; // demo
const TECH = "00000000-0000-0000-0000-00000000b001"; // Dave Martinez

async function main() {
  const supabase = createClient(url, key, { realtime: { params: { eventsPerSecond: 5 } } });

  let received = null;
  const gotEvent = new Promise((resolve) => {
    received = resolve;
  });

  // The SUBSCRIBED status callback fires before the postgres_changes listener
  // is actually attached to the WAL stream — wait for the system-level
  // "Subscribed to PostgreSQL" ack, or an insert can race ahead of the binding.
  let pgBound = null;
  const pgBoundPromise = new Promise((resolve) => {
    pgBound = resolve;
  });

  const channel = supabase
    .channel("sprint3-realtime-test")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "technician_availability" },
      (payload) => received(payload),
    )
    .on("system", {}, (msg) => {
      if (msg.extension === "postgres_changes" && msg.status === "ok") pgBound(true);
    });

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("subscribe timeout (15s)")), 15_000);
    channel.subscribe((status, err) => {
      if (status === "SUBSCRIBED") {
        clearTimeout(timer);
        resolve(true);
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        clearTimeout(timer);
        reject(err ?? new Error(status));
      }
    });
  });
  await Promise.race([
    pgBoundPromise,
    new Promise((_, rej) => setTimeout(() => rej(new Error("postgres_changes binding timeout (15s)")), 15_000)),
  ]);
  console.log("PASS  subscribed to postgres_changes on technician_availability");

  // Write a row the subscription should see.
  const { data: row, error } = await supabase
    .from("technician_availability")
    .insert({
      technician_id: TECH,
      tenant_id: TENANT,
      type: "blocked",
      title: "realtime test (auto-removed)",
      starts_at: "2027-01-01T15:00:00Z",
      ends_at: "2027-01-01T16:00:00Z",
    })
    .select("id")
    .single();
  if (error) throw new Error(`insert failed: ${error.message}`);

  const payload = await Promise.race([
    gotEvent,
    new Promise((_, rej) => setTimeout(() => rej(new Error("no realtime event within 15s")), 15_000)),
  ]);

  const ok = payload?.new?.id === row.id && payload?.new?.type === "blocked";
  console.log(`${ok ? "PASS" : "FAIL"}  INSERT event received for the row we wrote (id ${payload?.new?.id})`);

  // cleanup
  await supabase.from("technician_availability").delete().eq("id", row.id);
  await supabase.removeChannel(channel);
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error(`FAIL  ${err.message}`);
  process.exit(1);
});
