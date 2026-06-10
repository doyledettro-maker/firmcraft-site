// End-to-end Sprint 3 integration test — exercises the full job lifecycle
// through the actual skill modules against the live demo tenant, then verifies
// the audit trail and the webhook event queue. Fixtures are namespaced and torn
// down at the end (including on earlier-assert failure, best-effort).
//
// Run from the repo root:
//   SCHEDULING_ENV_FILE=admin/.env.local node hermes-skills/scheduling/test/integration.mjs

import { randomUUID } from "node:crypto";
import { createContext } from "../lib/api.mjs";
import { runSkill } from "../skills/index.mjs";

const api = await createContext();
const tz = api.tenant.timezone;
const SUFFIX = randomUUID().slice(0, 8);
const CUSTOMER_NAME = `E2E Sprint3 Testcustomer ${SUFFIX}`;

let failures = 0;
const createdJobIds = [];
let customerId = null;
let timeOffId = null;

function check(name, cond, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!cond) failures++;
}

async function cleanup() {
  try {
    if (createdJobIds.length > 0) {
      const ids = createdJobIds.join(",");
      await api.rest(`webhook_events?payload->job->>id=in.(${ids})`, { method: "DELETE" });
      await api.rest(`jobs?id=in.(${ids})`, { method: "DELETE" }); // history cascades
    }
    if (timeOffId) await api.rest(`technician_availability?id=eq.${timeOffId}`, { method: "DELETE" });
    if (customerId) await api.rest(`customers?id=eq.${customerId}`, { method: "DELETE" });
  } catch (err) {
    console.error(`cleanup warning: ${err.message}`);
  }
}

try {
  // --- fixture: a throwaway customer in the demo tenant ----------------------
  const techs = await api.rest(
    `technicians?tenant_id=eq.${api.tenant.id}&is_active=is.true&deleted_at=is.null&select=id,name&order=name`,
  );
  check("demo tenant has technicians", techs.length >= 2, `${techs.length} found`);
  const [techA, techB] = techs;

  const custRows = await api.rest(`customers?select=id,name`, {
    method: "POST",
    body: {
      tenant_id: api.tenant.id,
      name: CUSTOMER_NAME,
      phone: "555-0142",
      email: "e2e-sprint3@example.com",
      address: { street: "1800 Test Ln", city: "Houston", state: "TX", zip: "77002", lat: 29.7604, lng: -95.3698 },
    },
    prefer: "return=representation",
  });
  customerId = custRows[0].id;

  // === 1. create_job ==========================================================
  const created = await runSkill("create_job", {
    customer_name: CUSTOMER_NAME,
    service_type: "AC tune up",
    date: "tomorrow",
    time: "9am",
    preferred_tech: techA.name.split(" ")[0], // first name only — exercises fuzzy match
    description: "E2E integration test job",
  }, api);
  check("create_job books the job", created.ok === true, created.message);
  check("create_job assigned the requested tech", created.data?.technician === techA.name, String(created.data?.technician));
  const jobId = created.data?.job_id;
  if (jobId) createdJobIds.push(jobId);
  check("create_job returns scheduled status", created.data?.status === "scheduled", String(created.data?.status));

  // === 2. list_jobs shows it ==================================================
  const listed = await runSkill("list_jobs", { date: "tomorrow" }, api);
  const inList = (listed.data?.jobs ?? []).some((j) => j.id === jobId);
  check("list_jobs(tomorrow) includes the new job", listed.ok && inList, listed.message?.split("\n")[0]);

  // === 3. get_job =============================================================
  const got = await runSkill("get_job", { customer_name: CUSTOMER_NAME, date: "tomorrow" }, api);
  check("get_job finds it by customer + date", got.ok && got.data?.job?.id === jobId);

  // === 4. update_job (confirm flow + tech change) =============================
  const preview = await runSkill("update_job", { job_id: jobId, technician: techB.name, new_time: "1pm" }, api);
  check("update_job previews before executing", preview.needs_confirmation === true, preview.message);

  const updated = await runSkill("update_job", { job_id: jobId, technician: techB.name, new_time: "1pm", confirm: true }, api);
  check("update_job reassigns + reschedules", updated.ok === true, updated.message);
  check("update_job moved it to the other tech", updated.data?.technician_id === techB.id);

  // === 5. complete_job ========================================================
  const completed = await runSkill("complete_job", {
    job_id: jobId,
    notes: "E2E complete",
    parts_used: [{ name: "Run capacitor 45/5", qty: 1, cost: 24.5, price: 68 }],
    confirm: true,
  }, api);
  check("complete_job completes the job", completed.ok === true && completed.data?.status === "completed", completed.message);

  // === 6. status history is complete ==========================================
  const history = await api.rest(
    `job_status_history?job_id=eq.${jobId}&select=previous_status,new_status&order=created_at.asc`,
  );
  const path = history.map((h) => h.new_status);
  const expected = ["scheduled", "dispatched", "en_route", "arrived", "in_progress", "completed"];
  check(
    "status history records the full lifecycle",
    expected.every((s) => path.includes(s)) && history[0].previous_status === null,
    path.join(" → "),
  );

  // === 7. invoice_data persisted ==============================================
  const jobRow = (await api.rest(`jobs?id=eq.${jobId}&select=invoice_data,parts_used,status`))[0];
  check(
    "invoice_data assembled on completion",
    jobRow.invoice_data?.job_id === jobId && jobRow.invoice_data?.labor?.hours !== undefined,
    `labor hours: ${jobRow.invoice_data?.labor?.hours}`,
  );
  check("parts persisted", (jobRow.parts_used ?? []).length === 1);

  // === 8. webhook events queued ===============================================
  const events = await api.rest(
    `webhook_events?payload->job->>id=eq.${jobId}&select=event_type,processed_at&order=created_at.asc`,
  );
  const types = events.map((e) => e.event_type);
  check("job.created queued", types.includes("job.created"), types.join(", "));
  check("job.scheduled queued (insert as scheduled)", types.includes("job.scheduled"));
  check(
    "job.status_changed queued for each transition",
    types.filter((t) => t === "job.status_changed").length >= 5,
    `${types.filter((t) => t === "job.status_changed").length} transitions`,
  );
  check("job.completed queued", types.includes("job.completed"));
  check("events start unprocessed", events.every((e) => e.processed_at === null));

  // === 9. cancel flow on a second job =========================================
  const created2 = await runSkill("create_job", {
    customer_name: CUSTOMER_NAME,
    service_type: "Drain Cleaning",
    date: "tomorrow",
    time: "3pm",
  }, api);
  check("second job created (auto-assigned tech)", created2.ok === true, created2.data?.technician ?? "(unassigned)");
  const jobId2 = created2.data?.job_id;
  if (jobId2) createdJobIds.push(jobId2);

  const cancelPreview = await runSkill("cancel_job", { job_id: jobId2, reason: "customer called to cancel" }, api);
  check("cancel_job previews before executing", cancelPreview.needs_confirmation === true);
  const cancelled = await runSkill("cancel_job", { job_id: jobId2, reason: "customer called to cancel", confirm: true }, api);
  check("cancel_job cancels", cancelled.ok === true, cancelled.message);

  const events2 = await api.rest(`webhook_events?payload->job->>id=eq.${jobId2}&select=event_type`);
  check("job.cancelled queued", events2.some((e) => e.event_type === "job.cancelled"));

  const hist2 = await api.rest(
    `job_status_history?job_id=eq.${jobId2}&new_status=eq.cancelled&select=reason,changed_by`,
  );
  check(
    "cancellation reason + actor on the audit row",
    hist2[0]?.reason === "customer called to cancel" && hist2[0]?.changed_by === api.cfg.actor,
    JSON.stringify(hist2[0] ?? null),
  );

  // === 10. check_availability + set_time_off =================================
  const avail = await runSkill("check_availability", { date: "tomorrow", duration: "2 hours" }, api);
  check("check_availability returns techs", avail.ok === true && (avail.data?.technicians ?? []).length > 0, avail.message);

  const timeOff = await runSkill("set_time_off", {
    technician: techA.name,
    date_or_range: "tomorrow",
    reason: "E2E test PTO",
  }, api);
  check("set_time_off creates the block", timeOff.ok === true, timeOff.message);
  timeOffId = timeOff.data?.availability_id;

  const availAfter = await runSkill("check_availability", { date: "tomorrow", duration: "2 hours" }, api);
  const stillFree = (availAfter.data?.technicians ?? []).some((t) => t.tech_id === techA.id);
  check("time off removes the tech from availability", availAfter.ok === true && !stillFree);
} finally {
  await cleanup();
}

console.log(failures === 0 ? "\nAll integration checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures ? 1 : 0);
