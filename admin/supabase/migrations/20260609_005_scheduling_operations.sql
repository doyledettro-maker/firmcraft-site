-- Scheduling & Dispatch (Phase 2.1, Sprint 1) — availability, location, dispatch
--
-- Tables: technician_availability, technician_locations, technician_current_location,
-- on_call_rotations, dispatch_logs. Schemas follow architecture doc §2.1 exactly.

-- ============================================================
-- TECHNICIAN AVAILABILITY & TIME OFF
-- ============================================================

create table if not exists public.technician_availability (
    id              uuid primary key default gen_random_uuid(),
    technician_id   uuid not null references public.technicians(id) on delete cascade,
    tenant_id       uuid not null,
    type            text not null,                     -- "time_off", "blocked", "on_call", "overtime", "external_calendar"
    title           text,
    starts_at       timestamptz not null,
    ends_at         timestamptz not null,
    is_all_day      boolean not null default false,
    recurrence_rule text,                              -- iCal RRULE for recurring blocks
    external_ref    text,                              -- Google Calendar event ID if synced
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index if not exists idx_avail_tech_date on public.technician_availability(technician_id, starts_at, ends_at);
create index if not exists idx_avail_tenant on public.technician_availability(tenant_id);

-- ============================================================
-- TECHNICIAN LOCATION HISTORY
-- ============================================================

create table if not exists public.technician_locations (
    id              uuid primary key default gen_random_uuid(),
    technician_id   uuid not null references public.technicians(id),
    tenant_id       uuid not null,
    location        geometry(point, 4326) not null,
    accuracy        real,                              -- meters
    speed           real,                              -- m/s
    heading         real,                              -- degrees
    recorded_at     timestamptz not null default now()
);

-- Time-ordered access for trail rendering + efficient cleanup (keep 30 days).
create index if not exists idx_tech_loc_tech_time on public.technician_locations(technician_id, recorded_at desc);
create index if not exists idx_tech_loc_tenant on public.technician_locations(tenant_id);

-- Current location cache (one row per tech, upserted on each update)
create table if not exists public.technician_current_location (
    technician_id   uuid primary key references public.technicians(id),
    tenant_id       uuid not null,
    location        geometry(point, 4326) not null,
    accuracy        real,
    speed           real,
    heading         real,
    current_job_id  uuid references public.jobs(id),
    status          text default 'idle',                -- "idle", "driving", "on_job", "offline"
    updated_at      timestamptz not null default now()
);

create index if not exists idx_current_loc_tenant on public.technician_current_location(tenant_id);

-- ============================================================
-- ON-CALL ROTATIONS
-- ============================================================

create table if not exists public.on_call_rotations (
    id              uuid primary key default gen_random_uuid(),
    tenant_id       uuid not null references public.tenants(id),
    name            text not null default 'Default',
    rotation_type   text not null default 'weekly',    -- "daily", "weekly", "biweekly"
    members         uuid[] not null,                   -- technician IDs in rotation order
    current_index   integer not null default 0,
    starts_at       date not null,
    is_active       boolean not null default true,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

-- ============================================================
-- DISPATCH OPTIMIZATION LOG
-- ============================================================

create table if not exists public.dispatch_logs (
    id              uuid primary key default gen_random_uuid(),
    tenant_id       uuid not null,
    trigger_type    text not null,                     -- "new_job", "emergency", "tech_unavailable", "rolling", "manual"
    trigger_job_id  uuid references public.jobs(id),
    input_snapshot  jsonb not null,                    -- jobs + techs + constraints at time of solve
    solution        jsonb not null,                    -- VROOM output + scoring
    solve_time_ms   integer not null,
    assignments     jsonb not null,                    -- [{job_id, tech_id, score, reason}]
    accepted        boolean,                           -- did dispatcher accept?
    accepted_by     text,
    created_at      timestamptz not null default now()
);

create index if not exists idx_dispatch_logs_tenant on public.dispatch_logs(tenant_id, created_at desc);
