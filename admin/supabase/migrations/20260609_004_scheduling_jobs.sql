-- Scheduling & Dispatch (Phase 2.1, Sprint 1) — job tables
--
-- Enums: job_status, job_priority.
-- Tables: job_types, jobs (core entity), job_status_history, recurring_schedules.
-- Schemas follow architecture doc §2.1 exactly, including the composite dispatch
-- index and the deleted_at soft-delete columns.

-- ============================================================
-- ENUMS
-- ============================================================

do $$ begin
    create type job_status as enum (
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
exception when duplicate_object then null;
end $$;

do $$ begin
    create type job_priority as enum (
        'emergency',        -- same-day, ASAP dispatch
        'urgent',           -- within 24 hours
        'standard',         -- normal scheduling window
        'flexible'          -- customer is flexible on timing
    );
exception when duplicate_object then null;
end $$;

-- ============================================================
-- JOB TYPES
-- ============================================================

create table if not exists public.job_types (
    id                  uuid primary key default gen_random_uuid(),
    tenant_id           uuid not null references public.tenants(id),
    name                text not null,                 -- "AC Tune-Up", "Furnace Repair", "Panel Upgrade"
    category            text,                          -- "hvac", "plumbing", "electrical"
    default_duration    integer not null default 60,   -- minutes
    estimated_revenue   numeric(10,2),                 -- average ticket for this job type
    color               text,                          -- for calendar display
    required_skills     uuid[] default '{}',           -- skill IDs required to perform this job type
    checklist_template  jsonb,                         -- default checklist items
    is_active           boolean not null default true,
    created_at          timestamptz not null default now(),
    unique(tenant_id, name)
);

create index if not exists idx_job_types_tenant on public.job_types(tenant_id);

-- ============================================================
-- JOBS (the core entity)
-- ============================================================

create table if not exists public.jobs (
    id                  uuid primary key default gen_random_uuid(),
    tenant_id           uuid not null references public.tenants(id),
    customer_id         uuid not null references public.customers(id),
    job_type_id         uuid references public.job_types(id),
    technician_id       uuid references public.technicians(id),   -- null if unassigned
    equipment_id        uuid references public.equipment(id),

    -- Descriptive
    title               text not null,
    description         text,
    priority            job_priority not null default 'standard',
    status              job_status not null default 'created',
    source              text default 'manual',              -- "manual", "phone_ai", "customer_portal", "hermes", "recurring"

    -- Scheduling
    scheduled_start     timestamptz,
    scheduled_end       timestamptz,
    arrival_window_start timestamptz,                       -- customer-facing: "between 2-4pm"
    arrival_window_end  timestamptz,
    estimated_duration  integer,                            -- minutes (ML-predicted or from job_type default)
    actual_start        timestamptz,                        -- tech checked in
    actual_end          timestamptz,                        -- tech checked out

    -- Location (denormalized from customer for query performance)
    address             jsonb,
    location            geometry(point, 4326),

    -- Work details
    checklist           jsonb default '[]',                 -- [{item, completed, notes}]
    parts_used          jsonb default '[]',                 -- [{part_name, quantity, cost}]
    tech_notes          text,
    internal_notes      text,                               -- dispatcher/office notes
    photos              text[] default '{}',                -- Supabase Storage URLs

    -- Financial
    estimated_revenue   numeric(10,2),
    actual_revenue      numeric(10,2),
    invoice_id          uuid,                               -- Phase 4 reference

    -- Relationships
    parent_job_id       uuid references public.jobs(id),    -- for multi-visit / callback tracking
    recurring_schedule_id uuid,                             -- links to recurring_schedules
    original_tech_id    uuid references public.technicians(id),  -- for warranty callback routing

    -- Signatures
    customer_signature  text,                               -- Supabase Storage URL
    signed_at           timestamptz,

    -- Metadata
    tags                text[] default '{}',
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),
    deleted_at          timestamptz
);

-- Primary query patterns
create index if not exists idx_jobs_tenant_status on public.jobs(tenant_id, status);
create index if not exists idx_jobs_tenant_date on public.jobs(tenant_id, scheduled_start);
create index if not exists idx_jobs_technician_date on public.jobs(technician_id, scheduled_start);
create index if not exists idx_jobs_customer on public.jobs(customer_id);
create index if not exists idx_jobs_location on public.jobs using gist(location);
create index if not exists idx_jobs_parent on public.jobs(parent_job_id) where parent_job_id is not null;
create index if not exists idx_jobs_recurring on public.jobs(recurring_schedule_id) where recurring_schedule_id is not null;
-- Composite for dispatch board: "show me all jobs for this tenant today by tech"
create index if not exists idx_jobs_dispatch on public.jobs(tenant_id, scheduled_start, technician_id)
    where status not in ('cancelled', 'completed', 'invoiced');

-- ============================================================
-- JOB STATUS HISTORY (audit trail)
-- ============================================================

create table if not exists public.job_status_history (
    id              uuid primary key default gen_random_uuid(),
    job_id          uuid not null references public.jobs(id) on delete cascade,
    tenant_id       uuid not null,
    previous_status job_status,
    new_status      job_status not null,
    changed_by      text,                              -- clerk_user_id or "system" or "hermes"
    reason          text,
    metadata        jsonb default '{}',
    created_at      timestamptz not null default now()
);

create index if not exists idx_job_history_job on public.job_status_history(job_id);

-- ============================================================
-- RECURRING SCHEDULES
-- ============================================================

create table if not exists public.recurring_schedules (
    id                  uuid primary key default gen_random_uuid(),
    tenant_id           uuid not null references public.tenants(id),
    customer_id         uuid not null references public.customers(id),
    job_type_id         uuid references public.job_types(id),
    technician_id       uuid references public.technicians(id),   -- preferred tech

    title               text not null,
    description         text,
    frequency           text not null,                      -- "weekly", "biweekly", "monthly", "quarterly", "biannual", "annual"
    preferred_day       text,                               -- "monday", "tuesday", etc.
    preferred_time      time,
    duration_minutes    integer not null,

    -- Recurrence window
    starts_at           date not null,
    ends_at             date,                               -- null = indefinite
    last_generated_at   date,                               -- last date for which a job was created
    next_occurrence     date,                               -- precomputed next date

    -- Seasonal preferences
    preferred_months    integer[] default '{}',             -- [3,4,9,10] = spring & fall maintenance
    avoid_months        integer[] default '{}',             -- [6,7,8] = avoid peak HVAC season

    is_active           boolean not null default true,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

create index if not exists idx_recurring_tenant on public.recurring_schedules(tenant_id);
create index if not exists idx_recurring_next on public.recurring_schedules(next_occurrence) where is_active = true;

-- jobs.recurring_schedule_id references recurring_schedules (added after the table
-- exists to avoid a forward-reference ordering problem in the jobs DDL above).
do $$ begin
    alter table public.jobs
        add constraint jobs_recurring_schedule_id_fkey
        foreign key (recurring_schedule_id) references public.recurring_schedules(id);
exception when duplicate_object then null;
end $$;
