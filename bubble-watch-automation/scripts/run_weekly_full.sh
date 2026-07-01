#!/bin/bash
# Bubble Watch — full weekly cycle: data refresh -> sanity gate -> deploy ->
# wait for Vercel -> tweet image -> post thread -> record state.
#
# Designed to run from launchd/cron on the Mac mini every Monday 08:00 CT.
# Safety posture: a missed week is fine, a wrong public post is not — any
# failed check alerts #predictium-marketing (SLACK_WEBHOOK_URL) and stops.
#
# Flags:
#   --dry-run   run everything except git push and the actual posting;
#               the composed thread is printed for review.

set -euo pipefail

BW="$HOME/source/predictium/Economics/bubble-watch"
FE="$HOME/source/predictium/40pfrom3/frontend"
SUMMARY="$FE/public/data/bubble-watch/summary.json"
STATE_FILE="$HOME/.openclaw/state/bubble-watch-last-posted.txt"
LIVE_SUMMARY="https://www.predictium.ai/data/bubble-watch/summary.json"
PIPE_DIR="$(cd "$(dirname "$0")/../pipeline" && pwd)"
LOG_DIR="$BW/logs"
mkdir -p "$LOG_DIR" "$(dirname "$STATE_FILE")"
LOG="$LOG_DIR/weekly-$(date +%Y-%m-%d-%H%M%S).log"
exec > >(tee -a "$LOG") 2>&1

DRY_RUN=0
[ "${1:-}" = "--dry-run" ] && DRY_RUN=1

alert() {
  echo "[ALERT] $*" >&2
  if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
    curl -s -m 15 -X POST -H 'Content-Type: application/json' \
      -d "{\"text\":\":rotating_light: Bubble Watch weekly run: $*\"}" \
      "$SLACK_WEBHOOK_URL" >/dev/null || true
  fi
}
trap 'alert "run failed at line $LINENO (see $LOG)"' ERR

echo "=== Bubble Watch weekly run $(date) (dry_run=$DRY_RUN) ==="

# capture last week's Index BEFORE phase 1 overwrites summary.json
PREV_VALUE=""
[ -f "$SUMMARY" ] && PREV_VALUE=$(jq -r '.value // empty' "$SUMMARY")

# ---- 1. Phase 1: fetch FRED + CAPE, recompute, write snapshot/summary/archive
cd "$BW"
RUNNER_OUT=$(./scripts/run_weekly.sh 2>&1) || { echo "$RUNNER_OUT"; alert "run_weekly.sh failed"; exit 1; }
echo "$RUNNER_OUT"

AS_OF=$(jq -r '.as_of' "$SUMMARY")
echo "as_of: $AS_OF"

# idempotency: never double-post a week
if [ -f "$STATE_FILE" ] && [ "$(cat "$STATE_FILE")" = "$AS_OF" ]; then
  echo "already posted for $AS_OF — nothing to do"
  exit 0
fi

# ---- 2. Sanity gate (never deploy/post on bad data)
# CAPE as printed by the runner; adjust the pattern if run_weekly.sh output changes
CAPE=$(echo "$RUNNER_OUT" | grep -ioE 'CAPE[^0-9]*[0-9]+(\.[0-9]+)?' | grep -oE '[0-9]+(\.[0-9]+)?' | head -1 || true)
python3 "$PIPE_DIR/sanity_check.py" --summary "$SUMMARY" \
  ${PREV_VALUE:+--prev-value "$PREV_VALUE"} ${CAPE:+--cape "$CAPE"} \
  || { alert "sanity check failed for $AS_OF — NOT deploying, NOT posting (see $LOG)"; exit 1; }

# ---- 3. Deploy: commit + push frontend so Vercel rebuilds
cd "$FE"
git add content/bubble-watch public/data/bubble-watch
if git diff --cached --quiet; then
  echo "no data changes to commit (already deployed?)"
else
  git commit -m "bubble-watch: weekly snapshot $AS_OF"
  if [ "$DRY_RUN" = 1 ]; then
    echo "[dry-run] would push:"; git log --oneline -1
    git reset --soft HEAD~1
  else
    ok=0
    for delay in 0 2 4 8 16; do
      sleep "$delay"
      git push && { ok=1; break; }
    done
    [ "$ok" = 1 ] || { alert "git push failed after retries for $AS_OF"; exit 1; }
  fi
fi

# ---- 4. Wait for the deploy to go live (~2-4 min, 10 min timeout)
if [ "$DRY_RUN" = 0 ]; then
  deadline=$(( $(date +%s) + 600 ))
  until [ "$(curl -s -m 20 "$LIVE_SUMMARY" | jq -r '.as_of' 2>/dev/null)" = "$AS_OF" ]; do
    if [ "$(date +%s)" -ge "$deadline" ]; then
      alert "deploy for $AS_OF not live after 10 min — thread NOT posted"
      exit 1
    fi
    sleep 20
  done
  echo "deploy live: $AS_OF"
fi

# ---- 5. Build the tweet image (branded 1200x630 OG card)
cd "$BW"
python3 -m pipeline.prepare_tweet
IMAGE="$BW/_tweet/bubble-watch-$AS_OF.png"
[ -f "$IMAGE" ] || { alert "tweet image $IMAGE was not produced"; [ "$DRY_RUN" = 1 ] || exit 1; }

# ---- 6+7. Compose + post the 5-tweet thread; state file written on success
POST_ARGS=(--snapshot "$FE/content/bubble-watch/$AS_OF.json" --state-file "$STATE_FILE")
[ -f "$IMAGE" ] && POST_ARGS+=(--image "$IMAGE")
if [ "$DRY_RUN" = 1 ]; then
  python3 "$PIPE_DIR/post_thread.py" --dry-run --summary "$SUMMARY" "${POST_ARGS[@]}"
else
  python3 "$PIPE_DIR/post_thread.py" --summary "$LIVE_SUMMARY" "${POST_ARGS[@]}" \
    || { alert "thread posting failed for $AS_OF (see $LOG)"; exit 1; }
fi

echo "=== done $(date) ==="
