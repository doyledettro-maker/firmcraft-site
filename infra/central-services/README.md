# Firmcraft Central Services

LiteLLM proxy + Langfuse observability, deployed as Docker Compose on a single Hetzner CX22 VPS. This is the central LLM gateway every Firmcraft agent and app routes through.

## What's in here

| File | Purpose |
| --- | --- |
| `docker-compose.yml` | Full stack: LiteLLM + Postgres, Langfuse + Postgres, nginx |
| `litellm-config.yaml` | Model routing (fast / standard / deep tiers), Langfuse callback, fallbacks |
| `nginx.conf` | TLS termination, rate limiting, security headers |
| `.env.example` | Every secret + domain, with comments. Copy to `.env`. |
| `setup.sh` | One-shot bootstrap: Docker, firewall, certs, stack up, smoke tests |

## Architecture

```
Internet ──▶ nginx :443 ──┬──▶ litellm    :4000 ──▶ litellm-db  (Postgres)
                          │         │
                          │         └──▶ langfuse :3000 (callbacks)
                          │
                          └──▶ langfuse  :3000 ──▶ langfuse-db (Postgres)
```

All containers share the `firmcraft-central` Docker network. Only nginx exposes ports to the host (`80`, `443`). Postgres data lives in named volumes; certs live in `/etc/letsencrypt` on the host.

### Why Langfuse v2 and not v3

Langfuse v3 requires Clickhouse + Redis + S3/MinIO — a meaningful uplift on a 4GB VPS. v2 runs on Postgres alone and covers everything Firmcraft needs at this stage (traces, sessions, scores, evals, prompt management). When ingest volume justifies it, migrate to v3 on a larger node.

## Prerequisites

- A Hetzner CX22 (or larger) running Ubuntu 22.04 / 24.04
- Root SSH access
- DNS A records for both subdomains pointing at the server's public IP:
  - `litellm.firmcraft.ai`
  - `langfuse.firmcraft.ai`
- API keys ready: Anthropic, OpenAI, OpenRouter

## Deployment

From your laptop:

```bash
ssh root@<server-ip>
git clone https://github.com/<org>/firmcraft-site /opt/firmcraft
cd /opt/firmcraft/infra/central-services
./setup.sh
```

`setup.sh` will:

1. Install Docker + Compose plugin if missing
2. Configure UFW (allow `22`, `80`, `443`)
3. Copy `.env.example` → `.env` and auto-generate strong values for DB passwords, master key, salts, encryption keys
4. Open `$EDITOR` so you can paste in the real provider API keys
5. Verify DNS resolves to this server
6. Issue Let's Encrypt certs for both subdomains via certbot standalone
7. `docker compose pull && docker compose up -d`
8. Wait for every service to report healthy
9. Hit both public TLS endpoints and confirm 200 OK
10. Print a summary with first-run actions

## First-run actions (done after `setup.sh`)

### 1. Create the Langfuse admin user

`LANGFUSE_DISABLE_SIGNUP` ships as `false` so the very first signup at `https://langfuse.firmcraft.ai` becomes admin. Once you have an admin user, lock signup down:

```bash
sed -i 's/^LANGFUSE_DISABLE_SIGNUP=.*/LANGFUSE_DISABLE_SIGNUP=true/' .env
docker compose up -d langfuse
```

### 2. Wire LiteLLM → Langfuse

In Langfuse: **Settings → API Keys → Create**. Copy public + secret into `.env`:

```bash
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
```

Reload LiteLLM:

```bash
docker compose up -d litellm
```

### 3. Mint a virtual key

Every app/agent gets its own key with budgets and per-key rate limits. The master key only exists to mint and manage virtual keys — never embed it in an app.

```bash
source .env
curl -X POST https://litellm.firmcraft.ai/key/generate \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key_alias": "firmcraft-website-staging",
    "models": ["firmcraft-fast","firmcraft-standard"],
    "max_budget": 25,
    "budget_duration": "30d",
    "rpm_limit": 60,
    "tpm_limit": 100000
  }'
```

### 4. Smoke test routing

```bash
curl https://litellm.firmcraft.ai/v1/chat/completions \
  -H "Authorization: Bearer <virtual-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "firmcraft-standard",
    "messages": [{"role":"user","content":"Reply with the word OK."}]
  }'
```

A trace should appear in Langfuse within a few seconds.

## Verification

```bash
# All containers up + healthy
docker compose ps

# Tail combined logs
docker compose logs -f --tail=200

# LiteLLM reports its model list
curl -s -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  https://litellm.firmcraft.ai/v1/models | jq '.data[].id'

# Langfuse public health
curl -s https://langfuse.firmcraft.ai/api/public/health | jq
```

## Operations

### Updating

```bash
cd /opt/firmcraft/infra/central-services
git pull
docker compose pull
docker compose up -d
```

### Backups

A nightly cron is the next addition; until then run on demand:

```bash
source .env
docker exec litellm-db  pg_dump -U "$LITELLM_DB_USER"  "$LITELLM_DB_NAME"  | gzip > "backups/litellm-$(date +%F).sql.gz"
docker exec langfuse-db pg_dump -U "$LANGFUSE_DB_USER" "$LANGFUSE_DB_NAME" | gzip > "backups/langfuse-$(date +%F).sql.gz"
```

Ship `backups/` off-server (S3, B2, restic, etc.).

### Cert renewal

`certbot.timer` is enabled by Ubuntu's certbot package. The deploy hook at `/etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh` reloads nginx after each renewal. Verify with:

```bash
systemctl list-timers | grep certbot
certbot renew --dry-run
```

## Troubleshooting

**`docker compose ps` shows a service as `unhealthy`**
Tail its logs: `docker compose logs --tail=200 <service>`. Most common causes:
- Postgres password mismatch between `.env` and the volume (left over from a previous run): `docker compose down -v` to wipe and re-init. Destroys data.
- Langfuse migration failure on a fresh DB: confirm `LANGFUSE_ENCRYPTION_KEY` is exactly 64 hex chars.

**TLS cert issuance fails in `setup.sh`**
- DNS hasn't propagated yet — `dig +short litellm.firmcraft.ai` should return the server's IP. Wait, then re-run `./setup.sh`.
- Port 80 already bound — `ss -tlnp | grep :80` and stop whatever is holding it.

**LiteLLM can't reach Langfuse**
The callback URL is `http://langfuse:3000` (in-network). If LiteLLM logs show `connection refused`, Langfuse hasn't finished booting yet — it depends on the Langfuse healthcheck and will retry. If persistent, `docker compose restart litellm`.

**Streaming completions get truncated**
nginx `proxy_buffering` is already off for the LiteLLM block. If you still see truncation, it's almost always client-side — verify the client honors `Transfer-Encoding: chunked` and reads `text/event-stream` line by line.

**`429 Too Many Requests` from nginx**
Tune the `limit_req_zone` rates in `nginx.conf`. The defaults (30 r/s LiteLLM, 60 r/s Langfuse) are deliberately conservative for a CX22.

**Out of memory**
`docker stats` to see who's bloated. Memory limits in `docker-compose.yml` sum to ~2.4GB; the rest is OS + buffer. If Postgres is the offender, tune `shared_buffers`/`work_mem` via a custom `postgresql.conf`.

## Security notes

- `.env` is `chmod 600` and **must not** be committed (`.gitignore` covers it via the project root).
- LiteLLM master key is admin-level — keep it on the server only. Apps use virtual keys with budgets.
- Langfuse signup is open on first boot so you can create the admin; flip `LANGFUSE_DISABLE_SIGNUP=true` immediately after.
- Telemetry to Langfuse Cloud is disabled (`TELEMETRY_ENABLED=false`).
- nginx serves HSTS (`max-age=63072000; preload`) — once you submit the apex domain to the HSTS preload list, browsers will refuse plaintext.
