-- Security-detection signals for client health beacons (post-incident upgrade).
--
-- The original beacon was uptime/cost-only and missed an 11-day cryptominer,
-- credential exfiltration, and an internet-exposed unauthenticated agent
-- dashboard on a client VPS. This migration adds the additive telemetry the
-- upgraded beacon (admin/scripts/health-beacon.sh) now reports so the /health
-- evaluator can detect those classes of compromise. All columns are nullable —
-- older beacons (and beacons from hosts where a probe can't run) simply omit
-- them, and existing rules keep working untouched.
alter table public.client_health_beacons
  -- P0: services bound to a public interface (anything on 0.0.0.0/::/non-loopback,
  -- excluding 22 and 443). Array of {port, bind_addr, proc}.
  add column if not exists public_listeners      jsonb,
  -- P1a: CPU saturation signal for cryptominer detection.
  add column if not exists cpu_percent           numeric(5, 2),
  add column if not exists load_avg              jsonb,   -- {one, five, fifteen}
  add column if not exists cpu_cores             integer,
  -- P1b: agent-config integrity.
  add column if not exists config_hash           text,    -- sha256 of config.yaml
  add column if not exists dangerous_config_keys jsonb,   -- array of present+non-empty risky keys
  -- P2: outbound endpoints for IOC matching.
  add column if not exists outbound_remotes      jsonb;   -- array of {ip, port}
