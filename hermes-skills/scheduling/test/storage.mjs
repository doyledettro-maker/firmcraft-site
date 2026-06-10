// Storage bucket verification (Sprint 3 task: buckets + RLS + size limits).
// Uploads a PNG into job-photos under {tenant_id}/{job_id}/, reads it back,
// checks the anon role is locked out, and confirms the size limit rejects an
// oversized signature. Run:
//   SCHEDULING_ENV_FILE=../../admin/.env.local node test/storage.mjs

import { createContext } from "../lib/api.mjs";

// 1×1 transparent PNG
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

let failures = 0;
function check(name, cond, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!cond) failures++;
}

const api = await createContext();
const { url, serviceKey } = api.cfg;
const objectPath = `${api.tenant.id}/00000000-0000-0000-0000-000000010001/storage-test.png`;

// --- upload (service role) ---------------------------------------------------
const up = await fetch(`${url}/storage/v1/object/job-photos/${objectPath}`, {
  method: "POST",
  headers: {
    apikey: serviceKey,
    authorization: `Bearer ${serviceKey}`,
    "content-type": "image/png",
    "x-upsert": "true",
  },
  body: PNG,
});
check("upload to job-photos under {tenant}/{job}/", up.ok, `status ${up.status}`);

// --- read back ---------------------------------------------------------------
const down = await fetch(`${url}/storage/v1/object/job-photos/${objectPath}`, {
  headers: { apikey: serviceKey, authorization: `Bearer ${serviceKey}` },
});
const body = Buffer.from(await down.arrayBuffer());
check("download returns the uploaded bytes", down.ok && body.equals(PNG), `status ${down.status}, ${body.length} bytes`);

// --- anon is locked out (private bucket + RLS) --------------------------------
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (anonKey) {
  const anon = await fetch(`${url}/storage/v1/object/job-photos/${objectPath}`, {
    headers: { apikey: anonKey, authorization: `Bearer ${anonKey}` },
  });
  check("anon role cannot read the object", !anon.ok, `status ${anon.status}`);
} else {
  console.log("SKIP  anon lockout (no NEXT_PUBLIC_SUPABASE_ANON_KEY in env)");
}

// --- signatures size limit (1MB) ----------------------------------------------
const big = Buffer.alloc(1_200_000, 7);
const sigPath = `${api.tenant.id}/00000000-0000-0000-0000-000000010001/too-big.png`;
const tooBig = await fetch(`${url}/storage/v1/object/signatures/${sigPath}`, {
  method: "POST",
  headers: {
    apikey: serviceKey,
    authorization: `Bearer ${serviceKey}`,
    "content-type": "image/png",
  },
  body: big,
});
check("signatures bucket rejects >1MB upload", !tooBig.ok, `status ${tooBig.status}`);

// --- mime restriction ----------------------------------------------------------
const badMime = await fetch(`${url}/storage/v1/object/job-photos/${api.tenant.id}/x/evil.exe`, {
  method: "POST",
  headers: {
    apikey: serviceKey,
    authorization: `Bearer ${serviceKey}`,
    "content-type": "application/octet-stream",
  },
  body: PNG,
});
check("job-photos rejects non-image mime type", !badMime.ok, `status ${badMime.status}`);

// --- cleanup -------------------------------------------------------------------
await fetch(`${url}/storage/v1/object/job-photos/${objectPath}`, {
  method: "DELETE",
  headers: { apikey: serviceKey, authorization: `Bearer ${serviceKey}` },
});

process.exit(failures ? 1 : 0);
