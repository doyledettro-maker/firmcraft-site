-- Firmcraft admin: initial schema
-- Tables: clients, usage_events, invoices, infrastructure, partners, client_partners

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------------
create table if not exists public.clients (
  id                    uuid primary key default uuid_generate_v4(),
  name                  text not null,
  industry              text,
  status                text not null default 'onboarding'
                          check (status in ('active', 'onboarding', 'suspended')),
  plan_tier             text not null default 'spark'
                          check (plan_tier in ('spark', 'flow', 'forge')),
  contact_name          text,
  contact_email         text,
  monthly_price         numeric(10, 2) not null default 0,
  stripe_customer_id    text,
  stripe_subscription_id text,
  litellm_key_id        text,
  vps_ip                text,
  hermes_port           integer,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  deleted_at            timestamptz
);

create index if not exists clients_status_idx       on public.clients (status) where deleted_at is null;
create index if not exists clients_plan_tier_idx    on public.clients (plan_tier) where deleted_at is null;
create index if not exists clients_stripe_cust_idx  on public.clients (stripe_customer_id);

-- ---------------------------------------------------------------------------
-- partners
-- ---------------------------------------------------------------------------
create table if not exists public.partners (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  contact_email   text,
  commission_rate numeric(5, 4) not null default 0
                    check (commission_rate >= 0 and commission_rate <= 1),
  status          text not null default 'active'
                    check (status in ('active', 'paused', 'terminated')),
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- client_partners (junction)
-- ---------------------------------------------------------------------------
create table if not exists public.client_partners (
  client_id  uuid not null references public.clients(id)  on delete cascade,
  partner_id uuid not null references public.partners(id) on delete cascade,
  primary key (client_id, partner_id)
);

-- ---------------------------------------------------------------------------
-- usage_events  (daily roll-ups from LiteLLM)
-- ---------------------------------------------------------------------------
create table if not exists public.usage_events (
  id            uuid primary key default uuid_generate_v4(),
  client_id     uuid not null references public.clients(id) on delete cascade,
  date          date not null,
  model         text,
  input_tokens  bigint not null default 0,
  output_tokens bigint not null default 0,
  cost          numeric(12, 6) not null default 0,
  api_calls     bigint not null default 0
);

create index if not exists usage_events_client_date_idx
  on public.usage_events (client_id, date desc);

-- ---------------------------------------------------------------------------
-- invoices
-- ---------------------------------------------------------------------------
create table if not exists public.invoices (
  id                uuid primary key default uuid_generate_v4(),
  client_id         uuid not null references public.clients(id) on delete cascade,
  stripe_invoice_id text unique,
  amount            numeric(12, 2) not null,
  status            text not null
                      check (status in ('draft', 'open', 'paid', 'void', 'uncollectible')),
  period_start      date,
  period_end        date,
  paid_at           timestamptz
);

create index if not exists invoices_client_idx on public.invoices (client_id, period_end desc);

-- ---------------------------------------------------------------------------
-- infrastructure  (per-client service health)
-- ---------------------------------------------------------------------------
create table if not exists public.infrastructure (
  id            uuid primary key default uuid_generate_v4(),
  client_id     uuid not null references public.clients(id) on delete cascade,
  service_name  text not null,
  endpoint      text,
  status        text not null default 'unknown'
                  check (status in ('up', 'degraded', 'down', 'unknown')),
  last_checked  timestamptz
);

create index if not exists infrastructure_client_idx on public.infrastructure (client_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger for clients
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();
