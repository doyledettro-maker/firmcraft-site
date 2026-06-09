-- Scheduling & Dispatch (Phase 2.1, Sprint 1) — job lifecycle triggers
--
-- Two triggers on public.jobs:
--   1. validate_job_status_transition() — BEFORE UPDATE: rejects illegal status
--      moves per the lifecycle diagram (architecture §2.2).
--   2. log_job_status_change() — AFTER UPDATE: appends an audit row to
--      job_status_history on every status change.
--
-- INSERTs are intentionally unconstrained: a job can be seeded/created directly
-- in any status (e.g. importing an in-progress job). The state machine governs
-- transitions, not initial state.

-- ============================================================
-- 1. TRANSITION VALIDATION (BEFORE UPDATE)
-- ============================================================

create or replace function public.validate_job_status_transition()
returns trigger as $$
declare
    -- "old:new" pairs that are permitted. Mirrors the lifecycle diagram.
    valid_transitions text[] := array[
        'created:scheduled',
        'scheduled:dispatched',
        'dispatched:en_route',
        'en_route:arrived',
        'arrived:in_progress',
        'in_progress:completed',
        'in_progress:on_hold',
        'on_hold:in_progress',
        'scheduled:cancelled',
        'dispatched:cancelled',
        'created:cancelled',
        'completed:invoiced'
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

drop trigger if exists trg_job_status_transition on public.jobs;
create trigger trg_job_status_transition
    before update on public.jobs
    for each row
    execute function public.validate_job_status_transition();

-- ============================================================
-- 2. STATUS HISTORY LOGGING (AFTER UPDATE)
-- ============================================================

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
        new.id, new.tenant_id, old.status, new.status, actor, '{}'::jsonb
    );

    return new;
end;
$$ language plpgsql;

drop trigger if exists trg_job_status_log on public.jobs;
create trigger trg_job_status_log
    after update on public.jobs
    for each row
    when (old.status is distinct from new.status)
    execute function public.log_job_status_change();
