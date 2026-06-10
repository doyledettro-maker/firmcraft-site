-- Scheduling & Dispatch — schema hardening: tighten write-side RLS
--
-- Code review finding H-3: the `tenant_isolation` policies are permissive
-- FOR ALL, and the role-scoping RESTRICTIVE policies added in migration 006
-- only cover SELECT. A technician-role JWT could therefore UPDATE/DELETE other
-- techs' jobs (including rows it cannot SELECT), UPDATE the tenants row itself,
-- rewrite job_status_history audit rows, and hard-DELETE jobs/customers despite
-- the soft-delete design. Finding M-8: check_availability()/eta_minutes() were
-- executable by `anon` and leak skewed results to technician JWTs.
--
-- None of this affects the admin panel or Edge Functions (service_role,
-- BYPASSRLS); it governs the future Clerk-authenticated client surfaces.

-- ============================================================
-- 1. JOBS — technicians may only write their OWN assigned jobs
-- ============================================================
--
-- Restrictive (AND'd with tenant_isolation). Mirrors the tech_own_jobs SELECT
-- policy from migration 006.

drop policy if exists tech_own_jobs_update on public.jobs;
create policy tech_own_jobs_update on public.jobs
    as restrictive
    for update
    to authenticated
    using (
        public.user_role() in ('admin', 'dispatcher')
        or technician_id = public.tech_id()
    )
    with check (
        public.user_role() in ('admin', 'dispatcher')
        or technician_id = public.tech_id()
    );

-- Soft delete (deleted_at) is the contract for jobs and customers — nobody on
-- the authenticated path hard-deletes. Technicians also never insert jobs
-- directly (create-job runs through the Edge Function service path).
revoke delete on public.jobs from authenticated;
revoke delete on public.customers from authenticated;
revoke delete on public.technicians from authenticated;

drop policy if exists tech_no_job_insert on public.jobs;
create policy tech_no_job_insert on public.jobs
    as restrictive
    for insert
    to authenticated
    with check (public.user_role() in ('admin', 'dispatcher'));

-- ============================================================
-- 2. JOBS — column-level guard for the technician role
-- ============================================================
--
-- RLS is row-granular, so the column restriction lives in a trigger: a
-- technician-role JWT may only change the field-work columns
--   status, tech_notes, checklist, parts_used, photos, actual_start, actual_end
-- on a job. Everything else (technician_id, estimated_revenue, scheduling
-- fields, internal_notes, …) is office-only. Comparing the jsonb projection of
-- the row minus the allowed keys protects future columns by default.

create or replace function public.enforce_technician_job_columns()
returns trigger
language plpgsql
as $$
declare
    -- updated_at is allowed only because trg_set_updated_at maintains it.
    allowed text[] := array[
        'status', 'tech_notes', 'checklist', 'parts_used', 'photos',
        'actual_start', 'actual_end', 'updated_at'
    ];
begin
    if public.user_role() = 'technician'
       and (to_jsonb(new) - allowed) is distinct from (to_jsonb(old) - allowed) then
        raise exception
            'Technicians may only update: status, tech_notes, checklist, parts_used, photos, actual_start, actual_end'
            using errcode = 'insufficient_privilege';
    end if;
    return new;
end;
$$;

drop trigger if exists trg_jobs_tech_column_guard on public.jobs;
create trigger trg_jobs_tech_column_guard
    before update on public.jobs
    for each row
    execute function public.enforce_technician_job_columns();

-- ============================================================
-- 3. JOB_STATUS_HISTORY — append-only audit trail
-- ============================================================

revoke update, delete on public.job_status_history from authenticated;

-- ============================================================
-- 4. TENANTS — UPDATE is admin-only; provisioning is service-role-only
-- ============================================================

drop policy if exists tenants_admin_update on public.tenants;
create policy tenants_admin_update on public.tenants
    as restrictive
    for update
    to authenticated
    using (public.user_role() = 'admin')
    with check (public.user_role() = 'admin');

-- Tenants are created/destroyed by the onboarding flow (service role), never
-- from a client session.
revoke insert, delete on public.tenants from authenticated;

-- ============================================================
-- 5. TECHNICIANS + TECH-OWNED TABLES — techs write only their own rows
-- ============================================================

drop policy if exists tech_own_row_update on public.technicians;
create policy tech_own_row_update on public.technicians
    as restrictive
    for update
    to authenticated
    using (
        public.user_role() in ('admin', 'dispatcher')
        or id = public.tech_id()
    )
    with check (
        public.user_role() in ('admin', 'dispatcher')
        or id = public.tech_id()
    );

do $$
declare
    t text;
    tech_owned text[] := array[
        'technician_availability', 'technician_locations', 'technician_current_location'
    ];
begin
    foreach t in array tech_owned loop
        execute format('drop policy if exists tech_own_writes_insert on public.%I;', t);
        execute format($f$
            create policy tech_own_writes_insert on public.%I
                as restrictive
                for insert
                to authenticated
                with check (
                    public.user_role() in ('admin', 'dispatcher')
                    or technician_id = public.tech_id()
                );
        $f$, t);
        execute format('drop policy if exists tech_own_writes_update on public.%I;', t);
        execute format($f$
            create policy tech_own_writes_update on public.%I
                as restrictive
                for update
                to authenticated
                using (
                    public.user_role() in ('admin', 'dispatcher')
                    or technician_id = public.tech_id()
                )
                with check (
                    public.user_role() in ('admin', 'dispatcher')
                    or technician_id = public.tech_id()
                );
        $f$, t);
        execute format('drop policy if exists tech_own_writes_delete on public.%I;', t);
        execute format($f$
            create policy tech_own_writes_delete on public.%I
                as restrictive
                for delete
                to authenticated
                using (
                    public.user_role() in ('admin', 'dispatcher')
                    or technician_id = public.tech_id()
                );
        $f$, t);
    end loop;
end $$;

-- ============================================================
-- 6. AVAILABILITY / ETA FUNCTIONS — service paths only (M-8)
-- ============================================================
--
-- The widget + dispatch board call these through service-role Edge Functions /
-- API routes. Direct execution by anon is dead weight; direct execution by a
-- technician JWT returns *wrong* results (RLS hides colleagues' jobs from the
-- busy-interval query → colleagues report as free → double-booking).

-- Postgres grants EXECUTE to PUBLIC on new functions by default, so the PUBLIC
-- grant must go too — revoking only anon/authenticated would be a no-op.
revoke execute on function public.check_availability(uuid, date, int, uuid, uuid) from public, anon, authenticated;
revoke execute on function public._free_slots(timestamptz, timestamptz, tstzrange[], int) from public, anon, authenticated;
revoke execute on function public.eta_minutes(uuid, uuid, uuid, numeric) from public, anon, authenticated;
grant execute on function public.check_availability(uuid, date, int, uuid, uuid) to service_role;
grant execute on function public._free_slots(timestamptz, timestamptz, tstzrange[], int) to service_role;
grant execute on function public.eta_minutes(uuid, uuid, uuid, numeric) to service_role;
