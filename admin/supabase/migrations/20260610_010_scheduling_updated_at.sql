-- Scheduling & Dispatch — schema hardening: updated_at maintenance
--
-- Code review finding H-2: every scheduling table that carries an
-- `updated_at timestamptz not null default now()` column relied on app code to
-- maintain it, and (with the single exception of the tech-location upsert) no
-- app code ever set it — so updated_at would silently equal created_at forever,
-- breaking "recently changed" queries and the conflict-resolution heuristics in
-- architecture §7.3.
--
-- The init migration already defines public.set_updated_at(); this migration
-- wires it to every scheduling table that has an updated_at column. The loop
-- skips any table/column that does not exist so the migration is safe to re-run
-- and order-independent.

do $$
declare
    t text;
    tables_with_updated_at text[] := array[
        'tenants',
        'service_areas',
        'technicians',
        'customers',
        'equipment',
        'jobs',
        'recurring_schedules',
        'technician_availability',
        'technician_current_location',
        'on_call_rotations'
    ];
begin
    foreach t in array tables_with_updated_at loop
        if exists (
            select 1 from information_schema.columns
            where table_schema = 'public'
              and table_name = t
              and column_name = 'updated_at'
        ) then
            execute format('drop trigger if exists trg_set_updated_at on public.%I;', t);
            execute format($f$
                create trigger trg_set_updated_at
                    before update on public.%I
                    for each row
                    execute function public.set_updated_at();
            $f$, t);
        end if;
    end loop;
end $$;
