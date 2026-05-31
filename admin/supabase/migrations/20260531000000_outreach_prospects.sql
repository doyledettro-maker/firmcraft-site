-- Outbound email marketing: prospects + per-event tracking.
-- Drives the /admin/outreach dashboard. Emails are sent via Resend; opens and
-- clicks are logged through /api/outreach/track/{open,click}/[id] endpoints.

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- prospects
-- ---------------------------------------------------------------------------
create table if not exists public.prospects (
  id              uuid primary key default uuid_generate_v4(),
  company_name    text not null,
  industry        text,
  employee_count  integer,
  city            text,
  state           text,
  contact_name    text,
  email           text not null,
  phone           text,
  website         text,
  subject_line    text,
  email_body      text,
  notes           text,
  status          text not null default 'draft'
                    check (status in (
                      'draft', 'queued', 'sent', 'opened',
                      'clicked', 'replied', 'bounced', 'unsubscribed'
                    )),
  resend_message_id text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  sent_at         timestamptz,
  opened_at       timestamptz,
  clicked_at      timestamptz,
  replied_at      timestamptz,
  bounced_at      timestamptz,
  unsubscribed_at timestamptz
);

create index if not exists prospects_status_idx   on public.prospects (status);
create index if not exists prospects_industry_idx on public.prospects (industry);
create index if not exists prospects_city_idx     on public.prospects (city);
create index if not exists prospects_email_idx    on public.prospects (lower(email));
create index if not exists prospects_created_idx  on public.prospects (created_at desc);

-- updated_at trigger
create or replace function public.prospects_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists prospects_updated_at on public.prospects;
create trigger prospects_updated_at
  before update on public.prospects
  for each row execute function public.prospects_set_updated_at();

-- ---------------------------------------------------------------------------
-- tracking_events
-- ---------------------------------------------------------------------------
-- One row per open / click / bounce / unsubscribe event. The prospects table
-- carries the latest aggregate state; this table is the raw event log.
create table if not exists public.tracking_events (
  id          uuid primary key default uuid_generate_v4(),
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  event_type  text not null
                check (event_type in ('open', 'click', 'bounce', 'reply', 'unsubscribe')),
  timestamp   timestamptz not null default now(),
  -- metadata payload: { user_agent, ip } for opens; { link_url, user_agent, ip } for clicks; etc.
  metadata    jsonb not null default '{}'::jsonb
);

create index if not exists tracking_events_prospect_idx
  on public.tracking_events (prospect_id, timestamp desc);
create index if not exists tracking_events_type_idx
  on public.tracking_events (event_type, timestamp desc);
