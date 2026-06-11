-- Scheduling & Dispatch — allow un-assigning a dispatched job back to the backlog
--
-- Bug: on the dispatch board, clearing a job's technician (— Unassigned —) left
-- the job at status `scheduled`/`dispatched` with technician_id NULL. Such a job
-- renders on neither surface — the calendar needs a technician_id, the sidebar
-- needs status `created` — so it vanished from the board.
--
-- The app layer now reverts an unassigned job to `created` and clears its
-- schedule. Migration 012 already permits scheduled → created (un-schedule);
-- this adds dispatched → created so a dispatched job can be un-assigned in one
-- step too. Everything else in the matrix is carried forward unchanged.

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
        -- backward scheduling moves (un-assign / re-schedule)
        'scheduled:created',        -- un-schedule
        'dispatched:created',       -- un-assign a dispatched job back to backlog
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
