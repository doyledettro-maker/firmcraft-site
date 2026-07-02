-- Opportunity Board: sales pipeline on top of outreach.
--
-- Opportunities sit ON TOP of the outreach graph (companies / contacts /
-- correspondence). Converting a qualified lead never moves or deletes the
-- underlying records — an opportunity just references them, so the full
-- email/call/meeting history stays attached to the company.
--
-- Stage model (Managed AI sales motion):
--   qualified → discovery → pilot_scoped → proposal → closed_won
--                                                   ↘ closed_lost
--   parked = deliberately on ice (still counts as "existing" for dedupe).

create table if not exists public.opportunities (
  id                    uuid primary key default uuid_generate_v4(),
  company_id            uuid not null references public.companies(id) on delete cascade,
  primary_contact_id    uuid references public.contacts(id) on delete set null,
  name                  text not null,
  stage                 text not null default 'qualified'
                          check (stage in (
                            'qualified', 'discovery', 'pilot_scoped', 'proposal',
                            'closed_won', 'closed_lost', 'parked'
                          )),
  priority              text not null default 'medium'
                          check (priority in ('low', 'medium', 'high')),
  special_attention     boolean not null default false,
  expected_close_start  date,
  expected_close_end    date,
  estimated_value       numeric(12,2),
  plan_tier             text check (plan_tier in ('solo', 'team', 'pro', 'pilot')),
  confidence            integer check (confidence between 0 and 100),
  owner                 text,
  next_action           text,
  next_action_due_at    timestamptz,
  use_case              text,
  notes                 text,
  lost_reason           text,
  closed_at             timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists opportunities_stage_idx
  on public.opportunities (stage);
create index if not exists opportunities_close_window_idx
  on public.opportunities (expected_close_end, expected_close_start);
create index if not exists opportunities_special_idx
  on public.opportunities (special_attention) where special_attention;
create index if not exists opportunities_owner_idx
  on public.opportunities (owner);
create index if not exists opportunities_company_idx
  on public.opportunities (company_id);

-- One non-closed opportunity per company. Parked counts as existing so the
-- UI links to it instead of creating a duplicate.
create unique index if not exists opportunities_company_open_uniq
  on public.opportunities (company_id)
  where stage not in ('closed_won', 'closed_lost');

drop trigger if exists opportunities_updated_at on public.opportunities;
create trigger opportunities_updated_at
  before update on public.opportunities
  for each row execute function public.set_updated_at_now();

-- ---------------------------------------------------------------------------
-- Seed: CW&M Company, Inc. / Kenneth T. Rowe — first real opportunity.
-- Expected close window July–August 2026, high-attention.
-- Only seeded when the outreach company already exists (idempotent).
-- ---------------------------------------------------------------------------
do $$
declare
  v_company_id uuid;
  v_owner      text;
  v_contact_id uuid;
begin
  select id, assigned_to into v_company_id, v_owner
    from public.companies
   where lower(company_name) like 'cw&m%'
      or lower(company_name) like 'cw & m%'
      or lower(company_name) like 'cwm company%'
   order by created_at
   limit 1;

  if v_company_id is null then
    return;
  end if;

  if exists (
    select 1 from public.opportunities
     where company_id = v_company_id
       and stage not in ('closed_won', 'closed_lost')
  ) then
    return;
  end if;

  select id into v_contact_id
    from public.contacts
   where company_id = v_company_id
     and (contact_name ilike '%rowe%' or contact_name ilike '%kenneth%')
   order by created_at
   limit 1;

  insert into public.opportunities (
    company_id, primary_contact_id, name, stage, priority, special_attention,
    expected_close_start, expected_close_end, confidence, owner, next_action
  ) values (
    v_company_id,
    v_contact_id,
    'CW&M Company — Managed AI',
    'discovery',
    'high',
    true,
    date '2026-07-01',
    date '2026-08-31',
    60,
    v_owner,
    'Confirm scope and schedule next meeting with Kenneth T. Rowe'
  );
end $$;
