#!/usr/bin/env bash
# Firmcraft central services — one-shot bootstrap for a fresh Hetzner CX22 (Ubuntu 22.04/24.04).
#
# Usage (run as root or with sudo):
#   curl -O https://raw.githubusercontent.com/<org>/firmcraft-site/main/infra/central-services/setup.sh
#   chmod +x setup.sh
#   ./setup.sh
#
# Or after cloning the repo:
#   cd infra/central-services && sudo ./setup.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ─── Helpers ──────────────────────────────────────────────────────────────────
c_red()   { printf "\033[31m%s\033[0m\n" "$*"; }
c_grn()   { printf "\033[32m%s\033[0m\n" "$*"; }
c_ylw()   { printf "\033[33m%s\033[0m\n" "$*"; }
c_blu()   { printf "\033[34m%s\033[0m\n" "$*"; }
step()    { printf "\n\033[1;36m▶ %s\033[0m\n" "$*"; }
die()     { c_red "ERROR: $*" >&2; exit 1; }

require_root() {
    if [[ $EUID -ne 0 ]]; then
        die "Run as root or with sudo (need to install packages, write to /etc/letsencrypt, bind :80/:443)."
    fi
}

# ─── 1. Pre-flight ────────────────────────────────────────────────────────────
require_root

step "Detecting OS"
if ! grep -qiE "ubuntu|debian" /etc/os-release; then
    c_ylw "Warning: this script is tested on Ubuntu/Debian. Continuing anyway."
fi

step "Updating apt and installing base packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y --no-install-recommends \
    ca-certificates curl gnupg lsb-release \
    ufw certbot openssl jq

# ─── 2. Docker + Compose ──────────────────────────────────────────────────────
step "Installing Docker (if missing)"
if ! command -v docker >/dev/null 2>&1; then
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    . /etc/os-release
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/${ID} ${VERSION_CODENAME} stable" \
        > /etc/apt/sources.list.d/docker.list
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable --now docker
    c_grn "Docker installed: $(docker --version)"
else
    c_grn "Docker already present: $(docker --version)"
fi

if ! docker compose version >/dev/null 2>&1; then
    die "docker compose plugin missing — install docker-compose-plugin and rerun."
fi
c_grn "Compose: $(docker compose version)"

# ─── 3. Firewall ──────────────────────────────────────────────────────────────
step "Configuring UFW (allow 22, 80, 443)"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status verbose

# ─── 4. .env scaffolding ──────────────────────────────────────────────────────
step "Preparing .env"
if [[ ! -f .env ]]; then
    cp .env.example .env
    chmod 600 .env

    # Generate any obvious placeholders so the operator only fills in real provider keys.
    sed -i \
        -e "s|CHANGEME_litellm_db_password|$(openssl rand -hex 24)|" \
        -e "s|CHANGEME_langfuse_db_password|$(openssl rand -hex 24)|" \
        -e "s|sk-CHANGEME_master_key_min_32_chars|sk-$(openssl rand -hex 24)|" \
        -e "s|CHANGEME_litellm_salt_key_32_bytes_hex|$(openssl rand -hex 32)|" \
        -e "s|CHANGEME_nextauth_secret_base64_32|$(openssl rand -base64 32 | tr -d '\n')|" \
        -e "s|CHANGEME_langfuse_salt_base64_32|$(openssl rand -base64 32 | tr -d '\n')|" \
        -e "s|CHANGEME_64_hex_chars_exactly_32_bytes_aaaaaaaaaaaaaaaaaaaaaaaaa|$(openssl rand -hex 32)|" \
        .env

    c_grn ".env created with auto-generated secrets."
    c_ylw "You still need to fill in real provider keys (ANTHROPIC, OPENAI, OPENROUTER) and Langfuse PUBLIC/SECRET keys."
    c_ylw "Edit now? Press ENTER to open in \$EDITOR (default: nano), or Ctrl-C to bail."
    read -r _
    "${EDITOR:-nano}" .env
else
    c_grn ".env already exists — skipping scaffold. Inspect it manually if needed."
fi

# Sanity check that no CHANGEME values remain.
if grep -q "CHANGEME" .env; then
    c_red "WARNING: .env still contains CHANGEME placeholders:"
    grep "CHANGEME" .env || true
    c_ylw "Continue anyway? [y/N]"
    read -r ans
    [[ "$ans" =~ ^[Yy]$ ]] || die "Aborting until .env is filled in."
fi

# Pull domain values so we can use them below.
# shellcheck disable=SC1091
set -a; source .env; set +a
: "${LITELLM_DOMAIN:?LITELLM_DOMAIN not set in .env}"
: "${LANGFUSE_DOMAIN:?LANGFUSE_DOMAIN not set in .env}"
: "${LETSENCRYPT_EMAIL:?LETSENCRYPT_EMAIL not set in .env}"

# ─── 5. DNS pre-flight ────────────────────────────────────────────────────────
step "Verifying DNS for $LITELLM_DOMAIN and $LANGFUSE_DOMAIN"
PUBLIC_IP=$(curl -fsSL https://api.ipify.org || true)
c_blu "This server's public IP: ${PUBLIC_IP:-unknown}"
for d in "$LITELLM_DOMAIN" "$LANGFUSE_DOMAIN"; do
    resolved=$(getent hosts "$d" | awk '{print $1}' | head -n1 || true)
    if [[ -z "$resolved" ]]; then
        c_red "  $d → no DNS record found"
        die "Point an A record for $d to $PUBLIC_IP before continuing."
    fi
    if [[ -n "$PUBLIC_IP" && "$resolved" != "$PUBLIC_IP" ]]; then
        c_ylw "  $d → $resolved (does NOT match this server's IP $PUBLIC_IP)"
        c_ylw "  Continue anyway? [y/N]"
        read -r ans
        [[ "$ans" =~ ^[Yy]$ ]] || die "Aborting — fix DNS first."
    else
        c_grn "  $d → $resolved ✓"
    fi
done

# ─── 6. Volume / cert directories ─────────────────────────────────────────────
step "Creating host directories"
mkdir -p /etc/letsencrypt /var/lib/letsencrypt /var/www/certbot
chmod 755 /var/www/certbot

# ─── 7. Certbot — issue certs via standalone before nginx comes up ────────────
step "Issuing TLS certificates"
issue_cert() {
    local domain="$1"
    if [[ -d "/etc/letsencrypt/live/$domain" ]]; then
        c_grn "  Cert for $domain already exists — skipping issue."
        return 0
    fi
    c_blu "  Requesting cert for $domain"
    certbot certonly --standalone --non-interactive --agree-tos \
        --email "$LETSENCRYPT_EMAIL" \
        --preferred-challenges http \
        -d "$domain" \
        --rsa-key-size 4096
}

# Make sure nothing is bound to :80 before standalone certbot runs.
if ss -tlnp | awk '{print $4}' | grep -qE ":80$"; then
    c_ylw "Port 80 is in use; bringing nginx down first if running."
    docker compose down nginx 2>/dev/null || true
fi

issue_cert "$LITELLM_DOMAIN"
issue_cert "$LANGFUSE_DOMAIN"

# Cert auto-renewal: standard certbot.timer + a deploy hook to reload nginx.
cat >/etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh <<'HOOK'
#!/usr/bin/env bash
set -e
cd /opt/firmcraft/central-services 2>/dev/null || cd "$(dirname "$0")/../../../../"
docker compose exec -T nginx nginx -s reload || true
HOOK
chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh

# ─── 8. Bring the stack up ────────────────────────────────────────────────────
step "Pulling images"
docker compose pull

step "Starting stack"
docker compose up -d

# ─── 9. Health-check loop ─────────────────────────────────────────────────────
step "Waiting for services to become healthy"
wait_healthy() {
    local svc="$1" tries=60 i=0
    while (( i < tries )); do
        local status
        status=$(docker inspect -f '{{.State.Health.Status}}' "$svc" 2>/dev/null || echo "missing")
        case "$status" in
            healthy)  c_grn "  $svc → healthy ✓"; return 0 ;;
            unhealthy) c_red "  $svc → unhealthy"; docker compose logs --tail=50 "$svc"; return 1 ;;
            *)        printf "  %s → %s (waiting)\r" "$svc" "$status" ;;
        esac
        sleep 5
        ((i+=1))
    done
    c_red "  $svc never became healthy"
    docker compose logs --tail=80 "$svc"
    return 1
}

wait_healthy litellm-db
wait_healthy langfuse-db
wait_healthy litellm
wait_healthy langfuse
wait_healthy nginx

# External smoke tests.
step "External smoke tests"
curl -fsS "https://$LITELLM_DOMAIN/health/liveliness" >/dev/null && c_grn "  LiteLLM TLS endpoint reachable ✓" || c_red "  LiteLLM endpoint failed"
curl -fsS "https://$LANGFUSE_DOMAIN/api/public/health" >/dev/null && c_grn "  Langfuse TLS endpoint reachable ✓" || c_red "  Langfuse endpoint failed"

# ─── 10. Summary ──────────────────────────────────────────────────────────────
step "Summary"
cat <<EOF

  $(c_grn "Firmcraft central services are up.")

  Endpoints
    LiteLLM proxy : https://$LITELLM_DOMAIN
    Langfuse UI   : https://$LANGFUSE_DOMAIN

  Admin keys (from .env — keep these secret)
    LITELLM_MASTER_KEY  : $LITELLM_MASTER_KEY

  First-run actions
    1. Open https://$LANGFUSE_DOMAIN and create the admin user (signup is open).
       After creating the admin, set LANGFUSE_DISABLE_SIGNUP=true in .env and run:
         docker compose up -d langfuse
    2. In Langfuse → Settings → API Keys → Create.
       Paste the public + secret values into .env as LANGFUSE_PUBLIC_KEY / LANGFUSE_SECRET_KEY,
       then:  docker compose up -d litellm
    3. Mint a virtual key for your first app:
         curl -X POST https://$LITELLM_DOMAIN/key/generate \\
           -H "Authorization: Bearer $LITELLM_MASTER_KEY" \\
           -H "Content-Type: application/json" \\
           -d '{"models":["firmcraft-fast","firmcraft-standard"],"max_budget":25,"budget_duration":"30d"}'
    4. Verify routing:
         curl https://$LITELLM_DOMAIN/v1/chat/completions \\
           -H "Authorization: Bearer <virtual-key>" \\
           -H "Content-Type: application/json" \\
           -d '{"model":"firmcraft-fast","messages":[{"role":"user","content":"ping"}]}'

  Operations
    Tail logs    : docker compose logs -f
    Restart      : docker compose restart <service>
    Update       : docker compose pull && docker compose up -d
    Backup DBs   : docker exec litellm-db pg_dump -U \$LITELLM_DB_USER \$LITELLM_DB_NAME > litellm.sql
                   docker exec langfuse-db pg_dump -U \$LANGFUSE_DB_USER \$LANGFUSE_DB_NAME > langfuse.sql

EOF
