-- Client health beacons: each client's Hermes VPS POSTs a heartbeat every 5
-- minutes (admin/scripts/health-beacon.sh) to /api/health/beacon, which upserts
-- a row here. The admin /health dashboard reads the latest row per client and
-- derives a traffic-light status. Distinct from `infrastructure` (admin-side
-- URL probes) — this is agent-side telemetry pushed FROM each VPS.
--
-- client_id is text (not a hard FK) on purpose: beacons may arrive from hosts
-- that don't yet have a clients-table row (fresh onboarding, self-monitoring),
-- and we never want a missing-FK error to drop a heartbeat. The GET endpoint
-- resolves client_id against clients.id for display metadata when it can.
create table if not exists public.client_health_beacons (
  id                      uuid primary key default gen_random_uuid(),
  client_id               text not null,
  reported_at             timestamptz not null default now(),
  container_status        text not null default 'unknown'
                            check (container_status in ('running', 'stopped', 'restarting', 'unknown')),
  container_uptime_hours  integer,
  container_restart_count integer,
  disk_percent            integer,
  memory_percent          integer,
  gateway_state           text not null default 'unknown'
                            check (gateway_state in ('connected', 'disconnected', 'unknown')),
  last_activity_at        timestamptz,
  token_spend_today       numeric(12, 4),
  token_spend_month       numeric(12, 4),
  -- escape hatch for future metrics without a migration (hostname, agent
  -- version, container name, raw df line, etc.)
  extra                   jsonb not null default '{}'::jsonb,
  created_at              timestamptz not null default now()
);

-- Latest-beacon-per-client is the hot query; index covers the dedupe scan.
create index if not exists client_health_beacons_client_reported_idx
  on public.client_health_beacons (client_id, reported_at desc);

create index if not exists client_health_beacons_reported_idx
  on public.client_health_beacons (reported_at desc);
