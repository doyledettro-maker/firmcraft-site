-- Scheduling & Dispatch (Phase 2.1, Sprint 1) — core tenant + technician tables
--
-- Tables: tenants, service_areas, technicians, skills, technician_skills,
-- technician_zones. Schemas follow architecture doc §2.1 exactly.
--
-- NOTE: the scheduling module's `tenants` table is the multi-tenancy boundary
-- for the dispatch product. It is SEPARATE from the existing `clients` table
-- (Firmcraft's paying contractor accounts). They are linked later; for now they
-- stand alone.

-- ============================================================
-- TENANT & ORGANIZATION
-- ============================================================

-- Tenants are created when a contractor signs up. Maps 1:1 with a Clerk org.
create table if not exists public.tenants (
    id              uuid primary key default gen_random_uuid(),
    clerk_org_id    text unique not null,
    name            text not null,
    slug            text unique not null,              -- subdomain for the white-labeled client app: {slug}.firmcraft.ai
    custom_domain   text unique,                       -- future Pro-tier upsell, e.g. "app.rumblebeeac.com"; null until provisioned
    timezone        text not null default 'America/Chicago',
    business_hours  jsonb not null default '{"mon":{"start":"08:00","end":"17:00"},"tue":{"start":"08:00","end":"17:00"},"wed":{"start":"08:00","end":"17:00"},"thu":{"start":"08:00","end":"17:00"},"fri":{"start":"08:00","end":"17:00"}}',
    settings        jsonb not null default '{}',
    -- settings includes: dispatch_mode (auto/assist/manual), optimization_weights,
    -- default_job_duration, service_area_radius, notification_preferences, branding
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

-- Host -> tenant lookups by the subdomain-routing middleware (architecture §1.6).
-- The UNIQUE constraints already back these, but explicit named indexes document
-- the access path and let custom_domain skip NULL rows.
create unique index if not exists idx_tenants_slug on public.tenants(slug);
create unique index if not exists idx_tenants_custom_domain on public.tenants(custom_domain) where custom_domain is not null;

-- ============================================================
-- SERVICE AREAS & ZONES
-- ============================================================

create table if not exists public.service_areas (
    id              uuid primary key default gen_random_uuid(),
    tenant_id       uuid not null references public.tenants(id),
    name            text not null,                    -- "North Houston", "Inner Loop"
    boundary        geometry(polygon, 4326),          -- PostGIS polygon
    color           text,                              -- hex color for map display
    is_active       boolean not null default true,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index if not exists idx_service_areas_tenant on public.service_areas(tenant_id);
create index if not exists idx_service_areas_boundary on public.service_areas using gist(boundary);

-- ============================================================
-- TECHNICIANS
-- ============================================================

create table if not exists public.technicians (
    id              uuid primary key default gen_random_uuid(),
    tenant_id       uuid not null references public.tenants(id),
    clerk_user_id   text,                              -- links to Clerk user (nullable for techs without app access)
    name            text not null,
    email           text,
    phone           text,
    avatar_url      text,
    home_address    jsonb,                             -- {street, city, state, zip, lat, lng} — start/end location for routing
    hourly_rate     numeric(10,2),
    color           text,                              -- hex color for calendar display
    work_hours      jsonb not null default '{}',       -- per-day overrides to tenant business_hours
    is_active       boolean not null default true,
    hire_date       date,
    notes           text,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    deleted_at      timestamptz
);

create index if not exists idx_technicians_tenant on public.technicians(tenant_id);
create index if not exists idx_technicians_clerk on public.technicians(clerk_user_id);

-- ============================================================
-- SKILLS & CERTIFICATIONS
-- ============================================================

-- Skill definitions are per-tenant (each contractor defines their own taxonomy).
create table if not exists public.skills (
    id              uuid primary key default gen_random_uuid(),
    tenant_id       uuid not null references public.tenants(id),
    name            text not null,                    -- "EPA 608 Universal", "Journeyman Electrician", "Tankless Water Heater"
    category        text,                              -- "certification", "specialty", "equipment"
    description     text,
    is_certification boolean not null default false,  -- true = has expiration date
    created_at      timestamptz not null default now(),
    unique(tenant_id, name)
);

create index if not exists idx_skills_tenant on public.skills(tenant_id);

-- Which techs have which skills.
create table if not exists public.technician_skills (
    id              uuid primary key default gen_random_uuid(),
    technician_id   uuid not null references public.technicians(id) on delete cascade,
    skill_id        uuid not null references public.skills(id) on delete cascade,
    proficiency     text default 'standard',          -- "apprentice", "standard", "expert"
    certified_at    date,
    expires_at      date,                              -- null if non-expiring
    license_number  text,
    created_at      timestamptz not null default now(),
    unique(technician_id, skill_id)
);

create index if not exists idx_tech_skills_tech on public.technician_skills(technician_id);
create index if not exists idx_tech_skills_skill on public.technician_skills(skill_id);
create index if not exists idx_tech_skills_expires on public.technician_skills(expires_at) where expires_at is not null;

-- ============================================================
-- TECHNICIAN ZONE ASSIGNMENTS
-- ============================================================

create table if not exists public.technician_zones (
    id              uuid primary key default gen_random_uuid(),
    technician_id   uuid not null references public.technicians(id) on delete cascade,
    service_area_id uuid not null references public.service_areas(id) on delete cascade,
    priority        integer not null default 1,        -- 1 = primary zone, 2 = secondary (overflow)
    created_at      timestamptz not null default now(),
    unique(technician_id, service_area_id)
);
