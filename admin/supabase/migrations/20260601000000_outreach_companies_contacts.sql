-- Restructure outreach from a flat prospects table into:
--   companies      — one row per firm (industry, location, status, notes)
--   contacts       — one row per person at a firm (FK to companies)
--   correspondence — full event log for every touch (sent/opened/clicked/replied/
--                    bounced/unsubscribed/call/meeting/note/sms)
--
-- Existing prospect rows are migrated:
--   * companies are deduplicated on lower(company_name)
--   * each prospect becomes a contact whose id is preserved from prospects.id
--     so tracking pixels & click links already in inboxes keep resolving.
--   * tracking_events rows are copied into correspondence.
--   * prospects status timestamps (sent_at, opened_at, etc.) are also synthesized
--     into correspondence rows when no matching tracking_event exists.
--
-- The old prospects and tracking_events tables are dropped at the end.

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- companies
-- ---------------------------------------------------------------------------
create table if not exists public.companies (
  id              uuid primary key default uuid_generate_v4(),
  company_name    text not null,
  industry        text,
  employee_count  integer,
  phone           text,
  website         text,
  city            text,
  state           text,
  status          text not null default 'active'
                    check (status in ('active', 'engaged', 'customer', 'archived')),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists companies_status_idx     on public.companies (status);
create index if not exists companies_industry_idx   on public.companies (industry);
create index if not exists companies_city_idx       on public.companies (city);
create index if not exists companies_name_lower_idx on public.companies (lower(company_name));
create index if not exists companies_created_idx    on public.companies (created_at desc);

-- ---------------------------------------------------------------------------
-- contacts
-- ---------------------------------------------------------------------------
create table if not exists public.contacts (
  id                uuid primary key default uuid_generate_v4(),
  company_id        uuid not null references public.companies(id) on delete cascade,
  contact_name      text,
  title             text,
  email             text not null,
  phone             text,
  subject_line      text,
  email_body        text,
  notes             text,
  status            text not null default 'draft'
                      check (status in (
                        'draft', 'queued', 'sent', 'opened',
                        'clicked', 'replied', 'bounced', 'unsubscribed'
                      )),
  resend_message_id text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  sent_at           timestamptz,
  opened_at         timestamptz,
  clicked_at        timestamptz,
  replied_at        timestamptz,
  bounced_at        timestamptz,
  unsubscribed_at   timestamptz
);

create index if not exists contacts_company_idx    on public.contacts (company_id);
create index if not exists contacts_status_idx     on public.contacts (status);
create index if not exists contacts_email_idx      on public.contacts (lower(email));
create index if not exists contacts_created_idx    on public.contacts (created_at desc);

-- ---------------------------------------------------------------------------
-- correspondence
-- ---------------------------------------------------------------------------
-- Full timeline of every touch with a contact. One row per event.
-- company_id is denormalized so we can render a firm-level timeline cheaply.
create table if not exists public.correspondence (
  id           uuid primary key default uuid_generate_v4(),
  contact_id   uuid not null references public.contacts(id)  on delete cascade,
  company_id   uuid not null references public.companies(id) on delete cascade,
  type         text not null
                 check (type in (
                   'email_sent', 'email_opened', 'email_clicked',
                   'email_replied', 'email_bounced', 'email_unsubscribed',
                   'call', 'meeting', 'note', 'sms'
                 )),
  subject      text,
  body         text,
  metadata     jsonb not null default '{}'::jsonb,
  occurred_at  timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

create index if not exists correspondence_contact_idx
  on public.correspondence (contact_id, occurred_at desc);
create index if not exists correspondence_company_idx
  on public.correspondence (company_id, occurred_at desc);
create index if not exists correspondence_type_idx
  on public.correspondence (type, occurred_at desc);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at_now()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists companies_updated_at on public.companies;
create trigger companies_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at_now();

drop trigger if exists contacts_updated_at on public.contacts;
create trigger contacts_updated_at
  before update on public.contacts
  for each row execute function public.set_updated_at_now();

-- ---------------------------------------------------------------------------
-- Data migration: prospects → companies + contacts; tracking_events → correspondence
-- ---------------------------------------------------------------------------
do $$
declare
  has_prospects        boolean;
  has_tracking_events  boolean;
begin
  select exists (
    select 1 from information_schema.tables
     where table_schema = 'public' and table_name = 'prospects'
  ) into has_prospects;

  select exists (
    select 1 from information_schema.tables
     where table_schema = 'public' and table_name = 'tracking_events'
  ) into has_tracking_events;

  if has_prospects then
    -- One company per distinct lower(company_name). Pull the first non-null
    -- value of each company-level field across that group.
    with grouped as (
      select
        lower(company_name)                                    as key,
        min(created_at)                                        as created_at,
        (array_agg(company_name   order by created_at))[1]     as company_name,
        (array_agg(industry       order by created_at) filter (where industry       is not null))[1] as industry,
        (array_agg(employee_count order by created_at) filter (where employee_count is not null))[1] as employee_count,
        (array_agg(phone          order by created_at) filter (where phone          is not null))[1] as phone,
        (array_agg(website        order by created_at) filter (where website        is not null))[1] as website,
        (array_agg(city           order by created_at) filter (where city           is not null))[1] as city,
        (array_agg(state          order by created_at) filter (where state          is not null))[1] as state,
        string_agg(distinct nullif(notes, ''), E'\n---\n' order by nullif(notes, '')) as notes
      from public.prospects
      group by lower(company_name)
    )
    insert into public.companies (
      company_name, industry, employee_count, phone, website,
      city, state, status, notes, created_at, updated_at
    )
    select
      company_name, industry, employee_count, phone, website,
      city, state, 'active', notes, created_at, created_at
    from grouped;

    -- Contacts: preserve prospects.id so existing tracking URLs keep working.
    insert into public.contacts (
      id, company_id, contact_name, title, email, phone,
      subject_line, email_body, notes, status, resend_message_id,
      created_at, updated_at,
      sent_at, opened_at, clicked_at, replied_at, bounced_at, unsubscribed_at
    )
    select
      p.id,
      c.id,
      p.contact_name,
      null::text,
      p.email,
      p.phone,
      p.subject_line,
      p.email_body,
      p.notes,
      p.status,
      p.resend_message_id,
      p.created_at,
      p.updated_at,
      p.sent_at,
      p.opened_at,
      p.clicked_at,
      p.replied_at,
      p.bounced_at,
      p.unsubscribed_at
    from public.prospects p
    join public.companies c on lower(c.company_name) = lower(p.company_name);

    -- tracking_events → correspondence
    if has_tracking_events then
      insert into public.correspondence (contact_id, company_id, type, metadata, occurred_at)
      select
        te.prospect_id,
        ct.company_id,
        case te.event_type
          when 'open'        then 'email_opened'
          when 'click'       then 'email_clicked'
          when 'bounce'      then 'email_bounced'
          when 'reply'       then 'email_replied'
          when 'unsubscribe' then 'email_unsubscribed'
        end,
        coalesce(te.metadata, '{}'::jsonb),
        te.timestamp
      from public.tracking_events te
      join public.contacts ct on ct.id = te.prospect_id;
    end if;

    -- Backfill correspondence rows from prospects.*_at timestamps so the
    -- timeline still has a "sent" entry (and others) even if no matching
    -- tracking_event row exists.
    insert into public.correspondence (contact_id, company_id, type, subject, body, occurred_at)
    select ct.id, ct.company_id, 'email_sent', ct.subject_line, ct.email_body, ct.sent_at
    from public.contacts ct
    where ct.sent_at is not null
      and not exists (
        select 1 from public.correspondence x
         where x.contact_id = ct.id and x.type = 'email_sent'
      );

    insert into public.correspondence (contact_id, company_id, type, occurred_at)
    select ct.id, ct.company_id, 'email_opened', ct.opened_at
    from public.contacts ct
    where ct.opened_at is not null
      and not exists (
        select 1 from public.correspondence x
         where x.contact_id = ct.id and x.type = 'email_opened'
      );

    insert into public.correspondence (contact_id, company_id, type, occurred_at)
    select ct.id, ct.company_id, 'email_clicked', ct.clicked_at
    from public.contacts ct
    where ct.clicked_at is not null
      and not exists (
        select 1 from public.correspondence x
         where x.contact_id = ct.id and x.type = 'email_clicked'
      );

    insert into public.correspondence (contact_id, company_id, type, occurred_at)
    select ct.id, ct.company_id, 'email_replied', ct.replied_at
    from public.contacts ct
    where ct.replied_at is not null
      and not exists (
        select 1 from public.correspondence x
         where x.contact_id = ct.id and x.type = 'email_replied'
      );

    insert into public.correspondence (contact_id, company_id, type, occurred_at)
    select ct.id, ct.company_id, 'email_bounced', ct.bounced_at
    from public.contacts ct
    where ct.bounced_at is not null
      and not exists (
        select 1 from public.correspondence x
         where x.contact_id = ct.id and x.type = 'email_bounced'
      );

    insert into public.correspondence (contact_id, company_id, type, occurred_at)
    select ct.id, ct.company_id, 'email_unsubscribed', ct.unsubscribed_at
    from public.contacts ct
    where ct.unsubscribed_at is not null
      and not exists (
        select 1 from public.correspondence x
         where x.contact_id = ct.id and x.type = 'email_unsubscribed'
      );

    drop table if exists public.tracking_events;
    drop function if exists public.prospects_set_updated_at() cascade;
    drop table if exists public.prospects;
  end if;
end $$;
