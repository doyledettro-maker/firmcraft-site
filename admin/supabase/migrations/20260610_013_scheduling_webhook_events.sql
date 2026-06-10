-- Scheduling & Dispatch (Phase 2.1, Sprint 3) — webhook event queue
--
-- Foundation for the architecture §9.4 webhook events: jobs lifecycle changes
-- are queued into webhook_events by trigger; delivery to tenant-configured URLs
-- (at-least-once, exponential backoff) is the Phase 2.5 consumer's job. Building
-- the queue now means Phase 4 invoicing / Phase 5 digital-ops never need a
-- schema retrofit — they just start draining it.
--
-- Emitted by the jobs trigger:
--   job.created         INSERT
--   job.scheduled       INSERT in status 'scheduled', or any transition INTO 'scheduled'
--   job.status_changed  every status transition (carries previous/new)
--   job.completed       transition into 'completed' (payload includes invoice_data)
--   job.cancelled       transition into 'cancelled'
-- The remaining §9.4 types (tech.location_updated, schedule.capacity_changed,
-- dispatch.suggestion_created) are queued by their own producers later; the
-- CHECK constraint already admits them.

-- ============================================================
-- 1. QUEUE TABLE
-- ============================================================

create table if not exists public.webhook_events (
    id            uuid primary key default gen_random_uuid(),
    tenant_id     uuid not null references public.tenants(id),
    event_type    text not null,
    payload       jsonb not null,
    created_at    timestamptz not null default now(),
    processed_at  timestamptz,                -- null = not yet delivered
    attempts      integer not null default 0  -- delivery attempts so far
);

do $$ begin
    alter table public.webhook_events add constraint webhook_events_event_type_check
        check (event_type in (
            'job.created', 'job.scheduled', 'job.status_changed',
            'job.completed', 'job.cancelled',
            'tech.location_updated', 'schedule.capacity_changed',
            'dispatch.suggestion_created'
        ));
exception when duplicate_object then null;
end $$;

do $$ begin
    alter table public.webhook_events add constraint webhook_events_attempts_check
        check (attempts >= 0);
exception when duplicate_object then null;
end $$;

create index if not exists idx_webhook_events_tenant
    on public.webhook_events(tenant_id, created_at desc);
-- The consumer's poll: oldest unprocessed first.
create index if not exists idx_webhook_events_unprocessed
    on public.webhook_events(created_at)
    where processed_at is null;

-- Tenant users may inspect their own event log; only the system (service role,
-- which bypasses RLS) and the SECURITY DEFINER trigger below ever write it.
alter table public.webhook_events enable row level security;
drop policy if exists tenant_isolation on public.webhook_events;
create policy tenant_isolation on public.webhook_events
    for select
    to authenticated
    using (tenant_id = public.tenant_id());
revoke all on public.webhook_events from public, anon;
grant select on public.webhook_events to authenticated;

-- ============================================================
-- 2. JOBS LIFECYCLE TRIGGER
-- ============================================================
--
-- SECURITY DEFINER so the enqueue works for any role that can legally write
-- jobs, without granting INSERT on webhook_events to authenticated.

create or replace function public.enqueue_job_webhook_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    -- geometry serializes as opaque EWKB hex in to_jsonb; the address jsonb
    -- already carries lat/lng, so drop it from payloads.
    job_json jsonb := to_jsonb(new) - 'location';
begin
    if tg_op = 'INSERT' then
        insert into public.webhook_events (tenant_id, event_type, payload)
        values (new.tenant_id, 'job.created', jsonb_build_object('job', job_json));

        if new.status = 'scheduled' then
            insert into public.webhook_events (tenant_id, event_type, payload)
            values (new.tenant_id, 'job.scheduled', jsonb_build_object(
                'job', job_json,
                'technician_id', new.technician_id,
                'scheduled_start', new.scheduled_start,
                'scheduled_end', new.scheduled_end
            ));
        end if;

    elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
        insert into public.webhook_events (tenant_id, event_type, payload)
        values (new.tenant_id, 'job.status_changed', jsonb_build_object(
            'job', job_json,
            'previous_status', old.status,
            'new_status', new.status
        ));

        if new.status = 'scheduled' then
            insert into public.webhook_events (tenant_id, event_type, payload)
            values (new.tenant_id, 'job.scheduled', jsonb_build_object(
                'job', job_json,
                'technician_id', new.technician_id,
                'scheduled_start', new.scheduled_start,
                'scheduled_end', new.scheduled_end
            ));
        elsif new.status = 'completed' then
            -- invoice_data / parts_used / photos ride along inside job_json —
            -- complete-job persists them before flipping the status.
            insert into public.webhook_events (tenant_id, event_type, payload)
            values (new.tenant_id, 'job.completed', jsonb_build_object(
                'job', job_json,
                'invoice_data', new.invoice_data,
                'parts_used', new.parts_used,
                'photos', to_jsonb(new.photos)
            ));
        elsif new.status = 'cancelled' then
            insert into public.webhook_events (tenant_id, event_type, payload)
            values (new.tenant_id, 'job.cancelled', jsonb_build_object('job', job_json));
        end if;
    end if;

    return new;
end;
$$;

revoke all on function public.enqueue_job_webhook_events() from public, anon, authenticated;

drop trigger if exists trg_jobs_webhook_events on public.jobs;
create trigger trg_jobs_webhook_events
    after insert or update on public.jobs
    for each row
    execute function public.enqueue_job_webhook_events();
