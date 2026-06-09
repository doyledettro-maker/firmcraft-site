-- Scheduling & Dispatch (Phase 2.1, Sprint 2) — Edge Function support objects
--
-- This migration adds the database-side pieces the Sprint 2 Edge Functions need:
--
--   1. jobs.invoice_data    — JSONB package assembled by complete-job for Phase 4
--                             invoicing (the §6.3 invoice data contract). Persisted
--                             on the job so the future job.completed webhook + the
--                             invoicing module can read it without re-deriving.
--   2. public.widget_keys   — tenant-scoped public API keys for the embeddable
--                             online-booking widget (Phase 3). The check-availability
--                             and create-job functions accept these alongside Clerk
--                             JWTs and the trusted service-credential path.
--   3. public.check_availability() / public._free_slots()
--                           — timezone-correct availability solver used by the
--                             check-availability function. Slot math lives in SQL so
--                             the tenant timezone, work windows, assigned jobs, and
--                             time-off blocks are reconciled with tstzrange in one
--                             place rather than in JS.

-- ============================================================
-- 1. INVOICE DATA PACKAGE ON JOBS
-- ============================================================

alter table public.jobs add column if not exists invoice_data jsonb;

comment on column public.jobs.invoice_data is
    'Phase 4 invoice-ready package assembled by the complete-job Edge Function. Shape: §6.3 of the build plan.';

-- ============================================================
-- 2. WIDGET KEYS (public, tenant-scoped, rate-limited)
-- ============================================================
--
-- A widget key authorizes a narrow, public, embeddable context (the Phase 3
-- online-booking widget) to call a whitelisted set of endpoints for ONE tenant.
-- It is NOT a Clerk identity and carries no user/role — only a tenant_id, a set
-- of scopes, and a per-minute rate limit. The plaintext key is shown to the
-- contractor once at creation; only its SHA-256 hash is stored.

create table if not exists public.widget_keys (
    id                    uuid primary key default gen_random_uuid(),
    tenant_id             uuid not null references public.tenants(id),
    key_hash              text unique not null,                       -- sha256 hex of the presented key
    key_prefix            text not null,                              -- non-secret display prefix, e.g. 'wk_live_ab12'
    label                 text,                                       -- "Website booking widget"
    scopes                text[] not null default '{check_availability}',  -- e.g. {check_availability, create_job}
    rate_limit_per_minute int  not null default 60,
    is_active             boolean not null default true,
    created_at            timestamptz not null default now(),
    last_used_at          timestamptz
);

create index if not exists idx_widget_keys_tenant on public.widget_keys(tenant_id);

-- Tenant isolation for the authenticated client app. The Edge Functions look up
-- keys with the service-role client (BYPASSRLS), so this policy only governs the
-- in-app key-management UI a contractor would use to mint/revoke their own keys.
alter table public.widget_keys enable row level security;
drop policy if exists tenant_isolation on public.widget_keys;
create policy tenant_isolation on public.widget_keys
    for all
    to authenticated
    using (tenant_id = public.tenant_id())
    with check (tenant_id = public.tenant_id());
grant select, insert, update, delete on public.widget_keys to authenticated;

-- Demo widget key for the seeded 'demo' tenant so the integration tests and a
-- local widget can exercise the public auth path. Plaintext key (test only):
--   wk_test_demo_0000000000000000
-- Scopes: check_availability + create_job. Inserted only if the demo tenant exists.
do $$
declare
    demo uuid := '00000000-0000-0000-0000-0000000000d0';
begin
    if exists (select 1 from public.tenants where id = demo) then
        insert into public.widget_keys (tenant_id, key_hash, key_prefix, label, scopes, rate_limit_per_minute)
        values (
            demo,
            '58526c7ddeed8f1790cb32445826a127d0ec3a1ce56e868a502e3ef4197d80eb',
            'wk_test_demo',
            'Demo booking widget (test key)',
            array['check_availability','create_job'],
            120
        )
        on conflict (key_hash) do nothing;
    end if;
end $$;

-- ============================================================
-- 3. AVAILABILITY SOLVER
-- ============================================================

-- Walk a sorted set of busy intervals inside [p_start, p_end) and emit the free
-- gaps that are at least p_dur minutes long, as a JSON array of {start, end}.
create or replace function public._free_slots(
    p_start timestamptz,
    p_end   timestamptz,
    p_busy  tstzrange[],
    p_dur   int
) returns jsonb
language plpgsql
immutable
as $$
declare
    v_cursor timestamptz := p_start;
    v_slots  jsonb := '[]'::jsonb;
    v_min    interval := (p_dur || ' minutes')::interval;
    r        tstzrange;
    v_lo     timestamptz;
    v_hi     timestamptz;
begin
    if p_start is null or p_end is null or p_end <= p_start then
        return '[]'::jsonb;
    end if;

    for r in
        select b from unnest(coalesce(p_busy, '{}'::tstzrange[])) b
        where not isempty(b)
        order by lower(b)
    loop
        v_lo := lower(r);
        v_hi := upper(r);
        -- free gap before this busy block
        if v_lo > v_cursor and (v_lo - v_cursor) >= v_min then
            v_slots := v_slots || jsonb_build_object('start', v_cursor, 'end', v_lo);
        end if;
        -- advance past this busy block (guard against nested/contained intervals)
        if v_hi > v_cursor then
            v_cursor := v_hi;
        end if;
    end loop;

    -- trailing gap after the last busy block
    if p_end > v_cursor and (p_end - v_cursor) >= v_min then
        v_slots := v_slots || jsonb_build_object('start', v_cursor, 'end', p_end);
    end if;

    return v_slots;
end;
$$;

-- Per-tech available slots for a given date, duration, and optional job-type
-- (skill) / zone filters. Returns a JSON array:
--   [{ tech_id, tech_name, available_slots: [{ start, end }] }]
-- Tenant timezone resolves the work window; assigned jobs and time-off blocks are
-- subtracted. Only techs that work that day (and clear the skill/zone filters)
-- appear in the result.
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

grant execute on function public.check_availability(uuid, date, int, uuid, uuid) to authenticated, anon, service_role;
grant execute on function public._free_slots(timestamptz, timestamptz, tstzrange[], int) to authenticated, anon, service_role;

-- ============================================================
-- 4. ETA HELPER (en_route transitions)
-- ============================================================
--
-- Straight-line ETA in minutes from a technician's current location to a job's
-- location, at an assumed average road speed. Used by transition-job when a job
-- moves to en_route; returns null when either point is unknown (location service
-- not yet reporting), in which case the caller simply skips the ETA.
create or replace function public.eta_minutes(
    p_tenant    uuid,
    p_tech      uuid,
    p_job       uuid,
    p_speed_kmh numeric default 40
) returns int
language sql
stable
as $$
    select case
        when tcl.location is null or j.location is null or coalesce(p_speed_kmh, 0) <= 0 then null
        else greatest(1, ceil(
            (extensions.ST_DistanceSphere(tcl.location, j.location) / 1000.0) / p_speed_kmh * 60.0
        ))::int
    end
    from public.jobs j
    left join public.technician_current_location tcl
        on tcl.technician_id = p_tech and tcl.tenant_id = p_tenant
    where j.id = p_job and j.tenant_id = p_tenant;
$$;

grant execute on function public.eta_minutes(uuid, uuid, uuid, numeric) to authenticated, anon, service_role;
