-- Scheduling & Dispatch (Phase 2.1, Sprint 1) — Row-Level Security
--
-- Tenant isolation is the HARD boundary (architecture §1.5): every query is
-- scoped to the authenticated user's tenant_id, taken from the Clerk JWT. Even
-- an application bug cannot leak rows across tenants. Role scoping (tech vs.
-- dispatcher/admin) is layered on top.
--
-- How the policies combine in Postgres:
--   * PERMISSIVE policies are OR'd together.
--   * RESTRICTIVE policies are AND'd with the permissive result.
-- So `tenant_isolation` (permissive) sets the tenant scope, and the
-- `*_role_visibility` RESTRICTIVE policies genuinely NARROW what a technician
-- can read (the doc's literal two-permissive-policy example would OR, not
-- narrow — restrictive policies express the intended scoping correctly).
--
-- The admin panel connects with the service_role key, which has BYPASSRLS, so
-- these policies do not affect existing admin/billing/outreach queries. They
-- govern the future Clerk-authenticated client app at {slug}.firmcraft.ai.

-- ============================================================
-- JWT CLAIM ACCESSORS
-- ============================================================
--
-- The architecture doc (§2.3) specifies `auth.tenant_id()`. On HOSTED Supabase
-- the `auth` schema is owned by `supabase_admin` and the `postgres` role cannot
-- create objects in it (permission denied), so these helpers live in `public`
-- instead — the same JWT-claim plumbing, just a schema that the migration role
-- can write to. Supabase's own `auth.uid()` / `auth.jwt()` still work; we simply
-- can't *add* to that schema. Policies below reference the public.* helpers.

-- tenant_id claim from the Clerk JWT (set by Clerk org → Supabase JWT template).
create or replace function public.tenant_id()
returns uuid as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id', '')::uuid;
$$ language sql stable;

-- app_role claim: 'admin' | 'dispatcher' | 'technician'.
-- The JWT's top-level role claim must remain the literal 'authenticated' for
-- Supabase/PostgREST; Firmcraft authorization uses app_role instead.
create or replace function public.user_role()
returns text as $$
  select current_setting('request.jwt.claims', true)::jsonb ->> 'app_role';
$$ language sql stable;

-- tech_id claim: the technicians.id this user maps to (null for office staff).
create or replace function public.tech_id()
returns uuid as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'tech_id', '')::uuid;
$$ language sql stable;

grant execute on function public.tenant_id() to authenticated, anon;
grant execute on function public.user_role() to authenticated, anon;
grant execute on function public.tech_id() to authenticated, anon;

-- ============================================================
-- TENANT ISOLATION (standard tables with a tenant_id column)
-- ============================================================

do $$
declare
    t text;
    tenant_id_tables text[] := array[
        'service_areas', 'technicians', 'skills', 'customers', 'equipment',
        'job_types', 'jobs', 'job_status_history', 'recurring_schedules',
        'technician_availability', 'technician_locations',
        'technician_current_location', 'on_call_rotations', 'dispatch_logs'
    ];
begin
    foreach t in array tenant_id_tables loop
        execute format('alter table public.%I enable row level security;', t);
        execute format('drop policy if exists tenant_isolation on public.%I;', t);
        execute format($f$
            create policy tenant_isolation on public.%I
                for all
                to authenticated
                using (tenant_id = public.tenant_id())
                with check (tenant_id = public.tenant_id());
        $f$, t);
        -- Grant the table privileges the authenticated role needs; RLS still gates rows.
        execute format('grant select, insert, update, delete on public.%I to authenticated;', t);
    end loop;
end $$;

-- ============================================================
-- TENANTS (the tenant row itself: id IS the tenant_id)
-- ============================================================

alter table public.tenants enable row level security;
drop policy if exists tenant_isolation on public.tenants;
create policy tenant_isolation on public.tenants
    for all
    to authenticated
    using (id = public.tenant_id())
    with check (id = public.tenant_id());
grant select, insert, update, delete on public.tenants to authenticated;

-- ============================================================
-- JOIN TABLES WITHOUT A DIRECT tenant_id (scope via parent technician)
-- ============================================================

alter table public.technician_skills enable row level security;
drop policy if exists tenant_isolation on public.technician_skills;
create policy tenant_isolation on public.technician_skills
    for all
    to authenticated
    using (exists (
        select 1 from public.technicians tch
        where tch.id = technician_skills.technician_id
          and tch.tenant_id = public.tenant_id()
    ))
    with check (exists (
        select 1 from public.technicians tch
        where tch.id = technician_skills.technician_id
          and tch.tenant_id = public.tenant_id()
    ));
grant select, insert, update, delete on public.technician_skills to authenticated;

alter table public.technician_zones enable row level security;
drop policy if exists tenant_isolation on public.technician_zones;
create policy tenant_isolation on public.technician_zones
    for all
    to authenticated
    using (exists (
        select 1 from public.technicians tch
        where tch.id = technician_zones.technician_id
          and tch.tenant_id = public.tenant_id()
    ))
    with check (exists (
        select 1 from public.technicians tch
        where tch.id = technician_zones.technician_id
          and tch.tenant_id = public.tenant_id()
    ));
grant select, insert, update, delete on public.technician_zones to authenticated;

-- ============================================================
-- ROLE-SCOPED VISIBILITY (restrictive — AND'd with tenant_isolation)
-- ============================================================

-- Jobs: dispatchers/admins see the whole tenant; technicians see only the jobs
-- assigned to them (architecture §2.3 tech_own_jobs, expressed restrictively so
-- it actually narrows tech reads).
drop policy if exists tech_own_jobs on public.jobs;
create policy tech_own_jobs on public.jobs
    as restrictive
    for select
    to authenticated
    using (
        public.user_role() in ('admin', 'dispatcher')
        or technician_id = public.tech_id()
    );

-- Technician locations: same shape — office staff see all techs, a tech sees
-- only their own breadcrumb trail.
drop policy if exists tech_own_locations on public.technician_locations;
create policy tech_own_locations on public.technician_locations
    as restrictive
    for select
    to authenticated
    using (
        public.user_role() in ('admin', 'dispatcher')
        or technician_id = public.tech_id()
    );

-- Dispatch logs: optimization internals are office-only; technicians cannot read them.
drop policy if exists dispatch_logs_office_only on public.dispatch_logs;
create policy dispatch_logs_office_only on public.dispatch_logs
    as restrictive
    for select
    to authenticated
    using (public.user_role() in ('admin', 'dispatcher'));
