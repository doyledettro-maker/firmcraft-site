-- Scheduling & Dispatch (Phase 2.2) — enable Supabase Realtime
--
-- The dispatch board subscribes to live changes on `jobs` (new/edited jobs
-- appear on the board instantly) and `technician_current_location` (tech dots
-- move on the map). Supabase Realtime only streams changes for tables that are
-- members of the `supabase_realtime` publication, so add them here.
--
-- REPLICA IDENTITY FULL makes the OLD row available on UPDATE/DELETE events,
-- which lets the client diff `tenant_id` (and other columns) on the previous
-- row — needed because the dispatch board filters realtime events by tenant.
--
-- Idempotent: guarded so re-running the migration is a no-op.

do $$
declare
    t text;
    realtime_tables text[] := array[
        'jobs', 'technician_current_location', 'technician_availability', 'dispatch_logs'
    ];
begin
    -- The publication is created by Supabase on project provisioning. If it is
    -- somehow absent (bare Postgres), create an empty one so the adds below work.
    if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
        create publication supabase_realtime;
    end if;

    foreach t in array realtime_tables loop
        execute format('alter table public.%I replica identity full;', t);
        if not exists (
            select 1 from pg_publication_tables
            where pubname = 'supabase_realtime'
              and schemaname = 'public'
              and tablename = t
        ) then
            execute format('alter publication supabase_realtime add table public.%I;', t);
        end if;
    end loop;
end $$;
