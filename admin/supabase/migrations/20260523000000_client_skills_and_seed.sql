-- client_skills: per-tenant inventory of custom Hermes skills.
-- Counted on the client detail page under "Live tenant stats" as "Custom skills".
-- Seed data covers Rumble Bee Tree Service (id 6fba1338-…) as the first live tenant.

create table if not exists public.client_skills (
  id          uuid primary key default uuid_generate_v4(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  skill_name  text not null,
  status      text not null default 'active'
                check (status in ('active', 'disabled')),
  created_at  timestamptz not null default now(),
  unique (client_id, skill_name)
);

create index if not exists client_skills_client_idx
  on public.client_skills (client_id) where status = 'active';

-- ---------------------------------------------------------------------------
-- Seed: Rumble Bee Tree Service skills
-- ---------------------------------------------------------------------------
insert into public.client_skills (client_id, skill_name, status)
values
  ('6fba1338-6461-420f-898c-3c8d4af7c3e5', 'rumble-bee-contract', 'active'),
  ('6fba1338-6461-420f-898c-3c8d4af7c3e5', 'rumble-bee-estimate', 'active'),
  ('6fba1338-6461-420f-898c-3c8d4af7c3e5', 'docuseal',            'active')
on conflict (client_id, skill_name) do nothing;

-- ---------------------------------------------------------------------------
-- Seed: Rumble Bee infrastructure records (Hermes Agent already exists)
-- ---------------------------------------------------------------------------
insert into public.infrastructure (client_id, service_name, endpoint, status)
select '6fba1338-6461-420f-898c-3c8d4af7c3e5', 'DocuSeal',     'https://sign.firmcraft.ai',       'up'
where not exists (
  select 1 from public.infrastructure
  where client_id = '6fba1338-6461-420f-898c-3c8d4af7c3e5' and service_name = 'DocuSeal'
);

insert into public.infrastructure (client_id, service_name, endpoint, status)
select '6fba1338-6461-420f-898c-3c8d4af7c3e5', 'Telegram Bot', 'https://api.telegram.org',        'up'
where not exists (
  select 1 from public.infrastructure
  where client_id = '6fba1338-6461-420f-898c-3c8d4af7c3e5' and service_name = 'Telegram Bot'
);

insert into public.infrastructure (client_id, service_name, endpoint, status)
select '6fba1338-6461-420f-898c-3c8d4af7c3e5', 'Print Bridge', 'http://178.105.123.101:8080',     'unknown'
where not exists (
  select 1 from public.infrastructure
  where client_id = '6fba1338-6461-420f-898c-3c8d4af7c3e5' and service_name = 'Print Bridge'
);

notify pgrst, 'reload schema';
