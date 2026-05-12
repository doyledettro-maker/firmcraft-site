#!/usr/bin/env bash
# Firmcraft — Hermes agent upgrade
#
# Upgrades a Hermes agent install to the latest upstream code:
#   1. Backs up ~/.hermes/config.yaml (so the user's tuned config can never be lost)
#   2. git fetch + stash any local repo edits (e.g. our docker-compose.yml mounts)
#   3. git pull origin/main (or --ref TAG/BRANCH)
#   4. docker compose build --pull && up -d
#   5. Works around the skill-sync mkdir bug: scans early logs for missing
#      skill directories and pre-creates them on the host bind mount
#   6. Verifies config.yaml is byte-identical to the pre-upgrade backup; if
#      not, restores automatically.
#
# Usage (local):
#   ./upgrade-hermes.sh                          # dry-run, shows current vs. upstream
#   ./upgrade-hermes.sh --apply                  # back up + pull + rebuild + restart
#   ./upgrade-hermes.sh --apply --ref v1.4.0     # upgrade to a specific tag/branch
#
# Usage (remote, piped over SSH — recommended for client instances):
#   ssh root@CLIENT_IP 'bash -s -- --apply --yes' < upgrade-hermes.sh
#
# Usage (fleet — loop over an inventory file):
#   while read -r ip; do
#     echo "=== Upgrading $ip ==="
#     ssh root@$ip 'bash -s -- --apply --yes' < upgrade-hermes.sh
#   done < inventory.txt
#
# Flags:
#   --apply              Do the upgrade (otherwise dry-run, no changes)
#   --repo PATH          Override repo location (default: /opt/flex-pattern/hermes-agent)
#   --config PATH        Override config path (default: auto-detect ~/.hermes/config.yaml)
#   --ref REF            Tag or branch to check out instead of origin/main
#   --skip-skill-fix     Skip the post-up skill-sync mkdir workaround
#   --yes / -y           Skip the interactive confirmation prompt
#   --help / -h          Show this help text

set -euo pipefail

# ─── Defaults & CLI ───────────────────────────────────────────────────────────
APPLY=0
ASSUME_YES=0
SKIP_SKILL_FIX=0
REPO_PATH="/opt/flex-pattern/hermes-agent"
CONFIG_PATH=""
REF=""

usage() {
    sed -n '2,35p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --apply)           APPLY=1; shift ;;
        --yes|-y)          ASSUME_YES=1; shift ;;
        --skip-skill-fix)  SKIP_SKILL_FIX=1; shift ;;
        --repo)            REPO_PATH="$2"; shift 2 ;;
        --config)          CONFIG_PATH="$2"; shift 2 ;;
        --ref)             REF="$2"; shift 2 ;;
        --help|-h)         usage; exit 0 ;;
        *)                 echo "Unknown flag: $1" >&2; usage >&2; exit 2 ;;
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

# ─── 1. Pre-flight checks ─────────────────────────────────────────────────────
step "Pre-flight checks"

command -v docker >/dev/null 2>&1 || die "docker not installed"
docker compose version >/dev/null 2>&1 || die "docker compose plugin not installed (need v2)"
command -v git >/dev/null 2>&1 || die "git not installed"

[[ -d "$REPO_PATH" ]] || die "Hermes repo not found at: $REPO_PATH (override with --repo PATH)"
[[ -d "$REPO_PATH/.git" ]] || die "$REPO_PATH is not a git repo"
[[ -f "$REPO_PATH/docker-compose.yml" ]] || die "$REPO_PATH/docker-compose.yml not found — wrong directory?"

# Auto-detect config path if not provided
if [[ -z "$CONFIG_PATH" ]]; then
    for c in "/root/.hermes/config.yaml" "${HOME}/.hermes/config.yaml" "${HERMES_HOME:-}/config.yaml"; do
        [[ -n "$c" && -f "$c" ]] && { CONFIG_PATH="$c"; break; }
    done
fi
[[ -n "$CONFIG_PATH" && -f "$CONFIG_PATH" ]] || die "config.yaml not found (try --config /path/to/config.yaml)"

# Derive hermes home (skills bind-mount target) from the config path
HERMES_HOME="$(dirname "$CONFIG_PATH")"
SKILLS_DIR="${HERMES_HOME}/skills"

c_grn "✓ docker, docker compose, git all present"
c_blu "  repo:   $REPO_PATH"
c_blu "  config: $CONFIG_PATH"
c_blu "  hermes: $HERMES_HOME"

# Verify the repo has a remote (so 'git fetch' will mean something)
REMOTE_URL=$(git -C "$REPO_PATH" remote get-url origin 2>/dev/null || true)
[[ -n "$REMOTE_URL" ]] || die "repo has no 'origin' remote configured"
c_blu "  remote: $REMOTE_URL"

# ─── 2. Show current state ────────────────────────────────────────────────────
step "Current state"

CURRENT_VERSION=$(grep -E '^version\s*=' "$REPO_PATH/pyproject.toml" 2>/dev/null \
                  | head -1 | sed -E 's/.*"([^"]+)".*/\1/' || echo "unknown")
CURRENT_COMMIT=$(git -C "$REPO_PATH" rev-parse --short HEAD 2>/dev/null || echo "unknown")
CURRENT_BRANCH=$(git -C "$REPO_PATH" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
HAS_LOCAL_CHANGES=0
if ! git -C "$REPO_PATH" diff --quiet 2>/dev/null || ! git -C "$REPO_PATH" diff --cached --quiet 2>/dev/null; then
    HAS_LOCAL_CHANGES=1
fi

echo "  version:        $CURRENT_VERSION"
echo "  commit:         $CURRENT_COMMIT  ($CURRENT_BRANCH)"
echo -n "  local changes:  "
if [[ $HAS_LOCAL_CHANGES -eq 1 ]]; then
    c_ylw "yes (will be stashed during upgrade)"
    git -C "$REPO_PATH" status --short | sed 's/^/                    /'
else
    c_grn "none"
fi

# Container status
echo "  containers:"
( cd "$REPO_PATH" && docker compose ps --format 'table {{.Name}}\t{{.Image}}\t{{.Status}}' 2>/dev/null \
    | sed 's/^/    /' ) || echo "    (no containers running)"

# Image digest (the running images, not whatever is in the registry)
echo "  images:"
( cd "$REPO_PATH" && docker compose images --format 'table {{.Service}}\t{{.Repository}}\t{{.Tag}}\t{{.ID}}' 2>/dev/null \
    | sed 's/^/    /' ) || true

# ─── 3. Check upstream ────────────────────────────────────────────────────────
step "Upstream"

# Quiet fetch — even in dry-run, we need to know what's available
git -C "$REPO_PATH" fetch --all --tags --quiet 2>&1 | sed 's/^/  /' || c_ylw "  (fetch produced warnings — continuing)"

TARGET_REF="${REF:-origin/main}"
if ! git -C "$REPO_PATH" rev-parse --verify --quiet "$TARGET_REF" >/dev/null; then
    die "ref '$TARGET_REF' does not exist after fetch"
fi

UPSTREAM_COMMIT=$(git -C "$REPO_PATH" rev-parse --short "$TARGET_REF")
UPSTREAM_VERSION=$(git -C "$REPO_PATH" show "$TARGET_REF:pyproject.toml" 2>/dev/null \
                   | grep -E '^version\s*=' | head -1 | sed -E 's/.*"([^"]+)".*/\1/' || echo "unknown")
COMMITS_BEHIND=$(git -C "$REPO_PATH" rev-list --count "HEAD..$TARGET_REF" 2>/dev/null || echo "?")
LATEST_TAG=$(git -C "$REPO_PATH" describe --tags --abbrev=0 "$TARGET_REF" 2>/dev/null || echo "")

echo "  target ref:     $TARGET_REF"
echo "  target commit:  $UPSTREAM_COMMIT"
echo "  target version: $UPSTREAM_VERSION"
[[ -n "$LATEST_TAG" ]] && echo "  latest tag:     $LATEST_TAG"
echo "  commits behind: $COMMITS_BEHIND"

if [[ "$CURRENT_COMMIT" == "$UPSTREAM_COMMIT" ]]; then
    c_grn ""
    c_grn "Already at $TARGET_REF — nothing to upgrade."
    if [[ $APPLY -eq 0 ]]; then
        exit 0
    fi
    c_ylw "  --apply set anyway: will rebuild + restart to refresh containers."
fi

# ─── 4. Stop here if dry-run ──────────────────────────────────────────────────
if [[ $APPLY -eq 0 ]]; then
    c_ylw ""
    c_ylw "Dry-run mode — no changes made. Re-run with --apply to perform the upgrade."
    exit 0
fi

# Confirm if interactive and not --yes
if [[ -t 0 && $ASSUME_YES -eq 0 ]]; then
    echo
    read -r -p "Upgrade Hermes at $REPO_PATH from $CURRENT_COMMIT to $UPSTREAM_COMMIT? [y/N] " ans
    [[ "$ans" =~ ^[Yy]$ ]] || { c_ylw "Aborted."; exit 0; }
fi

# ─── 5. Backup config ─────────────────────────────────────────────────────────
step "Backing up config"
TS=$(date +%Y%m%d-%H%M%S)
CONFIG_BACKUP="${CONFIG_PATH}.bak-upgrade-${TS}"
cp -p "$CONFIG_PATH" "$CONFIG_BACKUP"
c_grn "✓ $CONFIG_BACKUP"

# ─── 6. Stash local changes ───────────────────────────────────────────────────
STASHED=0
if [[ $HAS_LOCAL_CHANGES -eq 1 ]]; then
    step "Stashing local repo changes"
    STASH_MSG="upgrade-hermes ${TS}"
    if git -C "$REPO_PATH" stash push --include-untracked -m "$STASH_MSG" >/dev/null; then
        STASHED=1
        c_grn "✓ stashed as: $STASH_MSG"
    else
        die "git stash failed — refusing to overwrite local changes"
    fi
fi

# ─── 7. Pull / checkout ───────────────────────────────────────────────────────
step "Updating repo to $TARGET_REF"
if [[ -n "$REF" ]]; then
    # Specific tag or branch — detach if tag, track if branch
    git -C "$REPO_PATH" checkout "$REF" 2>&1 | sed 's/^/  /'
    # If it's a branch (not a tag), pull to make sure we have the tip
    if git -C "$REPO_PATH" show-ref --verify --quiet "refs/heads/$REF" 2>/dev/null; then
        git -C "$REPO_PATH" pull --ff-only origin "$REF" 2>&1 | sed 's/^/  /' || true
    fi
else
    # Default: fast-forward main to origin/main
    git -C "$REPO_PATH" checkout main 2>&1 | sed 's/^/  /'
    git -C "$REPO_PATH" pull --ff-only origin main 2>&1 | sed 's/^/  /'
fi

NEW_COMMIT=$(git -C "$REPO_PATH" rev-parse --short HEAD)
NEW_VERSION=$(grep -E '^version\s*=' "$REPO_PATH/pyproject.toml" 2>/dev/null \
              | head -1 | sed -E 's/.*"([^"]+)".*/\1/' || echo "unknown")
c_grn "✓ now at $NEW_COMMIT (version $NEW_VERSION)"

# ─── 8. Pop stash ─────────────────────────────────────────────────────────────
if [[ $STASHED -eq 1 ]]; then
    step "Restoring stashed local changes"
    if git -C "$REPO_PATH" stash pop 2>&1 | sed 's/^/  /'; then
        c_grn "✓ stash applied cleanly"
    else
        c_ylw "stash pop reported conflicts — your local edits are still in 'git stash list'"
        c_ylw "  resolve manually after the upgrade, then drop the stash"
    fi
fi

# ─── 9. Rebuild & restart ─────────────────────────────────────────────────────
step "Rebuilding images"
( cd "$REPO_PATH" && docker compose build --pull ) 2>&1 | sed 's/^/  /'

step "Restarting containers"
( cd "$REPO_PATH" && docker compose up -d ) 2>&1 | sed 's/^/  /'

# ─── 10. Skill-sync mkdir workaround ──────────────────────────────────────────
SKILLS_CREATED=()
if [[ $SKIP_SKILL_FIX -eq 0 ]]; then
    step "Checking for skill-sync mkdir failures"
    echo "  waiting 10s for initial skill sync..."
    sleep 10

    # Pull recent logs and look for "No such file or directory" mentioning a skills path.
    # Strip ANSI color codes and use a permissive grep — Hermes log formats vary by version.
    LOG_SNAPSHOT=$( cd "$REPO_PATH" && docker compose logs --since 30s --no-color 2>&1 \
                    | sed -E 's/\x1b\[[0-9;]*[a-zA-Z]//g' || true )

    # Extract candidate container paths under /<anything>/.hermes/skills/...
    # from "No such file or directory: '<path>'" style messages.
    mapfile -t MISSING_PATHS < <(
        echo "$LOG_SNAPSHOT" \
            | grep -E "No such file or directory" \
            | grep -oE "[^'\"]*\.hermes/skills/[^'\"[:space:]]+" \
            | sort -u
    )

    if [[ ${#MISSING_PATHS[@]} -eq 0 ]]; then
        c_grn "✓ no skill-sync mkdir errors detected"
    else
        echo "  found ${#MISSING_PATHS[@]} skill path(s) missing:"
        for p in "${MISSING_PATHS[@]}"; do
            # Strip everything up through "/.hermes/skills/" to get the relative skill path
            rel="${p#*.hermes/skills/}"
            # Target the parent directory of the file (or the path itself if it ends in /)
            host_dir="$SKILLS_DIR/$(dirname "$rel")"
            if [[ ! -d "$host_dir" ]]; then
                mkdir -p "$host_dir"
                SKILLS_CREATED+=("$host_dir")
                c_blu "    created: $host_dir"
            fi
        done

        if [[ ${#SKILLS_CREATED[@]} -gt 0 ]]; then
            step "Restarting containers after skill dir fix"
            ( cd "$REPO_PATH" && docker compose restart ) 2>&1 | sed 's/^/  /'
            c_grn "✓ ${#SKILLS_CREATED[@]} dir(s) created, containers restarted"
        fi
    fi
fi

# ─── 11. Verify config survived ───────────────────────────────────────────────
step "Verifying config preservation"
if cmp -s "$CONFIG_PATH" "$CONFIG_BACKUP"; then
    c_grn "✓ config.yaml unchanged by upgrade (matches pre-upgrade backup)"
else
    c_red "config.yaml differs from pre-upgrade backup — upgrade overwrote tuned settings!"
    c_ylw "  diff (current vs. backup):"
    diff -u "$CONFIG_BACKUP" "$CONFIG_PATH" | sed 's/^/    /' || true
    c_ylw "  restoring from backup..."
    cp -p "$CONFIG_BACKUP" "$CONFIG_PATH"
    c_grn "  ✓ config restored from $CONFIG_BACKUP"
    step "Restarting containers to pick up restored config"
    ( cd "$REPO_PATH" && docker compose restart ) 2>&1 | sed 's/^/  /'
fi

# ─── 12. Final summary ────────────────────────────────────────────────────────
step "Done"
echo "  upgraded:       $CURRENT_COMMIT → $NEW_COMMIT"
echo "  version:        $CURRENT_VERSION → $NEW_VERSION"
echo "  config backup:  $CONFIG_BACKUP"
if [[ ${#SKILLS_CREATED[@]} -gt 0 ]]; then
    echo "  skill dirs created: ${#SKILLS_CREATED[@]}"
    for d in "${SKILLS_CREATED[@]}"; do echo "    $d"; done
else
    echo "  skill dirs:     no fixes needed"
fi
echo
echo "  container status:"
( cd "$REPO_PATH" && docker compose ps --format 'table {{.Name}}\t{{.Image}}\t{{.Status}}' 2>/dev/null \
    | sed 's/^/    /' ) || true

c_grn ""
c_grn "Upgrade complete. Tail logs to verify: docker compose -f $REPO_PATH/docker-compose.yml logs -f --tail 50"
exit 0
