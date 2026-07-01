# Bubble Watch — weekly automation

Automates the Monday Bubble Watch cycle: refresh data → sanity-gate → deploy
(Vercel via git push) → wait for live → build OG card → post a 5-tweet thread
to @PredictiumAI → record state (never double-post).

**These files were authored in a cloud session that could NOT reach the Mac
mini, the `Predictium_Front_End` repo, or `~/.openclaw/workspace/TOOLS.md`.**
They are written to be dropped onto the Mac mini next to the existing
pipeline. Install + first dry-run must happen there.

## Contents

| File | Purpose |
|---|---|
| `pipeline/post_thread.py` | Composes + posts the thread (stdlib-only OAuth 1.0a; `--dry-run` prints instead of posting; media-upload failure falls back to text-only + alert) |
| `pipeline/sanity_check.py` | Gate: value int 0–100, WoW change ≤ 15, CAPE 20–60; nonzero exit = stop, alert |
| `scripts/run_weekly_full.sh` | Full Monday sequence, per the runbook; `--dry-run` supported |
| `launchd/com.predictium.bubble-watch.weekly.plist` | Monday 08:00 (machine-local time) launchd job |
| `scripts/install_on_mac_mini.sh` | Copies scripts into `~/source/predictium/Economics/bubble-watch/` and registers the launchd job |

## Install (on the Mac mini)

```bash
git clone -b claude/bubble-watch-weekly-cron-8isojh <this repo> /tmp/bw-automation
/tmp/bw-automation/bubble-watch-automation/scripts/install_on_mac_mini.sh
```

Then:

1. **Slack alerts**: put the `#predictium-marketing` webhook into
   `SLACK_WEBHOOK_URL` (plist `EnvironmentVariables` or the shell profile).
2. **Twitter creds**: `post_thread.py` reads env vars
   `X_CONSUMER_KEY / X_CONSUMER_SECRET / X_ACCESS_TOKEN / X_ACCESS_TOKEN_SECRET`
   first, then best-effort parses the X/Twitter section of
   `~/.openclaw/workspace/TOOLS.md`. If the parse misses (unusual formatting),
   export the env vars — the script fails loudly, it never guesses.
3. **Timezone**: launchd fires in machine-local time; confirm the mini is on
   `America/Chicago`.
4. **Dry run** (prints the thread, pushes nothing, posts nothing):
   ```bash
   ~/source/predictium/Economics/bubble-watch/scripts/run_weekly_full.sh --dry-run
   ```
5. After the first thread is approved, run once without `--dry-run` manually.
   That first live run also answers the Free-tier media question: if the v1.1
   media upload is rejected, the script posts the thread **text-only** and
   alerts that Basic tier (~$100/mo) is needed for images — it never skips the
   thread just because the image failed.

## Safety properties

- **Idempotent**: `~/.openclaw/state/bubble-watch-last-posted.txt` holds the
  last posted `as_of`; a rerun for the same week exits early. The state file is
  written only after the whole thread posts.
- **Sanity gate before anything public**: bad value / >15 WoW jump / CAPE
  outside 20–60 / missing CAPE ⇒ no commit, no post, Slack alert, stop.
- **Honesty lint**: before posting, every tweet is checked for length (URL=23,
  emoji weighted) and banned framing (`we predict`, `N% chance`, `crash is
  coming`, …). Lint failure ⇒ no post, alert. The drawdown figure is always
  phrased as a historical base rate; the SaaS split is always labeled an
  editorial estimate.
- **Never invents numbers**: every figure comes from `summary.json` and the
  week's snapshot; a missing field aborts the post (dry-run shows a
  `⟨…unavailable⟩` placeholder instead).
- **Deploy-then-post**: the thread only goes out after the live
  `summary.json` shows the new `as_of` (10-min timeout ⇒ alert, stop).

## Weekly wording variation

Connective phrasing in tweets 1/2/4/5 rotates deterministically by `as_of`
hash, so threads don't read as a canned template while facts and honesty
framing stay fixed.
