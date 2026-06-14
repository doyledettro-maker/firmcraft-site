# Managed Hermes — Provisioning Hardening Checklist

Post-incident hardening for every managed Hermes VPS. A client instance ran a
cryptominer + credential-exfiltrator for **11 days** before detection, reachable
because the agent dashboard was bound to `0.0.0.0` with no auth and the host
firewall was wide open. This checklist plus the upgraded health beacon
(`admin/scripts/health-beacon.sh`) is the prevention + detection layer.

Run through this on **every** provision and on **every** existing client during
the next maintenance window.

## 1. Agent dashboard — never publicly reachable

- Bind the dashboard to loopback only: container/host `127.0.0.1:9119`, never
  `0.0.0.0` and never `[::]`.
- **Never** set `HERMES_DASHBOARD_INSECURE=1`. If you see it, remove it and
  recreate the container.
- Expose the dashboard only through a reverse proxy (Caddy) that enforces auth —
  e.g. basic-auth in front of `127.0.0.1:9119`, served over TLS on a
  grey-clouded subdomain (`agent.<client>.firmcraft.ai`). The dashboard has no
  built-in auth, so the proxy is the only thing protecting it.
- Confirm: from another host, `curl http://<vps-ip>:9119/` must **fail/refuse**.
  From the box, `ss -tlnp | grep 9119` must show `127.0.0.1:9119`, not
  `0.0.0.0:9119`.

## 2. Host firewall — default-deny

- Default-deny inbound; allow only **22** (SSH) and **443** (HTTPS / reverse
  proxy). Nothing else should be reachable from the internet.
- No application/agent ports (9119, LiteLLM, postgres, dashboards) bound to a
  public interface. Bind them to `127.0.0.1` and proxy if external access is
  needed.
- Verify with the beacon's `public_listeners` check (see §5): the only "public"
  binds permitted are 22 and 443, which the beacon already excludes — so a
  hardened box reports `public_listeners: []`.

## 3. Agent config integrity

- Do not enable code-execution config keys unless a documented client need
  requires them: `startup_hooks`, `mcp_servers`, `shell_hooks`,
  `post_start_script`. The beacon flags any of these (present + non-empty) and
  the admin marks the client **RED**.
- The beacon hashes `config.yaml` (`config_hash`); an unexpected change shows as
  **YELLOW "Agent config changed"** on `/health`. Treat unexplained drift as an
  incident until proven benign.

## 4. SSH + accounts

- Key-only SSH, password auth disabled, root login disabled (or key-only).
- No shared credentials baked into the image; per-client secrets in the
  gitignored env file (`/opt/firmcraft/health-beacon.env`, mode `600`).

## 5. Health beacon — required on every box

The beacon is the detection layer. It is **mandatory** on every managed VPS.

- Install per the header in `admin/scripts/health-beacon.sh`:
  - `/opt/firmcraft/health-beacon.sh` (mode `0755`)
  - `/opt/firmcraft/health-beacon.env` (mode `600`) with `CLIENT_ID` +
    `BEACON_TOKEN`
  - cron: `*/5 * * * * /opt/firmcraft/health-beacon.sh >> /var/log/firmcraft-beacon.log 2>&1`
- It needs standard tools only: `bash`, `docker`, `ss` (or `netstat`),
  `sha256sum`, `/proc`, `curl`.
- New security signals it reports (all best-effort, null if a probe can't run):
  - `public_listeners` — services on a public interface (excl. 22/443) → **RED**
  - `cpu_percent` + `load_avg` + `cpu_cores` — sustained high load across the
    last few beacons → **RED "possible cryptominer"**
  - `config_hash` + `dangerous_config_keys` — config drift / dangerous keys
  - `outbound_remotes` — outbound endpoints, matched against the IOC list in
    `admin/src/lib/health-iocs.ts` → **RED** on a known-bad IP / mining pool /
    mining port

## 6. Verify the hardening

After provisioning (or hardening an existing box):

1. `ss -tlnp` on the box — only `127.0.0.1`-bound app ports; nothing public
   except 22/443.
2. From off-box, `curl http://<vps-ip>:9119/` refuses.
3. Run the beacon once by hand:
   `/opt/firmcraft/health-beacon.sh` — the log line should show
   `public_listeners=0`, and the admin `/health` card for that client should be
   green with no Security badge.
4. Confirm the new fields arrive: the client's `/health` card shows a CPU
   metric and (if anything is exposed/risky) a red **Security** badge with the
   specific finding.
