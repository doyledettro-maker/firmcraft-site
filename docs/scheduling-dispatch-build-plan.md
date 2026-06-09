# Scheduling & Dispatch Module: Build Plan

**Module:** Phase 2 — Scheduling + Dispatch
**Version:** 1.0
**Date:** June 8, 2026
**Author:** Firmcraft Engineering
**Status:** Ready for execution
**Target:** Production-ready by September 2026

---

## How to Read This Document

This is the execution plan for Firmcraft's scheduling and dispatch module. It is designed to be run by Doyle (solo founder) directing AI coding agents (Claude Code sessions). Every task is written at the specificity level an AI agent needs to execute without ambiguity.

The architecture document ([scheduling-dispatch-architecture.md](scheduling-dispatch-architecture.md)) is the source of truth for *what* to build. This document is the source of truth for *when* and *how*.

**Related docs:** [Market Research](scheduling-dispatch-market-research.md) · [AI/ML Research](ai-scheduling-dispatch-research.md) · [ROADMAP.md](../ROADMAP.md)

---

## Table of Contents

1. [Build Phases](#1-build-phases)
2. [Technology Setup](#2-technology-setup)
3. [Sprint-Level Breakdown (Phase 2.1)](#3-sprint-level-breakdown-phase-21)
4. [Risk Register](#4-risk-register)
5. [Testing Strategy](#5-testing-strategy)
6. [Integration Checklist](#6-integration-checklist)
7. [Go-to-Market for Phase 2](#7-go-to-market-for-phase-2)

---

## 1. Build Phases

The build is structured as five sub-phases of roadmap **Phase 2 (Scheduling + Dispatch)** — numbered **Phase 2.1 – Phase 2.5** to keep them distinct from the global roadmap phase numbers — each delivering a usable increment that can be demoed and tested with real contractors. Total timeline: 14 weeks (June 16 — September 19, 2026).

The timeline is aggressive but achievable because: (a) the architecture is already defined, (b) AI coding agents can execute well-scoped tasks fast, and (c) we are building on an existing stack (Supabase, Next.js, Vercel, Hermes) rather than starting from zero.

### Phase 2.1: Data Foundation + Core API (Weeks 1–3)

**What's being built:** The Supabase schema, RLS policies, Edge Functions for job CRUD, and the basic Hermes skills for job management. This is the boring-but-essential foundation that everything else depends on.

**Features:**

- Full Supabase schema: tenants, technicians, customers, jobs, job_types, skills, technician_skills, technician_availability, job_status_history, equipment, recurring_schedules, service_areas, on_call_rotations
- Row-Level Security policies on every table (tenant isolation + role-based access)
- Job lifecycle state machine with Postgres trigger enforcing valid transitions
- Edge Functions: job CRUD (create, read, update, cancel, complete), technician CRUD, customer CRUD
- Hermes skills: `create_job`, `update_job`, `cancel_job`, `complete_job`, `list_jobs`, `get_job`
- Seed data: demo tenant with 5 techs, 10 customers, 3 job types, sample skill definitions
- Clerk role configuration: add `dispatcher` and `technician` roles

**Estimated duration:** 3 weeks

**Dependencies:** None — this is the starting layer.

**Deliverable:** Doyle can create, assign, and complete jobs via Hermes commands in Telegram. "Book an AC repair for Tom at 2pm Friday, assign Dave" creates a real database record. "What jobs do we have tomorrow?" returns a formatted list.

**Definition of done:**

- All tables created with correct indexes and RLS policies
- `SELECT * FROM jobs` as Tenant A returns zero rows from Tenant B (RLS test)
- Job status transitions enforced: `created → completed` rejected, `created → scheduled → dispatched → en_route → arrived → in_progress → completed` accepted
- Every status change writes to `job_status_history`
- Hermes can create a job, list jobs by date, and complete a job via natural language
- Seed script populates a demo tenant for testing

### Phase 2.2: Dispatch Board + Map View (Weeks 4–6)

**What's being built:** The web-based dispatch board inside admin.firmcraft.ai, with a FullCalendar resource timeline view (technicians as rows, time as columns), drag-and-drop job assignment, and a Mapbox map overlay showing job locations.

**Features:**

- FullCalendar Premium integration: resource timeline (day/week views), techs as resources, jobs as events
- Drag-and-drop: move jobs between techs, resize to change duration, drag unassigned jobs from sidebar
- Mapbox GL JS map panel: job pins (color-coded by status), tech home locations
- Supabase Realtime subscriptions: jobs channel, tech locations channel
- Unassigned jobs sidebar: list of `created` status jobs waiting for assignment
- Job detail panel: click a job to see customer info, notes, status history
- Conflict detection: visual warning when dropping a job onto an occupied time slot
- Filter controls: by date, by tech, by job status, by job type

**Estimated duration:** 3 weeks

**Dependencies:** Phase 2.1 (schema + API must exist).

**Deliverable:** Doyle opens admin.firmcraft.ai/dispatch and sees today's schedule laid out as a timeline. He can drag an unassigned job onto Dave's row at 2pm. The map shows where each job is located. Changes made via Hermes appear on the board in real-time.

**Definition of done:**

- FullCalendar renders with tech rows and job event blocks
- Drag-and-drop updates the database and persists on refresh
- Mapbox map shows job pins with status colors
- Real-time: a job created via Hermes CLI appears on the board within 2 seconds
- Unassigned jobs list updates when jobs are assigned
- Conflict warning appears when scheduling overlapping jobs for the same tech
- Day and week views both work correctly

### Phase 2.3: Dispatch Optimizer + Hermes Dispatch Skills (Weeks 7–9)

**What's being built:** The Python/FastAPI dispatch optimizer service wrapping VROOM, the multi-objective scoring engine, the distance matrix cache, and the Hermes skills for dispatch commands. This is where the AI intelligence lives.

**Features:**

- Python/FastAPI microservice on Hetzner VPS (alongside Hermes)
- VROOM integration via pyvroom: problem builder translates DB state into VROOM input
- Google Routes API integration: distance/duration matrix with Redis caching (24h TTL, grid-cell keys)
- Scoring engine: weighted multi-objective (drive time 0.30, skill match 0.20, revenue 0.25, workload 0.15, customer preference 0.10)
- Three dispatch modes: manual (suggestions only), assist (top 3 shown, dispatcher clicks to accept), auto (auto-assign with 5-min override window)
- Skill-based routing: VROOM enforces hard skill constraints, scoring engine applies soft preferences
- Emergency dispatch flow: identify nearest qualified tech, compute disruption cost, re-solve affected routes
- Rolling re-optimization: configurable cadence (default 15 min), threshold for applying changes (default 10% score improvement)
- Hermes skills: `auto_assign`, `reassign_tech_jobs`, `emergency_dispatch`, `optimize_routes`, `find_nearest_tech`, `check_availability`
- Dispatch log: every optimization run logged to `dispatch_logs` with input snapshot, solution, solve time, accepted status
- Dispatch suggestions surface on the dispatch board via Supabase Realtime

**Estimated duration:** 3 weeks

**Dependencies:** Phase 2.1 (data model), Phase 2.2 (dispatch board for displaying suggestions). The optimizer can be developed in parallel with late Phase 2.2 work — the API is independent of the UI.

**Deliverable:** Doyle says "Assign the unassigned jobs for tomorrow" in Hermes. The optimizer runs VROOM, scores assignments, and returns ranked suggestions: "Dave (score 0.87): 12 min drive, EPA certified. Mike (score 0.72): 8 min drive, 6 jobs already." In assist mode, the dispatch board shows a pulsing notification; clicking "Accept" assigns the jobs. Emergency: "Emergency AC out at 123 Oak, needs someone now" triggers instant re-optimization.

**Definition of done:**

- VROOM solves a 10-tech / 50-job problem in under 1 second
- Distance matrix cache achieves >50% hit rate after first optimization run of the day
- Scoring engine produces different rankings when weights are changed
- Emergency dispatch returns nearest qualified tech within 5 seconds
- Dispatch board shows optimization suggestions with accept/reject buttons
- "Dave called in sick, reassign his jobs" via Hermes re-distributes all of Dave's jobs
- Dispatch logs capture every optimization run with full input/output snapshot
- All three dispatch modes (manual/assist/auto) work end-to-end

### Phase 2.4: Mobile App MVP (Weeks 10–13)

**What's being built:** The React Native + Expo technician app with PowerSync offline-first sync. This is the app techs use in the field every day.

**Features:**

- Expo project setup with TypeScript, React Navigation, and Expo Router
- PowerSync integration: SQLite ↔ Supabase Postgres sync with bucket definitions (tech sees their own jobs for 7 days)
- Daily schedule screen: scrollable timeline, job cards with customer/address/type/time, large status button at bottom
- Job detail screen: customer info (tap to call), address (tap to navigate via Google Maps deep link), job description, checklist, notes, equipment history
- Status progression: "Start Drive" → "Arrived" → "Start Work" → "Complete" — one-tap advancement
- Photo capture: expo-camera integration, before/during/after flow, compression via react-native-compressor, upload to Supabase Storage
- Customer signature: react-native-signature-canvas at job completion, SVG stored in Supabase Storage
- Push notifications: expo-notifications + Firebase Cloud Messaging for new job assignments, schedule changes, emergencies
- GPS location sharing: expo-location background tracking during work hours, adaptive polling (30s on job, 5min idle), POST to Edge Function
- Pull-to-refresh for manual sync
- Offline capability: view schedule, update job status, add notes, capture photos — all work without connectivity, sync on reconnect

**Estimated duration:** 4 weeks

**Dependencies:** Phase 2.1 (API), Phase 2.3 (push notifications from dispatch events). The mobile app can start development at week 8 in parallel with final Phase 2.3 work — it consumes the same API.

**Deliverable:** A tech installs the app on their phone, logs in, and sees today's jobs. They tap "Start Drive," the app opens Google Maps navigation. On arrival they tap "Arrived," take photos, complete the checklist, collect a signature, and tap "Complete." In a basement with no signal, everything still works — photos and status changes sync when they surface.

**Definition of done:**

- App installs via Expo Go (dev) or TestFlight (staging) on iOS and Android
- Tech sees only their assigned jobs (PowerSync bucket filtering confirmed)
- Full offline cycle: go airplane mode → view jobs → change status → add notes → take photo → go back online → everything syncs within 30 seconds
- Photos compressed to <500KB before upload
- Signature captured and visible in job detail on the web dispatch board
- Push notification received within 5 seconds of a new job assignment
- GPS location visible on the dispatch board map while the tech's app is active
- Cold start under 3 seconds on a mid-range Android device
- 56dp touch targets on all primary action buttons

### Phase 2.5: Customer Notifications + Polish (Weeks 13–14)

**What's being built:** Automated customer communications (SMS confirmations, reminders, ETA updates, delay notifications), the customer self-service reschedule/cancel flow, and final polish across all surfaces.

**Features:**

- SMS notification flows via Twilio (existing):
  - Appointment confirmation on job creation
  - 24-hour reminder
  - 2-hour reminder
  - "Tech is on the way" with ETA when status changes to `en_route`
  - Delay notification when job runs 30+ min over estimate
- **Review flywheel (late-sprint scope, originally a Digital Ops feature):** the full loop, not just the request — `job.completed` → 2-hour-delay SMS review request → Google review link → inbound review matched back to `job_id` → AI-drafted response queued for one-tap approval. This ships here because it only depends on job-completion events, and it seeds the reputation dashboard the Digital Ops module (roadmap Phase 5) builds out later.
- Email confirmation via Resend (existing): branded HTML template with job details, tech name, what-to-expect
- Customer reschedule/cancel page: Next.js public route, short-lived token (no login), see available slots, pick new time or cancel with reason
- Hermes notification skills: `send_confirmation`, `send_eta`, `send_delay`, `send_reminder`
- Proactive dispatcher alerts via Hermes:
  - Job running 30+ min over estimate
  - Tech idle 20+ min between jobs
  - Certification expiring in 30 days
- Dispatch board polish: loading states, error handling, empty states, keyboard shortcuts
- Mobile app polish: error boundaries, retry logic, haptic feedback on status changes

**Estimated duration:** 2 weeks (overlaps with final week of Phase 2.4)

**Dependencies:** Phase 2.1 (job data), Phase 2.3 (ETA calculations from dispatch engine), Phase 2.4 (mobile status changes trigger notifications).

**Deliverable:** A customer receives an SMS: "Your AC repair with CoolAir HVAC is confirmed for Thursday 2-4pm. Your technician will be Dave." The day of, they get: "Your technician Dave is on the way! ETA: 15 minutes." If Dave runs late: "We're sorry — your technician is running about 30 minutes behind. Updated arrival: 2:30pm." After the job: "Thanks for choosing CoolAir! How was your experience with Dave? [Review link]"

**Definition of done:**

- Full notification sequence fires correctly through the job lifecycle
- Customer can reschedule via the link in their confirmation SMS
- Rescheduling releases the old slot and books the new one
- Cancellation updates customer's cancel count and notifies dispatcher
- Proactive alerts fire in Hermes when jobs run long or techs go idle
- Review flywheel runs end to end: completed job triggers the review request, an inbound review is matched to its job, and an AI-drafted response is queued for approval
- No unhandled errors or blank screens in dispatch board or mobile app
- End-to-end demo: phone call (Phase 1) → job created → dispatched → tech drives → arrives → completes → customer notified → review requested → AI-drafted review response queued

---

## 2. Technology Setup

### 2.1 Repositories

**No new repos needed.** All code lives in existing repositories:

| Component | Location | Notes |
|---|---|---|
| Supabase schema + Edge Functions | `firmcraft-site/admin/supabase/` | Extend existing Supabase project. Migrations go in `supabase/migrations/`. Edge Functions in `supabase/functions/`. |
| Dispatch board UI | `firmcraft-site/admin/src/app/dispatch/` | New route group in existing admin Next.js app (admin.firmcraft.ai) |
| Dispatch optimizer | `firmcraft-site/voice-agent/` or new `dispatch-optimizer/` dir on Hetzner | Python/FastAPI service, lives alongside Hermes on the VPS |
| Hermes scheduling skills | Hermes agent codebase (Hetzner VPS) | New skill files added to existing Hermes skill registry |
| Mobile app | **New directory:** `firmcraft-mobile/` | Expo project, separate from web codebase. Could be a new repo or a top-level directory. Recommend new repo `firmcraft-mobile` for clean EAS build config. |
| Customer notification pages | `firmcraft-site/admin/src/app/(public)/` | Public routes (no auth) for reschedule/cancel/tracking |

### 2.2 Package & Dependency Decisions

**Admin Panel (Next.js) — new dependencies:**

```
@fullcalendar/core
@fullcalendar/resource-timeline  (Premium — $590 one-time license)
@fullcalendar/interaction        (drag-and-drop)
@fullcalendar/daygrid
mapbox-gl
@types/mapbox-gl
```

**Dispatch Optimizer (Python) — new service:**

```
fastapi
uvicorn
pyvroom          (VROOM solver bindings)
httpx            (async HTTP client for Google Routes API)
redis            (Redis client for distance matrix cache)
supabase         (Python Supabase client)
pydantic         (request/response validation)
```

**Mobile App (React Native) — new project:**

```
expo (SDK 53+)
expo-router
@powersync/react-native
@supabase/supabase-js
expo-camera
expo-location
expo-notifications
react-native-compressor
react-native-signature-canvas
@react-navigation/native
react-native-maps (or mapbox-react-native)
```

### 2.3 Infrastructure to Provision

**Supabase (existing project — extend):**

- Enable PostGIS extension: `CREATE EXTENSION IF NOT EXISTS postgis;`
- Enable `pg_cron` extension for scheduled cleanup of location history
- Run schema migrations (all tables from architecture doc Section 2)
- Configure Realtime for tables: `jobs`, `technician_current_location`, `technician_availability`, `dispatch_logs`
- Create Supabase Storage buckets: `job-photos`, `signatures`, `documents`
- Configure PowerSync connection (requires PowerSync cloud account)

**Hetzner VPS (existing — extend):**

- Install Python 3.11+ and pyvroom dependencies (requires CMake, C++ compiler for VROOM build)
- Set up dispatch optimizer as a systemd service alongside Hermes
- Configure Caddy reverse proxy to route `/dispatch-api/*` to the FastAPI service
- Install Redis (or use Upstash serverless Redis to avoid managing another process)

**Upstash Redis (new):**

- Create a serverless Redis instance for distance matrix cache and location cache
- Free tier handles up to 10K commands/day; Pay-as-you-go at $0.20 per 100K commands
- Connection string goes in VPS environment variables

**PowerSync Cloud (new):**

- Create account at powersync.com
- Configure sync rules (bucket definitions from architecture doc Section 5.3)
- Connect to existing Supabase Postgres instance
- Free tier supports development; $49/mo for production

**Radar.io (new — Phase 2.5 or post-launch):**

- Create account, get API keys
- Not needed for MVP — geofencing is a polish feature. Manual "Arrived" button works for launch.

**FullCalendar Premium License (new):**

- Purchase Premium license ($590 one-time) for the resource-timeline plugin
- License key goes in admin panel environment variables

**Mapbox (new):**

- Create account, get access token
- Free tier: 50K map loads/month (more than sufficient for launch)
- Token goes in admin panel environment variables

**Firebase (extend existing or new):**

- Create a Firebase project (or use existing)
- Enable Cloud Messaging
- Generate iOS + Android credentials for push notifications
- Configure expo-notifications with FCM credentials

**Clerk (existing — extend):**

- Add roles: `dispatcher`, `technician`
- Add custom JWT claims: `tenant_id`, `role`, `tech_id`
- Configure Supabase JWT template in Clerk dashboard

### 2.4 Development Environment Setup

For a Claude Code agent session to work on this project, it needs:

**For schema/API work:**
- Supabase CLI installed (`npx supabase`)
- Access to Supabase project credentials (`.env.local`)
- Ability to run migrations: `supabase db push`

**For dispatch board work:**
- Node.js 18+, npm
- Admin panel project running locally: `cd admin && npm run dev`
- FullCalendar license key in env
- Mapbox token in env

**For dispatch optimizer work:**
- Python 3.11+
- `pip install pyvroom` (requires build tools — may need to install via Docker on some systems)
- Google Routes API key
- Redis connection string

**For mobile app work:**
- Node.js 18+, Expo CLI
- Expo Go app on a test phone (or iOS Simulator / Android Emulator)
- PowerSync cloud credentials
- Firebase project credentials

---

## 3. Sprint-Level Breakdown (Phase 2.1)

Phase 2.1 spans 3 weeks. Each "sprint" below is roughly one week of focused AI agent work sessions. Tasks are ordered by dependency — later tasks may depend on earlier ones within the same sprint.

### Sprint 1 (Week 1): Schema + RLS + Seed Data

**Goal:** All database tables exist with correct constraints, indexes, RLS policies, and demo data.

**Tasks:**

1. **Enable PostGIS extension**
   - Run: `CREATE EXTENSION IF NOT EXISTS postgis;` on Supabase project
   - Verify: `SELECT PostGIS_Version();` returns a version string

2. **Create Supabase migration: core tenant + technician tables**
   - File: `supabase/migrations/20260616_scheduling_core.sql`
   - Tables: `tenants`, `service_areas`, `technicians`, `skills`, `technician_skills`, `technician_zones`
   - Include all columns, types, constraints, indexes exactly as specified in architecture doc Section 2.1
   - Include PostGIS geometry columns for `service_areas.boundary`

3. **Create Supabase migration: customer + equipment tables**
   - File: `supabase/migrations/20260617_scheduling_customers.sql`
   - Tables: `customers`, `equipment`
   - Include PostGIS point column for `customers.location`
   - Include all indexes from architecture doc

4. **Create Supabase migration: job tables**
   - File: `supabase/migrations/20260618_scheduling_jobs.sql`
   - Create enums: `job_status`, `job_priority`
   - Tables: `job_types`, `jobs`, `job_status_history`, `recurring_schedules`
   - Include all indexes, especially the composite `idx_jobs_dispatch` index
   - Include the `deleted_at` soft-delete columns

5. **Create Supabase migration: availability + location + dispatch tables**
   - File: `supabase/migrations/20260619_scheduling_operations.sql`
   - Tables: `technician_availability`, `technician_locations`, `technician_current_location`, `on_call_rotations`, `dispatch_logs`
   - Include the partitioning index on `technician_locations`

6. **Create Supabase migration: RLS policies**
   - File: `supabase/migrations/20260620_scheduling_rls.sql`
   - Create `auth.tenant_id()` function that reads from Clerk JWT
   - Enable RLS on every table
   - Create `tenant_isolation` policy on every table with `tenant_id`
   - Create `tech_own_jobs` policy on `jobs` table (techs see only their assigned jobs)
   - Create similar role-scoped policies on `technician_locations`, `dispatch_logs`

7. **Create Supabase migration: job status transition trigger**
   - File: `supabase/migrations/20260621_scheduling_triggers.sql`
   - Create function `validate_job_status_transition()` that enforces valid state transitions per the lifecycle diagram in architecture doc Section 2.2
   - Valid transitions: `created→scheduled`, `scheduled→dispatched`, `dispatched→en_route`, `en_route→arrived`, `arrived→in_progress`, `in_progress→completed`, `in_progress→on_hold`, `on_hold→in_progress`, `scheduled→cancelled`, `dispatched→cancelled`, `created→cancelled`, `completed→invoiced`
   - Invalid transitions are rejected with a descriptive error
   - Create trigger `trg_job_status_transition` BEFORE UPDATE on `jobs`
   - Create function `log_job_status_change()` that inserts into `job_status_history` on every status change
   - Create trigger `trg_job_status_log` AFTER UPDATE on `jobs` when `OLD.status IS DISTINCT FROM NEW.status`

8. **Create seed script for demo tenant**
   - File: `supabase/seed.sql` or `scripts/seed-scheduling.sql`
   - Create 1 demo tenant (timezone: America/Chicago, business hours Mon-Fri 8am-5pm)
   - Create 5 technicians with names, skills, home addresses (Houston area), work hours
   - Create 3 skills: "EPA 608 Universal", "Journeyman Electrician", "Licensed Plumber"
   - Create skill assignments (not every tech has every skill)
   - Create 10 customers with addresses (Houston area, with lat/lng for PostGIS)
   - Create 4 job types: "AC Tune-Up" (60 min), "Furnace Repair" (90 min), "Panel Upgrade" (240 min), "Drain Cleaning" (45 min)
   - Create 15 sample jobs across various statuses
   - Create 2 service areas: "North Houston", "South Houston" as PostGIS polygons

9. **Run all migrations and verify**
   - Run `supabase db push` (or apply migrations via Supabase dashboard)
   - Run seed script
   - Verify: query each table and confirm data exists
   - Verify: RLS test — query jobs as wrong tenant returns empty
   - Verify: status transition test — attempt invalid transition, confirm rejection

### Sprint 2 (Week 2): Edge Functions + API Layer

**Goal:** All CRUD operations available via API. Jobs can be created, read, updated, cancelled, and completed through Edge Functions with proper validation.

**Tasks:**

1. **Create Edge Function: job creation**
   - File: `supabase/functions/create-job/index.ts`
   - Input: `{ customer_id, job_type_id, title, description, priority, scheduled_start, scheduled_end, arrival_window_start, arrival_window_end, technician_id? }`
   - Validation with Zod: required fields, valid UUIDs, `scheduled_start < scheduled_end`, valid priority enum
   - Auto-populate: `estimated_duration` from job_type default, `address` and `location` from customer record, `estimated_revenue` from job_type
   - If `technician_id` provided: set status to `scheduled`; else set to `created`
   - Return the created job record
   - Auth: require valid Clerk JWT, extract `tenant_id`

2. **Create Edge Function: job update**
   - File: `supabase/functions/update-job/index.ts`
   - Input: `{ job_id, ...fields_to_update }`
   - Allow updating: `title`, `description`, `priority`, `scheduled_start`, `scheduled_end`, `technician_id`, `arrival_window_*`, `tech_notes`, `internal_notes`, `tags`, `checklist`, `parts_used`
   - When `technician_id` changes on a `created` job: auto-transition to `scheduled`
   - Validate `scheduled_start < scheduled_end` if either is being changed
   - Auth: dispatcher or admin role required

3. **Create Edge Function: job status transition**
   - File: `supabase/functions/transition-job/index.ts`
   - Input: `{ job_id, new_status, reason?, metadata? }`
   - The Postgres trigger handles validation — this function just attempts the UPDATE and returns success/failure
   - Special handling for `completed`: validate that `actual_start` is set, set `actual_end` to now()
   - Special handling for `en_route`: set ETA based on tech current location → job location (if location service available, else skip)
   - Special handling for `cancelled`: set `reason` in status history metadata
   - Auth: techs can transition their own jobs; dispatchers can transition any job

4. **Create Edge Function: job completion**
   - File: `supabase/functions/complete-job/index.ts`
   - Input: `{ job_id, tech_notes?, parts_used?, photos?, customer_signature? }`
   - Sets `actual_end` to now(), calculates actual duration
   - Stores photos URLs and signature URL
   - Assembles invoice-ready data package (for Phase 4 Invoicing): `{ services, parts, labor_hours, labor_rate, travel_time }`
   - Transitions status to `completed`
   - Returns the completed job with assembled invoice data

5. **Create Edge Function: technician availability check**
   - File: `supabase/functions/check-availability/index.ts`
   - Input: `{ date, duration_minutes, job_type_id?, zone_id? }`
   - Queries: tech work hours for the requested date, existing job assignments, time-off blocks from `technician_availability`
   - Computes available slots per tech: subtract assigned jobs and blocked time from work hours
   - If `job_type_id` provided: filter to techs with required skills
   - If `zone_id` provided: filter to techs assigned to that zone
   - Returns: `[{ tech_id, tech_name, available_slots: [{ start, end }] }]`

6. **Create Edge Function: tech location update**
   - File: `supabase/functions/tech-location/index.ts`
   - Input: `{ lat, lng, accuracy, speed, heading }`
   - Auth: extract `tech_id` from JWT
   - Upsert `technician_current_location` (one row per tech)
   - Append to `technician_locations` (history)
   - Rate limit: max 2 updates per second per tech (dedup by timestamp)
   - Return: `{ ok: true }`

7. **Verify PostgREST auto-generated endpoints**
   - Confirm these work via Supabase client:
     - `GET /rest/v1/jobs?tenant_id=eq.X&scheduled_start=gte.DATE` (list jobs by date)
     - `GET /rest/v1/technicians?tenant_id=eq.X&is_active=eq.true` (list techs)
     - `GET /rest/v1/customers?tenant_id=eq.X` (list customers)
   - Confirm RLS filters results correctly (only tenant's own data)

8. **Create integration tests for all Edge Functions**
   - File: `supabase/tests/scheduling-api.test.ts`
   - Test cases:
     - Create job → verify it appears in the database
     - Create job with technician → verify status is `scheduled`
     - Attempt invalid status transition → verify rejection
     - Complete job → verify `actual_end` is set and invoice data assembled
     - Check availability → verify blocked times are excluded
     - RLS: create job as Tenant A, query as Tenant B → verify empty result
     - Location update → verify `technician_current_location` is updated

### Sprint 3 (Week 3): Hermes Skills + Realtime Setup

**Goal:** Hermes can manage the full job lifecycle via natural language. Supabase Realtime is configured and tested.

**Tasks:**

1. **Create Hermes skill: `create_job`**
   - LLM function-calling tool definition with parameters: `customer_name` (string), `service_type` (string), `date` (string), `time` (string), `preferred_tech` (string, optional), `priority` (string, optional), `description` (string, optional)
   - Implementation:
     - Fuzzy match `customer_name` against `customers` table (ILIKE search, return top 3 if ambiguous)
     - Match `service_type` against `job_types.name` (fuzzy match)
     - Resolve `preferred_tech` against `technicians.name`
     - Parse `date` and `time` into `scheduled_start` (handle "Thursday", "next Tuesday", "tomorrow 2pm")
     - Calculate `scheduled_end` from job type's `default_duration`
     - Call the `create-job` Edge Function
     - Return natural language confirmation: "Booked [job type] for [customer] on [date] at [time]. Assigned to [tech]. Confirmation sent."
   - If customer not found: "I couldn't find a customer named [X]. Did you mean [suggestions]? Or should I create a new customer?"
   - If tech not available: "Dave is booked at that time. [Alternative tech] is available, or I can try [alternative time]. What would you prefer?"

2. **Create Hermes skill: `list_jobs`**
   - Parameters: `date` (string, default "today"), `technician` (string, optional), `status` (string, optional)
   - Query jobs with filters, ordered by `scheduled_start`
   - Return formatted list: "Tomorrow's schedule (6 jobs): 8:00am — AC Tune-Up at 123 Oak St (Dave), 9:30am — Drain Cleaning at 456 Elm St (Mike), ..."

3. **Create Hermes skill: `get_job`**
   - Parameters: `job_id` (string) or `customer_name` + `date` (for lookup)
   - Return detailed job info: customer, address, type, tech, status, notes, history

4. **Create Hermes skill: `update_job`**
   - Parameters: `job_identifier` (customer name + date, or job ID), plus fields to change
   - Handle: "Move the Johnson job to Wednesday", "Assign Mike to the 3pm", "Change the priority to urgent"
   - Confirm before executing: "I'll move Mrs. Johnson's AC Repair from Tuesday 2pm to Wednesday 2pm. Dave is still assigned. Confirm?"

5. **Create Hermes skill: `cancel_job`**
   - Parameters: `job_identifier`, `reason` (optional)
   - Confirm before executing
   - Return: "Cancelled the 3pm AC repair at 123 Oak St. The slot is now open."

6. **Create Hermes skill: `complete_job`**
   - Parameters: `job_identifier`, `notes` (optional), `parts_used` (optional)
   - Intended for dispatcher/owner use (techs complete via mobile app)
   - Return: "Marked Dave's AC repair at Johnson's as complete. Duration: 1h 45m."

7. **Create Hermes skill: `check_availability`**
   - Parameters: `date` (string), `duration` (string, e.g., "2 hours"), `skills` (string[], optional)
   - Call the `check-availability` Edge Function
   - Return: "Three techs available on Tuesday for a 2-hour block: Dave (8am-12pm), Sarah (1pm-5pm), Mike (9am-1pm). Dave and Mike are EPA certified."

8. **Create Hermes skill: `set_time_off`**
   - Parameters: `technician` (string), `date_or_range` (string), `reason` (optional)
   - Create `technician_availability` record of type `time_off`
   - Return: "Done — Dave is marked off next Friday. His 3 scheduled jobs that day need to be reassigned. Should I optimize and reassign them?"

9. **Configure Supabase Realtime channels**
   - Enable Realtime on tables: `jobs`, `technician_current_location`, `technician_availability`, `dispatch_logs`
   - Test: insert a job via API → verify the Realtime event fires (use Supabase client subscription in a test script)
   - Configure Realtime publication filters to include `tenant_id` for efficient filtering

10. **Create Supabase Storage buckets**
    - Create buckets: `job-photos`, `signatures`
    - Configure RLS on buckets: users can only upload to their tenant's folder (`{tenant_id}/{job_id}/`)
    - Set size limits: 5MB per photo, 1MB per signature
    - Test: upload a test image → verify it's accessible via the returned URL

11. **End-to-end integration test**
    - Script that exercises the full lifecycle via Hermes skills:
      - Create a job via `create_job`
      - List jobs via `list_jobs` — verify it appears
      - Update the job via `update_job` — change technician
      - Complete the job via `complete_job`
      - Verify all status history entries exist
      - Verify Realtime events fired for each change

---

## 4. Risk Register

### 4.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **pyvroom build fails on Hetzner VPS** — VROOM requires C++20 compiler and CMake. The Hetzner VPS may have an older toolchain. | Medium | High (blocks Phase 2.3) | Test pyvroom install on VPS in Week 1. Fallback: run VROOM in a Docker container. Alternative: use OpenRouteService API (uses VROOM internally) as a managed service. |
| **PowerSync sync conflicts** — Field-level merge with last-write-wins may produce unexpected results when dispatcher reassigns a job while tech is offline and working on it. | Medium | Medium | Design sync rules to avoid conflicting writes: techs can only write to `status`, `tech_notes`, `checklist`, `parts_used`, `photos`. Dispatchers write to `technician_id`, `scheduled_start/end`. Non-overlapping fields = no conflicts. Surface true conflicts to dispatcher for resolution. |
| **Google Routes API costs exceed estimate** — Heavy re-optimization or cache misses could drive costs above $300/month. | Low | Low | Grid-cell caching (0.01° ≈ 1km) with 24h TTL reduces calls by 80%+ after first week. Monitor daily API spend. Add circuit breaker: if daily cost exceeds $15, fall back to cached-only (no fresh API calls for non-emergency optimizations). |
| **FullCalendar Premium resource timeline performance** — Rendering 50+ techs × 200+ jobs could be sluggish. | Low | Medium | Paginate technicians (show 15 at a time with "load more"). Use FullCalendar's `lazyFetching` and `eventSourceSuccess` for efficient loading. Virtualize the resource list if needed. For MVP with 5-10 techs, this isn't a concern. |
| **Expo/React Native offline GPS tracking drains battery** — Background location tracking is notorious for battery drain on both platforms. | Medium | Medium | Use iOS significant location changes API (low power, ~500m accuracy) as baseline. Switch to high-accuracy GPS only when approaching a job site or during `en_route` status. Target <5% battery drain per work hour. Test on real devices early in Phase 2.4. |
| **Clerk JWT → Supabase RLS integration** — Custom JWT claims (`tenant_id`, `role`, `tech_id`) must be correctly configured in Clerk and correctly parsed in Supabase. | Medium | High (data leakage if wrong) | Set up and test the JWT integration in Sprint 1. Write explicit RLS tests: query as wrong tenant, query as tech for another tech's jobs. This is a security-critical path. |

### 4.2 Schedule Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Phase 1 (AI Phone) delays push Phase 2 start** — If phone answering isn't done by July, scheduling work may be deprioritized. | Medium | High | Phase 2 can be built independently of Phase 1. The only integration point is "phone call creates a job" — that's a single API call that can be wired up later. Start Phase 2 schema work even if Phase 1 is still in progress. |
| **Mobile app takes longer than 4 weeks** — React Native + PowerSync + offline sync is a complex setup with many edge cases. | High | Medium | Focus on the critical path: schedule view → job detail → status transitions → photo capture. Defer to post-launch: voice notes, equipment OCR, parts catalog search, signature annotation. PowerSync integration should be attempted in a standalone prototype first (Week 7-8) before integrating into the full app. |
| **Solo founder bandwidth** — Doyle is also running sales, managing the existing Flex client, and building Phase 1. | High | High | AI agents do 80%+ of the coding. Doyle's role is: (1) review and approve, (2) test on real devices, (3) talk to pilot contractors, (4) make product decisions. Clear task specs (this document) minimize Doyle's need to context-switch into implementation details. |

### 4.3 External Dependency Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Google Routes API pricing changes** — Google has changed Maps pricing before (2018 was a major disruption). | Low | Medium | Cache aggressively. Monitor the OSRM + Valhalla open-source routing stack as a fallback. OSRM provides distance/duration matrices without traffic awareness — acceptable for non-real-time planning. |
| **PowerSync service availability** — PowerSync is a startup; outages or pricing changes could affect the mobile app. | Low | High | PowerSync's architecture means the app works offline even if PowerSync's cloud service is down — syncs just queue. For long-term mitigation, WatermelonDB is a self-hosted alternative (more work to set up, but no vendor dependency). |
| **Supabase Realtime limits** — Free/Pro tier may throttle at high connection counts or message volumes. | Low | Low | At launch volumes (5 tenants, 2-3 dispatchers each, 25 techs total), this is well within limits. Supabase Pro supports 500 concurrent connections and 2M Realtime messages/month. Monitor and upgrade if needed. |
| **App Store review delays** — First-time app submission to Apple App Store can take 1-2 weeks with potential rejections. | Medium | Medium | Submit to TestFlight early (end of Phase 2.4 Week 2). Use TestFlight for pilot contractors initially. Submit to App Store during the polish phase. Prepare privacy policy, data handling disclosures (location tracking, photo capture) in advance. |

---

## 5. Testing Strategy

### 5.1 Testing the Dispatch Optimizer

**Unit tests (Python/pytest):**

- Test problem builder: given a known set of techs and jobs, verify the VROOM input is correctly formed
- Test scoring engine: given known inputs, verify scores match expected values (deterministic)
- Test weight configuration: changing weights changes rankings
- Test skill constraints: job requiring "EPA 608" is never assigned to a tech without it
- Test emergency flow: emergency job is assigned to nearest qualified tech, disrupted customers are identified

**Integration tests:**

- Solve a known problem (5 techs, 20 jobs, Houston addresses) and verify:
  - Solution contains all jobs
  - No tech is double-booked
  - Time windows are respected
  - Drive times are plausible (not 0, not > 2 hours for a metro area)
  - Solve time < 1 second
- Re-optimization: solve, then add an emergency job, re-solve, and verify:
  - Emergency job is assigned
  - Remaining schedule is still valid
  - Previously completed jobs are unchanged

**Benchmark test:**

- 30 techs, 200 jobs, real Houston addresses
- Verify: solve time < 2 seconds
- Run 10 iterations and report mean/max solve time

**Regression dataset:**

- Save 3-5 known good optimization inputs and outputs as JSON fixtures
- On every change to the optimizer, re-run against fixtures and compare results
- Flag if total drive time increases by more than 5% (regression)

### 5.2 Testing Hermes Skills

**Each skill gets a test matrix:**

| Skill | Happy Path | Edge Case | Error Case |
|---|---|---|---|
| `create_job` | "Book AC repair for Tom Friday 2pm" → job created | "Book for Johnson" (ambiguous — 2 Johnsons) → asks for clarification | "Book for Nonexistent Person" → customer not found error |
| `list_jobs` | "What jobs tomorrow?" → formatted list | "What jobs?" (no date) → defaults to today | No jobs → "No jobs scheduled for tomorrow" |
| `check_availability` | "Who's free Tuesday for 2 hours?" → list of techs with slots | "Who's free for 8 hours?" → only techs with full-day availability | No one available → "No techs available on Tuesday for that duration" |
| `cancel_job` | "Cancel the 3pm" → cancelled | "Cancel all of Dave's jobs tomorrow" → confirm before bulk cancel | Job already completed → "That job is already completed and can't be cancelled" |

**Automated test runner:**

- Script that sends a sequence of messages to Hermes and checks responses for expected keywords/entities
- Run before every deployment to catch regressions in skill definitions or API changes

### 5.3 Testing the Mobile App

**Manual testing protocol (Doyle + test phone):**

1. **Offline cycle:** Enable airplane mode → navigate through all screens → change job status → add notes → take photo → disable airplane mode → verify everything syncs within 60 seconds
2. **Push notification:** Assign a new job via dispatch board → verify push notification arrives on phone within 10 seconds
3. **GPS tracking:** Open app → verify location dot appears on dispatch board map → drive 1 mile → verify dot moves
4. **Photo capture:** Take before/during/after photos → verify they appear on the job record in the dispatch board
5. **Signature:** Capture signature → verify SVG appears in job detail on web
6. **Battery:** Run app for 2 hours with GPS active → verify battery drain < 10%

**Automated tests (Jest + React Native Testing Library):**

- Component rendering tests for all screens
- Navigation flow tests
- PowerSync mock tests: verify offline reads/writes queue correctly

### 5.4 Load Testing

**Not needed for launch** (5 contractors × 5-10 techs each = 25-50 concurrent users). However, prepare for growth:

- **Target:** support 50 tenants × 30 techs = 1,500 concurrent mobile app users + 100 dispatcher sessions
- **Bottleneck identification:** Supabase Realtime connections (most likely limit), Edge Function cold starts, dispatch optimizer solve time at scale
- **Tool:** k6 (open-source load testing) or Artillery against the Supabase API
- **When:** Run load tests when approaching 20+ tenants, before any major sales push

### 5.5 Staging Environment

**Supabase:** Use a separate Supabase project for staging (free tier). Same schema, separate data. Staging URL in `admin/.env.staging`.

**Admin panel:** Deploy staging branch to Vercel preview URLs (automatic with Vercel's git integration). No additional configuration needed.

**Dispatch optimizer:** Run a staging instance on the same Hetzner VPS on a different port. Or use Docker Compose for isolated staging.

**Mobile app:** Use Expo development builds pointing at the staging Supabase project. Distribute via Expo's internal distribution (no App Store needed for staging).

---

## 6. Integration Checklist

### 6.1 Phase 1 (AI Phone) → Phase 2 (Scheduling)

These hooks must exist for the phone agent to create jobs:

| Hook | Direction | Implementation | Status |
|---|---|---|---|
| Phone call extracts service request → creates job | Phone → Scheduling | Phone agent calls `create-job` Edge Function with extracted entities (customer, service type, urgency, time preference) | Build during Phase 2.1 Sprint 2; wire up when Phase 1 is ready |
| Real-time availability check during phone call | Phone → Scheduling | Phone agent calls `check-availability` Edge Function. Target: <3 second response including VROOM availability solve | Build during Phase 2.1 Sprint 2 |
| Emergency call triggers immediate dispatch | Phone → Scheduling | Phone agent sets `priority: 'emergency'`, which triggers the emergency dispatch flow in the optimizer | Build during Phase 2.3 |
| Customer lookup during phone call | Phone → Scheduling | Phone agent queries `customers` table by phone number (caller ID match) | Build during Phase 2.1 Sprint 2 |
| New customer creation during phone call | Phone → Scheduling | If no customer match, phone agent calls customer creation endpoint | Build during Phase 2.1 Sprint 2 |

**API contract (Phone → Scheduling):**

```typescript
// POST /functions/v1/create-job
// Called by the phone agent after extracting intent from a customer call
{
  source: "phone_ai",
  customer_phone: "+15551234567",     // for caller ID lookup
  customer_name?: "Johnson",          // if captured from call
  service_type: "AC repair",          // natural language — matched to job_types
  urgency: "emergency" | "standard",
  preferred_date?: "2026-06-10",
  preferred_time?: "14:00",
  description?: "AC stopped blowing cold air, thermostat reads 85 degrees",
  address?: "123 Oak St, Houston TX"  // if different from customer on file
}
```

### 6.2 Phase 2 (Scheduling) → Phase 3 (Online Booking Widget)

Online booking is the next module after scheduling — it depends on the availability engine, **not** on invoicing. Phase 2 must expose a public-safe availability API so an embeddable widget can check slots and self-book without an end-user login.

| Hook | Direction | Implementation | Status |
|---|---|---|---|
| Public availability check | Booking → Scheduling | `check-availability` Edge Function callable with a tenant-scoped **public widget key** (no end-user auth), rate-limited | Build in Phase 2.1 Sprint 2; harden for public use before Phase 3 ships |
| Slot hold / confirm | Booking → Scheduling | Two-step hold token on `check-availability` → `create-job` so two customers can't grab the same slot mid-form | Build in Phase 2.1 Sprint 3 |
| Self-booked job creation | Booking → Scheduling | Widget calls the same `create-job` path as the phone agent with `source: "online_booking"` | Build in Phase 2.1 Sprint 2 |
| Customer self-service reads | Booking → Scheduling | Portal reads `jobs` by `customer_id`; "Where's My Tech" subscribes to `technician_current_location` via short-lived token; reschedule via `update-job` | Reuses Phase 2.1 Sprint 2–3 endpoints |

**Forward-compatibility requirement:** the `check-availability` and `create-job` Edge Functions must support a **public widget-key auth path** (tenant-scoped, rate-limited) alongside the service-credential path the phone agent uses. Build this into the auth layer from the start so Phase 3 needs no schema or contract changes.

### 6.3 Phase 2 (Scheduling) → Phase 4 (Invoicing)

These hooks Phase 2 must expose for Phase 4:

| Hook | Direction | Implementation | Status |
|---|---|---|---|
| Job completion assembles invoice data | Scheduling → Invoicing | `complete-job` Edge Function returns `invoice_data` JSON package | Build in Phase 2.1 Sprint 2 |
| `job.completed` webhook event | Scheduling → Invoicing | Webhook fires with full job record + parts + labor when job is completed | Build in Phase 2.1 Sprint 3 |
| Time tracking feeds labor hours | Scheduling → Invoicing | `actual_start`, `actual_end`, and drive time calculated from location history | Build in Phase 2.1 Sprint 2 |
| Parts used tracked per job | Scheduling → Invoicing | `parts_used` JSONB field on jobs table, populated by tech via mobile app | Build in Phase 2.4 |
| Invoice ID written back to job | Invoicing → Scheduling | Phase 4 sets `jobs.invoice_id` when invoice is generated, transitions status to `invoiced` | Phase 4 responsibility |

**Invoice data contract (Scheduling → Invoicing):**

```json
{
  "job_id": "uuid",
  "tenant_id": "uuid",
  "customer": {
    "id": "uuid",
    "name": "Tom Johnson",
    "email": "tom@example.com",
    "phone": "+15551234567",
    "address": { "street": "123 Oak St", "city": "Houston", "state": "TX", "zip": "77001" }
  },
  "job_type": { "name": "AC Tune-Up", "category": "hvac" },
  "services": [
    { "name": "AC Diagnostic", "flat_rate": 89.00 }
  ],
  "parts": [
    { "name": "Capacitor 45/5 MFD", "qty": 1, "cost": 12.50, "price": 45.00 }
  ],
  "labor": {
    "actual_start": "2026-06-10T14:15:00Z",
    "actual_end": "2026-06-10T15:45:00Z",
    "hours": 1.5,
    "rate": 125.00,
    "total": 187.50
  },
  "travel_time_minutes": 22,
  "photos": ["https://storage.supabase.co/..."],
  "signature_url": "https://storage.supabase.co/...",
  "completed_at": "2026-06-10T15:45:00Z"
}
```

### 6.4 Phase 2 (Scheduling) → Later Phases & Cross-Cutting Surfaces

**Customer self-service portal (Phase 3 growth scope):**

- Portal reads `jobs` table filtered by `customer_id` (upcoming appointments + history)
- Portal calls `check-availability` for self-scheduling
- Portal calls `update-job` for rescheduling
- "Where's My Tech" page subscribes to `technician_current_location` via Supabase Realtime
- Short-lived tracking tokens generated by an Edge Function, scoped to one customer + one job

**Office Dashboard (cross-cutting — built incrementally, not a standalone phase):**

- The dashboard is assembled tab-by-tab as each module ships; scheduling contributes the Job Board and Tech Utilization tabs
- All scheduling KPIs derived from existing scheduling tables via Postgres views
- Create materialized views for expensive aggregations (refresh on schedule via pg_cron)
- Views: `jobs_per_tech_per_day`, `drive_time_percentage`, `first_time_fix_rate`, `on_time_arrival_rate`, `schedule_fill_rate`

**Review flywheel (ships within Phase 2 — see §1 Phase 2.5 sprint):**

- `job.completed` webhook triggers the review request flow (2-hour delay), Google review link, and AI-drafted response capture
- This loop is live at the end of Phase 2 and is later absorbed into the Digital Ops reputation dashboard

**Digital Ops (roadmap Phase 5):**

- Expose capacity signal: Edge Function that returns daily capacity percentage, available hours by skill, saturated zones
- Reuses the Phase 2 review-flywheel hooks rather than rebuilding them
- `schedule.capacity_changed` webhook fires when daily fill rate crosses 60% or 90% thresholds

### 6.5 Webhook Events to Implement

Build these webhook events into the scheduling system from the start, even though consumers don't exist yet. This prevents painful retrofit later.

| Event | Trigger | Payload |
|---|---|---|
| `job.created` | INSERT on `jobs` | Full job record |
| `job.scheduled` | `status` changes to `scheduled` | Job + tech assignment |
| `job.status_changed` | Any status transition | Job + old/new status + changed_by |
| `job.completed` | `status` changes to `completed` | Job + parts + labor + photos + signature |
| `job.cancelled` | `status` changes to `cancelled` | Job + reason |
| `tech.location_updated` | INSERT/UPDATE on `technician_current_location` | tech_id + lat/lng + timestamp |
| `schedule.capacity_changed` | Daily capacity crosses 60% or 90% | tenant_id + date + capacity % + available hours by skill |

**Implementation:** Postgres triggers → insert into a `webhook_events` queue table → Edge Function processes the queue on a 30-second cadence (or Supabase Realtime subscription fires a processing Edge Function).

---

## 7. Go-to-Market for Phase 2

### 7.1 Pilot Contractor Selection

**Target: 3-5 contractors for the pilot.** Ideal profile:

- 5-15 technicians (complex enough to benefit from dispatch intelligence, small enough to onboard quickly)
- HVAC, plumbing, or electrical (our target verticals)
- Houston metro area (Doyle can visit in person, Rumble Bee is already local)
- Currently using Jobber, HCP, spreadsheets, or paper (not ServiceTitan — those are harder to migrate)
- Owner is willing to give feedback and tolerate early-stage bugs
- Ideally already a Firmcraft Flex client or in the sales pipeline

**Pilot candidates from existing pipeline:**

- Rumble Bee (existing Flex client — natural first candidate)
- Prospects from the outreach CRM with 5-15 techs in Houston

### 7.2 What "Production Ready" Means

The system is production-ready when:

1. **Core workflow completes end-to-end:** Job created → assigned to tech → tech sees on phone → drives → arrives → works → completes → customer notified → job logged with photos/notes
2. **Dispatch optimizer runs without errors** for a full business day (8am-5pm) with no manual intervention
3. **Mobile app works offline** for at least 30 minutes without data loss
4. **No data leakage** between tenants (verified by automated RLS tests)
5. **Customer receives SMS confirmation** within 60 seconds of booking
6. **Dispatch board loads in under 3 seconds** with a day of 50+ jobs
7. **Zero crashes** in the mobile app during a full day of use by a real tech

Production-ready does NOT require:

- Auto mode dispatch (assist mode is sufficient for launch)
- ML-powered duration predictions (use job type defaults)
- Geofencing auto-clock (manual "Arrived" button is fine)
- Demand forecasting
- Google Calendar sync
- Parts inventory management
- Customer "Where's My Tech" tracking page

These are all post-launch features that can be shipped iteratively.

### 7.3 Success Metrics

From the roadmap: **"5 contractors with active daily job boards."**

More granular metrics for the first 90 days:

| Metric | Target | How to Measure |
|---|---|---|
| Active daily job boards | 5 contractors | Count of tenants with >0 jobs created per day, 5 of the last 7 days |
| Jobs dispatched per week | 200+ across all tenants | `COUNT(jobs) WHERE status != 'created' AND created_at > now() - interval '7 days'` |
| Tech app daily active users | 15+ | Distinct tech IDs with location updates or job status changes per day |
| Dispatch optimizer runs/day | 10+ per active tenant | `COUNT(dispatch_logs)` per tenant per day |
| Customer SMS delivered | 90%+ delivery rate | Twilio delivery reports |
| Mean time to assign (created → scheduled) | <4 hours for standard, <30 min for emergency | `AVG(scheduled_at - created_at)` from job_status_history |
| Mobile app crash-free rate | 99.5%+ | Expo/Sentry crash reporting |
| Pilot NPS | 40+ | Survey pilot contractors monthly |

### 7.4 Pricing Implications

Phase 2 (Scheduling + Dispatch) is **bundled** in the Operator Plan tiers:

- Solo ($399/mo): scheduling included
- Team ($799/mo): scheduling included
- Pro ($1,499/mo): scheduling included

No separate a la carte pricing for scheduling — it's core platform functionality. The scheduling module is the primary value driver that replaces Jobber/HCP and justifies the monthly price.

If a contractor wants ONLY scheduling (not the full Hermes operator), consider a standalone tier at $149-199/mo. This positions against Jobber ($149/mo) and Housecall Pro ($149/mo) while offering AI dispatch that neither provides. Decision on standalone pricing can wait until after the pilot.

### 7.5 Onboarding Playbook

**Target: contractor operational in 2 weeks** (vs. ServiceTitan's 2-12 months).

**Week 1: Setup**

1. Doyle creates the tenant in the admin panel
2. AI-guided setup via Hermes: "Let's set up your team. How many technicians do you have? What are their names?" → creates tech records
3. Import customer list (CSV upload or manual entry via Hermes)
4. Define job types: "What kinds of jobs do you do? AC repair, furnace install, ..." → creates job_type records
5. Set business hours, service area, dispatch preferences
6. Install mobile app on each tech's phone (Expo Go for pilot, TestFlight for production)
7. Test: create a few sample jobs, verify they appear on dispatch board and tech phones

**Week 2: Shadow Mode**

1. Contractor runs their normal operations using their existing tool
2. Firmcraft mirrors the schedule: Doyle or Hermes enters the same jobs into Firmcraft
3. Contractor compares: "Does the dispatch board match what actually happened?"
4. Fix any data model gaps or workflow mismatches
5. End of week: contractor switches primary operations to Firmcraft

---

## Appendix A: Key Technical Decisions Summary

| Decision | Choice | Rationale | Alternatives Considered |
|---|---|---|---|
| Primary solver | VROOM via pyvroom | Millisecond solve times, skills matching built in, BSD license | OR-Tools (slower but more constraints), PyVRP (academic-grade but heavier) |
| Distance matrix | Google Routes API | Traffic-aware, maintained, ~$150-300/mo | OSRM (free but no real-time traffic), Mapbox Directions (comparable pricing) |
| Dispatch board | FullCalendar Premium | Resource timeline view, drag-and-drop, well-documented, $590 one-time | DHTMLX (more expensive), react-big-calendar (no resource view), custom (2+ months) |
| Map rendering | Mapbox GL JS | 5x cheaper than Google Maps tiles, full style control | Google Maps JS (more expensive), Leaflet (less polished) |
| Mobile framework | React Native + Expo | Shared React stack, PowerSync SDK, OTA updates | Flutter (different language), PWA (can't do offline GPS), native (2x effort) |
| Offline sync | PowerSync | Field-level merge, React Native SDK, Postgres-native | WatermelonDB (more manual setup), RxDB (less Postgres integration) |
| Real-time | Supabase Realtime | Already in stack, Postgres-native, Presence built in | Socket.io (self-hosted complexity), Ably (another vendor) |
| Geofencing | Manual → Radar.io (post-launch) | Manual "Arrived" button for MVP. Radar.io handles iOS limits. | expo-location geofencing (limited to 20 regions on iOS) |
| Push notifications | Firebase Cloud Messaging | Free, reliable, Expo integration | OneSignal (another vendor), APNs/FCM direct (more setup) |
| Redis | Upstash (serverless) | No ops, pay-per-use, good free tier | Self-hosted Redis on VPS (another process to manage) |

## Appendix B: Timeline Visualization

```
Week  1  2  3  4  5  6  7  8  9  10 11 12 13 14
      ├──────────┤
      Phase 2.1: Data Foundation + Core API
               ├──────────────┤
               Phase 2.2: Dispatch Board + Map
                        ├──────────────┤
                        Phase 2.3: Dispatch Optimizer
                                    ├────────────────┤
                                    Phase 2.4: Mobile App MVP
                                                ├──────┤
                                                Phase 2.5: Notifications + Polish
      |                                                |
   Jun 16                                          Sep 19
```

**Critical path:** Phase 2.1 → Phase 2.3 (optimizer needs data model) → Phase 2.4 (mobile app needs optimizer for push notifications) → Phase 2.5 (notifications need mobile status changes).

**Parallel work:** Phase 2.2 (dispatch board) can start in Week 3 while Phase 2.1 finishes. Phase 2.4 (mobile app) can start in Week 8 while Phase 2.3 finishes. This overlap is what makes 14 weeks achievable.

## Appendix C: First Day Checklist

Before the first line of code is written, complete these setup tasks:

- [ ] Purchase FullCalendar Premium license ($590)
- [ ] Create Mapbox account and generate access token
- [ ] Create Upstash Redis instance
- [ ] Create PowerSync Cloud account
- [ ] Create Firebase project and enable Cloud Messaging
- [ ] Configure Clerk: add `dispatcher` and `technician` roles, add `tenant_id` and `tech_id` to JWT claims
- [ ] Enable PostGIS extension on Supabase
- [ ] Enable `pg_cron` extension on Supabase
- [ ] Verify pyvroom installs on Hetzner VPS (test with `pip install pyvroom && python -c "import vroom"`)
- [ ] Set up Google Routes API key and enable the Routes API in Google Cloud Console
- [ ] Create Supabase Storage buckets: `job-photos`, `signatures`
- [ ] Add all API keys to VPS environment variables and admin panel `.env.local`
