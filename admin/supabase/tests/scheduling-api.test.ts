// Integration tests for the Phase 2.1 Sprint 2 scheduling Edge Functions.
//
// These run the function handlers IN-PROCESS against the live Supabase project
// (the same DB the functions will be deployed against). Calls authenticate via the
// trusted "service-credential" path: Bearer <service-role key> + x-tenant-id /
// x-role / x-tech-id headers — exactly how the AI phone agent (and any trusted
// backend) calls these endpoints. The RLS isolation test additionally opens a
// direct Postgres connection and exercises the policies as the `authenticated`
// role with synthetic JWT claims.
//
// Run (from admin/):
//   deno test -A --env-file=.env.local supabase/tests/scheduling-api.test.ts
//
// Fixtures are created under two throwaway tenants (A and B) with fixed UUIDs and
// torn down before and after the run, so the seeded `demo` tenant is untouched.

import { assert, assertEquals, assertExists } from "std/assert";
import postgres from "postgres";

import { handler as createJob } from "../functions/create-job/index.ts";
import { handler as updateJob } from "../functions/update-job/index.ts";
import { handler as transitionJob } from "../functions/transition-job/index.ts";
import { handler as completeJob } from "../functions/complete-job/index.ts";
import { handler as checkAvailability } from "../functions/check-availability/index.ts";
import { handler as techLocation } from "../functions/tech-location/index.ts";

// ---------------------------------------------------------------------------
// Env + fixtures
// ---------------------------------------------------------------------------

const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("NEXT_PUBLIC_SUPABASE_URL")!;
const DATABASE_URL = Deno.env.get("DATABASE_URL")!;
assertExists(SERVICE_KEY, "SUPABASE_SERVICE_ROLE_KEY required");
assertExists(SUPABASE_URL, "SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL required");

const TENANT_A = "00000000-0000-0000-0000-00000000a0a0";
const TENANT_B = "00000000-0000-0000-0000-00000000b0b0";
const CUST_A = "00000000-0000-0000-0000-00000000a0c1";
const JOBTYPE_A = "00000000-0000-0000-0000-00000000a0f1";
const SKILL_A = "00000000-0000-0000-0000-00000000a051";
const TECH_A = "00000000-0000-0000-0000-00000000a0b1";

const sql = postgres(DATABASE_URL, { ssl: "require", max: 2 });

type CallOpts = {
  tenantId?: string;
  role?: string;
  techId?: string;
  actor?: string;
  widgetKey?: string;
  noAuth?: boolean;
};

function call(
  handler: (req: Request) => Promise<Response>,
  body: unknown,
  opts: CallOpts = {},
): Promise<Response> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (opts.widgetKey) {
    headers["x-firmcraft-widget-key"] = opts.widgetKey;
  } else if (!opts.noAuth) {
    headers["authorization"] = `Bearer ${SERVICE_KEY}`;
    headers["x-tenant-id"] = opts.tenantId ?? TENANT_A;
    headers["x-role"] = opts.role ?? "dispatcher";
    if (opts.techId) headers["x-tech-id"] = opts.techId;
    if (opts.actor) headers["x-actor"] = opts.actor;
  }
  const req = new Request("http://localhost/fn", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return handler(req);
}

async function cleanup() {
  // FK-safe delete order, both test tenants.
  for (const t of [TENANT_A, TENANT_B]) {
    await sql`delete from public.job_status_history where tenant_id = ${t}`;
    await sql`delete from public.jobs where tenant_id = ${t}`;
    await sql`delete from public.technician_current_location where tenant_id = ${t}`;
    await sql`delete from public.technician_locations where tenant_id = ${t}`;
    await sql`delete from public.technician_availability where tenant_id = ${t}`;
    await sql`delete from public.technician_skills ts using public.technicians te
              where ts.technician_id = te.id and te.tenant_id = ${t}`;
    await sql`delete from public.job_types where tenant_id = ${t}`;
    await sql`delete from public.customers where tenant_id = ${t}`;
    await sql`delete from public.skills where tenant_id = ${t}`;
    await sql`delete from public.technicians where tenant_id = ${t}`;
    await sql`delete from public.widget_keys where tenant_id = ${t}`;
    await sql`delete from public.tenants where id = ${t}`;
  }
}

async function seed() {
  const hours = {
    mon: { start: "08:00", end: "17:00" },
    tue: { start: "08:00", end: "17:00" },
    wed: { start: "08:00", end: "17:00" },
    thu: { start: "08:00", end: "17:00" },
    fri: { start: "08:00", end: "17:00" },
    sat: { start: "08:00", end: "17:00" },
    sun: { start: "08:00", end: "17:00" },
  };
  await sql`insert into public.tenants (id, clerk_org_id, name, slug, timezone, business_hours)
            values (${TENANT_A}, 'org_test_a', 'Test Tenant A', 'sched-test-a', 'America/Chicago', ${sql.json(hours)})`;
  await sql`insert into public.tenants (id, clerk_org_id, name, slug, timezone, business_hours)
            values (${TENANT_B}, 'org_test_b', 'Test Tenant B', 'sched-test-b', 'America/Chicago', ${sql.json(hours)})`;

  await sql`insert into public.skills (id, tenant_id, name, category, is_certification)
            values (${SKILL_A}, ${TENANT_A}, 'EPA 608', 'certification', true)`;

  await sql`insert into public.customers (id, tenant_id, name, email, phone, address, location)
            values (${CUST_A}, ${TENANT_A}, 'Test Customer', 'cust@test.example', '+17135559999',
              ${sql.json({ street: "1 Test St", city: "Houston", state: "TX", zip: "77002", lat: 29.76, lng: -95.37 })},
              ST_SetSRID(ST_MakePoint(-95.37, 29.76), 4326))`;

  await sql`insert into public.job_types (id, tenant_id, name, category, default_duration, estimated_revenue, required_skills)
            values (${JOBTYPE_A}, ${TENANT_A}, 'AC Tune-Up', 'hvac', 60, 149.00, ${sql.array([SKILL_A])}::uuid[])`;

  await sql`insert into public.technicians (id, tenant_id, name, email, hourly_rate, work_hours, is_active)
            values (${TECH_A}, ${TENANT_A}, 'Test Tech', 'tech@test.example', 125.00, ${sql.json({})}, true)`;
  await sql`insert into public.technician_skills (technician_id, skill_id, proficiency)
            values (${TECH_A}, ${SKILL_A}, 'expert')`;
}

async function body(res: Response) {
  return { status: res.status, json: await res.json() };
}

// Next occurrence (UTC) of a weekday at a Chicago wall-clock hour, as ISO.
// Chicago is UTC-5 (CDT) in June, so 09:00 CT == 14:00 UTC.
function nextWeekdayChicago(hourLocal: number): { date: string; isoUtc: string } {
  const now = new Date();
  // pick 7 days out to be safely in the future and on a weekday
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 7));
  // ensure weekday (Mon-Fri); nudge forward if weekend
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) {
    d.setUTCDate(d.getUTCDate() + 1);
  }
  const dateStr = d.toISOString().slice(0, 10);
  const isoUtc = `${dateStr}T${String(hourLocal + 5).padStart(2, "0")}:00:00.000Z`;
  return { date: dateStr, isoUtc };
}

// ---------------------------------------------------------------------------
// Lifecycle: setup once, teardown once.
// ---------------------------------------------------------------------------

Deno.test("scheduling Edge Functions", async (t) => {
  await cleanup();
  await seed();

  let createdJobId = "";

  try {
    await t.step("create-job (no tech) → status=created, auto-populated, in DB", async () => {
      const res = await call(createJob, {
        customer_id: CUST_A,
        job_type_id: JOBTYPE_A,
        title: "AC Tune-Up — Test",
        description: "annual maintenance",
        priority: "standard",
        source: "phone_ai",
      });
      const { status, json } = await body(res);
      assertEquals(status, 201, JSON.stringify(json));
      assert(json.ok, "expected ok");
      const job = json.data;
      assertEquals(job.status, "created");
      assertEquals(job.estimated_duration, 60, "duration from job_type default");
      assertEquals(Number(job.estimated_revenue), 149, "revenue from job_type");
      assertEquals(job.source, "phone_ai");
      assertExists(job.address, "address denormalized from customer");
      assertExists(job.location, "location denormalized from customer");
      createdJobId = job.id;

      const rows = await sql`select id, status from public.jobs where id = ${job.id}`;
      assertEquals(rows.length, 1, "job persisted");
      assertEquals(rows[0].status, "created");
    });

    await t.step("create-job (with tech) → status=scheduled", async () => {
      const { isoUtc } = nextWeekdayChicago(9);
      const end = new Date(new Date(isoUtc).getTime() + 60 * 60000).toISOString();
      const res = await call(createJob, {
        customer_id: CUST_A,
        job_type_id: JOBTYPE_A,
        title: "AC Tune-Up — assigned",
        technician_id: TECH_A,
        scheduled_start: isoUtc,
        scheduled_end: end,
      });
      const { status, json } = await body(res);
      assertEquals(status, 201, JSON.stringify(json));
      assertEquals(json.data.status, "scheduled", "tech assigned → scheduled");
      assertEquals(json.data.technician_id, TECH_A);
    });

    await t.step("update-job: assigning a tech to a created job → scheduled", async () => {
      const created = await body(await call(createJob, {
        customer_id: CUST_A,
        job_type_id: JOBTYPE_A,
        title: "AC Tune-Up — to assign",
      }));
      const jid = created.json.data.id;
      assertEquals(created.json.data.status, "created");

      const res = await call(updateJob, {
        job_id: jid,
        technician_id: TECH_A,
        internal_notes: "assigned by dispatcher",
      }, { role: "dispatcher" });
      const { status, json } = await body(res);
      assertEquals(status, 200, JSON.stringify(json));
      assertEquals(json.data.status, "scheduled", "created + tech assigned → scheduled");
      assertEquals(json.data.technician_id, TECH_A);
      assertEquals(json.data.internal_notes, "assigned by dispatcher");
    });

    await t.step("update-job: requires admin/dispatcher role → 403 for technician", async () => {
      const res = await call(updateJob, {
        job_id: createdJobId,
        title: "nope",
      }, { role: "technician", techId: TECH_A });
      const { status } = await body(res);
      assertEquals(status, 403, "technician role cannot update-job");
    });

    await t.step("invalid status transition → 422 rejection", async () => {
      // created → arrived is not a legal transition; the Postgres trigger rejects it.
      // (We avoid created → completed here because complete has an actual_start
      // precheck that would short-circuit before the trigger fires.)
      const res = await call(transitionJob, {
        job_id: createdJobId,
        new_status: "arrived",
      });
      const { status, json } = await body(res);
      assertEquals(status, 422, JSON.stringify(json));
      assertEquals(json.ok, false);
      assert(/invalid job status transition/i.test(json.error), json.error);
    });

    await t.step("complete-job → actual_end set + invoice_data assembled", async () => {
      // Create a fresh job, assign tech, then walk it to in_progress.
      const { isoUtc } = nextWeekdayChicago(10);
      const end = new Date(new Date(isoUtc).getTime() + 60 * 60000).toISOString();
      const created = await body(await call(createJob, {
        customer_id: CUST_A,
        job_type_id: JOBTYPE_A,
        title: "AC Tune-Up — to complete",
        technician_id: TECH_A,
        scheduled_start: isoUtc,
        scheduled_end: end,
      }));
      const jid = created.json.data.id;

      for (const s of ["dispatched", "en_route", "arrived", "in_progress"]) {
        const r = await body(await call(transitionJob, { job_id: jid, new_status: s }));
        assertEquals(r.status, 200, `transition to ${s}: ${JSON.stringify(r.json)}`);
      }

      const res = await call(completeJob, {
        job_id: jid,
        tech_notes: "Replaced capacitor, system nominal.",
        parts_used: [{ name: "Capacitor 45/5 MFD", qty: 1, cost: 12.5, price: 45.0 }],
        photos: ["https://storage.supabase.co/test/photo1.jpg"],
        customer_signature: "https://storage.supabase.co/test/sig.png",
      }, { role: "dispatcher" });
      const { status, json } = await body(res);
      assertEquals(status, 200, JSON.stringify(json));
      assertEquals(json.data.job.status, "completed");
      assertExists(json.data.job.actual_end, "actual_end set");

      const inv = json.data.invoice_data;
      assertExists(inv, "invoice_data assembled");
      assertEquals(inv.job_id, jid);
      assertEquals(inv.tenant_id, TENANT_A);
      assertEquals(inv.customer.name, "Test Customer");
      assertEquals(inv.job_type.name, "AC Tune-Up");
      assertEquals(inv.parts.length, 1);
      assertEquals(inv.parts[0].name, "Capacitor 45/5 MFD");
      assertEquals(inv.parts[0].price, 45);
      assertExists(inv.labor.actual_start);
      assertExists(inv.labor.actual_end);
      assertEquals(inv.labor.rate, 125, "labor rate from tech hourly_rate");
      assert(typeof inv.labor.hours === "number");
      assertEquals(inv.signature_url, "https://storage.supabase.co/test/sig.png");

      // Persisted on the job for Phase 4.
      const rows = await sql`select invoice_data, actual_end from public.jobs where id = ${jid}`;
      assertExists(rows[0].invoice_data, "invoice_data persisted on job");
      assertExists(rows[0].actual_end);
    });

    await t.step("check-availability → blocked times excluded", async () => {
      // Book TECH_A 09:00–10:00 local on a future weekday, then ask for that day.
      const { date, isoUtc } = nextWeekdayChicago(9);
      const busyStart = new Date(isoUtc);
      const busyEnd = new Date(busyStart.getTime() + 60 * 60000);
      await sql`insert into public.jobs (tenant_id, customer_id, job_type_id, technician_id, title, status, scheduled_start, scheduled_end, estimated_duration)
                values (${TENANT_A}, ${CUST_A}, ${JOBTYPE_A}, ${TECH_A}, 'busy block', 'scheduled',
                  ${busyStart.toISOString()}, ${busyEnd.toISOString()}, 60)`;

      const res = await call(checkAvailability, {
        date,
        duration_minutes: 60,
        job_type_id: JOBTYPE_A,
      });
      const { status, json } = await body(res);
      assertEquals(status, 200, JSON.stringify(json));
      const tech = json.data.technicians.find((x: { tech_id: string }) => x.tech_id === TECH_A);
      assertExists(tech, "TECH_A present (has required skill)");

      // No returned slot may overlap the 09:00–10:00 busy window.
      const bs = busyStart.getTime();
      const be = busyEnd.getTime();
      for (const slot of tech.available_slots) {
        const s = new Date(slot.start).getTime();
        const e = new Date(slot.end).getTime();
        assert(e <= bs || s >= be, `slot ${slot.start}–${slot.end} overlaps the busy block`);
      }
      // And a slot should resume exactly at the busy end (10:00).
      assert(
        tech.available_slots.some((sl: { start: string }) => new Date(sl.start).getTime() === be),
        "expected a free slot starting at the busy-block end",
      );
    });

    await t.step("check-availability via public widget key", async () => {
      const { date } = nextWeekdayChicago(9);
      // Demo tenant's seeded widget key works for the demo tenant; here we just
      // assert the widget auth path is accepted and scoped (uses the demo tenant).
      const res = await call(checkAvailability, { date, duration_minutes: 60 }, {
        widgetKey: "wk_test_demo_0000000000000000",
      });
      const { status, json } = await body(res);
      assertEquals(status, 200, JSON.stringify(json));
      assert(Array.isArray(json.data.technicians), "widget key returned availability");
    });

    await t.step("RLS: create as Tenant A, query as Tenant B → empty", async () => {
      // Exercise the actual RLS policies as the `authenticated` role with JWT claims.
      const claimsA = JSON.stringify({ tenant_id: TENANT_A, role: "admin" });
      const claimsB = JSON.stringify({ tenant_id: TENANT_B, role: "admin" });

      const asA = await sql.begin(async (tx) => {
        await tx`select set_config('role', 'authenticated', true)`;
        await tx`select set_config('request.jwt.claims', ${claimsA}, true)`;
        return await tx`select count(*)::int as n from public.jobs where id = ${createdJobId}`;
      });
      assertEquals(asA[0].n, 1, "Tenant A sees its own job under RLS");

      const asB = await sql.begin(async (tx) => {
        await tx`select set_config('role', 'authenticated', true)`;
        await tx`select set_config('request.jwt.claims', ${claimsB}, true)`;
        const own = await tx`select count(*)::int as n from public.jobs where id = ${createdJobId}`;
        const all = await tx`select count(*)::int as n from public.jobs`;
        return { own: own[0].n, all: all[0].n };
      });
      assertEquals(asB.own, 0, "Tenant B cannot see Tenant A's job");
      assertEquals(asB.all, 0, "Tenant B has no jobs of its own → empty");
    });

    await t.step("tech-location → technician_current_location updated", async () => {
      const res = await call(techLocation, {
        lat: 29.78,
        lng: -95.41,
        accuracy: 8,
        speed: 12.5,
        heading: 270,
      }, { role: "technician", techId: TECH_A });
      const { status, json } = await body(res);
      assertEquals(status, 200, JSON.stringify(json));
      assert(json.ok);

      const rows = await sql`select status, ST_X(location) as lng, ST_Y(location) as lat
                             from public.technician_current_location where technician_id = ${TECH_A}`;
      assertEquals(rows.length, 1, "current location upserted");
      assertEquals(rows[0].status, "driving", "speed>1.5 → driving");
      assertEquals(Math.round(rows[0].lat * 100) / 100, 29.78);
      assertEquals(Math.round(rows[0].lng * 100) / 100, -95.41);

      const hist = await sql`select count(*)::int as n from public.technician_locations where technician_id = ${TECH_A}`;
      assert(hist[0].n >= 1, "history appended");
    });

    await t.step("tech-location rate limit: 3rd call within 1s → 429", async () => {
      const ping = () =>
        call(techLocation, { lat: 29.78, lng: -95.41 }, { role: "technician", techId: TECH_A });
      // The earlier successful call already consumed budget in this 1s window for
      // some runs; issue a burst and assert at least one 429 appears.
      const results = await Promise.all([ping(), ping(), ping(), ping()]);
      const codes = results.map((r) => r.status);
      // drain bodies to avoid resource leaks
      await Promise.all(results.map((r) => r.body?.cancel()));
      assert(codes.includes(429), `expected a 429 in burst, got ${codes.join(",")}`);
    });

    await t.step("auth: missing credentials → 401", async () => {
      const res = await call(createJob, { customer_id: CUST_A, title: "x" }, { noAuth: true });
      const { status } = await body(res);
      assertEquals(status, 401);
    });

    await t.step("cross-tenant guard: customer from another tenant → 404", async () => {
      // Tenant B tries to create a job against Tenant A's customer.
      const res = await call(createJob, {
        customer_id: CUST_A,
        title: "cross-tenant attempt",
      }, { tenantId: TENANT_B });
      const { status, json } = await body(res);
      assertEquals(status, 404, JSON.stringify(json));
    });
  } finally {
    await cleanup();
    await sql.end({ timeout: 5 });
  }
});
