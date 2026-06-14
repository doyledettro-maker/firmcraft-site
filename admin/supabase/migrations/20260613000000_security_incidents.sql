-- Security incidents: human-authored records of security events affecting
-- Firmcraft-managed infrastructure (client Hermes VPSs, shared services). This
-- is the in-panel record of truth surfaced at admin /security — the long-form
-- writeup lives as a markdown doc (doc_path) but the incident itself must be
-- visible/triaged inside the admin UI, not only in a file.
--
-- Read by getSecurityIncidents() via the service-role admin client (same as the
-- rest of the admin DB layer); rows are append-mostly and edited by an operator.
create table if not exists public.security_incidents (
  id            uuid primary key default gen_random_uuid(),
  occurred_at   timestamptz not null,
  resolved_at   timestamptz,
  severity      text not null default 'medium'
                  check (severity in ('low', 'medium', 'high', 'critical')),
  status        text not null default 'open'
                  check (status in ('open', 'investigating', 'contained', 'resolved')),
  title         text not null,
  affected_host text,
  summary       text not null,
  root_cause    text,
  remediation   text,
  -- indicators of compromise: free-form, e.g. { "c2": "...", "pool": "...",
  -- "wallet": "...", "removed_ssh_keys": [...] }. jsonb so the IOC shape can
  -- evolve without a migration.
  iocs          jsonb not null default '{}'::jsonb,
  -- relative path to the long-form writeup in the repo, e.g.
  -- docs/security/2026-06-13-worldmax-compromise.md
  doc_path      text,
  created_at    timestamptz not null default now()
);

-- Newest-first is the only access pattern (the /security list).
create index if not exists security_incidents_occurred_idx
  on public.security_incidents (occurred_at desc);

-- Seed: WorldMax managed-Hermes cryptojacking + exfil attempt (2026-06-13).
-- Source of truth: docs/security/2026-06-13-worldmax-compromise.md
insert into public.security_incidents
  (occurred_at, resolved_at, severity, status, title, affected_host, summary, root_cause, remediation, iocs, doc_path)
values (
  '2026-06-13T00:00:00Z',
  '2026-06-14T03:09:00Z',
  'high',
  'resolved',
  'WorldMax Hermes compromise — cryptojacking + exfil attempt',
  'WorldMax managed-Hermes VPS — 178.105.96.71 (Hetzner)',
  'WorldMax ran a Hermes-agent container whose web dashboard was exposed to the internet unauthenticated (HERMES_DASHBOARD_HOST=0.0.0.0, port 80, HERMES_DASHBOARD_INSECURE=1). An attacker wrote the agent config — which allows code execution via startup_hooks (shell) and mcp_servers (arbitrary launch commands) — and deployed three payloads: (1) an XMRig miner pointed at pool.supportxmr.com that ran ~11 days, (2) a credential-exfil mcp_server that base64ed ~/.hermes/.env and POSTed it to 43.228.79.77:55557, and (3) a container-escape attempt via chroot /proc/1/root, nsenter, the Docker socket, and a planted /etc/crontab + xmrig.service. The container escape FAILED — the container was unprivileged with no docker.sock mounted; host forensics confirmed no crontab miner line, no rogue systemd units, no rogue cron/accounts, and no non-owner SSH logins. The host was NOT compromised. No secrets were stolen: the targeted ANTHROPIC_API_KEY was empty (stock template, instance dormant), so the exfil POSTed an empty key and no rotation was required. The client (Mary) was not yet onboarded and had no production data — zero business impact. dogfood (5.78.117.234) and Rumble Bee / Mike (178.105.123.101) were verified clean. Discovered 2026-06-13 during a routine Hermes upgrade when a pre-upgrade config backup revealed the injected malware.',
  'About 75% our misconfiguration, 25% vendor footgun. Ours: Hermes'' dashboard is secure-by-default (an auth gate auto-engages when bound off-loopback), but we explicitly set HERMES_DASHBOARD_INSECURE=1 AND bound 0.0.0.0:80, defeating the gate — the docs warn against exactly this. Our other instances correctly use loopback / Caddy basic-auth. Vendor: once on the unauthenticated dashboard, blast radius is maximal-by-design — config writes to RCE-capable fields (startup_hooks, mcp_servers) need no second confirmation. Related known issues: CVE-2026-7113 (webhook INSECURE_NO_AUTH), GH issues #6439/#6440/#7089.',
  'Evidence preserved on host (worldmax-incident-evidence-*.tar.gz, .hermes.compromised-*, authorized_keys backups). Full host forensics → verdict container-scoped, host clean (no OS reinstall). Nuke & repave: removed both containers, moved the poisoned HERMES_HOME aside, deployed a fresh nousresearch/hermes-agent:v2026.6.5 with a clean empty HERMES_HOME and no real keys. Dashboard hardened: bound to 127.0.0.1:9119, INSECURE removed; the public interface now exposes only :22 (SSH). SSH locked down: authorized_keys reduced to the owner key only, with two unattributed keys removed (backed up). Verified: no startup_hooks/mcp_servers, no IOCs, no miner, dashboard not publicly reachable.',
  '{
    "c2": "43.228.79.77:55557",
    "mining_pool": "pool.supportxmr.com",
    "xmr_wallet": "4AgVrhUedHCdARgcoBDzTAWki…",
    "worker_tags": ["up_178_105_96_71", "dx_178_105_96_71"],
    "malicious_config_keys": ["startup_hooks", "mcp_servers._r1781016673"],
    "injected_env": ["BASH_ENV=/tmp/.h", "HERMES_SECURITY_PATCH", "HERMES_STARTUP_SCRIPT", "HERMES_POST_START_SCRIPT"],
    "removed_ssh_keys": ["SHA256:07mQCrc//Dt…", "SHA256:Ug5k54iOMwc… (funny-dazzling-carson@claude)"]
  }'::jsonb,
  'docs/security/2026-06-13-worldmax-compromise.md'
);
