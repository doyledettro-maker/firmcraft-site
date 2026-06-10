-- Scheduling & Dispatch (Phase 2.4, Sprint 2) — mobile push-notification tokens
--
-- One row per installed app instance. The tech app registers its Expo/FCM push
-- token on sign-in and refreshes last_seen_at on each launch; the dispatch
-- notifier (Phase 2.3 events → push) reads tokens by technician to deliver
-- new-job / schedule-change / emergency notifications.
--
-- A separate table (not technicians.push_token) because a tech can carry two
-- devices (phone + tablet) and a shared device can change hands between techs —
-- the token belongs to the installation, not the person.

create table if not exists public.device_tokens (
    id              uuid primary key default gen_random_uuid(),
    tenant_id       uuid not null references public.tenants(id),
    technician_id   uuid references public.technicians(id) on delete cascade,
    clerk_user_id   text,                                  -- token owner when no technician row maps (office staff testing)
    token           text not null,                         -- ExponentPushToken[…] or raw FCM/APNs token
    token_type      text not null default 'expo',          -- 'expo' | 'fcm' | 'apns'
    platform        text not null,                         -- 'ios' | 'android'
    device_name     text,                                  -- "Dave's iPhone 15" — for the admin device list
    app_version     text,
    is_active       boolean not null default true,         -- flipped false on sign-out / delivery failure
    created_at      timestamptz not null default now(),
    last_seen_at    timestamptz not null default now(),
    unique(token)
);

do $$ begin
    alter table public.device_tokens add constraint device_tokens_platform_check
        check (platform in ('ios', 'android'));
exception when duplicate_object then null;
end $$;

do $$ begin
    alter table public.device_tokens add constraint device_tokens_type_check
        check (token_type in ('expo', 'fcm', 'apns'));
exception when duplicate_object then null;
end $$;

-- The notifier's lookup: active tokens for a tech.
create index if not exists idx_device_tokens_tech
    on public.device_tokens(technician_id) where is_active = true;
create index if not exists idx_device_tokens_tenant
    on public.device_tokens(tenant_id);

-- Tenant isolation + each user manages only their own device rows. The
-- notifier reads with the service role (BYPASSRLS).
alter table public.device_tokens enable row level security;

drop policy if exists tenant_isolation on public.device_tokens;
create policy tenant_isolation on public.device_tokens
    for all
    to authenticated
    using (tenant_id = public.tenant_id())
    with check (tenant_id = public.tenant_id());

-- RESTRICTIVE: narrow technicians to their own rows (office roles see all
-- tenant devices for the admin device list).
drop policy if exists device_tokens_role_visibility on public.device_tokens;
create policy device_tokens_role_visibility on public.device_tokens
    as restrictive
    for all
    to authenticated
    using (
        public.user_role() in ('admin', 'dispatcher')
        or technician_id = public.tech_id()
        or clerk_user_id = current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
    )
    with check (
        public.user_role() in ('admin', 'dispatcher')
        or technician_id = public.tech_id()
        or clerk_user_id = current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
    );

revoke all on public.device_tokens from public, anon;
grant select, insert, update, delete on public.device_tokens to authenticated;
