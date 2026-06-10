-- Scheduling & Dispatch — updated_at maintenance (code review H-2)
--
-- The scheduling tables carry `updated_at timestamptz not null default now()`
-- but nothing ever advanced it on UPDATE, so it silently stayed equal to
-- created_at forever — breaking "recently changed" logic and the
-- conflict-resolution heuristics in architecture §7.3.
--
-- Wires the existing public.set_updated_at() helper (from the init migration)
-- as a BEFORE UPDATE trigger on every scheduling table that has an updated_at
-- column. The information_schema check makes the loop self-maintaining: tables
-- without the column are skipped, and re-running is a no-op (drop+create).

do $$
declare
    t text;
    scheduling_tables text[] := array[
        'tenants', 'service_areas', 'technicians', 'skills',
        'technician_skills', 'technician_zones',
        'customers', 'equipment',
        'job_types', 'jobs', 'job_status_history', 'recurring_schedules',
        'technician_availability', 'technician_locations',
        'technician_current_location', 'on_call_rotations', 'dispatch_logs',
        'widget_keys'
    ];
begin
    foreach t in array scheduling_tables loop
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
                    for each row execute function public.set_updated_at();
            $f$, t);
        end if;
    end loop;
end $$;
