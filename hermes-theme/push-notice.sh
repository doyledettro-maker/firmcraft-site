#!/usr/bin/env bash
# Firmcraft — push dashboard notices to client Hermes instances
#
# Updates /root/.hermes/plugins/firmcraft-brand/notices.json on one or many
# client agents. The Firmcraft dashboard plugin polls that file every 5
# minutes (and on page load), so banners appear without needing a restart.
#
# Usage (single host):
#   ./push-notice.sh --host root@CLIENT_IP --notices ./notices.json --apply
#
# Usage (fleet):
#   ./push-notice.sh --inventory ./clients.txt --notices ./notices.json --apply
#
# Clear all banners on a fleet (push an empty notices file):
#   ./push-notice.sh --inventory ./clients.txt --clear --apply
#
# Dry-run (default — shows what would happen, no changes):
#   ./push-notice.sh --inventory ./clients.txt --notices ./notices.json
#
# Flags:
#   --host HOST          Single SSH target (e.g. root@1.2.3.4 or just 1.2.3.4)
#   --inventory FILE     File with one host per line; '#' lines and blanks skipped
#   --notices FILE       Local notices.json to push (default: ./notices.json)
#   --remote-path PATH   Destination on the client
#                        (default: /root/.hermes/plugins/firmcraft-brand/notices.json)
#   --ssh-user USER      Default SSH user when host has no 'user@' prefix (default: root)
#   --clear              Ignore --notices and push an empty {"notices": []}
#   --apply              Actually push (otherwise dry-run only)
#   --yes / -y           Skip confirmation prompt
#   --help / -h          Show this help

set -euo pipefail

# ─── Defaults & CLI ───────────────────────────────────────────────────────────
APPLY=0
ASSUME_YES=0
CLEAR=0
HOST=""
INVENTORY=""
NOTICES_FILE="./notices.json"
REMOTE_PATH="/root/.hermes/plugins/firmcraft-brand/notices.json"
SSH_USER="root"

usage() {
    sed -n '2,30p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --host)         HOST="$2"; shift 2 ;;
        --inventory)    INVENTORY="$2"; shift 2 ;;
        --notices)      NOTICES_FILE="$2"; shift 2 ;;
        --remote-path)  REMOTE_PATH="$2"; shift 2 ;;
        --ssh-user)     SSH_USER="$2"; shift 2 ;;
        --clear)        CLEAR=1; shift ;;
        --apply)        APPLY=1; shift ;;
        --yes|-y)       ASSUME_YES=1; shift ;;
        --help|-h)      usage; exit 0 ;;
        *)              echo "Unknown flag: $1" >&2; usage >&2; exit 2 ;;
    esac
done

# ─── Output helpers ───────────────────────────────────────────────────────────
if [[ -t 1 ]]; then
    c_red()  { printf "\033[31m%s\033[0m\n" "$*"; }
    c_grn()  { printf "\033[32m%s\033[0m\n" "$*"; }
    c_ylw()  { printf "\033[33m%s\033[0m\n" "$*"; }
    c_blu()  { printf "\033[36m%s\033[0m\n" "$*"; }
    bold()   { printf "\033[1m%s\033[0m\n" "$*"; }
else
    c_red()  { printf "%s\n" "$*"; }
    c_grn()  { printf "%s\n" "$*"; }
    c_ylw()  { printf "%s\n" "$*"; }
    c_blu()  { printf "%s\n" "$*"; }
    bold()   { printf "%s\n" "$*"; }
fi
step() { printf "\n"; bold "▶ $*"; }
die()  { c_red "ERROR: $*" >&2; exit 1; }

# ─── 1. Pre-flight ────────────────────────────────────────────────────────────
step "Pre-flight"

command -v ssh >/dev/null 2>&1 || die "ssh not installed"

[[ -n "$HOST" || -n "$INVENTORY" ]] || die "must specify --host or --inventory"
[[ -n "$HOST" && -n "$INVENTORY" ]] && die "specify exactly one of --host / --inventory, not both"

# Build the host list
HOSTS=()
if [[ -n "$HOST" ]]; then
    HOSTS=("$HOST")
else
    [[ -f "$INVENTORY" ]] || die "inventory not found: $INVENTORY"
    while IFS= read -r line || [[ -n "$line" ]]; do
        line="${line%%#*}"                  # strip inline comments
        line="$(echo "$line" | tr -d '[:space:]')"
        [[ -z "$line" ]] && continue
        HOSTS+=("$line")
    done < "$INVENTORY"
    [[ ${#HOSTS[@]} -gt 0 ]] || die "inventory $INVENTORY is empty"
fi

# Normalize: prepend $SSH_USER@ if the host doesn't already have a user
NORM_HOSTS=()
for h in "${HOSTS[@]}"; do
    if [[ "$h" == *@* ]]; then
        NORM_HOSTS+=("$h")
    else
        NORM_HOSTS+=("${SSH_USER}@${h}")
    fi
done

c_blu "  hosts:        ${#NORM_HOSTS[@]}"
for h in "${NORM_HOSTS[@]}"; do echo "    - $h"; done
c_blu "  remote path:  $REMOTE_PATH"

# ─── 2. Resolve / validate the payload ────────────────────────────────────────
step "Payload"

PAYLOAD_FILE=""
CLEANUP_PAYLOAD=0
if [[ $CLEAR -eq 1 ]]; then
    PAYLOAD_FILE=$(mktemp -t firmcraft-clear-notices.XXXXXX.json)
    CLEANUP_PAYLOAD=1
    printf '{"notices": []}\n' > "$PAYLOAD_FILE"
    c_ylw "  --clear set: pushing empty notices ({\"notices\": []})"
else
    [[ -f "$NOTICES_FILE" ]] || die "notices file not found: $NOTICES_FILE"
    PAYLOAD_FILE="$NOTICES_FILE"
    c_blu "  source:       $NOTICES_FILE"
fi

# Validate JSON. Prefer python3 (richer error), fall back to grep-level sanity.
if command -v python3 >/dev/null 2>&1; then
    python3 -c "import json,sys; data=json.load(open(sys.argv[1])); \
                assert isinstance(data, dict) and isinstance(data.get('notices', []), list), \
                'top-level must be an object with a \"notices\" array'" \
        "$PAYLOAD_FILE" \
        || die "notices file is not valid JSON (or has the wrong shape)"
    NOTICE_COUNT=$(python3 -c "import json,sys; print(len(json.load(open(sys.argv[1])).get('notices',[])))" "$PAYLOAD_FILE")
else
    grep -q '"notices"' "$PAYLOAD_FILE" || die "no \"notices\" key in $PAYLOAD_FILE"
    NOTICE_COUNT="?"
fi
c_grn "  ✓ valid JSON, $NOTICE_COUNT notice(s)"

# Show the payload preview
echo "  preview:"
sed -e 's/^/    /' "$PAYLOAD_FILE" | head -30

cleanup() { [[ $CLEANUP_PAYLOAD -eq 1 && -n "$PAYLOAD_FILE" && -f "$PAYLOAD_FILE" ]] && rm -f "$PAYLOAD_FILE"; }
trap cleanup EXIT

# ─── 3. Dry-run? ──────────────────────────────────────────────────────────────
if [[ $APPLY -eq 0 ]]; then
    c_ylw ""
    c_ylw "Dry-run mode — no changes pushed. Re-run with --apply to push to ${#NORM_HOSTS[@]} host(s)."
    exit 0
fi

# Confirm if interactive and not --yes
if [[ -t 0 && $ASSUME_YES -eq 0 ]]; then
    echo
    read -r -p "Push to ${#NORM_HOSTS[@]} host(s)? [y/N] " ans
    [[ "$ans" =~ ^[Yy]$ ]] || { c_ylw "Aborted."; exit 0; }
fi

# ─── 4. Push ──────────────────────────────────────────────────────────────────
step "Pushing"

OK_COUNT=0
FAIL_COUNT=0
FAILED_HOSTS=()
REMOTE_DIR=$(dirname "$REMOTE_PATH")

for h in "${NORM_HOSTS[@]}"; do
    printf "  %-32s ... " "$h"
    # ssh once: mkdir the parent dir, then atomically replace the file by
    # writing to .tmp and renaming. Atomic rename means the plugin can never
    # read a half-written file mid-fetch.
    if ssh -o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new "$h" \
        "mkdir -p '$REMOTE_DIR' && cat > '${REMOTE_PATH}.tmp' && mv '${REMOTE_PATH}.tmp' '$REMOTE_PATH'" \
        < "$PAYLOAD_FILE" 2>/dev/null; then
        c_grn "ok"
        OK_COUNT=$((OK_COUNT + 1))
    else
        c_red "failed"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        FAILED_HOSTS+=("$h")
    fi
done

# ─── 5. Summary ───────────────────────────────────────────────────────────────
step "Summary"
echo "  pushed:  $OK_COUNT / ${#NORM_HOSTS[@]}"
if [[ $FAIL_COUNT -gt 0 ]]; then
    c_red "  failed: $FAIL_COUNT"
    for h in "${FAILED_HOSTS[@]}"; do echo "    - $h"; done
    c_ylw ""
    c_ylw "Re-run with just the failed hosts:"
    c_ylw "  printf '%s\\n' ${FAILED_HOSTS[*]} > failed.txt"
    c_ylw "  ./push-notice.sh --inventory failed.txt --notices $NOTICES_FILE --apply --yes"
    exit 1
fi

c_grn ""
c_grn "All hosts updated. Banners appear on next dashboard poll (≤5 min) or immediate page reload."
exit 0
