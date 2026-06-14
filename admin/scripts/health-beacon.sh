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

# ===========================================================================
# Security signals (post-incident upgrade). All best-effort: any probe that
# can't run leaves its field null/empty and the beacon still POSTs cleanly.
# ===========================================================================

# json_escape <string> -> JSON-safe (no surrounding quotes)
json_escape() { printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g; s/\t/ /g'; }

# --- P0: public listeners -------------------------------------------------
# Anything bound to 0.0.0.0 / :: / a non-loopback IP, excluding 22 and 443.
# Emits a JSON array of {port, bind_addr, proc}.
PUBLIC_LISTENERS_JSON="null"
collect_public_listeners() {
  local raw=""
  if command -v ss >/dev/null 2>&1; then
    raw="$(ss -tlnp 2>/dev/null)"
  elif command -v netstat >/dev/null 2>&1; then
    raw="$(netstat -tlnp 2>/dev/null)"
  fi
  [ -n "$raw" ] || return

  # Parse "<bind_addr>:<port>" out of the local-address column and the process
  # name out of the trailing users:(("name",...)) field. Loopback and the two
  # allowed ports are filtered out.
  PUBLIC_LISTENERS_JSON="$(printf '%s\n' "$raw" | awk '
    NR == 1 && /State|Proto/ { next }   # header line (ss prints one; netstat too)
    {
      laddr=""; proc="";
      # Find the local address: the column containing a ":" that is not the
      # peer/foreign one. For ss -tlnp it is column 4; for netstat column 4 too.
      laddr=$4;
      # process name (best effort)
      if (match($0, /users:\(\("[^"]+/)) {
        proc=substr($0, RSTART, RLENGTH);
        sub(/users:\(\("/, "", proc);
      } else if ($7 ~ /\//) {
        # netstat: pid/name
        split($7, a, "/"); proc=a[2];
      }
      # split bind_addr / port on the LAST colon (handles IPv6 [::]:port and
      # plain a.b.c.d:port).
      n=split(laddr, parts, ":");
      port=parts[n];
      bind=laddr; sub(":" port "$", "", bind);
      gsub(/[\[\]]/, "", bind);
      if (port !~ /^[0-9]+$/) next;
      if (port == 22 || port == 443) next;
      # public if bound to wildcard or a non-loopback address.
      is_public=0;
      if (bind == "0.0.0.0" || bind == "*" || bind == "::" || bind == "[::]") is_public=1;
      else if (bind ~ /^127\./ || bind == "::1") is_public=0;
      else is_public=1;
      if (!is_public) next;
      print port "\t" bind "\t" proc;
    }
  ' | sort -u | awk -F'\t' '
    BEGIN { printf "[" }
    {
      if (NR > 1) printf ",";
      gsub(/\\/, "\\\\", $3); gsub(/"/, "\\\"", $3);
      gsub(/\\/, "\\\\", $2); gsub(/"/, "\\\"", $2);
      procval = ($3 == "" ? "null" : "\"" $3 "\"");
      printf "{\"port\":%s,\"bind_addr\":\"%s\",\"proc\":%s}", $1, $2, procval;
    }
    END { printf "]" }
  ')"
  # An empty result is a valid (and good) signal: no public listeners.
  [ -n "$PUBLIC_LISTENERS_JSON" ] || PUBLIC_LISTENERS_JSON="[]"
}
collect_public_listeners

# --- P1a: CPU% + load average --------------------------------------------
CPU_PERCENT=""
CPU_CORES="$(nproc 2>/dev/null || getconf _NPROCESSORS_ONLN 2>/dev/null)"
LOAD_ONE=""; LOAD_FIVE=""; LOAD_FIFTEEN=""

if [ -r /proc/loadavg ]; then
  read -r LOAD_ONE LOAD_FIVE LOAD_FIFTEEN _ < /proc/loadavg 2>/dev/null
fi

# CPU% from two /proc/stat samples ~1s apart (busy delta / total delta).
if [ -r /proc/stat ]; then
  read -r _ u1 n1 s1 i1 w1 irq1 sirq1 st1 _ < /proc/stat 2>/dev/null
  sleep 1
  read -r _ u2 n2 s2 i2 w2 irq2 sirq2 st2 _ < /proc/stat 2>/dev/null
  if [ -n "${i2:-}" ] && [ -n "${i1:-}" ]; then
    busy1=$(( ${u1:-0} + ${n1:-0} + ${s1:-0} + ${irq1:-0} + ${sirq1:-0} + ${st1:-0} ))
    busy2=$(( ${u2:-0} + ${n2:-0} + ${s2:-0} + ${irq2:-0} + ${sirq2:-0} + ${st2:-0} ))
    tot1=$(( busy1 + ${i1:-0} + ${w1:-0} ))
    tot2=$(( busy2 + ${i2:-0} + ${w2:-0} ))
    dtot=$(( tot2 - tot1 ))
    dbusy=$(( busy2 - busy1 ))
    if [ "$dtot" -gt 0 ]; then
      CPU_PERCENT="$(awk -v b="$dbusy" -v t="$dtot" 'BEGIN{ printf "%.2f", (b/t)*100 }')"
    fi
  fi
fi
# Fallback: top -bn1 if /proc/stat sampling failed.
if [ -z "$CPU_PERCENT" ] && command -v top >/dev/null 2>&1; then
  idle="$(top -bn1 2>/dev/null | awk -F'[,%]+' '/Cpu\(s\)/{ for(i=1;i<=NF;i++) if($i ~ /id/){ gsub(/[^0-9.]/,"",$(i-1)); print $(i-1); exit } }')"
  case "$idle" in ''|*[!0-9.]*) ;; *) CPU_PERCENT="$(awk -v id="$idle" 'BEGIN{ printf "%.2f", 100-id }')" ;; esac
fi

# --- P1b: agent config integrity -----------------------------------------
# Read the container's config.yaml (docker exec, falling back to a host mount),
# hash it, and flag dangerous keys that grant code execution.
CONFIG_HASH=""
DANGEROUS_KEYS_JSON="null"
CONFIG_TEXT=""

if [ -n "$CONTAINER_NAME" ]; then
  for p in /opt/data/config.yaml /opt/data/hermes/config.yaml /app/config.yaml /config.yaml; do
    CONFIG_TEXT="$(docker exec "$CONTAINER_NAME" cat "$p" 2>/dev/null)"
    [ -n "$CONFIG_TEXT" ] && break
  done
fi
# Host-mounted fallback (common bind-mount locations).
if [ -z "$CONFIG_TEXT" ]; then
  for p in /opt/data/config.yaml /opt/flex-pattern/hermes-agent/config.yaml /opt/hermes/config.yaml; do
    if [ -r "$p" ]; then CONFIG_TEXT="$(cat "$p" 2>/dev/null)"; [ -n "$CONFIG_TEXT" ] && break; fi
  done
fi

if [ -n "$CONFIG_TEXT" ]; then
  if command -v sha256sum >/dev/null 2>&1; then
    CONFIG_HASH="$(printf '%s' "$CONFIG_TEXT" | sha256sum 2>/dev/null | awk '{print $1}')"
  elif command -v shasum >/dev/null 2>&1; then
    CONFIG_HASH="$(printf '%s' "$CONFIG_TEXT" | shasum -a 256 2>/dev/null | awk '{print $1}')"
  fi

  # A key is "dangerous" only if present AND non-empty (top-level YAML key with a
  # value, or a non-empty block/list under it).
  DANGEROUS_KEYS_JSON="$(printf '%s\n' "$CONFIG_TEXT" | awk '
    BEGIN { split("startup_hooks mcp_servers shell_hooks post_start_script", keys, " ") }
    {
      line=$0;
      # current top-level key (no leading space, "key:")
      if (line ~ /^[A-Za-z0-9_]+:/) {
        curkey=line; sub(/:.*/, "", curkey);
        # inline value on same line?
        rest=line; sub(/^[A-Za-z0-9_]+:[ \t]*/, "", rest);
        gsub(/[ \t\r]+$/, "", rest);
        inline[curkey]=(rest != "" && rest != "[]" && rest != "{}" && rest != "null" && rest != "~");
        haschild[curkey]=0;
      } else if (line ~ /^[ \t]+[^ \t#]/ && curkey != "") {
        # indented non-comment content under the current key
        haschild[curkey]=1;
      }
    }
    END {
      first=1; printf "[";
      for (i in keys) {
        k=keys[i];
        if (inline[k] || haschild[k]) {
          if (!first) printf ",";
          printf "\"%s\"", k; first=0;
        }
      }
      printf "]";
    }
  ')"
  [ -n "$DANGEROUS_KEYS_JSON" ] || DANGEROUS_KEYS_JSON="[]"
fi

# --- P2: outbound established endpoints -----------------------------------
# Dedup {ip,port} of ESTABLISHED outbound connections, excluding loopback,
# private ranges, and known-good destinations.
OUTBOUND_JSON="null"
ADMIN_HOST="$(printf '%s' "${ADMIN_URL#*://}" | cut -d/ -f1 | cut -d: -f1)"
LITELLM_HOST="$(printf '%s' "${LITELLM_BASE_URL#*://}" | cut -d/ -f1 | cut -d: -f1)"

if command -v ss >/dev/null 2>&1; then
  OUTBOUND_JSON="$(ss -tnp state established 2>/dev/null | awk '
    NR == 1 && /Peer|Address/ { next }
    {
      peer=$NF;
      # ss established layout: ... <local> <peer>. Peer is the last addr-like col.
      # find the column that is the remote endpoint (has a port via last colon)
      for (c=NF; c>=1; c--) { if ($c ~ /:[0-9]+$/) { peer=$c; break } }
      n=split(peer, parts, ":"); port=parts[n];
      ip=peer; sub(":" port "$", "", ip); gsub(/[\[\]]/, "", ip);
      if (port !~ /^[0-9]+$/) next;
      # exclude loopback / link-local / private ranges
      if (ip ~ /^127\./ || ip == "::1") next;
      if (ip ~ /^10\./) next;
      if (ip ~ /^192\.168\./) next;
      if (ip ~ /^172\.(1[6-9]|2[0-9]|3[0-1])\./) next;
      if (ip ~ /^169\.254\./) next;
      if (ip ~ /^fe80:/ || ip ~ /^fc/ || ip ~ /^fd/) next;
      print ip "\t" port;
    }
  ' | sort -u | awk -F'\t' -v admin="$ADMIN_HOST" -v litellm="$LITELLM_HOST" '
    BEGIN { printf "[" }
    {
      ip=$1; port=$2;
      # drop obvious known-good infra by IP/host where we have it; hostnames are
      # resolved server-side, so we keep endpoints and let IOC matching decide.
      if (ip == admin || ip == litellm) next;
      if (printed) printf ",";
      printf "{\"ip\":\"%s\",\"port\":%s}", ip, port;
      printed=1;
    }
    END { printf "]" }
  ')"
  [ -n "$OUTBOUND_JSON" ] || OUTBOUND_JSON="[]"
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
# jraw: pre-built JSON (array/object) or null if empty
jraw() { [ -z "$1" ] && { printf 'null'; return; }; printf '%s' "$1"; }

# load_avg object (null if we couldn't read any of it)
if [ -n "$LOAD_ONE$LOAD_FIVE$LOAD_FIFTEEN" ]; then
  LOAD_AVG_JSON="{\"one\":$(jnum "$LOAD_ONE"),\"five\":$(jnum "$LOAD_FIVE"),\"fifteen\":$(jnum "$LOAD_FIFTEEN")}"
else
  LOAD_AVG_JSON="null"
fi

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
  "public_listeners": $(jraw "$PUBLIC_LISTENERS_JSON"),
  "cpu_percent": $(jnum "$CPU_PERCENT"),
  "load_avg": $(jraw "$LOAD_AVG_JSON"),
  "cpu_cores": $(jnum "$CPU_CORES"),
  "config_hash": $(jstr "$CONFIG_HASH"),
  "dangerous_config_keys": $(jraw "$DANGEROUS_KEYS_JSON"),
  "outbound_remotes": $(jraw "$OUTBOUND_JSON"),
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
  pub_count="$(printf '%s' "$PUBLIC_LISTENERS_JSON" | grep -o '"port"' | wc -l | tr -d ' ')"
  echo "[beacon] $ts ok status=$CONTAINER_STATUS gw=$GATEWAY_STATE disk=${DISK_PERCENT:-?}% mem=${MEMORY_PERCENT:-?}% cpu=${CPU_PERCENT:-?}% load=${LOAD_ONE:-?} public_listeners=${pub_count:-0} -> $resp"
else
  echo "[beacon] $ts POST failed (rc=$rc): $resp" >&2
  exit 1
fi
