#!/usr/bin/env bash
#
# Firmcraft health beacon
# -----------------------
# Lightweight heartbeat that runs on each client's Hermes VPS via cron and POSTs
# a JSON health snapshot to the admin panel. Self-contained: only needs bash,
# docker, df/free, curl, and (optionally) python3 for parsing LiteLLM spend.
#
# Install:
#   sudo install -m 0755 health-beacon.sh /opt/firmcraft/health-beacon.sh
#   sudo install -d /opt/firmcraft
#   sudo tee /opt/firmcraft/health-beacon.env >/dev/null <<'EOF'
#   CLIENT_ID=<client uuid from the clients table>
#   BEACON_TOKEN=<shared secret>
#   # optional overrides:
#   # ADMIN_URL=https://admin.firmcraft.ai
#   # CONTAINER_NAME=hermes
#   # LITELLM_BASE_URL=https://llm.firmcraft.ai
#   # LITELLM_KEY=sk-...
#   EOF
#   sudo chmod 600 /opt/firmcraft/health-beacon.env
#   ( crontab -l 2>/dev/null; echo '*/5 * * * * /opt/firmcraft/health-beacon.sh >> /var/log/firmcraft-beacon.log 2>&1' ) | crontab -
#
# Config is read from (in order): this process's env, then the env file at
# $BEACON_ENV_FILE (default /opt/firmcraft/health-beacon.env).

set -uo pipefail

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
ENV_FILE="${BEACON_ENV_FILE:-/opt/firmcraft/health-beacon.env}"
if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  set -a; . "$ENV_FILE"; set +a
fi

ADMIN_URL="${ADMIN_URL:-https://admin.firmcraft.ai}"
CLIENT_ID="${CLIENT_ID:-}"
BEACON_TOKEN="${BEACON_TOKEN:-}"
CONTAINER_NAME="${CONTAINER_NAME:-}"

if [ -z "$CLIENT_ID" ] || [ -z "$BEACON_TOKEN" ]; then
  echo "[beacon] ERROR: CLIENT_ID and BEACON_TOKEN are required (set them in $ENV_FILE)" >&2
  exit 1
fi

now_iso() { date -u +%Y-%m-%dT%H:%M:%SZ; }

# ---------------------------------------------------------------------------
# JSON parsing helper (prefers python3, harmless no-op if absent)
# ---------------------------------------------------------------------------
HAS_PY=0
command -v python3 >/dev/null 2>&1 && HAS_PY=1

# json_get <json> <dotted.path> -> value or empty
json_get() {
  [ "$HAS_PY" -eq 1 ] || { echo ""; return; }
  python3 - "$2" <<'PY' 2>/dev/null
import sys, json
path = sys.argv[1].split(".")
try:
    data = json.load(sys.stdin)
except Exception:
    print(""); sys.exit(0)
cur = data
for p in path:
    if isinstance(cur, dict) and p in cur:
        cur = cur[p]
    else:
        print(""); sys.exit(0)
print("" if cur is None else cur)
PY
}

# ---------------------------------------------------------------------------
# Locate the Hermes container
# ---------------------------------------------------------------------------
if [ -z "$CONTAINER_NAME" ]; then
  CONTAINER_NAME="$(docker ps -a --format '{{.Names}}' 2>/dev/null | grep -iE 'hermes' | grep -viE 'db|postgres' | head -1)"
fi

CONTAINER_STATUS="stopped"   # running | stopped | restarting | unknown
UPTIME_HOURS=""
RESTART_COUNT=""
LAST_ACTIVITY=""
GATEWAY_STATE="unknown"      # connected | disconnected | unknown

if [ -n "$CONTAINER_NAME" ] && docker inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
  raw_status="$(docker inspect -f '{{.State.Status}}' "$CONTAINER_NAME" 2>/dev/null)"
  case "$raw_status" in
    running)    CONTAINER_STATUS="running" ;;
    restarting) CONTAINER_STATUS="restarting" ;;
    *)          CONTAINER_STATUS="stopped" ;;
  esac

  RESTART_COUNT="$(docker inspect -f '{{.RestartCount}}' "$CONTAINER_NAME" 2>/dev/null)"

  started="$(docker inspect -f '{{.State.StartedAt}}' "$CONTAINER_NAME" 2>/dev/null)"
  if [ -n "$started" ]; then
    s_epoch="$(date -d "$started" +%s 2>/dev/null)"
    if [ -n "$s_epoch" ]; then
      UPTIME_HOURS=$(( ( $(date +%s) - s_epoch ) / 3600 ))
      [ "$UPTIME_HOURS" -lt 0 ] && UPTIME_HOURS=0
    fi
  fi

  # Last activity = timestamp of the most recent container log line.
  log_ts="$(docker logs --timestamps --tail 1 "$CONTAINER_NAME" 2>/dev/null | awk '{print $1}' | head -1)"
  if [ -n "$log_ts" ]; then
    norm="$(date -u -d "$log_ts" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null)"
    [ -n "$norm" ] && LAST_ACTIVITY="$norm"
  fi

  # Gateway heuristic: a running container is assumed connected unless recent
  # logs show a genuine gateway/transport failure (websocket drop, refused
  # connection, explicit gateway-disconnect).
  #
  # NOTE: Google-OAuth token revocation (invalid_grant / token revoked /
  # RefreshError) is deliberately NOT matched here. It breaks COI/email but the
  # gateway itself stays connected (Telegram + LLM keep working), so matching it
  # produced false "Gateway disconnected" alarms (the token is revoked roughly
  # weekly — see runbook). Google auth is a separate concern tracked elsewhere.
  if [ "$CONTAINER_STATUS" = "running" ]; then
    recent_logs="$(docker logs --tail 60 "$CONTAINER_NAME" 2>&1)"
    if printf '%s' "$recent_logs" | grep -qiE 'websocket.*clos|gateway.*disconnect|ECONNREFUSED|connection refused'; then
      GATEWAY_STATE="disconnected"
    else
      GATEWAY_STATE="connected"
    fi
  else
    GATEWAY_STATE="disconnected"
  fi
fi

# ---------------------------------------------------------------------------
# Disk + memory
# ---------------------------------------------------------------------------
DISK_PERCENT="$(df -P / 2>/dev/null | awk 'END{gsub(/%/,"",$5); print $5}')"
MEMORY_PERCENT="$(free 2>/dev/null | awk '/^Mem:/{ if ($7 != "") { print int(($2-$7)/$2*100) } else { print int($3/$2*100) } }')"

# ---------------------------------------------------------------------------
# Token spend (best-effort via LiteLLM key/info). Optional — null if unavailable.
# ---------------------------------------------------------------------------
TOKEN_SPEND_TODAY=""
TOKEN_SPEND_MONTH=""

LITELLM_BASE_URL="${LITELLM_BASE_URL:-}"
LITELLM_KEY="${LITELLM_KEY:-}"

# Fall back to reading creds out of the container's own environment.
if { [ -z "$LITELLM_BASE_URL" ] || [ -z "$LITELLM_KEY" ]; } && [ -n "$CONTAINER_NAME" ]; then
  cenv="$(docker exec "$CONTAINER_NAME" printenv 2>/dev/null)"
  if [ -n "$cenv" ]; then
    [ -z "$LITELLM_BASE_URL" ] && LITELLM_BASE_URL="$(printf '%s\n' "$cenv" | grep -E '^(LITELLM_BASE_URL|OPENAI_BASE_URL|OPENAI_API_BASE)=' | head -1 | cut -d= -f2-)"
    [ -z "$LITELLM_KEY" ]      && LITELLM_KEY="$(printf '%s\n' "$cenv" | grep -E '^(LITELLM_API_KEY|LITELLM_KEY|OPENAI_API_KEY)=' | head -1 | cut -d= -f2-)"
  fi
fi

if [ -n "$LITELLM_BASE_URL" ] && [ -n "$LITELLM_KEY" ] && [ "$HAS_PY" -eq 1 ]; then
  base="${LITELLM_BASE_URL%/}"
  info="$(curl -fsS --max-time 10 "$base/key/info" -H "Authorization: Bearer $LITELLM_KEY" 2>/dev/null)"
  if [ -n "$info" ]; then
    spend="$(printf '%s' "$info" | json_get - info.spend)"
    case "$spend" in ''|*[!0-9.]*) ;; *) TOKEN_SPEND_MONTH="$spend" ;; esac
  fi
fi

# ---------------------------------------------------------------------------
# Build JSON payload (no jq dependency — emit fields, nulling empties)
# ---------------------------------------------------------------------------
HOSTNAME_VAL="$(hostname 2>/dev/null)"
AGENT_VERSION=""
[ -n "$CONTAINER_NAME" ] && AGENT_VERSION="$(docker inspect -f '{{index .Config.Image}}' "$CONTAINER_NAME" 2>/dev/null)"

# jnum: numeric value or null; jstr: quoted string or null
jnum() { case "$1" in ''|*[!0-9.-]*) printf 'null' ;; *) printf '%s' "$1" ;; esac; }
jstr() { [ -z "$1" ] && { printf 'null'; return; }; printf '"%s"' "$(printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g')"; }

PAYLOAD=$(cat <<JSON
{
  "client_id": $(jstr "$CLIENT_ID"),
  "reported_at": $(jstr "$(now_iso)"),
  "container_status": $(jstr "$CONTAINER_STATUS"),
  "container_uptime_hours": $(jnum "$UPTIME_HOURS"),
  "container_restart_count": $(jnum "$RESTART_COUNT"),
  "disk_percent": $(jnum "$DISK_PERCENT"),
  "memory_percent": $(jnum "$MEMORY_PERCENT"),
  "gateway_state": $(jstr "$GATEWAY_STATE"),
  "last_activity_at": $(jstr "$LAST_ACTIVITY"),
  "token_spend_today": $(jnum "$TOKEN_SPEND_TODAY"),
  "token_spend_month": $(jnum "$TOKEN_SPEND_MONTH"),
  "extra": {
    "hostname": $(jstr "$HOSTNAME_VAL"),
    "container_name": $(jstr "$CONTAINER_NAME"),
    "agent_version": $(jstr "$AGENT_VERSION")
  }
}
JSON
)

# ---------------------------------------------------------------------------
# POST to the admin panel
# ---------------------------------------------------------------------------
resp="$(curl -fsS --max-time 20 -X POST "${ADMIN_URL%/}/api/health/beacon" \
  -H "Authorization: Bearer $BEACON_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "$PAYLOAD" 2>&1)"
rc=$?

ts="$(now_iso)"
if [ $rc -eq 0 ]; then
  echo "[beacon] $ts ok status=$CONTAINER_STATUS gw=$GATEWAY_STATE disk=${DISK_PERCENT:-?}% mem=${MEMORY_PERCENT:-?}% -> $resp"
else
  echo "[beacon] $ts POST failed (rc=$rc): $resp" >&2
  exit 1
fi
