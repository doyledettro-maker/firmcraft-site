#!/usr/bin/env bash
# Firmcraft — Hermes cost optimization
#
# Applies three cost-saving tweaks to a Hermes agent's config.yaml:
#   1. Compression model → claude-sonnet-4-6   (was: empty/auto, which falls back to the main chat model — usually Opus)
#   2. Compression threshold → 0.85            (was: 0.50, which compresses far too aggressively)
#   3. Prompt cache TTL → 5m                   (verified; left alone if already set)
#
# These targets the dominant cost on most Hermes instances: cache reads/writes
# driven by frequent compression cycles on an expensive primary model.
#
# Usage (local):
#   ./optimize-hermes-config.sh                       # dry-run, shows what would change
#   ./optimize-hermes-config.sh --apply               # back up + write changes
#   ./optimize-hermes-config.sh --apply --restart     # also restart the gateway (auto-detects docker/systemd)
#
# Usage (remote, piped over SSH — recommended for client instances):
#   ssh root@CLIENT_IP bash -s -- --apply --restart < optimize-hermes-config.sh
#
# Flags:
#   --apply            Write the changes (otherwise dry-run only)
#   --restart          Restart the Hermes gateway after applying
#   --config PATH      Override config path (default: auto-detect)
#   --yes              Skip the interactive confirmation prompt (useful for SSH piping)
#   --help             Show this help text

set -euo pipefail

# ─── Defaults & CLI ───────────────────────────────────────────────────────────
APPLY=0
RESTART=0
ASSUME_YES=0
CONFIG_PATH=""

usage() {
    sed -n '2,28p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --apply)   APPLY=1; shift ;;
        --restart) RESTART=1; shift ;;
        --yes|-y)  ASSUME_YES=1; shift ;;
        --config)  CONFIG_PATH="$2"; shift 2 ;;
        --help|-h) usage; exit 0 ;;
        *)         echo "Unknown flag: $1" >&2; usage >&2; exit 2 ;;
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

# ─── 1. Locate config.yaml ────────────────────────────────────────────────────
step "Locating Hermes config"

if [[ -n "$CONFIG_PATH" ]]; then
    [[ -f "$CONFIG_PATH" ]] || die "Config not found at: $CONFIG_PATH"
else
    CANDIDATES=(
        "/root/.hermes/config.yaml"
        "${HOME}/.hermes/config.yaml"
        "${HERMES_HOME:-}/config.yaml"
    )
    for c in "${CANDIDATES[@]}"; do
        [[ -n "$c" && -f "$c" ]] && { CONFIG_PATH="$c"; break; }
    done
    [[ -n "$CONFIG_PATH" ]] || die "Could not find config.yaml. Try: --config /path/to/config.yaml"
fi

c_blu "Found: $CONFIG_PATH"

# Need python3 for the YAML edit (line-walk preserves comments/formatting)
command -v python3 >/dev/null 2>&1 || die "python3 is required (apt-get install python3)"

# ─── 2. Show current vs. target ───────────────────────────────────────────────
step "Current settings"

python3 - "$CONFIG_PATH" <<'PY'
import re, sys
path = sys.argv[1]
lines = open(path).readlines()

def find_in_block(parent_re, key):
    """Find a key:value line inside the block headed by parent_re (matches at line start, any indent)."""
    in_block = False
    parent_indent = None
    for ln in lines:
        if not ln.strip() or ln.lstrip().startswith('#'):
            continue
        indent = len(ln) - len(ln.lstrip(' '))
        if in_block:
            if indent <= parent_indent and ln.strip().endswith(':'):
                # Left the block when we hit a same-or-lower indented sibling block
                in_block = False
            else:
                m = re.match(rf'^\s+{re.escape(key)}:\s*(.*?)\s*$', ln)
                if m and indent == parent_indent + 2:
                    return m.group(1)
        if not in_block and re.match(parent_re, ln):
            parent_indent = indent
            in_block = True
    return None

# Top-level `compression:` block
top_thresh = find_in_block(r'^compression:\s*$', 'threshold')
# `auxiliary:` → `compression:` (4-space indented)
aux_provider = aux_model = None
in_aux = False
in_aux_comp = False
for ln in lines:
    if re.match(r'^auxiliary:\s*$', ln):
        in_aux = True
        continue
    if in_aux and re.match(r'^[a-zA-Z_]', ln):
        in_aux = False  # left auxiliary block
        in_aux_comp = False
    if in_aux and re.match(r'^  compression:\s*$', ln):
        in_aux_comp = True
        continue
    if in_aux_comp:
        if re.match(r'^  [a-zA-Z_]', ln):
            in_aux_comp = False
        m = re.match(r'^    (provider|model):\s*(.*?)\s*$', ln)
        if m:
            if m.group(1) == 'provider': aux_provider = m.group(2)
            else: aux_model = m.group(2)

# prompt_caching.cache_ttl
cache_ttl = find_in_block(r'^prompt_caching:\s*$', 'cache_ttl')

print(f"  compression.threshold              = {top_thresh}")
print(f"  auxiliary.compression.provider     = {aux_provider}")
print(f"  auxiliary.compression.model        = {aux_model}")
print(f"  prompt_caching.cache_ttl           = {cache_ttl}")
PY

cat <<EOF

Target settings:
  compression.threshold              = 0.85
  auxiliary.compression.provider     = anthropic
  auxiliary.compression.model        = claude-sonnet-4-6
  prompt_caching.cache_ttl           = 5m
EOF

# ─── 3. Apply (or stop here if dry-run) ───────────────────────────────────────
if [[ $APPLY -eq 0 ]]; then
    c_ylw ""
    c_ylw "Dry-run mode — no changes made. Re-run with --apply to write."
    exit 0
fi

# Confirm if interactive and not --yes
if [[ -t 0 && $ASSUME_YES -eq 0 ]]; then
    echo
    read -r -p "Apply changes to $CONFIG_PATH? [y/N] " ans
    [[ "$ans" =~ ^[Yy]$ ]] || { c_ylw "Aborted."; exit 0; }
fi

step "Backing up"
TS=$(date +%Y%m%d-%H%M%S)
BACKUP="${CONFIG_PATH}.bak-${TS}"
cp -p "$CONFIG_PATH" "$BACKUP"
c_grn "Backup: $BACKUP"

step "Editing config"
# Line-walk editor preserves comments and formatting.
python3 - "$CONFIG_PATH" <<'PY'
import re, sys
path = sys.argv[1]
with open(path) as f:
    lines = f.readlines()

changed = []

def replace_value(line, key_pattern, new_value):
    """Replace the value of `key:` in *line*, preserving leading indent, key, trailing comment, and newline.
    Returns (new_line, old_value) or (None, None) if no match.
    """
    nl = '\n' if line.endswith('\n') else ''
    body = line.rstrip('\n')
    # Match: <indent+key:+spaces><value><optional trailing-space + comment>
    m = re.match(rf'^(\s*{key_pattern}:\s*)(\S.*?|)(\s*#.*)?$', body)
    if not m:
        return None, None
    prefix, old, trailing = m.group(1), m.group(2), (m.group(3) or '')
    return f"{prefix}{new_value}{trailing}{nl}", old

# (1) Top-level compression.threshold → 0.85
in_top_comp = False
for i, ln in enumerate(lines):
    if re.match(r'^compression:\s*$', ln):
        in_top_comp = True
        continue
    if in_top_comp and re.match(r'^[a-zA-Z_]', ln):
        in_top_comp = False
    if in_top_comp:
        new, old = replace_value(ln, 'threshold', '0.85')
        if new and old != '0.85':
            lines[i] = new
            changed.append(f"compression.threshold: {old} → 0.85")

# (2) auxiliary.compression.provider/model
in_aux = False
in_aux_comp = False
for i, ln in enumerate(lines):
    if re.match(r'^auxiliary:\s*$', ln):
        in_aux = True; continue
    if in_aux and re.match(r'^[a-zA-Z_]', ln):
        in_aux = False; in_aux_comp = False
    if in_aux and re.match(r'^  compression:\s*$', ln):
        in_aux_comp = True; continue
    if in_aux_comp and re.match(r'^  [a-zA-Z_]', ln):
        in_aux_comp = False
    if in_aux_comp:
        new, old = replace_value(ln, 'provider', 'anthropic')
        if new and old.strip("'\"") != 'anthropic':
            lines[i] = new
            changed.append(f"auxiliary.compression.provider: {old} → anthropic")
            continue
        new, old = replace_value(ln, 'model', 'claude-sonnet-4-6')
        if new and old.strip("'\"") != 'claude-sonnet-4-6':
            lines[i] = new
            changed.append(f"auxiliary.compression.model: {old} → claude-sonnet-4-6")

# (3) prompt_caching.cache_ttl → 5m (idempotent)
in_pc = False
saw_cache_ttl = False
for i, ln in enumerate(lines):
    if re.match(r'^prompt_caching:\s*$', ln):
        in_pc = True; continue
    if in_pc and re.match(r'^[a-zA-Z_]', ln):
        in_pc = False
    if in_pc:
        new, old = replace_value(ln, 'cache_ttl', '5m')
        if new:
            saw_cache_ttl = True
            if old.strip("'\"") != '5m':
                lines[i] = new
                changed.append(f"prompt_caching.cache_ttl: {old} → 5m")

if not saw_cache_ttl:
    # Insert cache_ttl line under prompt_caching block (or append a new block at end)
    inserted = False
    for i, ln in enumerate(lines):
        if re.match(r'^prompt_caching:\s*$', ln):
            lines.insert(i + 1, "  cache_ttl: 5m\n")
            changed.append("prompt_caching.cache_ttl: (missing) → 5m")
            inserted = True
            break
    if not inserted:
        lines.append("\nprompt_caching:\n  cache_ttl: 5m\n")
        changed.append("prompt_caching: (missing) — added with cache_ttl: 5m")

if not changed:
    print("NO_CHANGES")
else:
    with open(path, 'w') as f:
        f.writelines(lines)
    for c in changed:
        print(f"CHANGED {c}")
PY

# ─── 4. Show diff ─────────────────────────────────────────────────────────────
step "Diff"
if diff -u "$BACKUP" "$CONFIG_PATH"; then
    c_ylw "(no differences — config was already optimized)"
    # If nothing changed, the backup is redundant; remove it
    rm -f "$BACKUP"
fi

# ─── 5. Restart (optional) ────────────────────────────────────────────────────
if [[ $RESTART -eq 1 ]]; then
    step "Restarting Hermes gateway"
    if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' 2>/dev/null | grep -qx hermes; then
        docker restart hermes
        c_grn "✓ Docker container 'hermes' restarted"
    elif command -v systemctl >/dev/null 2>&1 && systemctl --user list-units --type=service 2>/dev/null | grep -q hermes-gateway; then
        systemctl --user restart hermes-gateway
        c_grn "✓ systemd unit 'hermes-gateway' restarted"
    elif pgrep -f 'hermes gateway run' >/dev/null 2>&1; then
        c_ylw "Hermes gateway process detected but no docker/systemd manager found."
        c_ylw "Restart it manually with the same command that started it."
    else
        c_ylw "No running Hermes gateway detected. Start it the usual way when ready."
    fi
else
    cat <<EOF

$(c_ylw "Note: changes will not take full effect until the gateway is restarted.")
  Docker:  docker restart hermes
  systemd: systemctl --user restart hermes-gateway

Or re-run this script with --restart to do it now.
EOF
fi

step "Done"
c_grn "Changes applied to $CONFIG_PATH"
if [[ -f "$BACKUP" ]]; then
    c_blu "Backup at $BACKUP (delete once you've verified the new config works)"
fi
exit 0
