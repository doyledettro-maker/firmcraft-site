# Scheduling & Dispatch Module: System Architecture

**Module:** Phase 2 — Scheduling + Dispatch
**Version:** 1.0
**Date:** June 8, 2026
**Author:** Firmcraft Engineering
**Status:** Architecture Review

---

**Related docs:** [Build Plan](scheduling-dispatch-build-plan.md) · [Market Research](scheduling-dispatch-market-research.md) · [AI/ML Research](ai-scheduling-dispatch-research.md) · [ROADMAP.md](../ROADMAP.md)

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Data Model](#2-data-model)
3. [AI-First Dispatch Engine](#3-ai-first-dispatch-engine)
4. [Hermes Skill Interface](#4-hermes-skill-interface)
5. [Mobile Experience (Technician App)](#5-mobile-experience-technician-app)
6. [Customer-Facing Experience](#6-customer-facing-experience)
7. [Real-Time Infrastructure](#7-real-time-infrastructure)
8. [Integration Architecture](#8-integration-architecture)
9. [API Design](#9-api-design)
10. [Infrastructure & Costs](#10-infrastructure--costs)
11. [Security & Compliance](#11-security--compliance)
12. [Build vs. Buy vs. Integrate](#12-build-vs-buy-vs-integrate)

---

## 1. System Architecture Overview

### 1.1 Design Principles

The scheduling module is built around five principles that reflect Firmcraft's competitive positioning:

**AI-first, not AI-bolted.** Every scheduling decision flows through the optimization engine by default. Drag-and-drop is a fallback for override, not the primary interaction model. This is the opposite of Jobber and Housecall Pro, where dispatch is purely manual and "AI" means a chatbot that answers the phone.

**Conversational configuration.** Contractors configure scheduling through Hermes, not through settings screens. "Set Dave's work hours to 7am-4pm" is simpler than navigating three menus. This is how ServiceTitan's Atlas works, but we do it from day one at every price tier.

**Offline-native.** The technician app treats offline as the default state, not an edge case. Every competitor lists "offline support" as a gap. We build around it using PowerSync's SQLite-to-Postgres sync, giving techs full read/write capability with zero connectivity.

**Sub-second re-optimization.** When an emergency arrives, a tech calls out sick, or a job runs long, the system re-solves the entire day's schedule in under one second using VROOM. ServiceTitan's Dispatch Pro re-optimizes every 10 minutes. We do it on every relevant event.

**Multi-tenant from the ground up.** Every query, every subscription, every API call is scoped to a tenant. Row-level security in Postgres enforces this at the data layer, not the application layer.

### 1.2 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                   │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  Tech Mobile  │  │  Dispatch    │  │  Customer    │  │  Hermes Chat   │  │
│  │  (React       │  │  Board       │  │  Portal      │  │  (Telegram/    │  │
│  │   Native)     │  │  (Next.js)   │  │  (Next.js)   │  │   Slack/SMS)   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬─────────┘  │
│         │                  │                  │                  │           │
│         │    PowerSync     │   Supabase       │   Supabase       │          │
│         │    (offline)     │   Realtime       │   REST           │          │
└─────────┼──────────────────┼──────────────────┼──────────────────┼──────────┘
          │                  │                  │                  │
┌─────────┼──────────────────┼──────────────────┼──────────────────┼──────────┐
│         ▼                  ▼                  ▼                  ▼          │
│                           API GATEWAY                                       │
│                     (Supabase Edge Functions + Next.js API Routes)          │
│                     Auth: Clerk JWT → Supabase RLS                          │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        CORE SERVICES                                │    │
│  │                                                                     │    │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────┐   │    │
│  │  │  Scheduling   │  │  Dispatch     │  │  Hermes Skill         │   │    │
│  │  │  Service      │  │  Optimizer    │  │  Interface            │   │    │
│  │  │               │  │  (Python/     │  │  (Job CRUD, queries,  │   │    │
│  │  │  Job CRUD,    │  │   FastAPI)    │  │   dispatch commands,  │   │    │
│  │  │  calendar,    │  │               │  │   config via NL)      │   │    │
│  │  │  availability │  │  VROOM solver │  │                       │   │    │
│  │  │               │  │  + scoring    │  │                       │   │    │
│  │  └───────────────┘  └───────────────┘  └───────────────────────┘   │    │
│  │                                                                     │    │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────┐   │    │
│  │  │  Notification │  │  Location     │  │  ML Pipeline          │   │    │
│  │  │  Service      │  │  Service      │  │  (Duration predict,   │   │    │
│  │  │  (Twilio SMS, │  │  (Radar.io    │  │   demand forecast,    │   │    │
│  │  │   Resend      │  │   geofence +  │  │   no-show predict)    │   │    │
│  │  │   email, FCM) │  │   GPS ingest) │  │                       │   │    │
│  │  └───────────────┘  └───────────────┘  └───────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         DATA LAYER                                  │    │
│  │                                                                     │    │
│  │  ┌────────────────────┐  ┌─────────────┐  ┌─────────────────────┐  │    │
│  │  │  Supabase          │  │  Redis       │  │  Supabase Storage   │  │    │
│  │  │  (PostgreSQL)      │  │  (event      │  │  (photos, sigs,     │  │    │
│  │  │                    │  │   queue,     │  │   documents)        │  │    │
│  │  │  RLS multi-tenant  │  │   location   │  │                     │  │    │
│  │  │  Realtime enabled  │  │   cache,     │  │                     │  │    │
│  │  │  PowerSync mirror  │  │   sessions)  │  │                     │  │    │
│  │  └────────────────────┘  └─────────────┘  └─────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      EXTERNAL SERVICES                              │    │
│  │                                                                     │    │
│  │  Google Routes API │ Google Calendar API │ Mapbox │ Twilio │ Resend │    │
│  │  Clerk Auth │ Stripe │ QuickBooks │ Firebase Cloud Messaging        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Component Breakdown

**Scheduling Service** — the source of truth for jobs, appointments, availability, and calendar state. Implemented as Supabase Edge Functions and Next.js API routes operating on the Postgres schema. Handles job lifecycle management, recurring schedule generation, availability windows, and conflict detection.

**Dispatch Optimizer** — a standalone Python/FastAPI microservice that wraps VROOM (via pyvroom) with a custom scoring layer. Receives optimization requests (new job, emergency, tech unavailable, rolling re-optimize), solves the assignment problem, and returns ranked assignment suggestions. Runs on the existing Hetzner VPS alongside the Hermes agent — no separate infrastructure needed.

**Hermes Skill Interface** — the set of skills (tools) that Hermes uses to read and write scheduling data. Hermes already exists as the conversational AI layer. The scheduling module adds skills for job CRUD, availability queries, dispatch commands, tech management, and proactive notifications. These skills call the Scheduling Service and Dispatch Optimizer on behalf of the user.

**Tech Mobile App** — React Native + Expo application with PowerSync for offline-first data sync. Provides the technician's daily schedule, job details, navigation, time tracking, photo/signature capture, and real-time status updates.

**Dispatch Board** — the contractor's web interface, served from the white-labeled client app at `{slug}.firmcraft.ai` (e.g. `rumblebee.firmcraft.ai`). It is **not** part of Firmcraft's internal `admin.firmcraft.ai` panel — that distinction is foundational (see Section 1.6). The board shares the same Next.js codebase and Vercel deployment as the admin panel; Next.js middleware resolves the host to a `tenant_id` and renders the contractor's view. Built on FullCalendar Premium (resource timeline view) with a Mapbox map overlay showing live tech locations. Connected to Supabase Realtime for live updates.

**Location Service** — ingests GPS coordinates from the mobile app, stores current positions in Redis for fast lookup, writes history to Postgres for analytics, and manages Radar.io geofence events for automatic arrival/departure detection.

**Notification Service** — orchestrates customer and tech communications across SMS (Twilio), email (Resend), and push (Firebase Cloud Messaging). Handles appointment confirmations, ETA updates, delay notifications, and review request triggers.

**ML Pipeline** — trains and serves predictive models for job duration estimation (XGBoost), cancellation/no-show prediction, and demand forecasting (Prophet). Runs as a scheduled batch process for training and a lightweight inference endpoint for real-time predictions.

### 1.4 How This Fits the Existing Stack

The scheduling module integrates with every existing Firmcraft component:

| Existing Component | Integration |
|---|---|
| **Hermes Agent** (Hetzner VPS) | Dispatch Optimizer runs on the same VPS. Hermes calls scheduling skills via function calling |
| **Supabase** (PostgreSQL) | Scheduling tables live in the same Supabase project, same multi-tenant schema |
| **Next.js admin/client app** (admin.firmcraft.ai + `*.firmcraft.ai`) | Same deployment serves Firmcraft's internal panel (`admin.firmcraft.ai`) and every contractor's white-labeled dispatch board (`{slug}.firmcraft.ai`); middleware resolves the host to a tenant. Dispatch board is a new route group within this app |
| **Clerk auth** | Same Clerk project, same JWT flow. New roles: dispatcher, technician |
| **Twilio** | Existing SMS channel reused for appointment notifications |
| **Resend** | Existing email service reused for confirmations and summaries |
| **LiteLLM gateway** | Hermes skill calls route through the existing LLM gateway |
| **Langfuse** | Dispatch decisions logged as traces for observability |
| **Voice agent** (Phase 1) | Inbound calls create jobs that flow directly into the scheduling system |

### 1.5 Multi-Tenant Architecture

Every contractor is a tenant. Tenancy is enforced at three layers:

1. **Database (Postgres RLS)** — every table includes a `tenant_id` column. Row-level security policies ensure queries only return rows matching the authenticated user's tenant. This is the hard boundary — even a bug in application code cannot leak data across tenants.

2. **Application (Clerk JWT)** — Clerk JWTs include a `tenant_id` claim set during organization setup. Supabase validates this JWT and uses the claim in RLS policies. No API request executes without a valid tenant-scoped token.

3. **Infrastructure (logical isolation)** — all tenants share the same Supabase project and database. This keeps costs low for the 5-50 tech target market. If a tenant exceeds 100 technicians, they can be migrated to a dedicated Supabase project without application changes (connection string swap).

### 1.6 Tenant-Facing Surfaces & Subdomain Routing

**Decision (June 9, 2026): client dashboards are white-labeled per tenant on a wildcard subdomain.** Each contractor gets their own dashboard at `{slug}.firmcraft.ai` (e.g. `rumblebee.firmcraft.ai`). This is the contractor's product surface — the dispatch board, job management, technician and customer admin, schedule configuration. It is distinct from Firmcraft's own internal panel.

**Three surfaces, one deployment:**

| Surface | Audience | Purpose |
|---|---|---|
| `admin.firmcraft.ai` | **Firmcraft staff (internal)** | The company's own back office — tenant/client management, MRR, token usage, outreach CRM, provisioning. Never customer-facing. |
| `{slug}.firmcraft.ai` | **The contractor (one tenant)** | The white-labeled client app — dispatch board, jobs, techs, customers, scheduling config. Scoped to exactly one tenant by the subdomain. |
| `app.firmcraft.ai` | **Any contractor user, pre-auth** | Generic login/landing. After authentication, redirects the user to their own `{slug}.firmcraft.ai`. Useful when a user doesn't remember their subdomain or arrives via a bare link. |

The client app and the internal admin panel share the **same codebase, same Vercel deployment, and same database**. There is no separate app to maintain per tenant. Tenant isolation is enforced by Postgres RLS (Section 1.5), not by deploying separate instances.

**Wildcard DNS.** A single Cloudflare wildcard record — `*.firmcraft.ai → Vercel` — routes every tenant subdomain to the one deployment. Adding a new tenant requires **no DNS change**: the moment a `slug` exists in the `tenants` table, `{slug}.firmcraft.ai` resolves and works. (Reserved subdomains like `admin`, `app`, `www`, `llm`, `langfuse`, `partners` are carved out and handled by their own routes/projects.)

**Next.js middleware resolves the tenant.** A middleware runs on every request to the client app:

```typescript
// middleware.ts (client app)
export function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? ''
  const sub = host.split('.')[0]                 // "rumblebee" from "rumblebee.firmcraft.ai"

  // Reserved/non-tenant hosts pass through to their own handling.
  if (['admin', 'app', 'www', ''].includes(sub) || !host.endsWith('firmcraft.ai')) {
    return NextResponse.next()
  }

  // Look up the tenant by slug (cached). Unknown slug → 404 / marketing redirect.
  // The resolved tenant_id is injected as a request header for downstream
  // route handlers and forwarded into the Clerk → Supabase JWT flow (Section 9.3).
  const res = NextResponse.next()
  res.headers.set('x-tenant-slug', sub)
  return res
}
```

The middleware extracts the subdomain, maps `slug → tenant_id` (lookup cached at the edge), and sets the tenant on the request context. Downstream, the resolved tenant must agree with the `tenant_id` claim in the authenticated user's Clerk JWT — a user authenticated for Tenant A who somehow lands on Tenant B's subdomain is rejected (see Section 9.3). The subdomain is a **routing and white-labeling mechanism, not a security boundary**; RLS remains the hard boundary.

**Custom domains (future Pro-tier upsell).** Contractors on a higher tier can point their own domain at their dashboard — e.g. `app.rumblebeeac.com` instead of `rumblebee.firmcraft.ai`. Vercel supports custom domains with automatic SSL, but each one requires per-client setup: the contractor adds a CNAME/A record, Vercel provisions and renews the TLS certificate, and the domain is verified and attached to the project. Because that provisioning is manual per client, custom domains are **out of scope for Phase 2** — the wildcard `{slug}.firmcraft.ai` covers every tenant on day one. Custom domains are an explicit later enhancement and a natural Pro-tier differentiator (see [ROADMAP.md](../ROADMAP.md) Future Considerations). The middleware already supports it conceptually: the host → tenant resolution simply falls back to a `custom_domain` lookup on the `tenants` table when the host is not a `*.firmcraft.ai` subdomain.

---

## 2. Data Model

### 2.1 Core Schema

The schema is designed around the job lifecycle, technician availability, and dispatch optimization. All tables include `tenant_id`, `created_at`, and `updated_at`. Soft deletes via `deleted_at` where needed.

```sql
-- ============================================================
-- TENANT & ORGANIZATION
-- ============================================================

-- Tenants are created when a contractor signs up.
-- Maps 1:1 with a Clerk organization.
CREATE TABLE tenants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_org_id    TEXT UNIQUE NOT NULL,
    name            TEXT NOT NULL,
    slug            TEXT UNIQUE NOT NULL,              -- subdomain for the white-labeled client app: {slug}.firmcraft.ai
    custom_domain   TEXT UNIQUE,                       -- future Pro-tier upsell, e.g. "app.rumblebeeac.com"; null until provisioned
    timezone        TEXT NOT NULL DEFAULT 'America/Chicago',
    business_hours  JSONB NOT NULL DEFAULT '{"mon":{"start":"08:00","end":"17:00"},"tue":{"start":"08:00","end":"17:00"},"wed":{"start":"08:00","end":"17:00"},"thu":{"start":"08:00","end":"17:00"},"fri":{"start":"08:00","end":"17:00"}}',
    settings        JSONB NOT NULL DEFAULT '{}',
    -- Settings includes: dispatch_mode (auto/assist/manual),
    -- optimization_weights, default_job_duration, service_area_radius,
    -- notification_preferences, branding
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- SERVICE AREAS & ZONES
-- ============================================================

CREATE TABLE service_areas (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    name            TEXT NOT NULL,                    -- "North Houston", "Inner Loop"
    boundary        GEOMETRY(POLYGON, 4326),          -- PostGIS polygon
    color           TEXT,                              -- hex color for map display
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_service_areas_tenant ON service_areas(tenant_id);
CREATE INDEX idx_service_areas_boundary ON service_areas USING GIST(boundary);

-- ============================================================
-- TECHNICIANS
-- ============================================================

CREATE TABLE technicians (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    clerk_user_id   TEXT,                              -- links to Clerk user (nullable for techs without app access)
    name            TEXT NOT NULL,
    email           TEXT,
    phone           TEXT,
    avatar_url      TEXT,
    home_address    JSONB,                             -- {street, city, state, zip, lat, lng} — start/end location for routing
    hourly_rate     NUMERIC(10,2),
    color           TEXT,                              -- hex color for calendar display
    work_hours      JSONB NOT NULL DEFAULT '{}',       -- per-day overrides to tenant business_hours
    is_active       BOOLEAN NOT NULL DEFAULT true,
    hire_date       DATE,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_technicians_tenant ON technicians(tenant_id);
CREATE INDEX idx_technicians_clerk ON technicians(clerk_user_id);

-- ============================================================
-- SKILLS & CERTIFICATIONS
-- ============================================================

-- Skill definitions are per-tenant (each contractor defines their own skill taxonomy).
CREATE TABLE skills (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    name            TEXT NOT NULL,                    -- "EPA 608 Universal", "Journeyman Electrician", "Tankless Water Heater"
    category        TEXT,                              -- "certification", "specialty", "equipment"
    description     TEXT,
    is_certification BOOLEAN NOT NULL DEFAULT false,  -- true = has expiration date
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, name)
);

CREATE INDEX idx_skills_tenant ON skills(tenant_id);

-- Which techs have which skills.
CREATE TABLE technician_skills (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    technician_id   UUID NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
    skill_id        UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    proficiency     TEXT DEFAULT 'standard',          -- "apprentice", "standard", "expert"
    certified_at    DATE,
    expires_at      DATE,                              -- null if non-expiring
    license_number  TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(technician_id, skill_id)
);

CREATE INDEX idx_tech_skills_tech ON technician_skills(technician_id);
CREATE INDEX idx_tech_skills_skill ON technician_skills(skill_id);
CREATE INDEX idx_tech_skills_expires ON technician_skills(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================
-- TECHNICIAN ZONE ASSIGNMENTS
-- ============================================================

CREATE TABLE technician_zones (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    technician_id   UUID NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
    service_area_id UUID NOT NULL REFERENCES service_areas(id) ON DELETE CASCADE,
    priority        INTEGER NOT NULL DEFAULT 1,        -- 1 = primary zone, 2 = secondary (overflow)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(technician_id, service_area_id)
);

-- ============================================================
-- CUSTOMERS
-- ============================================================

CREATE TABLE customers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    name            TEXT NOT NULL,
    email           TEXT,
    phone           TEXT,
    address         JSONB,                             -- {street, city, state, zip, lat, lng}
    location        GEOMETRY(POINT, 4326),             -- PostGIS point for geo queries
    preferred_tech_id UUID REFERENCES technicians(id),
    communication_preference TEXT DEFAULT 'sms',       -- "sms", "email", "phone", "none"
    tags            TEXT[] DEFAULT '{}',                -- "membership", "vip", "commercial"
    notes           TEXT,
    no_show_count   INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_customers_phone ON customers(tenant_id, phone);
CREATE INDEX idx_customers_location ON customers USING GIST(location);

-- ============================================================
-- EQUIPMENT (at customer locations)
-- ============================================================

CREATE TABLE equipment (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    type            TEXT NOT NULL,                     -- "furnace", "ac_unit", "water_heater", "panel"
    brand           TEXT,
    model           TEXT,
    serial_number   TEXT,
    install_date    DATE,
    warranty_expires DATE,
    location_notes  TEXT,                              -- "basement, left side", "rooftop unit #2"
    last_serviced   DATE,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_equipment_customer ON equipment(customer_id);
CREATE INDEX idx_equipment_tenant ON equipment(tenant_id);
CREATE INDEX idx_equipment_warranty ON equipment(warranty_expires) WHERE warranty_expires IS NOT NULL;

-- ============================================================
-- JOB TYPES
-- ============================================================

CREATE TABLE job_types (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id),
    name                TEXT NOT NULL,                 -- "AC Tune-Up", "Furnace Repair", "Panel Upgrade"
    category            TEXT,                          -- "hvac", "plumbing", "electrical"
    default_duration    INTEGER NOT NULL DEFAULT 60,   -- minutes
    estimated_revenue   NUMERIC(10,2),                 -- average ticket for this job type
    color               TEXT,                          -- for calendar display
    required_skills     UUID[] DEFAULT '{}',           -- skill IDs required to perform this job type
    checklist_template  JSONB,                         -- default checklist items
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, name)
);

CREATE INDEX idx_job_types_tenant ON job_types(tenant_id);

-- ============================================================
-- JOBS (the core entity)
-- ============================================================

CREATE TYPE job_status AS ENUM (
    'created',          -- job exists but is not yet scheduled
    'scheduled',        -- assigned to a tech and time slot
    'dispatched',       -- tech has been notified / day-of confirmation sent
    'en_route',         -- tech is driving to the job
    'arrived',          -- tech is on site (geofence or manual check-in)
    'in_progress',      -- tech has started work
    'completed',        -- work finished, pending paperwork
    'invoiced',         -- invoice generated (transition to Phase 4)
    'cancelled',        -- cancelled by customer or contractor
    'on_hold'           -- paused (waiting for parts, permit, etc.)
);

CREATE TYPE job_priority AS ENUM (
    'emergency',        -- same-day, ASAP dispatch
    'urgent',           -- within 24 hours
    'standard',         -- normal scheduling window
    'flexible'          -- customer is flexible on timing
);

CREATE TABLE jobs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id),
    customer_id         UUID NOT NULL REFERENCES customers(id),
    job_type_id         UUID REFERENCES job_types(id),
    technician_id       UUID REFERENCES technicians(id),   -- null if unassigned
    equipment_id        UUID REFERENCES equipment(id),

    -- Descriptive
    title               TEXT NOT NULL,
    description         TEXT,
    priority            job_priority NOT NULL DEFAULT 'standard',
    status              job_status NOT NULL DEFAULT 'created',
    source              TEXT DEFAULT 'manual',              -- "manual", "phone_ai", "customer_portal", "hermes", "recurring"

    -- Scheduling
    scheduled_start     TIMESTAMPTZ,
    scheduled_end       TIMESTAMPTZ,
    arrival_window_start TIMESTAMPTZ,                       -- customer-facing: "between 2-4pm"
    arrival_window_end  TIMESTAMPTZ,
    estimated_duration  INTEGER,                            -- minutes (ML-predicted or from job_type default)
    actual_start        TIMESTAMPTZ,                        -- tech checked in
    actual_end          TIMESTAMPTZ,                        -- tech checked out

    -- Location (denormalized from customer for query performance)
    address             JSONB,
    location            GEOMETRY(POINT, 4326),

    -- Work details
    checklist           JSONB DEFAULT '[]',                 -- [{item, completed, notes}]
    parts_used          JSONB DEFAULT '[]',                 -- [{part_name, quantity, cost}]
    tech_notes          TEXT,
    internal_notes      TEXT,                               -- dispatcher/office notes
    photos              TEXT[] DEFAULT '{}',                 -- Supabase Storage URLs

    -- Financial
    estimated_revenue   NUMERIC(10,2),
    actual_revenue      NUMERIC(10,2),
    invoice_id          UUID,                               -- Phase 4 reference

    -- Relationships
    parent_job_id       UUID REFERENCES jobs(id),           -- for multi-visit / callback tracking
    recurring_schedule_id UUID,                             -- links to recurring_schedules
    original_tech_id    UUID REFERENCES technicians(id),    -- for warranty callback routing

    -- Signatures
    customer_signature  TEXT,                               -- Supabase Storage URL
    signed_at           TIMESTAMPTZ,

    -- Metadata
    tags                TEXT[] DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ
);

-- Primary query patterns
CREATE INDEX idx_jobs_tenant_status ON jobs(tenant_id, status);
CREATE INDEX idx_jobs_tenant_date ON jobs(tenant_id, scheduled_start);
CREATE INDEX idx_jobs_technician_date ON jobs(technician_id, scheduled_start);
CREATE INDEX idx_jobs_customer ON jobs(customer_id);
CREATE INDEX idx_jobs_location ON jobs USING GIST(location);
CREATE INDEX idx_jobs_parent ON jobs(parent_job_id) WHERE parent_job_id IS NOT NULL;
CREATE INDEX idx_jobs_recurring ON jobs(recurring_schedule_id) WHERE recurring_schedule_id IS NOT NULL;
-- Composite for dispatch board: "show me all jobs for this tenant today by tech"
CREATE INDEX idx_jobs_dispatch ON jobs(tenant_id, scheduled_start, technician_id) WHERE status NOT IN ('cancelled', 'completed', 'invoiced');

-- ============================================================
-- JOB STATUS HISTORY (audit trail)
-- ============================================================

CREATE TABLE job_status_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL,
    previous_status job_status,
    new_status      job_status NOT NULL,
    changed_by      TEXT,                              -- clerk_user_id or "system" or "hermes"
    reason          TEXT,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_history_job ON job_status_history(job_id);

-- ============================================================
-- RECURRING SCHEDULES
-- ============================================================

CREATE TABLE recurring_schedules (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id),
    customer_id         UUID NOT NULL REFERENCES customers(id),
    job_type_id         UUID REFERENCES job_types(id),
    technician_id       UUID REFERENCES technicians(id),   -- preferred tech

    title               TEXT NOT NULL,
    description         TEXT,
    frequency           TEXT NOT NULL,                      -- "weekly", "biweekly", "monthly", "quarterly", "biannual", "annual"
    preferred_day       TEXT,                               -- "monday", "tuesday", etc.
    preferred_time      TIME,
    duration_minutes    INTEGER NOT NULL,

    -- Recurrence window
    starts_at           DATE NOT NULL,
    ends_at             DATE,                               -- null = indefinite
    last_generated_at   DATE,                               -- last date for which a job was created
    next_occurrence     DATE,                               -- precomputed next date

    -- Seasonal preferences
    preferred_months    INTEGER[] DEFAULT '{}',             -- [3,4,9,10] = spring & fall maintenance
    avoid_months        INTEGER[] DEFAULT '{}',             -- [6,7,8] = avoid peak HVAC season

    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recurring_tenant ON recurring_schedules(tenant_id);
CREATE INDEX idx_recurring_next ON recurring_schedules(next_occurrence) WHERE is_active = true;

-- ============================================================
-- TECHNICIAN AVAILABILITY & TIME OFF
-- ============================================================

CREATE TABLE technician_availability (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    technician_id   UUID NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL,
    type            TEXT NOT NULL,                     -- "time_off", "blocked", "on_call", "overtime", "external_calendar"
    title           TEXT,
    starts_at       TIMESTAMPTZ NOT NULL,
    ends_at         TIMESTAMPTZ NOT NULL,
    is_all_day      BOOLEAN NOT NULL DEFAULT false,
    recurrence_rule TEXT,                              -- iCal RRULE for recurring blocks
    external_ref    TEXT,                              -- Google Calendar event ID if synced
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_avail_tech_date ON technician_availability(technician_id, starts_at, ends_at);
CREATE INDEX idx_avail_tenant ON technician_availability(tenant_id);

-- ============================================================
-- TECHNICIAN LOCATION HISTORY
-- ============================================================

CREATE TABLE technician_locations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    technician_id   UUID NOT NULL REFERENCES technicians(id),
    tenant_id       UUID NOT NULL,
    location        GEOMETRY(POINT, 4326) NOT NULL,
    accuracy        REAL,                              -- meters
    speed           REAL,                              -- m/s
    heading         REAL,                              -- degrees
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partitioned by time for efficient cleanup (keep 30 days)
CREATE INDEX idx_tech_loc_tech_time ON technician_locations(technician_id, recorded_at DESC);
CREATE INDEX idx_tech_loc_tenant ON technician_locations(tenant_id);

-- Current location cache (one row per tech, upserted on each update)
CREATE TABLE technician_current_location (
    technician_id   UUID PRIMARY KEY REFERENCES technicians(id),
    tenant_id       UUID NOT NULL,
    location        GEOMETRY(POINT, 4326) NOT NULL,
    accuracy        REAL,
    speed           REAL,
    heading         REAL,
    current_job_id  UUID REFERENCES jobs(id),
    status          TEXT DEFAULT 'idle',                -- "idle", "driving", "on_job", "offline"
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_current_loc_tenant ON technician_current_location(tenant_id);

-- ============================================================
-- ON-CALL ROTATIONS
-- ============================================================

CREATE TABLE on_call_rotations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    name            TEXT NOT NULL DEFAULT 'Default',
    rotation_type   TEXT NOT NULL DEFAULT 'weekly',    -- "daily", "weekly", "biweekly"
    members         UUID[] NOT NULL,                   -- technician IDs in rotation order
    current_index   INTEGER NOT NULL DEFAULT 0,
    starts_at       DATE NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- DISPATCH OPTIMIZATION LOG
-- ============================================================

CREATE TABLE dispatch_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    trigger_type    TEXT NOT NULL,                     -- "new_job", "emergency", "tech_unavailable", "rolling", "manual"
    trigger_job_id  UUID REFERENCES jobs(id),
    input_snapshot  JSONB NOT NULL,                    -- jobs + techs + constraints at time of solve
    solution        JSONB NOT NULL,                    -- VROOM output + scoring
    solve_time_ms   INTEGER NOT NULL,
    assignments     JSONB NOT NULL,                    -- [{job_id, tech_id, score, reason}]
    accepted        BOOLEAN,                           -- did dispatcher accept?
    accepted_by     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dispatch_logs_tenant ON dispatch_logs(tenant_id, created_at DESC);
```

### 2.2 Job Lifecycle States

```
                    ┌──────────┐
                    │ created  │ ← Job entered (manually, phone AI, portal, Hermes)
                    └────┬─────┘
                         │ assign tech + time slot
                    ┌────▼─────┐
              ┌─────│scheduled │──────────┐
              │     └────┬─────┘          │
              │          │ day-of          │ customer/contractor
              │          │ confirmation    │ cancels
              │     ┌────▼──────┐    ┌────▼─────┐
              │     │dispatched │    │cancelled │
              │     └────┬──────┘    └──────────┘
              │          │ tech starts driving
              │     ┌────▼───┐
              │     │en_route│
              │     └────┬───┘
              │          │ geofence / manual check-in
              │     ┌────▼────┐
              │     │arrived  │
              │     └────┬────┘
              │          │ tech starts work
              │    ┌─────▼──────┐
              │    │in_progress │──────┐
              │    └─────┬──────┘      │ waiting for parts/permit
              │          │        ┌────▼────┐
              │          │        │ on_hold │
              │          │        └────┬────┘
              │          │             │ resumes
              │          │◄────────────┘
              │     ┌────▼─────┐
              │     │completed │ ← photos captured, signature collected
              │     └────┬─────┘
              │          │ invoice generated (Phase 4)
              │     ┌────▼────┐
              └─────│invoiced │
                    └─────────┘
```

Status transitions are enforced by a Postgres trigger function. Invalid transitions (e.g., `created` → `completed`) are rejected. Every transition writes to `job_status_history` for the audit trail.

### 2.3 Row-Level Security

Every table uses the same RLS pattern, keyed on the Clerk JWT:

```sql
-- Enable RLS on all tables
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Extract tenant_id from the Clerk JWT
CREATE OR REPLACE FUNCTION auth.tenant_id()
RETURNS UUID AS $$
  SELECT (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::UUID;
$$ LANGUAGE sql STABLE;

-- Standard policy (applied to every table with tenant_id)
CREATE POLICY tenant_isolation ON jobs
    USING (tenant_id = auth.tenant_id())
    WITH CHECK (tenant_id = auth.tenant_id());

-- Technician-specific: techs can only see their own jobs
CREATE POLICY tech_own_jobs ON jobs
    FOR SELECT
    TO authenticated
    USING (
        tenant_id = auth.tenant_id()
        AND (
            -- dispatchers/admins see all
            current_setting('request.jwt.claims', true)::jsonb ->> 'role' IN ('admin', 'dispatcher')
            OR
            -- techs see only their assigned jobs
            technician_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tech_id')::UUID
        )
    );
```

### 2.4 Supabase Realtime Subscriptions

The dispatch board and mobile app subscribe to real-time changes on key tables:

| Channel | Table | Filter | Subscribers |
|---|---|---|---|
| `jobs:changes` | `jobs` | `tenant_id=eq.{id}` | Dispatch board, tech mobile app |
| `tech:locations` | `technician_current_location` | `tenant_id=eq.{id}` | Dispatch board map view |
| `tech:availability` | `technician_availability` | `tenant_id=eq.{id}` | Dispatch board, Hermes |
| `dispatch:suggestions` | `dispatch_logs` | `tenant_id=eq.{id}` | Dispatch board (AI suggestions) |

Supabase Realtime uses PostgreSQL logical replication, so any write to these tables — whether from the API, a Hermes skill, or a mobile app sync — automatically propagates to all connected clients.

---

## 3. AI-First Dispatch Engine

### 3.1 Architecture

The dispatch engine is a Python/FastAPI microservice running on the Hetzner VPS alongside the Hermes agent. It exposes an internal API consumed by the Scheduling Service and Hermes skills.

```
┌─────────────────────────────────────────────────────────┐
│                  DISPATCH OPTIMIZER                      │
│                  (Python/FastAPI)                         │
│                                                          │
│  ┌──────────────────┐   ┌──────────────────────────┐    │
│  │  Problem Builder  │   │  Scoring Engine           │    │
│  │                    │   │                            │    │
│  │  Reads from DB:    │   │  Weights (configurable):  │    │
│  │  - Unassigned jobs │   │  - Drive time: 0.30       │    │
│  │  - Tech locations  │   │  - Revenue: 0.25          │    │
│  │  - Tech skills     │   │  - Workload balance: 0.15 │    │
│  │  - Time windows    │   │  - Skill match: 0.20      │    │
│  │  - Constraints     │   │  - Customer pref: 0.10    │    │
│  │                    │   │                            │    │
│  │  Builds VROOM      │   │  Scores VROOM solutions   │    │
│  │  problem instance  │   │  with business factors    │    │
│  └────────┬───────────┘   └──────────┬───────────────┘    │
│           │                          │                     │
│  ┌────────▼──────────────────────────▼───────────────┐    │
│  │                VROOM Solver                        │    │
│  │                (pyvroom)                           │    │
│  │                                                    │    │
│  │  Input: vehicles (techs), jobs (stops),            │    │
│  │         skills, time windows, durations            │    │
│  │  Output: optimized routes per tech                 │    │
│  │  Solve time: <1 second for 30 techs / 200 jobs    │    │
│  └────────────────────────┬──────────────────────────┘    │
│                           │                               │
│  ┌────────────────────────▼──────────────────────────┐    │
│  │              Assignment Ranker                     │    │
│  │                                                    │    │
│  │  Combines VROOM route quality +                    │    │
│  │  scoring engine business factors                   │    │
│  │  → ranked list of tech assignments per job         │    │
│  └───────────────────────────────────────────────────┘    │
│                                                          │
│  ┌───────────────────────────────────────────────────┐    │
│  │              Distance Matrix Cache                 │    │
│  │  (Redis, 24h TTL)                                  │    │
│  │                                                    │    │
│  │  Google Routes API → cache origin-dest pairs       │    │
│  │  Invalidate on traffic change > 20%                │    │
│  └───────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 3.2 How Dispatch Optimization Works

**Step 1 — Build the problem.** The Problem Builder reads current state from Supabase: unassigned jobs (locations, time windows, required skills, estimated duration), available technicians (current locations, remaining work hours, skills, zone assignments), and existing assignments that shouldn't be disrupted.

**Step 2 — Compute the distance matrix.** For each tech-to-job and job-to-job pair, look up drive time and distance. Check Redis cache first (24-hour TTL keyed on origin+destination grid cell). Cache misses hit the Google Routes API Compute Route Matrix endpoint. For a typical 30-tech / 200-job problem, this produces a ~230×230 matrix. Most entries are cached after the first solve of the day.

**Step 3 — Solve with VROOM.** The problem is formulated as a VRPTW instance:

- **Vehicles** = technicians, each with: start location (current position or home), end location (home or depot), time windows (work hours minus breaks), skills (certification IDs).
- **Jobs** = service stops, each with: location, service duration, time windows (customer's availability window), required skills.
- **Shipments** = used for pickup-then-deliver scenarios (e.g., pick up parts from supply house, then go to customer).

VROOM solves this in milliseconds for fleet sizes up to 200 vehicles / 1,000 stops.

**Step 4 — Score and rank.** VROOM optimizes primarily for drive time. The Scoring Engine applies business factors to the VROOM solution:

```python
def score_assignment(job, tech, vroom_route):
    drive_score = 1 - (drive_time_minutes / max_drive_time)
    revenue_score = (tech.historical_avg_ticket / max_avg_ticket) * (job.estimated_revenue / max_revenue)
    workload_score = 1 - (tech.assigned_hours_today / tech.max_hours)
    skill_score = skill_match_quality(tech.skills, job.required_skills)
    pref_score = 1.0 if job.customer.preferred_tech == tech.id else 0.5

    weights = tenant.settings.optimization_weights  # configurable per contractor
    return (
        weights.drive_time * drive_score +
        weights.revenue * revenue_score +
        weights.workload * workload_score +
        weights.skill_match * skill_score +
        weights.customer_preference * pref_score
    )
```

**Step 5 — Return ranked suggestions.** For each unassigned job, the engine returns a ranked list of technician assignments with scores and explanations: "Dave (score 0.87): 12 min drive, EPA 608 certified, customer's preferred tech. Mike (score 0.72): 8 min drive, EPA 608 certified, but already has 6 jobs today."

### 3.3 Dispatch Modes

Configurable per tenant via Hermes ("Set dispatch to auto mode") or the admin panel:

**Manual mode** — the dispatch board shows unassigned jobs on the left. Dispatcher drags them onto technician rows. VROOM-powered suggestions appear as recommendations but are not auto-applied. This is the default for new tenants to build trust.

**Assist mode** — when a new job arrives, the engine runs immediately and shows the top 3 assignments with scores. Dispatcher clicks to accept or overrides. A notification badge pulses on the dispatch board. This matches ServiceTitan Dispatch Pro's "Assist Mode."

**Auto mode** — the engine assigns automatically. The dispatcher is notified of each assignment and can override within a 5-minute window before the tech is notified. If no override, the assignment is confirmed and the tech receives a push notification.

### 3.4 Skill-Based Routing

Skills are modeled as a many-to-many relationship between technicians and skill definitions. Job types declare required skills. The VROOM solver enforces skill constraints natively — a job requiring "EPA 608 Universal" can only be assigned to a vehicle (tech) that has that skill ID.

Beyond hard constraints, the scoring engine applies soft preferences: an "expert" proficiency tech scores higher than a "standard" tech for complex jobs, even though both technically qualify. An apprentice-level tech is excluded from solo jobs that require a journeyman, enforced as a hard constraint.

Certification expiration is checked at solve time. If Dave's EPA 608 expires next week, the engine flags it and excludes him from refrigerant work after the expiration date.

### 3.5 Zone-Based Assignment

Service areas are stored as PostGIS polygons. Each tech has primary and secondary zone assignments. The dispatch engine uses zone membership as a scoring factor:

- Job in tech's primary zone: full zone score (1.0)
- Job in tech's secondary zone: partial score (0.6)
- Job outside all tech zones: low score (0.2), but not excluded — allows overflow when zones are overloaded

Dynamic zone rebalancing: if one zone has more demand than its assigned techs can handle, the engine borrows techs from neighboring zones with lower utilization. This happens automatically — no static zone boundaries to reconfigure.

### 3.6 Drive-Time Optimization

The Google Routes API provides traffic-aware drive times. The system uses two tiers:

**Real-time traffic** — for same-day dispatch, the API returns drive times based on current traffic conditions. Used when assigning a new emergency job or re-routing a tech.

**Predictive traffic** — for next-day and future scheduling, the API returns typical drive times for the requested departure time. Used in overnight batch optimization.

**Cost management:** The distance matrix is cached aggressively in Redis. Grid cells (0.01° lat/lng, roughly 1km) are used as cache keys. A query for "123 Oak St → 456 Elm St" is rounded to its grid cell pair. This means a new job on the same block as a recent query reuses the cached result. For a 30-tech fleet in a metro area, cache hit rates exceed 80% after the first week.

### 3.7 Emergency Dispatch

When an emergency job arrives (priority = 'emergency'), the dispatch engine follows a specialized flow:

1. **Identify candidate techs** — all techs currently on the clock with the required skills, sorted by drive time from the emergency location.
2. **Evaluate disruption cost** — for each candidate, compute the cost of pulling them off their current job or delaying their next job. Factor in customer priority of the jobs being disrupted.
3. **Re-solve the affected routes** — VROOM re-optimizes the remainder of the day for the selected tech AND any techs whose jobs are being reassigned.
4. **Notify and execute** — the selected tech receives a push notification with the emergency job details and navigation. Displaced customers receive proactive notifications: "Your technician has been reassigned to an emergency. We've rescheduled your appointment to [new time]. We apologize for the inconvenience."

The entire process — from emergency call to tech notification — targets under 30 seconds with no human intervention. The dispatcher sees the re-optimized board and can override within the 5-minute window.

### 3.8 The "10-Minute Reshuffle"

Inspired by ServiceTitan's Dispatch Pro, the system runs a rolling re-optimization on a configurable cadence (default: every 15 minutes during business hours, hourly off-hours). Each reshuffle:

1. Takes a snapshot of current state (tech locations, job statuses, remaining schedule).
2. Runs VROOM on the remainder of the day.
3. Compares the new solution against the current assignments.
4. If the new solution improves the overall score by more than a configurable threshold (default: 10%), it proposes the changes to the dispatcher (assist mode) or applies them automatically (auto mode).
5. Small improvements below the threshold are logged but not applied, to avoid constant churn.

This cadence catches drift — when a job takes 30 minutes longer than expected, the reshuffle ripples the delay through the rest of the day and notifies affected customers proactively.

### 3.9 Hermes Natural Language Dispatch

Hermes interacts with the dispatch engine through structured skill calls. Examples:

**"Book a furnace inspection for Mrs. Johnson Thursday afternoon, send someone EPA certified"**
→ Hermes calls `create_job` skill with extracted entities → skill checks Mrs. Johnson in CRM (fuzzy match) → queries availability for Thursday afternoon with EPA 608 constraint → dispatch engine ranks available techs → Hermes confirms: "I've booked Dave Martinez for Thursday 2-4pm at Mrs. Johnson's address on 4th Street. Dave is EPA 608 Universal certified. I'll send her a confirmation text. Sound good?"

**"Who's closest to 5th and Main right now?"**
→ Hermes calls `find_nearest_tech` skill → skill queries `technician_current_location` with PostGIS ST_Distance → returns ranked list: "Mike is 8 minutes away (en route to a job at 3rd and Elm), Dave is 14 minutes away (just finished at 7th and Oak), Sarah is 22 minutes away (on a job at Westpark)."

**"Reschedule all of Dave's jobs tomorrow, he called in sick"**
→ Hermes calls `tech_unavailable` skill with tech=Dave, date=tomorrow → skill marks Dave unavailable → triggers dispatch engine re-optimization for tomorrow → engine reassigns all of Dave's jobs to other qualified techs → Hermes reports: "Done. I've reassigned Dave's 6 jobs for tomorrow: 3 went to Mike, 2 to Sarah, 1 to Carlos. All customers have been notified of the technician change. Should I text Dave to confirm he's out?"

**"Show me who's available next Tuesday for a 4-hour install"**
→ Hermes calls `check_availability` skill with date=next Tuesday, duration=240min → skill queries tech schedules, removes blocks and existing jobs, checks work hour constraints → returns: "Three techs have 4+ hour blocks open on Tuesday: Dave (8am-12pm), Sarah (1pm-5pm), Mike (9am-1pm). Dave and Mike are install-certified. Want me to book one of them?"

---

## 4. Hermes Skill Interface

### 4.1 Skill Catalog

Hermes skills are defined as LLM function-calling tools. Each skill maps to one or more API endpoints on the Scheduling Service. The skills are organized by domain:

**Job Management Skills:**

| Skill | Description | Example Trigger |
|---|---|---|
| `create_job` | Create a new job with customer, type, time, tech | "Book an AC repair for Tom at 2pm Friday" |
| `update_job` | Modify job details, reschedule, reassign | "Move the Johnson job to Wednesday" |
| `cancel_job` | Cancel a job with reason and customer notification | "Cancel the 3pm, customer called to cancel" |
| `complete_job` | Mark job complete with summary | "Dave finished the furnace install" |
| `get_job` | Look up job details | "What's the Johnson job about?" |
| `list_jobs` | Query jobs by date, tech, status, customer | "What jobs do we have tomorrow?" |

**Schedule & Availability Skills:**

| Skill | Description | Example Trigger |
|---|---|---|
| `check_availability` | Find open slots by date, duration, skills | "When can we fit in a 3-hour install next week?" |
| `find_nearest_tech` | Find closest available tech to a location | "Who can get to downtown fastest?" |
| `set_time_off` | Block tech availability | "Dave is off next Friday" |
| `set_work_hours` | Configure tech schedule | "Set Sarah's hours to 7am-3pm" |
| `get_schedule` | View a tech's daily/weekly schedule | "What's Mike's schedule tomorrow?" |

**Dispatch & Optimization Skills:**

| Skill | Description | Example Trigger |
|---|---|---|
| `auto_assign` | Trigger dispatch optimization for unassigned jobs | "Assign the unassigned jobs for tomorrow" |
| `reassign_tech_jobs` | Redistribute a tech's jobs (sick/unavailable) | "Dave called in sick, reassign his jobs" |
| `emergency_dispatch` | Fast-track an emergency job | "Emergency AC out at 123 Oak, needs someone now" |
| `optimize_routes` | Run route optimization for a day | "Optimize tomorrow's routes" |

**Tech Management Skills:**

| Skill | Description | Example Trigger |
|---|---|---|
| `add_tech` | Register a new technician | "Add new tech: Maria Lopez, HVAC certified" |
| `update_tech` | Modify tech profile | "Dave is now EPA 608 certified" |
| `add_skill` | Add a skill/certification to a tech | "Add Journeyman Plumber certification to Mike" |
| `set_zone` | Assign tech to a service area | "Put Sarah in the North zone" |

**Customer Communication Skills:**

| Skill | Description | Example Trigger |
|---|---|---|
| `send_confirmation` | Send appointment confirmation | "Confirm the Johnson appointment" |
| `send_eta` | Send tech ETA to customer | "Text Mrs. Johnson that Dave is 20 minutes out" |
| `send_delay` | Notify customer of delay | "Let the 3pm know we're running 30 minutes late" |
| `send_reminder` | Send appointment reminder | "Remind tomorrow's customers" |

**Configuration Skills:**

| Skill | Description | Example Trigger |
|---|---|---|
| `set_dispatch_mode` | Switch between manual/assist/auto | "Turn on auto-dispatch" |
| `set_service_area` | Define or modify service area boundary | "Our service area is within 30 miles of downtown Houston" |
| `set_optimization_weights` | Adjust dispatch priorities | "Prioritize drive time over revenue" |
| `set_business_hours` | Configure operating hours | "We're open 7am to 6pm Monday through Saturday" |

### 4.2 Natural Language → Structured Action Mapping

Hermes uses LLM function calling (via LiteLLM gateway) to map natural language to skill invocations. The flow:

1. **User message** → Hermes receives text via Telegram/Slack/SMS
2. **Intent classification** → the LLM identifies which skill(s) to call based on the message
3. **Entity extraction** → the LLM extracts parameters using structured outputs (guaranteed valid JSON)
4. **Validation** → the skill validates entities against the database (customer lookup, tech availability check, conflict detection)
5. **Execution** → the skill calls the Scheduling Service API
6. **Response** → the skill returns a natural language summary to Hermes, who relays it to the user

For ambiguous requests, Hermes asks clarifying questions before executing. "Book a job for Johnson" → "I found two customers named Johnson: Tom Johnson at 123 Oak St and Maria Johnson at 456 Elm St. Which one?" This follows the existing Hermes pattern of confirmation before action.

### 4.3 Proactive Notifications

Hermes doesn't just respond — it initiates. The Scheduling Service triggers proactive Hermes messages when:

| Trigger | Message | Channel |
|---|---|---|
| Job running 30+ min over estimate | "Dave is running 45 minutes behind on his current job at [address]. His next customer is Mrs. Johnson at 3pm. Should I notify her and push to 3:45pm?" | Dispatcher |
| Tech idle for 20+ min between jobs | "Mike has been idle for 20 minutes. He has a gap until 2pm. There's an unassigned AC diagnostic 10 minutes from his location — should I send him?" | Dispatcher |
| Certification expiring in 30 days | "Dave's EPA 608 Universal certification expires on July 15. He has 8 refrigerant jobs scheduled after that date. Should I reassign those?" | Admin |
| Weather forecast: extreme heat | "Houston forecast: 105°F on Thursday. Historically, you see 40% more AC calls on days above 100°F. Consider opening overtime slots." | Admin |
| Customer no-show pattern detected | "Mrs. Garcia has no-showed 3 of her last 5 appointments. Her tune-up tomorrow at 10am has a high cancellation risk. Should I add a confirmation call?" | Dispatcher |
| Schedule capacity below 50% | "Next Tuesday is only 45% booked. Want me to trigger a maintenance reminder campaign to fill the day?" | Admin (→ Phase 5 Digital Ops) |

---

## 5. Mobile Experience (Technician App)

### 5.1 Technology Choice: React Native + Expo

**Decision: React Native with Expo** (not Flutter, not PWA, not pure native).

**Why React Native + Expo:**

- **Shared stack** — the existing Firmcraft admin panel and customer portal are Next.js/React. React Native lets the team share component logic, TypeScript types, API clients, and business logic across web and mobile. One team, one language.
- **Offline-first with PowerSync** — PowerSync provides a production-grade SQLite ↔ Postgres sync layer with a React Native SDK. Field-level merge resolution, automatic background sync, and zero-config conflict handling. This is the critical capability that eliminates the offline gap every competitor has.
- **OTA updates via Expo** — bug fixes and feature updates push to users without App Store review cycles. For a small team shipping fast, this is essential. A dispatcher reports a bug at 9am; a fix can be live on all tech phones by 10am.
- **Native performance where it matters** — camera (expo-camera), GPS (expo-location), push notifications (expo-notifications), and background tasks (expo-task-manager) all use native modules. The app is not a webview.
- **Expo Application Services (EAS)** — managed build and submit pipeline. No Xcode/Android Studio maintenance for CI/CD.

**Why not Flutter:** Flutter would require learning Dart and maintaining a separate UI framework from the web stack. The shared React knowledge across web and mobile is more valuable than Flutter's rendering performance advantage (which is marginal for this type of app).

**Why not PWA:** iOS Safari evicts PWA storage after ~7 days of inactivity. Background location tracking requires native capabilities. Push notifications are unreliable on iOS PWAs. For a field service app where offline-first is non-negotiable, PWA falls short.

**Why not pure native (Swift/Kotlin):** Double the codebase, double the team needed. The UX gap between React Native and native is negligible for business apps. Reserve native for when you need <8ms frame times (games, AR), not for form-heavy field service apps.

### 5.2 Core Screens

**Daily Schedule (Home Screen)**

The first screen a tech sees every morning. Optimized for one-handed bottom-of-screen interaction.

- Scrollable timeline showing today's jobs in chronological order
- Each job card: customer name, address, job type (color-coded), time window, estimated duration
- Large status button at bottom: "Start Drive" → "Arrived" → "Start Work" → "Complete" — one tap to advance status
- Tap job card to expand: full details, customer phone (tap to call), navigation button (opens Google Maps/Waze)
- Pull-to-refresh for manual sync
- Tomorrow's preview with swipe gesture

**Job Detail Screen**

Full context for the current job, designed for gloved operation with 56dp touch targets.

- Customer: name, phone (tap to call), address (tap to navigate), notes, equipment history
- Job: type, description, estimated duration, checklist, required parts
- History: previous visits to this address, original tech (for callbacks), equipment service history
- Actions: photo capture, add note, log parts used, view checklist, collect signature
- Timer: auto-started on "arrived" status, visible elapsed time

**Navigation**

- "Navigate" button launches Google Maps or Waze with the destination pre-filled via deep link
- No in-app turn-by-turn (maps apps do this better)
- ETA displayed on the job card, updated via Google Routes API when tech starts driving

**Time Tracking**

- Automatic: geofence arrival/departure via Radar.io sets clock-in/clock-out timestamps
- Manual override: tech can tap "Arrived" / "Departed" if geofence doesn't trigger (basement, GPS drift)
- Break tracking: "Take Break" button pauses the work timer
- Daily summary: total hours, drive time, on-job time, break time

**Photo Capture & Notes**

- Camera launches from within the job detail screen, photos attach directly to the job record
- Required photo flow: before photo → work photo → after photo, prompted at job completion
- Photo compression (react-native-compressor) before upload — target 500KB per photo
- Photos stored in Supabase Storage, synced on reconnect if offline
- Voice-to-text notes: tap microphone icon, speak note, on-device Whisper transcription stores as text

**Customer Signature**

- Signature pad (react-native-signature-canvas) presented at job completion
- Customer signs on tech's phone screen
- Signature stored as SVG in Supabase Storage, linked to job record
- Signature capture is a configurable requirement per job type (can be required, optional, or skipped)

**Parts & Inventory**

- "Add Parts" button on job detail screen
- Search from tenant's parts catalog (cached offline)
- Quantity selector, notes field
- Parts logged to job record → flows to invoice in Phase 4

### 5.3 Offline-First Architecture

**PowerSync (SQLite ↔ Postgres sync):**

PowerSync maintains a local SQLite database on the device that mirrors the relevant subset of the Postgres data. The sync rules define which rows each tech can see:

```yaml
# PowerSync sync rules (simplified)
bucket_definitions:
  # Tech sees their own jobs for the next 7 days
  my_jobs:
    parameters: SELECT technician_id FROM technicians WHERE clerk_user_id = token_parameters.user_id
    data:
      - SELECT * FROM jobs WHERE technician_id = bucket.technician_id AND scheduled_start > now() - interval '1 day' AND scheduled_start < now() + interval '7 days'
      - SELECT * FROM customers WHERE id IN (SELECT customer_id FROM jobs WHERE technician_id = bucket.technician_id)
      - SELECT * FROM equipment WHERE customer_id IN (SELECT customer_id FROM jobs WHERE technician_id = bucket.technician_id)
      - SELECT * FROM job_types WHERE tenant_id = token_parameters.tenant_id
```

**What works offline (full read/write):**

- View today's schedule and next 7 days
- View customer details, equipment history, job notes
- Change job status (arrived, in progress, completed)
- Add notes, log parts used, complete checklists
- Capture photos and signatures (stored locally, uploaded on reconnect)
- View parts catalog and price list

**What requires connectivity:**

- Receive new job assignments (push notification + sync)
- Real-time location sharing
- Navigation (Google Maps)
- Making/receiving phone calls through the app

**Sync strategy:** PowerSync uses a write-ahead log. Changes made offline are queued and applied to Postgres when connectivity returns. Field-level merge with last-write-wins prevents most conflicts. For true conflicts (e.g., dispatcher reassigns a job while tech is offline and marks it en_route), the system surfaces the conflict to the dispatcher for resolution rather than auto-resolving.

### 5.4 Real-Time Location Sharing

**When active:** only during configured work hours, only when the tech's status is not "offline." Techs opt in during onboarding. Location sharing can be paused (break) or stopped (end of day) from the app.

**Implementation:**

- `expo-location` for foreground and background GPS
- Adaptive polling: every 30 seconds while on a job or driving, every 5 minutes when idle
- Data payload per update: ~100 bytes (tech_id, lat, lng, timestamp, accuracy, speed, heading)
- Updates POST to a Supabase Edge Function that writes to `technician_current_location` (upsert) and `technician_locations` (append)
- Redis caches the latest position for sub-millisecond lookups by the dispatch engine

**Battery optimization:** iOS significant location changes API provides ~500m accuracy updates at near-zero battery cost. The app uses this as a baseline, switching to high-accuracy GPS only when approaching a geofence boundary or when the dispatch board requests a precise location.

### 5.5 Geofencing

**Radar.io** handles geofence management and event processing:

- Each job's customer address becomes a geofence (100m radius, created when job is scheduled)
- When the tech enters the geofence: automatic "arrived" status, clock-in timestamp
- When the tech exits the geofence: automatic "departed" event (doesn't auto-complete — tech must explicitly complete the job)
- Radar handles OS-level geofence limitations (iOS caps at 20 simultaneous geofences — Radar manages this with server-side syncing)
- Events are delivered via webhook to a Supabase Edge Function that updates job status

### 5.6 Push Notification Strategy

Firebase Cloud Messaging (FCM) for both iOS and Android, via `expo-notifications`:

| Event | Notification | Priority |
|---|---|---|
| New job assigned | "New job: AC Repair at 123 Oak St, 2-4pm" | High |
| Job reassigned to you | "Reassigned: Furnace inspection at 456 Elm, 10am (was Dave's)" | High |
| Emergency dispatch | "EMERGENCY: AC out at 789 Pine St. Tap for navigation." | Critical (bypass DND) |
| Schedule change | "Your 3pm has been moved to 3:45pm" | Normal |
| Customer cancelled | "Cancelled: The 1pm at 321 Maple has been cancelled. You now have a 1-hour gap." | Normal |
| Reminder | "Tomorrow you have 6 jobs. First job: 8am at 111 Cedar St." | Normal, evening before |

---

## 6. Customer-Facing Experience

### 6.1 Appointment Confirmations

When a job is scheduled, the customer receives a confirmation via their preferred channel:

**SMS (default):** "Hi [Customer Name], your [job type] with [Company Name] is confirmed for [Day], [Date] between [Window Start]-[Window End]. Your technician will be [Tech Name]. Reply C to confirm or R to reschedule."

**Email (via Resend):** Branded HTML email with appointment details, tech name and photo, what to expect, cancellation/reschedule link.

**Reminder sequence:**
- 24 hours before: "Reminder: Your [job type] is tomorrow between [window]. Reply C to confirm."
- 2 hours before: "Your technician [Tech Name] will be arriving between [window]. We'll text you when they're on the way."
- On dispatch: "Your technician [Tech Name] is on the way! ETA: [X] minutes."

Confirmations and reminders reduce no-show rates by 30-40% (industry data). The system tracks responses: if a customer replies "R" to reschedule, Hermes engages via the same channel to find a new time.

### 6.2 "Your Tech Is On the Way" with ETA

When a tech's status changes to `en_route`, the customer receives an SMS with the tech's name, photo (optional), and real-time ETA. The ETA is calculated by the Google Routes API using current traffic conditions.

If the ETA changes by more than 10 minutes (traffic, previous job running long), the customer receives an updated notification automatically.

### 6.3 "Where's My Tech" Real-Time Tracking

Opt-in feature enabled per tenant in settings. When active:

- After the "on the way" notification, the SMS includes a link to a tracking page
- The tracking page (Next.js, public route, no login required) shows a map with the tech's live location and updated ETA
- The page uses a short-lived token (expires when the job is completed) — no customer account needed
- Tech location updates every 15 seconds on the tracking page via Supabase Realtime
- The page auto-expires and shows "Your technician has arrived" when the geofence triggers

This is modeled after DoorDash/Uber tracking — customers already expect this experience for food delivery. Offering it for HVAC repair is a differentiator.

### 6.4 Reschedule/Cancel Self-Service

The confirmation SMS/email includes a link to a self-service page where the customer can:

- **Reschedule:** see available time slots (same availability engine that Hermes uses) and pick a new time. The old slot is released and the new slot is booked. The assigned tech and dispatcher are notified.
- **Cancel:** cancel with a reason (dropdown + free text). The slot is released. The dispatcher is notified. If the cancellation is within 24 hours, the system flags it for the dispatcher to decide whether to attempt a save call.

Cancellations update the customer's no-show/cancel count, which feeds into the ML cancellation prediction model.

### 6.5 Post-Job Review Request

After a job is marked "completed," the system waits a configurable delay (default: 2 hours) and then sends a review request:

**SMS:** "Hi [Name], thanks for choosing [Company]. How was your experience with [Tech Name]? Leave a quick review: [Google Review Link]. It means a lot to our team!"

The review link points to the contractor's Google Business Profile. This is the review flywheel — it ships as part of Phase 2 (see §8.4) and later feeds the full Digital Ops module (Phase 5). The delay is configurable because sending immediately after the tech leaves feels pushy; 2 hours lets the customer settle back into their day.

If the customer responds with a low rating (detected via reply analysis or a feedback form), the system routes the feedback to the contractor for follow-up before it becomes a public review.

---

## 7. Real-Time Infrastructure

### 7.1 Technology Choices

The real-time layer uses a hybrid approach, matching the right technology to each communication pattern:

**Supabase Realtime (primary)** — for database-driven updates. When a row in `jobs`, `technician_current_location`, or `technician_availability` changes, Supabase automatically broadcasts the change to all subscribed clients via WebSocket. No custom server code needed. This covers: job status changes, new job assignments, tech location updates on the dispatch board, schedule modifications.

**Supabase Realtime Broadcast** — for ephemeral events that don't need database persistence. Used for: dispatcher cursor positions (if we add collaborative dispatch), typing indicators in the dispatch chat, and optimization-in-progress status.

**Supabase Realtime Presence** — for tracking who's online. Used for: showing which dispatchers are currently viewing the board (prevents conflicting edits), and showing which techs have their app open.

**Firebase Cloud Messaging** — for push notifications to the mobile app when the app is in the background. Supabase Realtime requires an active WebSocket connection; FCM delivers even when the app is closed.

### 7.2 Dispatch Board Real-Time Updates

The dispatch board (FullCalendar Premium in the admin panel) subscribes to three Supabase Realtime channels:

```typescript
// Channel 1: Job changes (creates, updates, deletes)
supabase
  .channel('jobs')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'jobs',
    filter: `tenant_id=eq.${tenantId}`
  }, (payload) => {
    // Update FullCalendar event in place
    calendarApi.getEventById(payload.new.id)?.setProp(...)
  })
  .subscribe()

// Channel 2: Tech locations (for map overlay)
supabase
  .channel('tech-locations')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'technician_current_location',
    filter: `tenant_id=eq.${tenantId}`
  }, (payload) => {
    // Move tech pin on Mapbox map
    updateTechMarker(payload.new.technician_id, payload.new.location)
  })
  .subscribe()

// Channel 3: Dispatch suggestions (AI recommendations)
supabase
  .channel('dispatch-suggestions')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'dispatch_logs',
    filter: `tenant_id=eq.${tenantId}`
  }, (payload) => {
    // Show optimization suggestion notification
    showDispatchSuggestion(payload.new)
  })
  .subscribe()
```

### 7.3 Conflict Resolution

When two dispatchers are viewing the dispatch board simultaneously and both try to assign the same tech to overlapping jobs:

1. **Optimistic UI:** the first dispatcher's drag-and-drop appears to succeed immediately on their screen.
2. **Server validation:** the Supabase Edge Function checks for time conflicts before committing. If the tech already has a job at that time (assigned by the other dispatcher milliseconds earlier), the function returns a conflict error.
3. **Conflict notification:** the first dispatcher sees a toast: "Conflict: Dave was just assigned to [other job] by [other dispatcher]. Assignment reverted." The calendar event snaps back to its original position.
4. **Presence awareness:** the dispatch board shows which dispatcher is currently dragging a job (via Supabase Presence), reducing the likelihood of simultaneous conflicting actions.

The key principle: the database is the source of truth. Optimistic UI makes the app feel fast, but every write is validated server-side before becoming permanent. Supabase Realtime ensures both dispatchers see the resolved state within 1-2 seconds.

### 7.4 Live Tech Location Updates

Tech phones send GPS updates to a Supabase Edge Function:

```
POST /functions/v1/tech-location
Authorization: Bearer <clerk_jwt>
Body: { lat, lng, accuracy, speed, heading }
```

The function:
1. Validates the JWT and extracts `tech_id` and `tenant_id`
2. Upserts `technician_current_location` (triggers Realtime broadcast to dispatch board)
3. Appends to `technician_locations` history (for analytics and playback)
4. Updates Redis cache (for sub-millisecond reads by the dispatch engine)

At 50 techs updating every 30 seconds, this is ~100 writes/minute — well within Supabase's capacity. The Realtime broadcast is the expensive part, but with 2-3 dispatchers subscribed per tenant, it's negligible.

---

## 8. Integration Architecture

### 8.1 Phase 1 (AI Phone) → Phase 2 (Scheduling)

```
Customer calls → Retell/Vapi AI → Hermes (brain) → Scheduling Skills → Job created
                                                                       ↓
                                                            Dispatch Engine → Tech assigned
                                                                       ↓
                                                            SMS confirmation → Customer
                                                            Push notification → Tech
```

The AI phone agent uses Hermes as its brain. When the phone agent detects a service request, Hermes invokes the `create_job` skill with extracted entities. The skill checks availability in real-time (the phone call waits — target <3 seconds for availability check) and either books immediately or offers alternatives.

For emergency calls, the phone agent detects urgency cues ("my AC is out and it's 100 degrees", "water is flooding my kitchen") and sets priority = 'emergency', which triggers the emergency dispatch flow immediately after job creation. The customer is told: "I'm dispatching a technician to you right now. You'll receive a text with their name and ETA within 5 minutes."

### 8.2 Phase 2 (Scheduling) → Phase 3 (Online Booking Widget)

Online booking is the next module after scheduling, and it depends entirely on the scheduler — **not** on invoicing. The widget lets customers self-book against real availability and drops the resulting job straight into the dispatch board.

**Forward-compatibility requirement (Phase 2 must ship this):** Phase 2 has to expose a stable, documented **availability API** that an unauthenticated, embeddable widget can call. Concretely:

- **`check_availability` endpoint** — takes service type + customer location/zip, returns the same slot suggestions Hermes computes (VROOM-backed). It must be callable from a public, embeddable context (no end-user login), rate-limited and tenant-scoped via a **public widget key** rather than a service credential.
- **`create_job` from booking** — a confirmed slot calls the same job-creation path the phone agent uses (§8.1), so a self-booked job is indistinguishable from a phone-booked one downstream.
- **Idempotency + hold tokens** — the widget needs a short-lived slot "hold" so two customers can't grab the same slot mid-form. Phase 2 exposes a hold/confirm two-step on `check_availability` → `create_job`.

**Customer self-service portal (Phase 3 growth scope):** logged-in customers query `jobs` where `customer_id = X` for history and upcoming appointments; "Where's My Tech" subscribes to `technician_current_location` for the assigned tech, scoped by a short-lived token; rescheduling calls the same `update_job` endpoint Hermes uses, triggering re-optimization of affected routes.

### 8.3 Phase 2 (Scheduling) → Phase 4 (Invoicing)

When a tech marks a job "completed," the system assembles an invoice-ready data package:

```json
{
  "job_id": "...",
  "customer": { "name": "...", "email": "...", "address": "..." },
  "services": [
    { "name": "AC Diagnostic", "flat_rate": 89.00 }
  ],
  "parts": [
    { "name": "Capacitor 45/5 MFD", "qty": 1, "cost": 12.50, "price": 45.00 }
  ],
  "labor": {
    "hours": 1.5,
    "rate": 125.00,
    "total": 187.50
  },
  "travel_time_minutes": 22,
  "membership_discount": 0.10,
  "warranty_claim": false
}
```

This package is stored in the job record. Phase 4's invoicing service reads it and generates a Stripe invoice. The transition from "completed" to "invoiced" is the handoff point.

### 8.4 Review Flywheel (Phase 2 scope)

The review flywheel ships at the **tail end of Phase 2**, not with Digital Ops. It only depends on one thing the scheduler already knows — *when a job is done* — so it lands here first and later folds into the full Digital Ops module (Phase 5).

The flow: job marked `completed` → (configurable delay, default 2h) → SMS review request → Google review link → AI-drafted response to whatever review the customer leaves.

**Hooks Phase 2 must expose for the flywheel (and that Digital Ops later reuses):**

- **`job.completed` event** — the same webhook/event that feeds invoicing (§8.3) also triggers the review request, after the configurable delay. The delay is a setting because firing the instant the tech leaves feels pushy; a short wait lets the customer settle.
- **Review-request send** — reuses the Phase 1/2 SMS stack (Twilio); the message carries the contractor's Google review link.
- **Review capture + AI draft** — inbound reviews are matched back to the `job_id`, and an AI-drafted response is queued for one-tap approval. This is the seed of the reputation dashboard Digital Ops builds out in Phase 5.

Because these hooks live in Phase 2, Digital Ops (Phase 5) inherits a working review loop on day one and only has to add the reputation dashboard, multi-platform monitoring, and cross-channel reporting around it.

### 8.5 Phase 2 (Scheduling) → Phase 5 (Digital Ops)

The scheduling system exposes a capacity signal to the Digital Ops module:

```json
{
  "tenant_id": "...",
  "date": "2026-06-15",
  "capacity_percentage": 72,
  "available_hours_by_skill": {
    "hvac_repair": 14,
    "plumbing": 8,
    "electrical": 6
  },
  "available_zones": ["north_houston", "inner_loop"],
  "saturated_zones": ["katy", "sugarland"]
}
```

Digital Ops uses this signal to:
- **Throttle ads** when capacity > 90% (don't waste ad spend on leads you can't serve)
- **Boost campaigns** when capacity < 60% (fill empty slots)
- **Target geographically** — advertise in zones with availability, suppress in saturated zones
- **Time campaigns** — send maintenance reminders during slow weeks, not peak weeks

### 8.6 Office Dashboard (cross-cutting — built incrementally)

The office dashboard is **no longer a standalone phase**. Each module ships its own dashboard tab into the admin panel as it lands, so the single pane of glass assembles itself tab-by-tab rather than waiting for a dedicated build. Scheduling contributes the Job Board and Tech Utilization tabs.

The scheduling KPIs below are derived directly from the scheduling tables and surface in those tabs:

| KPI | Query Source |
|---|---|
| Jobs per tech per day | `COUNT(jobs) GROUP BY technician_id, DATE(scheduled_start)` |
| Drive time % | `SUM(drive_time) / SUM(work_hours)` from location + job timestamps |
| First-time fix rate | `COUNT(jobs WHERE parent_job_id IS NULL AND status='completed') / COUNT(jobs WHERE status='completed')` |
| Revenue per tech | `SUM(actual_revenue) GROUP BY technician_id` |
| On-time arrival % | `COUNT(WHERE actual_start <= arrival_window_end) / COUNT(completed jobs)` |
| Schedule fill rate | `SUM(booked_hours) / SUM(available_hours)` |
| Avg job duration accuracy | `AVG(ABS(actual_duration - estimated_duration))` |

These are computed as Postgres views or materialized views, refreshed on a schedule. The dashboard subscribes to Supabase Realtime on the views for live updates during the workday. Later phases add their own tabs (Booking Activity in Phase 3, AR Aging in Phase 4, reputation in Phase 5) against the same pattern.

### 8.7 Google Calendar Integration

**Strategy: one-way push, scheduling system is source of truth.**

When a job is assigned to a tech, a Google Calendar event is created (or updated) in the tech's calendar via the Google Calendar API. The event includes job details, customer address, and a link to the job in the Firmcraft mobile app.

If a tech blocks time in their personal Google Calendar (vacation, personal appointment), a webhook fires. The scheduling system creates a `technician_availability` record of type `external_calendar`, blocking that time slot from dispatch. The tech's personal events are not synced back as jobs — they only create unavailability windows.

This avoids the complexity of true two-way sync. The scheduling system always wins for job assignments; Google Calendar is a read-only view for techs who like seeing everything in one place.

**Rate limit management:** Google Calendar API allows 500 requests/100 seconds per user. For 50 techs, batch operations (bulk schedule updates) use the Calendar API's batch endpoint (up to 50 requests per batch). Webhook subscriptions use push notifications (Calendar API watch) rather than polling.

### 8.8 Google Maps/Routes Integration

| Use Case | API | Endpoint | Cost |
|---|---|---|---|
| Tech navigation to job | None (deep link to Google Maps/Waze app) | `google.navigation:q=...` | Free |
| Drive time for dispatch | Routes API | Compute Route Matrix | $30/1K fleet routing visits |
| ETA for customer notification | Routes API | Compute Routes | $10/1K single-origin |
| Geocoding addresses | Geocoding API | Geocode | $5/1K requests |
| Dispatch board map | Mapbox GL JS | Tiles + Markers | Free tier (50K loads/mo) |

### 8.9 QuickBooks Integration

Phase 4 handles QuickBooks invoice sync, but Phase 2 contributes time tracking data:

- Tech clock-in/clock-out times (from geofence + manual entries) → work hours per day per tech
- Drive time between jobs → tracked separately from on-site time
- Break time → deducted from billable hours
- This data feeds Phase 4's payroll export and is available for QuickBooks Time (formerly TSheets) sync

---

## 9. API Design

### 9.1 Architecture Decision: REST + Supabase

**RESTful API via Supabase auto-generated endpoints + custom Edge Functions.** Not GraphQL.

**Why REST over GraphQL:** The scheduling module has well-defined entities with predictable access patterns. Jobs are queried by date, tech, or customer. Techs are listed by tenant. The overhead of a GraphQL schema, resolver layer, and N+1 query management is not justified for these patterns. Supabase's PostgREST layer provides instant CRUD endpoints with filtering, ordering, and pagination — for free. Custom logic (dispatch optimization, notification triggers) runs in Edge Functions.

### 9.2 Key Endpoints

**Jobs**

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/rest/v1/jobs?tenant_id=eq.X&scheduled_start=gte.2026-06-08&scheduled_start=lt.2026-06-09&order=scheduled_start` | List jobs for a day |
| `GET` | `/rest/v1/jobs?technician_id=eq.X&status=in.(scheduled,dispatched,en_route,arrived,in_progress)` | Active jobs for a tech |
| `POST` | `/rest/v1/jobs` | Create a job |
| `PATCH` | `/rest/v1/jobs?id=eq.X` | Update a job (reschedule, reassign, add notes) |
| `POST` | `/functions/v1/jobs/complete` | Complete a job (triggers notification, invoice prep) |
| `POST` | `/functions/v1/jobs/cancel` | Cancel a job (triggers notification, slot release) |

**Technicians**

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/rest/v1/technicians?tenant_id=eq.X&is_active=eq.true` | List active techs |
| `GET` | `/rest/v1/technician_current_location?tenant_id=eq.X` | Current positions |
| `GET` | `/functions/v1/technicians/availability?date=2026-06-10&duration=120` | Available slots |

**Dispatch**

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/functions/v1/dispatch/optimize` | Trigger optimization for a day |
| `POST` | `/functions/v1/dispatch/emergency` | Emergency dispatch for a specific job |
| `POST` | `/functions/v1/dispatch/reassign` | Redistribute a tech's jobs |
| `GET` | `/functions/v1/dispatch/suggestions?date=2026-06-08` | Pending AI suggestions |
| `POST` | `/functions/v1/dispatch/accept` | Accept an AI assignment suggestion |

**Schedule**

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/functions/v1/schedule/slots?date=2026-06-10&job_type_id=X&zone_id=Y` | Available booking slots |
| `POST` | `/rest/v1/technician_availability` | Add time off / blocked time |
| `GET` | `/rest/v1/recurring_schedules?tenant_id=eq.X&is_active=eq.true` | List recurring schedules |

**Location**

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/functions/v1/tech-location` | Update tech GPS position |
| `GET` | `/functions/v1/tech-location/nearest?lat=X&lng=Y&skill_ids=A,B` | Find nearest qualified tech |

### 9.3 Authentication

All API requests require a Clerk JWT in the Authorization header. The JWT includes:

```json
{
  "sub": "user_abc123",
  "tenant_id": "uuid-of-tenant",
  "role": "admin|dispatcher|technician",
  "tech_id": "uuid-of-tech-if-applicable",
  "org_id": "clerk-org-id"
}
```

Supabase validates the JWT using Clerk's JWKS endpoint. RLS policies use `auth.tenant_id()` (extracted from the JWT) to scope all queries. Technician-role JWTs additionally restrict job visibility to jobs assigned to that tech.

**Subdomain ↔ JWT consistency.** On the client app (`{slug}.firmcraft.ai`), the Next.js middleware resolves the subdomain to a `tenant_id` (Section 1.6) *before* any data access. That resolved tenant must match the `tenant_id` claim in the user's Clerk JWT. The two are reconciled as follows:

1. **Middleware** extracts the subdomain slug and looks up its `tenant_id` (edge-cached).
2. **Clerk** authenticates the user; the active organization's `tenant_id` is in the JWT.
3. If the JWT's `tenant_id` ≠ the subdomain's `tenant_id`, the request is rejected (403) and the user is redirected to `app.firmcraft.ai`, which sends them to *their* correct `{slug}` subdomain. This guards against a user authenticated for one tenant landing on another tenant's URL.

The subdomain is convenience and white-labeling, not authorization: even if the consistency check were bypassed, Postgres RLS (keyed on the JWT's `tenant_id`, never on the subdomain) is the hard boundary that prevents cross-tenant reads or writes. `app.firmcraft.ai` is a tenant-agnostic login surface — it authenticates the user, reads the `tenant_id`/`slug` from Clerk, and 302-redirects to the right dashboard. Firmcraft staff hitting `admin.firmcraft.ai` are authenticated as the internal organization and see the cross-tenant back office rather than any single tenant's view.

### 9.4 Webhook Events

The scheduling system emits webhook events that downstream systems (Phase 4 invoicing, Phase 5 Digital Ops, external integrations) can subscribe to:

| Event | Payload | Triggered When |
|---|---|---|
| `job.created` | Full job record | New job created |
| `job.scheduled` | Job + tech assignment | Job assigned to tech + time |
| `job.status_changed` | Job + old/new status | Any status transition |
| `job.completed` | Job + parts + labor + photos | Tech marks complete |
| `job.cancelled` | Job + reason | Job cancelled |
| `tech.location_updated` | Tech ID + lat/lng + timestamp | Location update received |
| `schedule.capacity_changed` | Tenant + date + capacity % | Daily capacity crosses threshold |
| `dispatch.suggestion_created` | Optimization result | AI generates assignment suggestions |

Webhooks are delivered via Supabase Edge Functions → tenant-configured webhook URLs. Delivery is at-least-once with exponential backoff retry (3 attempts over 1 hour).

### 9.5 Rate Limiting

| Consumer | Limit | Enforcement |
|---|---|---|
| Admin panel / dispatch board | 100 requests/second | Supabase default |
| Tech mobile app | 30 requests/second | Edge Function middleware |
| Customer portal | 20 requests/second | Edge Function middleware |
| Hermes skills | 50 requests/second | Internal, no external rate limit |
| Location updates | 2/second per tech | Edge Function dedup |

---

## 10. Infrastructure & Costs

### 10.1 Hosting Architecture

| Component | Hosting | Why |
|---|---|---|
| **Supabase** (Postgres + Realtime + Storage + Edge Functions) | Supabase Cloud (Pro plan) | Managed Postgres, built-in Realtime, PostGIS, RLS, Edge Functions. No ops overhead. |
| **Dispatch Optimizer** (Python/FastAPI + VROOM) | Hetzner VPS (existing) | Runs alongside the Hermes agent. VROOM needs <500MB RAM. Co-locate to minimize latency to Supabase. |
| **Admin Panel / Dispatch Board** | Vercel (existing) | Next.js deployment. Existing infrastructure. |
| **Tech Mobile App** | Expo Application Services (EAS) | Build, submit, OTA updates. Managed CI/CD. |
| **Redis** | Upstash (serverless Redis) | Distance matrix cache, location cache, event queue. Pay-per-request, no idle cost. |
| **ML Pipeline** | Hetzner VPS or Modal (serverless GPU) | XGBoost training is CPU-bound and fast. No GPU needed until computer vision features. |

### 10.2 Cost Model Per Tenant (Monthly)

**For a 30-tech fleet (typical mid-market contractor):**

| Item | Cost | Notes |
|---|---|---|
| Supabase Pro | $25 | Shared across tenants (one Supabase project) |
| Google Routes API | $150-300 | ~5,000-10,000 matrix computations/month |
| Google Calendar API | $0 | Free tier covers <500 pushes/day easily |
| Mapbox | $0 | Free tier: 50K map loads/month |
| Radar.io | $0 | Free tier: 1,000 users |
| Firebase Cloud Messaging | $0 | Free, unlimited |
| Upstash Redis | $5-10 | ~100K commands/month |
| PowerSync | $49 | Sync service for offline mobile |
| Expo EAS | $0 | Free tier for builds; $99/mo for priority |
| VROOM | $0 | Open source, self-hosted |
| ML inference | $10-20 | Marginal cost per tenant on shared infra |
| **Total per tenant** | **~$240-405** | |

**Key insight:** The marginal cost per tenant is dominated by Google Routes API usage. Everything else is shared infrastructure with near-zero marginal cost. At $149-199/month retail price for the scheduling module (bundled in the Team plan at $799/mo), the unit economics are strong once you have 5+ tenants sharing the fixed infrastructure.

### 10.3 Cost at Scale

| Tenants | Monthly Infra Cost | Revenue (at $799/mo avg plan) | Gross Margin |
|---|---|---|---|
| 10 | ~$2,800 | $7,990 | ~65% |
| 50 | ~$10,500 | $39,950 | ~74% |
| 100 | ~$18,000 | $79,900 | ~77% |

Margins improve with scale because Supabase, Hetzner, Redis, and ML infrastructure costs are largely fixed. Google Routes API is the only meaningfully variable cost, and it scales linearly with fleet size.

### 10.4 Google Routes API Cost Modeling (30-Tech Fleet)

**Assumptions:** 30 techs, 8 jobs/tech/day, 22 working days/month.

**Daily distance matrix:** The dispatch engine needs drive times between all tech locations and job locations. For 30 techs and ~240 daily jobs, the matrix is ~270×270 = ~72,900 elements. However, with grid-cell caching (0.01° ≈ 1km), cache hit rates exceed 80% after the first week. Actual API calls: ~15,000/day initially, dropping to ~3,000/day with warm cache.

**Fleet routing pricing:** $30/1,000 visits. At 240 visits/day × 22 days = 5,280 visits/month = ~$158/month.

**Re-optimization calls:** Rolling 15-minute re-optimization computes partial matrices. Estimated additional 30% over base: ~$47/month.

**Total Google Routes API cost:** ~$150-300/month for a 30-tech fleet. This aligns with the research estimate.

---

## 11. Security & Compliance

### 11.1 Multi-Tenant Data Isolation

**Database layer (hard boundary):** PostgreSQL Row-Level Security policies on every table ensure a tenant can never access another tenant's data, regardless of application-layer bugs. The `tenant_id` is extracted from the Clerk JWT, not from user input. RLS policies use `USING` and `WITH CHECK` clauses to enforce both read and write isolation.

**Application layer:** API routes validate the JWT before any database access. Edge Functions run in isolated V8 workers per request. No shared state between requests from different tenants.

**Subdomain is not a boundary:** the white-labeled `{slug}.firmcraft.ai` host (Section 1.6) is a routing and white-labeling convenience, never an authorization mechanism. Tenant scoping always derives from the Clerk JWT's `tenant_id` claim and is enforced by RLS — a forged or mismatched subdomain cannot widen access. The middleware's subdomain ↔ JWT consistency check (Section 9.3) is defense-in-depth on top of RLS, not a substitute for it.

**Testing:** integration tests verify that a JWT for Tenant A cannot read, write, or modify data belonging to Tenant B. These tests run in CI on every deployment.

### 11.2 Technician Location Privacy

Location data is the most sensitive data in the scheduling module. Protections:

**Work hours only:** GPS tracking is only active during the tech's configured work hours. Outside work hours, no location data is collected. The mobile app enforces this client-side (stops sending updates) and the server rejects out-of-hours updates.

**Opt-in consent:** techs must explicitly enable location sharing during onboarding. The permission can be revoked at any time from the app settings. Revocation is immediate — the tech disappears from the dispatch map.

**Retention policy:** `technician_locations` (history table) retains 30 days of data, then automatically purges via a Postgres cron job (`pg_cron`). `technician_current_location` (current position) is overwritten on each update and deleted when the tech goes offline.

**Access control:** only users with the `dispatcher` or `admin` role can view tech locations. Techs cannot see other techs' locations. Customer tracking is limited to their assigned tech during the active job window.

**No off-site tracking:** the system does not track techs when they leave a job site and are not en route to the next job. "Idle" techs (between jobs, on break) report only their last known position, not continuous tracking.

### 11.3 Customer Data Handling

**PII scope:** customer names, addresses, phone numbers, and email addresses are stored in the `customers` table. This data is subject to state privacy laws (CCPA for California customers, TDPA for Texas, etc.).

**Encryption:** all data is encrypted at rest (Supabase uses AES-256 for storage encryption) and in transit (TLS 1.3 for all API connections).

**Access control:** customer data is accessible to dispatchers and the assigned technician. Techs can see customer details only for their assigned jobs. The customer portal uses short-lived tokens scoped to a single customer, not broad access tokens.

**Data deletion:** when a contractor terminates their Firmcraft subscription, all tenant data is deleted within 30 days. Contractors can request immediate deletion. An export is provided before deletion (CSV/JSON).

**Signature storage:** digital signatures are stored in Supabase Storage with the same RLS policies. Signatures are immutable once captured — they cannot be modified or deleted by the contractor without an audit trail.

### 11.4 API Security

**Authentication:** every API request requires a valid Clerk JWT. JWTs have a 1-hour expiry with refresh tokens.

**Authorization:** role-based access control (admin > dispatcher > technician > customer) is enforced at the RLS and Edge Function layers.

**Input validation:** all Edge Functions validate input with Zod schemas. SQL injection is prevented by Supabase's parameterized queries.

**Rate limiting:** per-consumer limits prevent abuse (see Section 9.5).

**Audit logging:** all job status changes, tech assignments, and configuration changes are logged to `job_status_history` and `dispatch_logs` with the acting user's ID.

---

## 12. Build vs. Buy vs. Integrate

### 12.1 Decision Matrix

| Component | Decision | Choice | Rationale |
|---|---|---|---|
| **Route optimization solver** | Build (integrate open source) | VROOM via pyvroom | Free, millisecond solve times, skills matching. The custom part is the problem formulation and scoring layer, not the solver. |
| **Distance/duration matrix** | Integrate (API) | Google Routes API | Traffic-aware, maintained, $150-300/mo. Not worth self-hosting OSRM for the traffic accuracy tradeoff. |
| **Dispatch scoring engine** | Build | Custom Python | This IS the differentiation. Weighted multi-objective scoring with configurable priorities is what makes Firmcraft's dispatch smarter than manual drag-and-drop. |
| **Database** | Buy (managed service) | Supabase (PostgreSQL) | Already in the stack. Realtime, RLS, PostGIS, Edge Functions. No ops team to run Postgres. |
| **Mobile app framework** | Build (on framework) | React Native + Expo | Cross-platform, offline-first with PowerSync, OTA updates. Shared React knowledge with web team. |
| **Offline sync** | Buy (managed service) | PowerSync | Field-level merge, React Native SDK, Postgres-native. Building this from scratch would take 3+ months. |
| **Dispatch board UI** | Buy (component library) | FullCalendar Premium | Resource timeline view (techs as rows, time as columns), drag-and-drop, event resizing. $590 one-time license. Building a calendar from scratch is a 2-month project. |
| **Map display** | Integrate (SDK) | Mapbox GL JS | 5x cheaper than Google Maps for tile rendering. Full style control for the dispatch map. |
| **Tech navigation** | Integrate (deep link) | Google Maps / Waze | Don't build in-app navigation. Deep link to the app techs already know. |
| **Geofencing** | Buy (managed service) | Radar.io | Handles iOS 20-geofence limit, cross-platform, free tier for 1K users. Building geofencing from scratch requires fighting OS-level limitations. |
| **Push notifications** | Integrate (service) | Firebase Cloud Messaging | Free, reliable, unlimited, supported by Expo. No reason to build or buy anything else. |
| **SMS/Email** | Integrate (existing) | Twilio + Resend | Already in the Firmcraft stack. No new vendor needed. |
| **Auth** | Integrate (existing) | Clerk | Already in the stack. Add technician and dispatcher roles. |
| **ML models** | Build | XGBoost + Prophet + scikit-learn | Duration prediction and demand forecasting are straightforward ML with well-understood approaches. No need for a managed ML platform at this scale. |
| **Voice-to-text** | Integrate (API) | Whisper V4 or Deepgram | Commoditized. Use the best API; don't self-host until volume justifies it. |
| **LLM for NL parsing** | Integrate (existing) | LiteLLM gateway | Already in the stack. Hermes's existing LLM pipeline handles intent extraction and structured output. |
| **Calendar sync** | Integrate (API) | Google Calendar API | One-way push. Standard REST API, well-documented. |
| **Photo CDN** | Buy (managed) | Supabase Storage + Cloudflare CDN | Supabase Storage handles uploads, Cloudflare provides edge caching. No need for Cloudinary at this scale. |
| **Signature capture** | Build (integrate library) | Signature Pad (szimek) | Lightweight, no dependencies, canvas-based. Free and trivial to integrate. |
| **OCR for equipment** | Integrate (SDK) | Google ML Kit v2 | On-device, free, offline-capable. No API cost, no server infrastructure. |

### 12.2 What Must Be Custom-Built

These are the components that create Firmcraft's competitive differentiation and cannot be bought or integrated:

1. **Dispatch scoring engine** — the weighted multi-objective optimization that considers drive time, revenue potential, workload balance, skill match, and customer preference simultaneously. This is what makes Firmcraft's dispatch intelligent, not just optimized for one variable.

2. **Hermes skill interface** — the natural language layer that translates "Dave called in sick, reassign his jobs" into a series of API calls that re-optimize the schedule. This is Firmcraft's core product interaction model.

3. **Proactive intelligence layer** — the system that detects jobs running long, idle techs, expiring certifications, and capacity gaps, then proactively alerts the dispatcher. This transforms the dispatcher from reactive to proactive.

4. **Problem formulation layer** — the code that translates the messy real-world state (techs, jobs, constraints, preferences) into a clean VROOM problem instance. This is where domain expertise matters — handling edge cases like multi-day projects, warranty callbacks, and seasonal maintenance scheduling.

5. **Job lifecycle engine** — the state machine that enforces valid status transitions, triggers downstream actions (notifications, invoice prep, review requests), and maintains the audit trail.

### 12.3 Open Source Components Summary

| Component | Project | License | Stars | Purpose |
|---|---|---|---|---|
| VROOM | VROOM-Project/vroom | BSD 2-Clause | 1.4K | Route optimization solver |
| FullCalendar | fullcalendar/fullcalendar | MIT (core) | 19K+ | Dispatch board calendar |
| Signature Pad | szimek/signature_pad | MIT | 3.5K+ | Digital signature capture |
| Supabase | supabase/supabase | Apache 2.0 | 80K+ | Database, Realtime, Storage, Auth |
| Expo | expo/expo | MIT | 38K+ | React Native framework |
| PowerSync | powersync-ja | Apache 2.0 | 1.5K+ | Offline-first sync |
| XGBoost | dmlc/xgboost | Apache 2.0 | 27K+ | ML: duration prediction |
| Prophet | facebook/prophet | MIT | 19K+ | ML: demand forecasting |

---

## Appendix A: Phased Build Timeline

| Phase | Timeline | Deliverables |
|---|---|---|
| **2a: Smart Dispatch MVP** | Months 1-3 (Aug-Oct 2026) | Dispatch board (FullCalendar), map view (Mapbox), VROOM route optimization, basic skill matching, Supabase Realtime updates, mobile app (schedule view, job status, navigation, photos), offline mode (PowerSync) |
| **2b: Predictive Intelligence** | Months 3-5 (Oct-Dec 2026) | Job duration prediction (XGBoost), dynamic re-routing on job overrun, emergency dispatch re-optimization, automated customer notifications (ETA, delays), geofencing auto-clock (Radar.io) |
| **2c: Voice & Natural Language** | Months 5-7 (Dec 2026-Feb 2027) | Voice-to-schedule (Whisper + Claude structured outputs), NL dispatch commands via Hermes, AI dispatch suggestions (assist mode → auto mode), warranty callback auto-routing |
| **2d: Advanced Optimization** | Months 7-10 (Feb-May 2027) | Demand forecasting (Prophet), capacity-aware marketing signal (Phase 5 Digital Ops), multi-day project scheduling, on-call rotation management, revenue-optimizing dispatch, full integrations with Phase 1 (phone), Phase 3 (booking), Phase 4 (invoicing), Phase 5 (Digital Ops) |

## Appendix B: Key Technical Decisions Log

| Decision | Chosen | Considered | Rationale |
|---|---|---|---|
| Mobile framework | React Native + Expo | Flutter, PWA, Native | Shared React stack, PowerSync SDK, OTA updates, sufficient performance |
| Offline sync | PowerSync | WatermelonDB, RxDB, custom | Production-grade Postgres sync, field-level merge, React Native support |
| Route solver | VROOM | OR-Tools, PyVRP, Timefold | Millisecond solve times, skills matching built in, simplest integration |
| Distance matrix | Google Routes API | OSRM, OpenRouteService | Traffic-aware accuracy justifies API cost; self-hosted OSRM lacks real-time traffic |
| Dispatch board | FullCalendar Premium | DHTMLX, react-big-calendar, custom | Resource timeline view, drag-and-drop, 19K+ stars, well-documented |
| Map rendering | Mapbox GL JS | Google Maps JS | 5x cheaper tile pricing, full style control, vector tiles |
| Geofencing | Radar.io | Custom (expo-location) | Handles iOS 20-geofence limit, cross-platform edge cases, free tier |
| Real-time layer | Supabase Realtime | Socket.io, Ably, Pusher | Already in stack, Postgres-native (no sync layer), Presence built in |
| ML framework | XGBoost + Prophet | TensorFlow, PyTorch | Tabular data; gradient boosted trees outperform deep learning here |
| Dispatch API | REST (Supabase PostgREST) | GraphQL | Well-defined entities with predictable access patterns; no GraphQL overhead needed |
| Calendar sync | One-way push to Google Calendar | Two-way sync | Avoids conflict resolution nightmare; scheduling system is source of truth |
