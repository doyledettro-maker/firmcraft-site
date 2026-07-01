#!/bin/bash
# Install the Bubble Watch weekly automation onto the Mac mini.
# Run this ON THE MAC MINI from a checkout of this repo/branch.
set -euo pipefail

SRC="$(cd "$(dirname "$0")/.." && pwd)"   # bubble-watch-automation/
BW="$HOME/source/predictium/Economics/bubble-watch"

[ -d "$BW" ] || { echo "ERROR: $BW not found — is this the Mac mini?"; exit 1; }

# 1. Drop the scripts into the bubble-watch pipeline
install -m 0755 "$SRC/pipeline/post_thread.py"   "$BW/pipeline/post_thread.py"
install -m 0755 "$SRC/pipeline/sanity_check.py"  "$BW/pipeline/sanity_check.py"
install -m 0755 "$SRC/scripts/run_weekly_full.sh" "$BW/scripts/run_weekly_full.sh"
echo "installed pipeline scripts into $BW"

# 2. Register the launchd job (Monday 08:00 local time)
PLIST_DST="$HOME/Library/LaunchAgents/com.predictium.bubble-watch.weekly.plist"
mkdir -p "$HOME/Library/LaunchAgents"
cp "$SRC/launchd/com.predictium.bubble-watch.weekly.plist" "$PLIST_DST"
launchctl bootout "gui/$(id -u)" "$PLIST_DST" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST_DST"
launchctl print "gui/$(id -u)/com.predictium.bubble-watch.weekly" | head -5
echo "launchd job registered: com.predictium.bubble-watch.weekly (Mon 08:00 local)"

echo
echo "Remaining manual steps:"
echo "  1. Set SLACK_WEBHOOK_URL (in the plist or shell profile) for alerts."
echo "  2. Verify timezone: sudo systemsetup -gettimezone  (must be America/Chicago)"
echo "  3. Dry-run first:  $BW/scripts/run_weekly_full.sh --dry-run"
echo "  4. After approval of the first thread, run without --dry-run once manually."
