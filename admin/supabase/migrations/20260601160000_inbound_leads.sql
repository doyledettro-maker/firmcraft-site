-- Inbound lead capture: contact/support forms on the marketing site write
-- here, the admin Leads view reads + works the pipeline. Distinct from the
-- cold-outbound `companies`/`contacts` tables — this is people reaching out to us.
create table if not exists public.inbound_leads (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  company    text,
  phone      text,
  message    text,
  -- which page/form the lead came from (e.g. 'contact', 'homepage-cta', 'support')
  source     text,
  -- pipeline stage: new → contacted → qualified → converted → archived
  status     text not null default 'new'
    check (status in ('new', 'contacted', 'qualified', 'converted', 'archived')),
  -- best-effort market segment guessed at capture time
  segment    text check (segment in ('small', 'midmarket', 'pe')),
  notes      text,
  created_at timestamptz not null default now()
);

create index if not exists inbound_leads_created_at_idx on public.inbound_leads (created_at desc);
create index if not exists inbound_leads_status_idx on public.inbound_leads (status);
