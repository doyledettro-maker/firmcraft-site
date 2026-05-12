#!/usr/bin/env bash
# deploy.sh — install the Firmcraft theme + plugin into a local Hermes instance.
#
# Usage:
#   ./deploy.sh                # install to ~/.hermes
#   HERMES_HOME=/opt/hermes ./deploy.sh
#
# This script is idempotent — re-running it overwrites the installed copy.

set -euo pipefail

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HERMES_HOME="${HERMES_HOME:-$HOME/.hermes}"

THEME_DEST="$HERMES_HOME/themes/firmcraft.yaml"
PLUGIN_DEST="$HERMES_HOME/plugins/firmcraft-brand"

echo "→ Firmcraft theme deployer"
echo "  source:       $SRC_DIR"
echo "  hermes home:  $HERMES_HOME"
echo

# ─── Pre-flight ──────────────────────────────────────────────────────
if [[ ! -f "$SRC_DIR/firmcraft.yaml" ]]; then
  echo "✗ firmcraft.yaml not found in $SRC_DIR" >&2
  exit 1
fi
if [[ ! -d "$SRC_DIR/plugin" ]]; then
  echo "✗ plugin/ directory not found in $SRC_DIR" >&2
  exit 1
fi

mkdir -p "$HERMES_HOME/themes"
mkdir -p "$HERMES_HOME/plugins"

# ─── Theme ───────────────────────────────────────────────────────────
echo "→ installing theme   → $THEME_DEST"
cp "$SRC_DIR/firmcraft.yaml" "$THEME_DEST"

# ─── Plugin ──────────────────────────────────────────────────────────
echo "→ installing plugin  → $PLUGIN_DEST"
rm -rf "$PLUGIN_DEST"
mkdir -p "$PLUGIN_DEST"
cp -R "$SRC_DIR/plugin/." "$PLUGIN_DEST/"

echo
echo "✓ Files in place."
echo
cat <<'INSTRUCTIONS'
─── Activate in Hermes ──────────────────────────────────────────────────

Add the following to ~/.hermes/config.yaml (or your Hermes config file):

    theme: firmcraft
    plugins:
      - firmcraft-brand

Then restart the Hermes service:

    hermes restart            # or your platform equivalent
    # systemctl --user restart hermes
    # launchctl kickstart -k gui/$(id -u)/com.hermes.dashboard

Hard-reload the dashboard in your browser (Cmd-Shift-R / Ctrl-Shift-F5)
to bypass the favicon cache — see "Known risks" in README.md.

─── Verification checklist (10 points) ──────────────────────────────────

After reload, walk through these in order:

  [ ]  1. Favicon shows the dark squircle with cream "F" (not the
          stock Hermes icon). Hard-reload if you still see the old icon.
  [ ]  2. Browser tab title reads "Firmcraft" (not "Hermes Dashboard").
  [ ]  3. Header-left shows the forge stamp (terracotta italic F in
          ink ring) followed by the "Firmcraft" wordmark.
  [ ]  4. Sidebar uses warm cream background; the active nav item
          has a terracotta left-edge stripe.
  [ ]  5. Login screen background is cream; card is white with warm
          border; heading uses Source Serif 4 italic.
  [ ]  6. Footer-right shows "Built by Firmcraft" with firmcraft.ai
          link styled in slate.
  [ ]  7. Primary buttons render in terracotta with white text;
          hover deepens to #C4623F.
  [ ]  8. Inline links render in slate (#3F7A8C); hover flips to ink.
  [ ]  9. Light mode is forced — toggling the OS to dark mode does
          not switch the dashboard to a dark palette.
  [ ] 10. The "Update" button is hidden anywhere it would normally
          appear (top bar, settings, modal headers).

If any point fails, see README.md → Troubleshooting.
INSTRUCTIONS
