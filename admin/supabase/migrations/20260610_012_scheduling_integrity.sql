-- Scheduling & Dispatch — schema hardening: integrity fixes
--
-- Code review findings:
--   H-4  check_availability() counted soft-deleted jobs as busy
--   M-1  status-transition matrix missing real-world paths
--   M-2  no audit row on INSERT (a job created as in_progress had zero history)
--   M-3  missing temporal CHECK constraints (reversed ranges crash tstzrange())
--   M-4  behavior-bearing text columns lacked CHECK constraints
--   M-5  missing FK indexes
--   M-6  denormalized tenant_id columns had no FK to tenants

-- ============================================================
-- 1. STATUS-TRANSITION MATRIX ADDITIONS (M-1)
-- ============================================================
--
-- Adds: cancellation from every active state (en_route/arrived/in_progress/
-- on_hold — customers cancel mid-drive and mid-job in the real world), and the
-- backward scheduling moves the board + optimizer need: scheduled → created
-- (un-schedule) and dispatched → scheduled (un-dispatch / drag-drop reschedule,
-- also required by the optimizer's reassign path — H-9).
-- `cancelled` stays terminal: reinstating means creating a fresh job.

create or replace function public.validate_job_status_transition()
returns trigger as $$
declare
    -- "old:new" pairs that are permitted. Mirrors the lifecycle diagram
    -- (architecture §2.2, updated 2026-06-10).
    valid_transitions text[] := array[
        'created:scheduled',
        'scheduled:dispatched',
        'dispatched:en_route',
        'en_route:arrived',
        'arrived:in_progress',
        'in_progress:completed',
        'in_progress:on_hold',
        'on_hold:in_progress',
        'completed:invoiced',
        -- backward scheduling moves
        'scheduled:created',        -- un-schedule
        'dispatched:scheduled',     -- un-dispatch / reschedule
        -- cancellation from any pre-completion state
        'created:cancelled',
        'scheduled:cancelled',
        'dispatched:cancelled',
        'en_route:cancelled',
        'arrived:cancelled',
        'in_progress:cancelled',
        'on_hold:cancelled'
    ];
begin
    -- No status change → nothing to validate.
    if new.status is not distinct from old.status then
        return new;
    end if;

    if not ((old.status::text || ':' || new.status::text) = any (valid_transitions)) then
        raise exception
            'Invalid job status transition: % -> %. Allowed from %: %',
            old.status, new.status, old.status,
            coalesce(
                (select string_agg(split_part(v, ':', 2), ', ')
                 from unnest(valid_transitions) v
                 where split_part(v, ':', 1) = old.status::text),
                '(none — terminal state)'
            )
        using errcode = 'check_violation';
    end if;

    return new;
end;
$$ language plpgsql;

-- ============================================================
-- 2. AUDIT ROW ON INSERT (M-2)
-- ============================================================
--
-- Jobs may be created directly in any status (imports, seeds, phone-AI), so
-- the history trigger must also fire on INSERT — previous_status null.

create or replace function public.log_job_status_change()
returns trigger as $$
declare
    actor text;
begin
    -- Best-effort attribution from the Clerk JWT; falls back to 'system'
    -- (direct SQL, service-role writes, seed scripts).
    begin
        actor := coalesce(
            current_setting('request.jwt.claims', true)::jsonb ->> 'sub',
            'system'
        );
    exception when others then
        actor := 'system';
    end;

    insert into public.job_status_history (
        job_id, tenant_id, previous_status, new_status, changed_by, metadata
    ) values (
        new.id, new.tenant_id,
        case when tg_op = 'INSERT' then null else old.status end,
        new.status, actor, '{}'::jsonb
    );

    return new;
end;
$$ language plpgsql;

drop trigger if exists trg_job_status_log_insert on public.jobs;
create trigger trg_job_status_log_insert
    after insert on public.jobs
    for each row
    execute function public.log_job_status_change();

-- ============================================================
-- 3. TEMPORAL CHECK CONSTRAINTS (M-3)
-- ============================================================

do $$ begin
    if not exists (select 1 from pg_constraint where conname = 'jobs_scheduled_window_check') then
        alter table public.jobs add constraint jobs_scheduled_window_check
            check (scheduled_start is null or scheduled_end is null or scheduled_end > scheduled_start)
            not valid;
    end if;
    if not exists (select 1 from pg_constraint where conname = 'jobs_arrival_window_check') then
        alter table public.jobs add constraint jobs_arrival_window_check
            check (arrival_window_start is null or arrival_window_end is null or arrival_window_end > arrival_window_start)
            not valid;
    end if;
    if not exists (select 1 from pg_constraint where conname = 'availability_window_check') then
        alter table public.technician_availability add constraint availability_window_check
            check (ends_at > starts_at)
            not valid;
    end if;
end $$;

alter table public.jobs validate constraint jobs_scheduled_window_check;
alter table public.jobs validate constraint jobs_arrival_window_check;
alter table public.technician_availability validate constraint availability_window_check;

-- ============================================================
-- 4. TEXT-COLUMN CHECK CONSTRAINTS (M-4)
-- ============================================================
--
-- Most important: technician_availability.type — check_availability() filters
-- `type in ('time_off','blocked','external_calendar')`, so a typo'd 'timeoff'
-- row would be silently ignored → tech appears free during PTO → double-booking.
-- jobs.source is the union of the column comment and create-job's KNOWN_SOURCES
-- (review L-17 — the lists had diverged).

do $$ begin
    if not exists (select 1 from pg_constraint where conname = 'availability_type_check') then
        alter table public.technician_availability add constraint availability_type_check
            check (type in ('time_off', 'blocked', 'on_call', 'overtime', 'external_calendar'))
            not valid;
    end if;
    if not exists (select 1 from pg_constraint where conname = 'current_location_status_check') then
        alter table public.technician_current_location add constraint current_location_status_check
            check (status is null or status in ('idle', 'driving', 'on_job', 'offline'))
            not valid;
    end if;
    if not exists (select 1 from pg_constraint where conname = 'recurring_frequency_check') then
        alter table public.recurring_schedules add constraint recurring_frequency_check
            check (frequency in ('weekly', 'biweekly', 'monthly', 'quarterly', 'biannual', 'annual'))
            not valid;
    end if;
    if not exists (select 1 from pg_constraint where conname = 'tech_skills_proficiency_check') then
        alter table public.technician_skills add constraint tech_skills_proficiency_check
            check (proficiency is null or proficiency in ('apprentice', 'standard', 'expert'))
            not valid;
    end if;
    if not exists (select 1 from pg_constraint where conname = 'jobs_source_check') then
        alter table public.jobs add constraint jobs_source_check
            check (source is null or source in (
                'manual', 'phone_ai', 'customer_portal', 'online_booking',
                'dispatcher', 'api', 'hermes', 'recurring'))
            not valid;
    end if;
    if not exists (select 1 from pg_constraint where conname = 'dispatch_logs_trigger_type_check') then
        alter table public.dispatch_logs add constraint dispatch_logs_trigger_type_check
            check (trigger_type in ('new_job', 'emergency', 'tech_unavailable', 'rolling', 'manual'))
            not valid;
    end if;
    if not exists (select 1 from pg_constraint where conname = 'customers_comm_pref_check') then
        alter table public.customers add constraint customers_comm_pref_check
            check (communication_preference is null or communication_preference in ('sms', 'email', 'phone', 'none'))
            not valid;
    end if;
end $$;

alter table public.technician_availability validate constraint availability_type_check;
alter table public.technician_current_location validate constraint current_location_status_check;
alter table public.recurring_schedules validate constraint recurring_frequency_check;
alter table public.technician_skills validate constraint tech_skills_proficiency_check;
alter table public.jobs validate constraint jobs_source_check;
alter table public.dispatch_logs validate constraint dispatch_logs_trigger_type_check;
alter table public.customers validate constraint customers_comm_pref_check;

-- ============================================================
-- 5. FK INDEXES (M-5)
-- ============================================================

create index if not exists idx_dispatch_logs_trigger_job on public.dispatch_logs(trigger_job_id) where trigger_job_id is not null;
create index if not exists idx_recurring_customer on public.recurring_schedules(customer_id);
create index if not exists idx_recurring_job_type on public.recurring_schedules(job_type_id) where job_type_id is not null;
create index if not exists idx_recurring_technician on public.recurring_schedules(technician_id) where technician_id is not null;
create index if not exists idx_jobs_equipment on public.jobs(equipment_id) where equipment_id is not null;
create index if not exists idx_jobs_original_tech on public.jobs(original_tech_id) where original_tech_id is not null;
create index if not exists idx_customers_preferred_tech on public.customers(preferred_tech_id) where preferred_tech_id is not null;
create index if not exists idx_tech_zones_area on public.technician_zones(service_area_id);

-- ============================================================
-- 6. DENORMALIZED tenant_id FOREIGN KEYS (M-6)
-- ============================================================
--
-- tenant_id is the RLS predicate on all of these tables; without the FK a
-- mistyped value silently mis-scopes rows out of every tenant's view.

do $$
declare
    t text;
    fk_tables text[] := array[
        'job_status_history', 'technician_availability', 'technician_locations',
        'technician_current_location', 'dispatch_logs'
    ];
begin
    foreach t in array fk_tables loop
        if not exists (
            select 1 from pg_constraint
            where conname = t || '_tenant_id_fkey'
        ) then
            execute format(
                'alter table public.%I add constraint %I foreign key (tenant_id) references public.tenants(id) not valid;',
                t, t || '_tenant_id_fkey'
            );
        end if;
        execute format('alter table public.%I validate constraint %I;', t, t || '_tenant_id_fkey');
    end loop;
end $$;

-- ============================================================
-- 7. AVAILABILITY SOLVER IGNORES SOFT-DELETED JOBS (H-4)
-- ============================================================
--
-- Re-create check_availability() from migration 008 with one fix: the
-- busy-interval query now filters `j.deleted_at is null` (the technician loop
-- already did — the omission was accidental). Without it, a soft-deleted
-- scheduled job blocks that tech's slot forever.

create or replace function public.check_availability(
    p_tenant            uuid,
    p_date              date,
    p_duration_minutes  int,
    p_job_type          uuid default null,
    p_zone              uuid default null
) returns jsonb
language plpgsql
stable
as $$
declare
    v_tz        text;
    v_business  jsonb;
    v_result    jsonb := '[]'::jsonb;
    v_tech      record;
    v_dow       int;
    v_day_key   text;
    v_hours     jsonb;
    v_start_txt text;
    v_end_txt   text;
    v_work_start timestamptz;
    v_work_end   timestamptz;
    v_required  uuid[];
    v_busy      tstzrange[];
    v_free      jsonb;
begin
    select timezone, business_hours into v_tz, v_business
      from public.tenants where id = p_tenant;
    if v_tz is null then
        return '[]'::jsonb;
    end if;

    -- json day key matching business_hours/work_hours ("mon".."sun"); isodow 1=Mon..7=Sun
    v_dow := extract(isodow from p_date)::int;
    v_day_key := (array['mon','tue','wed','thu','fri','sat','sun'])[v_dow];

    if p_job_type is not null then
        select required_skills into v_required
          from public.job_types
         where id = p_job_type and tenant_id = p_tenant;
        v_required := coalesce(v_required, '{}'::uuid[]);
    end if;

    for v_tech in
        select t.id, t.name, t.work_hours
          from public.technicians t
         where t.tenant_id = p_tenant
           and t.is_active = true
           and t.deleted_at is null
           and (p_zone is null or exists (
                select 1 from public.technician_zones tz
                 where tz.technician_id = t.id and tz.service_area_id = p_zone))
           and (v_required is null or coalesce(array_length(v_required, 1), 0) = 0 or not exists (
                select 1 from unnest(v_required) rs
                 where not exists (
                    select 1 from public.technician_skills tsk
                     where tsk.technician_id = t.id and tsk.skill_id = rs)))
        order by t.name
    loop
        -- tech per-day override wins over tenant business hours
        v_hours := coalesce(
            nullif(v_tech.work_hours -> v_day_key, 'null'::jsonb),
            v_business -> v_day_key
        );
        if v_hours is null then
            continue;  -- not a working day for this tech
        end if;
        v_start_txt := v_hours ->> 'start';
        v_end_txt := v_hours ->> 'end';
        if v_start_txt is null or v_end_txt is null then
            continue;
        end if;

        v_work_start := (p_date::text || ' ' || v_start_txt)::timestamp at time zone v_tz;
        v_work_end   := (p_date::text || ' ' || v_end_txt)::timestamp at time zone v_tz;
        if v_work_end <= v_work_start then
            continue;
        end if;

        -- busy intervals (assigned jobs + time-off/blocked), clipped to the work window
        select coalesce(array_agg(rng), '{}'::tstzrange[])
          into v_busy
        from (
            select tstzrange(
                       greatest(j.scheduled_start, v_work_start),
                       least(
                           coalesce(j.scheduled_end,
                                    j.scheduled_start + (coalesce(j.estimated_duration, 60) || ' minutes')::interval),
                           v_work_end)
                   ) as rng
              from public.jobs j
             where j.technician_id = v_tech.id
               and j.tenant_id = p_tenant
               and j.status not in ('cancelled', 'completed', 'invoiced')
               and j.deleted_at is null                 -- H-4 fix
               and j.scheduled_start is not null
               and j.scheduled_start < v_work_end
               and coalesce(j.scheduled_end,
                            j.scheduled_start + (coalesce(j.estimated_duration, 60) || ' minutes')::interval) > v_work_start
            union all
            select tstzrange(greatest(a.starts_at, v_work_start), least(a.ends_at, v_work_end)) as rng
              from public.technician_availability a
             where a.technician_id = v_tech.id
               and a.type in ('time_off', 'blocked', 'external_calendar')
               and a.starts_at < v_work_end
               and a.ends_at > v_work_start
        ) busy
        where not isempty(rng);

        v_free := public._free_slots(v_work_start, v_work_end, v_busy, p_duration_minutes);

        v_result := v_result || jsonb_build_object(
            'tech_id', v_tech.id,
            'tech_name', v_tech.name,
            'available_slots', v_free
        );
    end loop;

    return v_result;
end;
$$;

-- The dispatch-board partial index gets the same soft-delete predicate.
drop index if exists idx_jobs_dispatch;
create index if not exists idx_jobs_dispatch on public.jobs(tenant_id, scheduled_start, technician_id)
    where status not in ('cancelled', 'completed', 'invoiced') and deleted_at is null;
