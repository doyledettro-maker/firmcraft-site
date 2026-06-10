# Phase 2 Scheduling/Dispatch — Comprehensive Code Review

**Date:** June 10, 2026
**Branch:** `phase-2.1-scheduling-foundation` (commits `97a4800`, `d65708e`, `7f3ba5f`, `5bb6346`)
**Scope:** All documentation, migrations, Edge Functions, Dispatch Board UI, dispatch optimizer, middleware, and cross-cutting concerns from the four completed build sprints.
**Method:** Six parallel deep-review passes (docs consistency, schema, Edge Functions, UI, optimizer, middleware/cross-cutting), findings deduplicated and verified against source. `npx tsc --noEmit` in `admin/` passes clean (0 errors). Optimizer test suite runs clean (23 passed, real pyvroom backend).

---

## Executive Summary

The foundation is in good shape: schema matches the architecture spec essentially verbatim, tenant-isolation discipline in the Edge Functions is excellent, the optimizer's VROOM construction and scoring math check out, and no secrets are committed. The four sprints delivered what the build plan specified for Sprints 1–2 and most of Phases 2.2–2.3.

**Three CRITICAL issues must be fixed before any real tenant onboards:**

1. **`x-tenant-id` header spoofing** — unauthenticated cross-tenant read/write through the public dispatch API routes (the exposure is broader than the known "demo board is open" interim state).
2. **Edge Function JWT issuer fallback** — with `CLERK_ISSUER` unset, *any* Clerk dev account can mint admin tokens for any tenant.
3. **Dispatch optimizer has no authentication** — anyone reaching port 8080 can drive auto-dispatch with service-role writes against any tenant.

Beyond those, the HIGH findings cluster around: RLS write-policies being too permissive for the future technician role, missing `updated_at` triggers, several status-lifecycle race conditions (transition-job no-ops, complete-job atomicity, optimizer `dispatched → scheduled` violations), a day-scoping bug in the optimizer that can schedule next week's jobs today, and the Google Routes matrix element limit silently disabling the API path.

Finding counts: **3 CRITICAL · 14 HIGH · 24 MEDIUM · 28 LOW**.

---

## CRITICAL

### CRIT-1 — `x-tenant-id` header spoofing → unauthenticated cross-tenant read/write

**Files:** [middleware.ts:135-151](admin/src/middleware.ts:135), [server.ts:46-62](admin/src/lib/dispatch/server.ts:46), [route.ts](admin/src/app/api/dispatch/jobs/[id]/route.ts)

`resolveTenant()` blindly trusts the `x-tenant-id` request header. The middleware only *overwrites* that header on the `tenant-client` surface; the `reserved`, `local`, `internal-admin`, and `login-app` surfaces return bare `NextResponse.next()` with **incoming client-supplied headers passed through untouched**. Since `/api/dispatch/(.*)` is in the public-route allowlist and the routes use the service-role client (RLS bypassed):

```
curl https://admin.firmcraft.ai/api/dispatch/board -H 'x-tenant-id: <any-tenant-uuid>'
```

reads — and via PATCH, mutates — **any tenant's** jobs, customer PII, and tech locations, unauthenticated, from any non-tenant host (including `*.vercel.app` previews, which classify as `local`). Tenant UUIDs are not secret: the board API returns `tenant.id` and every job embeds `tenant_id`.

This is worse than the documented interim state ("demo board is reachable") because the header is attacker-controlled outside the tenant subdomain.

**Fix (in order of urgency):**
1. **Now (small, shippable independently):** strip inbound `x-tenant-id`/`x-tenant-slug` on *every* middleware surface before `NextResponse.next()` — only the middleware should ever populate them.
2. Remove `/api/dispatch/(.*)` and `/dispatch(.*)` from `isPublicRoute` and require a Clerk session (the code comment already says "MUST be gated before real tenants onboard").
3. Land the Clerk-org → tenant binding so `resolveTenant()` derives the tenant from the authenticated session claim (`tenantClaim` is already computed at middleware.ts:179), never from a forwarded header.
4. Add rate limiting to `/api/dispatch/*`.

### CRIT-2 — Edge Function JWT issuer fallback trusts ANY Clerk tenant

**File:** [_shared/auth.ts:73-92](admin/supabase/functions/_shared/auth.ts:73) (`assertTrustedIssuer`)

When `CLERK_ISSUER` is not set, any issuer host ending in `.clerk.accounts.dev` or `.clerk.com` is trusted. An attacker can create a free Clerk app, configure a JWT template with arbitrary `tenant_id` / `role: "admin"` / `tech_id` claims, and pass `verifyClerkJwt` — the signature verifies against the *attacker's own* JWKS. That grants full read/write across any tenant on every endpoint (functions run with the service-role client; RLS is bypassed). The functions README treats `CLERK_ISSUER` as merely "recommended", and the gateway check is disabled (`verify_jwt = false`), so this is the only line of defense.

**Fix:** fail closed — if neither `CLERK_ISSUER` nor `CLERK_ALLOWED_ISSUER_HOST` is configured, throw 500 ("auth not configured"). Delete the wildcard fallback branch entirely. Update the README to mark `CLERK_ISSUER` as required.

### CRIT-3 — Dispatch optimizer: no authentication + service-role writes + per-request mode override

**Files:** [main.py](dispatch-optimizer/src/main.py) (all routes), [config.py](dispatch-optimizer/src/config.py), [docker-compose.yml](dispatch-optimizer/docker-compose.yml) (binds `0.0.0.0:8080`, port published)

Anyone who can reach port 8080 can POST `/optimize` with any `tenant_id` and `"mode": "auto"` — the request-level override (main.py:62-65) bypasses the tenant's configured `dispatch_mode`, and `_log_and_apply` then writes `technician_id`/`status` to `jobs` with the service-role key. `/suggest` also leaks cross-tenant job + customer data given only a job UUID (`fetch_job` in db.py has no tenant filter). Nothing (shared-secret header, IP allowlist, Caddy auth) is configured for the planned Hetzner deployment.

**Fix:** add an `OPTIMIZER_API_TOKEN` setting + FastAPI dependency checking `Authorization: Bearer`; bind to `127.0.0.1` in compose with Caddy in front. Drop the per-request `mode` override or gate it behind the token. Add a tenant filter to `fetch_job` (require `tenant_id` in the `/suggest` request and scope the query).

---

## HIGH

### Schema & RLS

**H-1 — Seed script is not idempotent — re-run fails on FK violations.**
[seed-scheduling.sql:24-43](admin/supabase/seed-scheduling.sql:24). The cleanup deletes `jobs` *before* `technician_current_location`/`dispatch_logs`, but the seed inserts `technician_current_location.current_job_id` rows pointing at demo jobs (FK is NO ACTION) — the second run dies on the FK. `widget_keys` (added in migration 008, FK to `tenants`) is never deleted, so `delete from public.tenants` fails once the demo widget key exists.
*Fix:* reorder the cleanup (widget_keys → technician_current_location → dispatch_logs → job_status_history → jobs → …).

**H-2 — No `updated_at` maintenance anywhere.**
13 scheduling tables carry `updated_at timestamptz not null default now()` but no `BEFORE UPDATE` trigger sets it, and app code never sets it (except the tech-location upsert). The helper already exists from init (`public.set_updated_at()`). `updated_at` will silently equal `created_at` forever, breaking "recently changed" logic and the conflict-resolution heuristics in architecture §7.3.
*Fix:* add a migration wiring `trg_set_updated_at` to all scheduling tables (a `do $$ … foreach … $$` loop over the table list).

**H-3 — RLS role scoping only restricts SELECT — a technician JWT can UPDATE/DELETE anything in the tenant.**
[006_scheduling_rls.sql:57-93, 140-168](admin/supabase/migrations/20260609_006_scheduling_rls.sql:57). `tenant_isolation` is permissive `FOR ALL` with full DML granted to `authenticated`; the restrictive policies (`tech_own_jobs`, etc.) are `FOR SELECT` only. A technician-role JWT can UPDATE/DELETE other techs' jobs (including rows they can't SELECT), UPDATE the `tenants` row itself (slug, clerk_org_id, business_hours), rewrite `job_status_history` audit rows, and hard-DELETE jobs/customers despite the soft-delete design.
*Fix:* make `job_status_history` SELECT+INSERT only; add restrictive UPDATE/DELETE policies on `jobs` mirroring `tech_own_jobs`; restrict `tenants` UPDATE to `public.user_role() = 'admin'`; drop the DELETE grant on `jobs`/`customers` if soft delete is the contract.

**H-4 — `check_availability()` counts soft-deleted jobs as busy.**
[008_scheduling_sprint2.sql:237-244](admin/supabase/migrations/20260609_008_scheduling_sprint2.sql:237). The busy-interval query never filters `j.deleted_at is null` (the technician loop does, so the omission is clearly accidental). A soft-deleted scheduled job blocks that tech's slot forever.
*Fix:* add `and j.deleted_at is null`; consider adding it to the `idx_jobs_dispatch` partial-index predicate too.

### Edge Functions

**H-5 — transition-job accepts no-op transitions with destructive side effects.**
[transition-job/index.ts:97-137](admin/supabase/functions/transition-job/index.ts:97). The DB trigger deliberately allows `status → same status` as a no-op, and transition-job never checks `new_status !== job.status`. A repeated `completed → completed` call re-stamps `actual_end = now()` (**overwriting the real completion time that feeds invoice labor hours**), and `annotateHistory` then overwrites the *original* transition's audit row (`reason`/`metadata`/`changed_by`). The call returns 200 as if something happened.
*Fix:* reject `new_status === job.status` (409 or no-op return); have `annotateHistory` only patch rows created after the update began (capture a timestamp lower-bound), or insert the history row directly instead of patching the trigger's.

### Dispatch Board UI

**H-6 — PATCH route validates field *names* but not *values*.**
[jobs/[id]/route.ts:37-43](admin/src/app/api/dispatch/jobs/[id]/route.ts:37). `body[key]` is copied verbatim into `.update()`: no enum membership check on `status`/`priority`, no UUID check on `technician_id`, no length caps on `title`/`internal_notes` — and `technician_id` is never verified to belong to the same tenant (a job can be assigned to *another tenant's* technician UUID).
*Fix:* zod schema — enum membership, UUID format, length caps, and verify `technician_id` resolves to a technician in `tenant.id` before the update.

**H-7 — SSE proxy leaks Supabase channels on stream cancel / serverless kill.**
[stream/route.ts:31-86](admin/src/app/api/dispatch/stream/route.ts:31). Cleanup is wired only to `req.signal` abort; the `ReadableStream` has no `cancel()` handler, so a consumer-side cancel leaks the Supabase channel + heartbeat interval. On Vercel, the max-duration kill may also skip abort.
*Fix:* extract a shared `cleanup()` and call it from both a `cancel()` implementation and the abort listener; add a max-lifetime timer that closes the stream so the client reconnects.

**H-8 — Realtime hook never re-opens SSE after `onerror` — "Live" silently degrades to 4s polling forever.**
[use-realtime.ts:56-60](admin/src/lib/dispatch/use-realtime.ts:56). `onerror` flips to offline and starts polling but never closes + recreates the `EventSource`; there's no backoff/explicit reconnect.
*Fix:* on error, `es.close()` and schedule a bounded-backoff reconnect, with polling as the bridge.

### Dispatch Optimizer

**H-9 — `apply_assignments` violates the DB status state machine → 500s + partially applied assignments.**
[db.py:349-355](dispatch-optimizer/src/db.py:349) unconditionally sets `status: "scheduled"`, but the trigger does not allow `dispatched → scheduled`. Auto-mode `/reassign` fetches `('scheduled','dispatched')` jobs, so any `dispatched` job raises, the per-job loop aborts mid-way (no transaction), earlier jobs are reassigned and later ones aren't — and the handler returns 500 *after* the dispatch_log was written as accepted.
*Fix:* only set `status='scheduled'` from `created`; leave status untouched otherwise; capture per-job errors and report apply failures in the response.

**H-10 — Auto-mode assignment writes no `scheduled_start`/`scheduled_end` — jobs become invisible.**
[db.py:349-355](dispatch-optimizer/src/db.py:349). A job moved to `scheduled` with NULL `scheduled_start` is never picked up by `fetch_tech_jobs`, won't appear on the dispatch board calendar, and isn't counted in workload scoring. The solver computed arrival times (`RouteStop.arrival_min`) but they're discarded before the DB write.
*Fix:* propagate `arrival_min` through `Assignment` and write `scheduled_start = day midnight (tenant tz) + arrival_min`, `scheduled_end = start + duration`.

**H-11 — Day-scoping bug: `/optimize` pulls unassigned jobs for ALL days and reinterprets their windows as today's.**
[db.py:234-246](dispatch-optimizer/src/db.py:234). `fetch_unassigned_jobs` never filters by `day`, and `_ts_to_min` strips the date — a job booked for *next Tuesday 2–4pm* enters today's solve with a 2–4pm window **today**, and auto mode would schedule it for the wrong day.
*Fix:* filter unassigned jobs to those whose window/start falls on `day` (or is NULL = floating); have `_ts_to_min` skip jobs whose local date ≠ `day`.

**H-12 — Google Routes matrix element limit makes the API path silently dead for real fleets.**
[distance.py:217-252](dispatch-optimizer/src/distance.py:217). `computeRouteMatrix` with TRAFFIC_AWARE caps at 625 elements (25×25); `_fill_missing` always requests the full k×k matrix, so anything beyond ~5 techs + 20 jobs gets a 400 that the bare `except Exception` swallows with **zero logging** — everything silently falls back to Haversine. The ">50% cache hit rate" DoD can't be met because nothing real ever enters the cache. Even one missing pair re-fetches and re-bills the entire k² matrix.
*Fix:* chunk into ≤625-element origin×destination blocks restricted to missing pairs; log API failures.

**H-13 — `.single()` raises on zero rows — every 404 path is dead code; clients get 500.**
[db.py:90-99, 248-256](dispatch-optimizer/src/db.py:90). `fetch_tenant`/`fetch_job` use `.single()`, which raises `APIError` on no rows, so the `if not tenant: 404` guards in main.py never execute.
*Fix:* use `.maybe_single()` or catch `APIError` and return None.

### Middleware

**H-14 — `Host` header controls tenant selection with no authenticated backstop yet.**
[middleware.ts:132](admin/src/middleware.ts:132). The wildcard `*.firmcraft.ai` cert means any `Host: victimslug.firmcraft.ai` routes to the victim's tenant. Subdomain is explicitly "routing, not security" with RLS as the intended backstop — but the dispatch routes currently bypass RLS via service-role. Same root exposure as CRIT-1; safe only once the routes are gated and tenant binds to the authenticated principal.

### Documentation

**H-15 — Build plan contradicts itself (and the architecture doc) on where the dispatch board lives.**
[scheduling-dispatch-build-plan.md](docs/scheduling-dispatch-build-plan.md) lines 72/89 say the board is "inside admin.firmcraft.ai", but the same doc's §2.1 (line 223) and architecture §1.6 say it's served at `{slug}.firmcraft.ai` and is *not* part of the admin panel — "that distinction is foundational." Architecture lines 819 and 1213 carry the same pre-decision residue.
*Fix:* update build plan lines 72/89 to `{slug}.firmcraft.ai/dispatch`; scrub "in the admin panel" at architecture lines 819/1213.

**H-16 — Three incompatible Phase-2 sub-phase schemes and two timelines ~8 months apart.**
Architecture Appendix A + market research §8.3 phase Phase 2 as **2a–2d, Aug 2026 → May 2027**; the build plan (and all commits/code) use **2.1–2.5, June → Sept 2026**. ai-research §8.1 has its own "Phase 1–4" colliding with the global roadmap.
*Fix:* mark the 2a–2d timelines as superseded by the build plan; rename ai-research §8.1 stages to "Stage 1–4".

**H-17 — ROADMAP contradicts the build plan on Phase 2 scope.**
[ROADMAP.md](ROADMAP.md) lists the mobile app and offline mode under "Future Considerations (2027+)", while the build plan makes the React Native + PowerSync tech app core **Phase 2.4 (ship by Sept 2026)**. ROADMAP Phase 2 also still says "Google Calendar sync" (build plan: post-launch) and "tech interface via Telegram" (superseded by the mobile app).
*Fix:* reconcile ROADMAP Phase 2 with the build plan.

**H-18 — Docs describe Clerk-JWT + RLS enforcement for the board; reality is open public routes on service-role credentials, recorded nowhere.**
Architecture §7.2/§9.3/§11.1 describe browser Realtime + JWT/RLS scoping. Actual: public dispatch routes, service-role data path, SSE proxy, no Clerk→Supabase bridge. The interim state lives only in code comments.
*Fix:* add an "Implementation status / known deviations" subsection to the architecture doc recording the interim state and the gating task (CRIT-1) that must land before onboarding a real tenant.

---

## MEDIUM

### Schema

**M-1 — Status-transition matrix is missing real-world paths.** [007_scheduling_triggers.sql:21-34](admin/supabase/migrations/20260609_007_scheduling_triggers.sql:21). No cancellation from `en_route`/`arrived`/`in_progress`/`on_hold`; no un-schedule (`scheduled → created`), no un-dispatch (`dispatched → scheduled` — which the optimizer needs, see H-9), no reinstating a cancelled job. The board's drag-drop reschedule will hit the missing un-dispatch path.
*Fix:* add `en_route/on_hold → cancelled` and the backward scheduling moves; update the lifecycle diagram in architecture §2.2 to match.

**M-2 — No audit row on INSERT.** The history trigger is AFTER UPDATE only, and jobs may be created in any status — a job inserted as `in_progress` has zero history. *Fix:* AFTER INSERT trigger writing `(previous_status = null, new_status = new.status)`.

**M-3 — Missing temporal CHECK constraints crash the availability solver.** No `check (scheduled_end > scheduled_start)` on `jobs`, no `check (ends_at > starts_at)` on `technician_availability`. A reversed range makes `tstzrange()` raise inside `check_availability`, 500-ing the endpoint for that tech/day. *Fix:* add the two CHECKs (guarding NULLs).

**M-4 — Behavior-bearing text columns lack CHECK constraints.** Most important: `technician_availability.type` — `check_availability` filters `type in ('time_off','blocked','external_calendar')`, so a typo'd `'timeoff'` row is silently ignored → tech appears free during PTO → **double-booking**. Also unconstrained: `technician_current_location.status`, `recurring_schedules.frequency`, `technician_skills.proficiency`, `jobs.source`, `dispatch_logs.trigger_type`, `customers.communication_preference`. The init migration CHECKs every text status; scheduling tables should match.

**M-5 — Missing FK indexes.** Highest value: `dispatch_logs.trigger_job_id` (high-volume table, scanned on every job delete) and the three `recurring_schedules` FKs. Also `jobs.equipment_id`, `jobs.original_tech_id`, `customers.preferred_tech_id`, `technician_zones.service_area_id`.

**M-6 — Denormalized `tenant_id` columns have no FK** on `job_status_history`, `technician_availability`, `technician_locations`, `technician_current_location`, `dispatch_logs` — and tenant_id is the RLS predicate on all of them, so a mistyped value silently mis-scopes rows. *Fix:* add `references public.tenants(id)` (NOT VALID + validate).

**M-7 — `technician_locations` is not partitioned, contradicting the doc** ("Partitioned by time for efficient cleanup"). It's the highest-write table in the module; 30-day retention via DELETE will bloat. *Fix:* partition now (cheap while empty) or update the doc and add a pg_cron batched-delete job. Related: architecture §11.2 claims a pg_cron purge job exists — **pg_cron is not enabled and no purge job is in any migration** (this is a stated privacy commitment; ship it or mark it planned).

**M-8 — `check_availability`/`eta_minutes` granted to `anon` (dead weight) and exploitable by technician JWTs.** As a technician, the restrictive `tech_own_jobs` policy hides colleagues' jobs from the busy-interval query → colleagues report as free when booked → double-booking from any future tech-facing rebooking UI. *Fix:* revoke `anon`; either restrict execute to service paths or make it `security definer` with `set search_path` + explicit tenant check.

**M-9 — Demo widget key is never created on a fresh environment.** The migration-008 insert is guarded by demo-tenant existence, but migrations run before the seed on a fresh project, so the key is silently skipped. *Fix:* move the widget-key insert into `seed-scheduling.sql`. (See also L-13 — the plaintext key itself.)

### Edge Functions

**M-10 — complete-job is non-atomic and racy.** [complete-job/index.ts:99-185](admin/supabase/functions/complete-job/index.ts:99). Status guard is read-then-write; two concurrent completes both pass, both return 200, and the second silently overwrites `invoice_data`/`actual_end`/`parts_used`/`photos`. The two UPDATEs aren't atomic — if the status transition fails, completion fields are already persisted on an `in_progress` job.
*Fix:* add `.eq("status", "in_progress")` to the field UPDATE and treat 0 rows as 409 — or collapse to a single UPDATE setting fields + status together (the trigger validates in one statement).

**M-11 — Internal DB error details leaked to clients, including the public widget path.** [_shared/response.ts:43-45](admin/supabase/functions/_shared/response.ts:43) returns `err.message` on 500, and `HttpError(500, …${error.message})` is pervasive. Constraint/column names go to callers — and `check-availability`/`create-job` are reachable with a public widget key from arbitrary websites.
*Fix:* generic message for non-`HttpError` 500s; log the real error server-side; keep the intentional 422 trigger-message passthrough.

**M-12 — create-job returns the full job row to public widget callers.** `.select("*")` ships `estimated_revenue`, `internal_notes`, `tags`, `technician_id`, etc. to untrusted embedded-widget callers.
*Fix:* when `auth.authType === "widget"`, return a trimmed shape (`id`, `status`, `title`, `scheduled_start/end`, `arrival_window_*`).

**M-13 — Rate limiting is per-isolate only; the documented DB-backed check doesn't exist.** [_shared/ratelimit.ts:4-6](admin/supabase/functions/_shared/ratelimit.ts:4) claims a DB-backed check for location updates; only the in-memory limiter exists, so effective limits are × N isolates. `sweepRateLimitWindows` is exported but never called (unbounded map growth in a long-lived isolate).
*Fix:* implement the DB-side dedup or correct the comment; call the sweep opportunistically.

**M-14 — transition-job lets a job reach `scheduled`/`dispatched` with no technician and no time.** create-job and update-job maintain "scheduled ⇒ technician assigned", but transition-job bypasses the invariant.
*Fix:* require `job.technician_id` (and arguably `scheduled_start`) when `new_status` is `scheduled`/`dispatched`; 409 otherwise.

### Dispatch Board UI

**M-15 — Drag-commit vs realtime echo race.** The PATCH triggers a realtime `change` → debounced full-board refetch that replaces `board` wholesale; under rapid drags the refetch can clobber the just-moved event with a stale snapshot. *Fix:* ignore or reconcile (by `updated_at`) echoes for jobs with an in-flight local mutation.

**M-16 — `eventReceive` external-assign has no revert.** [DispatchCalendar.tsx:182-194](admin/src/components/dispatch/DispatchCalendar.tsx:182) removes the placeholder unconditionally before the PATCH resolves; on failure (plus a failed reload) the job vanishes from view until manual refresh — unlike `eventDrop`/`eventResize`, which correctly revert. *Fix:* keep/restore the placeholder until the PATCH resolves.

**M-17 — No in-flight mutation guard on the calendar.** A fast second drop can issue a second PATCH before the first resolves. *Fix:* track in-flight job ids; ignore/queue concurrent moves.

**M-18 — `shapeJob` force-casts everything; schema drift flows through silently.** [server.ts:134-170](admin/src/lib/dispatch/server.ts:134). `Database = unknown` means zero compile-time guarantee the selected columns match `Job`; an unmapped DB status silently falls back via `statusStyle`'s `?? created`, masking drift. *Fix:* `supabase gen types` to replace `Database = unknown`, or a zod validator at the shape boundary (at minimum validate `status`/`priority` and log on miss).

**M-19 — Board window is client-supplied and unbounded.** `from`/`to` query params have no validation or max-span clamp — one request can pull every job a tenant has (amplifies CRIT-1). *Fix:* validate ISO format and clamp span (≤ 60 days) server-side.

**M-20 — `SplitPane` fragility.** [DispatchBoard.tsx:232-261](admin/src/app/dispatch/DispatchBoard.tsx:232): `leftPctRef` is referenced in a closure declared *before* the ref itself; global pointermove listener attached for the component's whole life. *Fix:* move the declaration above the effect; attach listeners only while dragging.

### Optimizer

**M-21 — Time-off/availability never consulted.** Tech selection filters on `is_active` only; `technician_availability` rows are ignored, so `/optimize` and `/emergency` route jobs to a tech on vacation. *Fix:* subtract availability blocks from the work window for the optimization day.

**M-22 — Emergency path ignores in-progress work, work hours, and clock time.** `fetch_tech_jobs` filters `('scheduled','dispatched')`, so `en_route`/`arrived`/`in_progress` jobs are invisible to disruption counting; `_current_locations` is a stub returning `{}` (drive times come from home address); no check that the tech's shift hasn't ended; "re-solve affected routes" and auto-apply are unimplemented — `/emergency` only logs even in auto mode. *Fix:* include active statuses in the displaced-jobs query; at minimum document the rest as Phase-2.3 stubs.

**M-23 — `/emergency` N+1 sequential queries** (one `fetch_tech_jobs` await per tech) inside a 5-second SLA. *Fix:* single `.in_("technician_id", […])` query grouped in Python, or `asyncio.gather`.

**M-24 — `/suggest` always evaluates "today"** even for a job booked tomorrow — availability/booked-hours context is the wrong day's. *Fix:* derive the day from the job's window/start when present. Related: disruption cost mixes minutes and hours×weights (`dispatch.py:149-150`) — units are incoherent; keep everything in minutes.

### Compliance

**M-25 — FullCalendar Premium running on the non-commercial license key.** [fullcalendar-license.ts:5-6](admin/src/lib/dispatch/fullcalendar-license.ts:5) defaults to `CC-Attribution-NonCommercial-NoDerivatives`; `@fullcalendar/resource-timeline` is a paid Premium plugin (~$590) and this board is the commercial client-facing product. No paid key is committed (correct — it belongs in env). **Launch blocker:** purchase the license and set `NEXT_PUBLIC_FULLCALENDAR_LICENSE_KEY` in prod before customer onboarding.

---

## LOW

### Schema
- **L-1** Duplicate indexes on `tenants.slug`/`tenants.custom_domain` (the UNIQUE constraints already create them) — drop the explicit ones.
- **L-2** `_free_slots` declared IMMUTABLE but output depends on session `TimeZone` — mark STABLE.
- **L-3** RLS helper functions (`tenant_id()`/`user_role()`/`tech_id()`) lack `set search_path = ''`; also a garbage non-UUID `tenant_id` claim throws on the `::uuid` cast → every query 500s instead of returning empty.
- **L-4** Restrictive policies deny rows on NULL claims — a Clerk JWT template missing `role` presents as "board is empty" with no error; document in the Clerk setup notes.
- **L-5** `on_call_rotations.members uuid[]` has no member FK enforcement, no cardinality/current_index checks, no tenant index.
- **L-6** `REPLICA IDENTITY FULL` on `jobs` — wide jsonb columns get written to WAL on every UPDATE; consider tenant-filtered channels instead if update volume grows.
- **L-7** Inconsistent ON DELETE for technician children: skills/zones/availability CASCADE but the two location tables are NO ACTION — pick one convention (CASCADE is natural for breadcrumbs).

### Edge Functions
- **L-8** tech-location's hand-rolled 429 bypasses the shared helpers — no CORS headers, so browser clients see an opaque failure instead of 429 + `Retry-After`.
- **L-9** check-availability date passes regex but not calendar validation (`2026-02-31` → Postgres cast error → 500 instead of 400) — use `z.string().date()` or a refine.
- **L-10** update-job doesn't validate `arrival_window_start < arrival_window_end` (create-job does).
- **L-11** complete-job: no fallback to the stored `customer_signature` (completing without re-sending it yields `signature_url: null` on a signed job); `customer_signature`/`photos[]` are unbounded strings (multi-MB data-URIs land in the row); `PartSchema` allows negative `qty`/`cost`/`price` into invoice_data.
- **L-12** Two paths to `completed`: transition-job leaves `invoice_data` null — document that the API flow must use complete-job, or have transition-job reject `completed`.
- **L-13** Plaintext demo widget key committed in [008_scheduling_sprint2.sql:67](admin/supabase/migrations/20260609_008_scheduling_sprint2.sql:67) (`wk_test_demo_…`, `create_job` scope, 120 req/min) and active in prod where the demo tenant exists — anyone reading the repo can spam jobs into the demo tenant. Rotate/deactivate in prod or gate on a non-prod flag (and see M-9 — move it to the seed).
- **L-14** Service-path headers (`x-tenant-id`/`x-tech-id`) not UUID-validated (garbage → Postgres cast 500s); service-key comparison is non-constant-time.
- **L-15** No overlap/double-booking guard on create-job/update-job scheduling writes — the hold/confirm flow is deferred to Sprint 3 by the plan, but even dispatcher-path conflict warnings are absent today.
- **L-16** `annotateHistory` newest-row tie-breaking can patch the wrong row (subsumed by the H-5 fix).
- **L-17** `KNOWN_SOURCES` in create-job diverges from the `jobs.source` column comment — align eventually.

### Dispatch Board UI
- **L-18** Mapbox token correctly `NEXT_PUBLIC_` — confirm it's a pk.* public-scope token with URL referrer restrictions in the Mapbox dashboard.
- **L-19** JobDetailPanel reschedule uses browser-local time while the board renders in tenant timezone — a dispatcher in another zone writes offset times.
- **L-20** `pendingStart/End` refs not reset after a successful reschedule — re-clicking re-sends stale values (idempotent, but a footgun).
- **L-21** SSE route has no explicit `maxDuration`; Vercel will kill it at the default with no graceful handoff (ties into H-7/H-8).
- **L-22** Map fit-bounds runs once per mount; selecting an off-screen job never pans — ease to the selected job when outside bounds.
- **L-23** `resolveTenant` returns `slug: ''` when only `x-tenant-id` is present — inconsistent contract.

### Optimizer
- **L-24** Deprecated `@app.on_event`; `/health` constructs throwaway providers and reaches into private `_get_redis` — use the lifespan context. New `httpx.AsyncClient` per API call — hold one on the provider. `_redis_ready` latch disables caching until restart after one Redis blip. Cache key omits grid precision (aliasing across `DISTANCE_GRID_PRECISION` changes). Cost circuit breaker is inert without Redis (`_today_spend` returns 0.0) — keep an in-process fallback counter.
- **L-25** Zero logging anywhere (`LOG_LEVEL` config exists, unused) — the swallowed exceptions in distance.py make API/cache failures undiagnosable. Score ties fall back to input order — add a deterministic secondary sort key. `_historical_avg_ticket` is an unordered `limit(2000)` sample across all time — order by `created_at desc` and window to ~90 days.
- **L-26** Dockerfile runs as root (no `USER`); test deps baked into the prod image; `.env.example` pins the live Supabase project URL (not a secret, but a template shouldn't).
- **L-27** Test gaps: no tests for `main.py` (would have caught H-9/H-13) or `db.py` (`_ts_to_min` — would have caught H-11); Redis hit path / circuit breaker / Routes-API parsing untested (H-12 would have surfaced with a mocked 400); greedy fallback never exercised when pyvroom is installed; job time-windows never set in any test; the build plan's JSON regression fixtures (§5.1) aren't implemented.

### Middleware & Docs
- **L-28** `'api'` is in the documented reserved list but **missing from `RESERVED_SUBDOMAINS`** in middleware.ts:33 — a tenant could register slug `api` and collide with a future `api.firmcraft.ai`. No DB/onboarding check prevents reserved slugs at registration; derive both from one shared constant. Multi-level subdomains collapse to the first label (`foo.admin.firmcraft.ai` → tenant `foo`) — reject `labels.length > 1`. Tenant cache: error-path lookups aren't negative-cached (DB stampede on a bogus erroring slug); no max-size guard. When Clerk keys are absent the app silently runs with no auth at all (noopMiddleware) — fine for dev, but prod should fail closed.
- **Docs LOW (roll-up):** `auth.tenant_id()` in architecture §2.3/§9.3 should be `public.tenant_id()` (hosted Supabase blocks the auth schema — following the doc verbatim fails); architecture §9.2 endpoint catalog doesn't match what shipped (lists never-built endpoints like `/dispatch/accept`, `/schedule/slots`; omits `transition-job`/`update-job`; presents the FastAPI optimizer as Edge Functions); `widget_keys` (18th table) and `jobs.invoice_data` missing from the documented data model; Phase 2.1 Sprint 3 (Hermes skills, hold tokens, storage buckets, webhook_events queue) silently skipped while 2.2/2.3 shipped — and 2.3's DoD ("board shows optimization suggestions with accept/reject") is unmet (the SSE stream never relays `dispatch_logs`; no suggestions UI exists); build plan dates/migration filenames are stale (plan says `20260616_*`, actual is `20260609_001–009`); ROADMAP "Last updated: June 8" predates its own June 9 content; build plan §1 table list undercounts by 4 (+widget_keys); `billing-spec.md` still uses Spark/Flow/Forge (rebranded Solo/Team/Pro in code) with a $3,500-vs-$3K setup-fee discrepancy; market research's "$99-199/month" floor disagrees with the other docs' $149-199.

---

## Recommended Fix Order

1. **Before merging anything further:** CRIT-1 step 1 (strip tenant headers on all surfaces — tiny diff), CRIT-2 (fail-closed issuer), CRIT-3 (optimizer bearer token + bind localhost).
2. **Before the optimizer runs in auto mode against real data:** H-9, H-10, H-11 (they corrupt schedules), plus M-1's `dispatched → scheduled` trigger addition.
3. **Schema hardening migration (one PR):** H-1, H-2, H-3, H-4, M-1–M-6 — all small SQL, best landed before data accumulates.
4. **Edge Function hardening (one PR):** H-5, M-10–M-14, L-9–L-11.
5. **Board robustness (one PR):** H-6, H-7, H-8, M-15–M-19.
6. **Docs reconciliation pass:** H-15–H-18 + the docs LOW roll-up — one editing session.
7. **Before customer onboarding:** M-25 (FullCalendar license), L-13 (rotate demo widget key), CRIT-1 steps 2–3 (Clerk gating + JWT bridge).

---

## What's Working Well / Architecturally Sound

**Schema.** All 17 spec tables present with columns/types matching architecture §2.1 essentially verbatim — including the composite `idx_jobs_dispatch` partial index, soft-delete columns, and the Sprint-2 additions properly layered on. `timestamptz` everywhere, `numeric(10,2)` for money, `geometry(POINT/POLYGON, 4326)` with GIST indexes matching the spec. RLS enabled on every scheduling table (no locked-out or accidentally open tables); the restrictive-policy refactor of the doc's example is a genuine correctness improvement; the `auth`→`public` JWT-helper deviation is sound and documented inline. The transition trigger is well built for what it covers (`IS NOT DISTINCT FROM` no-op guard, helpful error messages, proper errcode, correct serialization under concurrent updates, no recursion paths). Migrations are consistently idempotent (`if not exists`, enum guards, guarded publication adds). Seed data has full internal FK integrity, realistic Houston geo data consistent between JSON addresses and PostGIS points, and covers all 10 lifecycle states.

**Edge Functions.** Tenant-isolation discipline is excellent: every query in every function scopes by the resolved auth context's tenant; `tenant_id` is never read from the request body. The widget path is well designed — SHA-256-hashed keys, scope gating, forced `source`, technician self-assignment stripped; no privilege escalation found on the path itself. JWT verification mechanics (apart from CRIT-2's fallback) are correct: issuer peeked then pinned, JWKS verification with issuer assertion. No SQL injection surface (PostgREST builders/RPC params throughout; the one string-built EWKT value is `Number.isFinite`-gated). No mass assignment (`.strict()` zod + explicit field whitelists). The availability solver's timezone math (`at time zone` per tenant) handles DST correctly, `_free_slots` handles nested/overlapping busy intervals and back-to-back boundaries correctly, and the skill filter's "has ALL required skills" double-negation is right. **complete-job's `invoice_data` matches the build plan §6.3 contract exactly** — every key, name, and nesting level.

**Dispatch Board.** Clean client/server separation: the service-role key is gated behind `import 'server-only'` and never reaches the browser; client code talks only to `/api/dispatch/*`. Optimistic drag/resize with correct revert on failure. The status state machine in `status.ts` mirrors the Postgres trigger and gates quick-actions before hitting the DB, with 422 trigger messages surfaced to the user. The realtime design — lightweight "something changed" ping + clean refetch — deliberately avoids the PostGIS-WKB-in-realtime-payload problem and is documented in the route. Hooks correctly use refs to avoid stale closures and subscription churn. Typecheck passes with zero errors.

**Optimizer.** VROOM problem construction is unit-consistent (verified empirically against pyvroom's route frame: location index layout, seconds-based matrix and time windows, skill-id mapping, job-id round-tripping). Scoring weights match the build plan exactly (0.30/0.20/0.25/0.15/0.10), drive-time sign is correct, all dimensions clamp to [0,1] with division-by-zero guards. Full schema cross-check passes — every selected column and the dispatch_logs insert payload exist with matching names/types. Blocking Supabase calls correctly wrapped in `asyncio.to_thread`. Haversine math and fallback units are correct. Deps fully pinned. 23 tests pass against the real solver.

**Cross-cutting.** No secrets committed (full scan of all 73 changed files); `.env.example` files are placeholders-only; `.gitignore` correctly excludes `.venv`/`__pycache__`/`.env`/`node_modules` and none are tracked; the untracked repo-root cruft was confirmed absent from all four commits; no large/binary junk in the branch. `tsconfig` excludes exactly the Deno code and nothing else. Zero stray TODO/FIXME markers — deferred work is captured in honest, accurate prose comments (the "MUST be gated before real tenants onboard" notes), which is exactly the right practice; the gap is that the docs don't echo them (H-18).

**Process note.** Sprint 1 and Sprint 2 fidelity to the build plan is excellent — seed data matches the spec to the row, the six Edge Functions match the Sprint 2 task list 1:1, and code landed exactly where the plan's repo map said it would. The main process gap is that Phase 2.1 Sprint 3 was skipped without being recorded anywhere, and no doc tracks per-sub-phase status — adding a simple progress checklist to the build plan would prevent this drift.
