-- Self-hosted lightweight web analytics for firmcraft.ai marketing site.
-- Each page load on the marketing site fires a beacon to /api/track which
-- writes one row here. The admin /analytics page aggregates from this table.
--
-- ip_hash is daily-rotated (sha256 of ip + UTC date salt) so we never store
-- the raw IP — gives us "unique visitors per day" granularity without keeping
-- a long-lived identifier that could re-identify a user.

create extension if not exists "uuid-ossp";

create table if not exists public.page_views (
  id          uuid primary key default uuid_generate_v4(),
  path        text not null,
  referrer    text,
  user_agent  text,
  ip_hash     text,
  country     text,
  created_at  timestamptz not null default now()
);

create index if not exists page_views_created_idx  on public.page_views (created_at desc);
create index if not exists page_views_path_idx     on public.page_views (path);
create index if not exists page_views_referrer_idx on public.page_views (referrer)
  where referrer is not null;
