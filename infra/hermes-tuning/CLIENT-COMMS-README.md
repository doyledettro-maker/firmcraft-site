# Client communication — Hermes upgrade lifecycle

The pieces that go out to a client during a Hermes upgrade are deliberately
small: four email templates, a dashboard banner, and a tiny push tool to
move the banner state. This README is the playbook tying them together.

## The lifecycle

```
T-48h ──── T-0 ──── T+downtime ──── T+72h ─────►
  │         │            │              │
  │         │            │              └── upgrade-complete banner auto-hides
  │         │            │
  │         │            └── post-upgrade-confirmation email + upgrade-complete banner
  │         │
  │         └── maintenance-in-progress email + maintenance-in-progress banner
  │
  └── pre-upgrade-notice email + maintenance-scheduled banner
```

If anything goes sideways during the window, branch:

```
... ── T+downtime ──► rollback ──► emergency-rollback email + clear banners
```

## Step-by-step

### 1. 24–48h before maintenance — schedule it

Push the **scheduled** banner to the fleet:

```bash
cd hermes-theme/
cat > /tmp/notices.json <<'EOF'
{
  "notices": [{
    "id":          "upgrade-2026-05-14",
    "type":        "maintenance-scheduled",
    "title":       "Scheduled maintenance",
    "message":     "Hermes will be upgraded Wed May 14 at 9:00pm CT. About 5 minutes of downtime.",
    "starts_at":   "2026-05-14T21:00:00-05:00",
    "ends_at":     "2026-05-14T21:30:00-05:00",
    "created_at":  "2026-05-12T10:00:00-05:00",
    "dismissible": true
  }]
}
EOF
./push-notice.sh --inventory ./clients.txt --notices /tmp/notices.json --apply --yes
```

Send the email from `client-comms/pre-upgrade-notice.md`. Per-client placeholders:

| Placeholder              | Example                                                |
| ------------------------ | ------------------------------------------------------ |
| `{{CLIENT_NAME}}`        | `Sara`                                                 |
| `{{INSTANCE_NAME}}`      | `your Hermes operator` or `the Cardinal Plumbing agent`|
| `{{VERSION_FROM}}`       | `1.3.2`                                                |
| `{{VERSION_TO}}`         | `1.4.0`                                                |
| `{{MAINTENANCE_WINDOW}}` | `Wednesday May 14, 9:00pm – 9:30pm CT`                 |
| `{{DOWNTIME_ESTIMATE}}`  | `about 5 minutes`                                      |
| `{{NEW_FEATURES}}`       | A short bullet list, in client-friendly language       |
| `{{SUPPORT_EMAIL}}`      | `support@firmcraft.ai`                                 |
| `{{SENDER_NAME}}`        | `Doyle`                                                |

### 2. At the start of the maintenance window

Swap the banner to **in-progress** (same ID — replaces the scheduled banner;
won't fire a fresh dismissal):

```bash
cat > /tmp/notices.json <<'EOF'
{
  "notices": [{
    "id":         "upgrade-2026-05-14",
    "type":       "maintenance-in-progress",
    "title":      "Maintenance in progress",
    "message":    "We're upgrading the agent right now. Expected back by 9:30pm CT.",
    "created_at": "2026-05-14T21:00:00-05:00",
    "dismissible": false
  }]
}
EOF
./push-notice.sh --inventory ./clients.txt --notices /tmp/notices.json --apply --yes
```

Send `client-comms/maintenance-in-progress.md`. Then run the actual upgrade
(see `UPGRADE-README.md`):

```bash
while read -r ip; do
  echo "=== Upgrading $ip ==="
  ssh root@$ip 'bash -s -- --apply --yes' < upgrade-hermes.sh
done < clients.txt
```

### 3. Once the upgrade is healthy

Swap the banner to **upgrade-complete** (will auto-hide after 72 hours
based on `created_at`):

```bash
cat > /tmp/notices.json <<'EOF'
{
  "notices": [{
    "id":         "upgrade-complete-2026-05-14",
    "type":       "upgrade-complete",
    "title":      "Upgrade complete",
    "message":    "Hermes is running v1.4.0. Reload the page to pick up new features.",
    "created_at": "2026-05-14T21:22:00-05:00",
    "dismissible": true
  }]
}
EOF
./push-notice.sh --inventory ./clients.txt --notices /tmp/notices.json --apply --yes
```

Send `client-comms/post-upgrade-confirmation.md`. The banner will fade out
on its own three days later — no follow-up push needed.

### 4. If something goes wrong → rollback

If `upgrade-hermes.sh` auto-restored the config or you had to roll back code,
clear banners and send the rollback note:

```bash
./push-notice.sh --inventory ./clients.txt --clear --apply --yes
```

Send `client-comms/emergency-rollback.md`. Be honest, brief, and specific
about timeline. The script's config-preservation guarantees mean the data
side is always safe; the email should make that clear.

## Banner types reference

| Type                       | Color (palette token) | Use when                            | Auto-hides? |
| -------------------------- | --------------------- | ----------------------------------- | ----------- |
| `maintenance-scheduled`    | amber (`#D9A157`)     | 24–48h before maintenance starts    | no          |
| `maintenance-in-progress`  | terracotta (`#D97757`)| During the maintenance window       | no          |
| `upgrade-complete`         | sage (`#6B8E5A`)      | Post-upgrade, healthy               | yes — 72h   |
| `info`                     | slate (`#3F7A8C`)     | Anything else (one-off notes, etc.) | no          |

All four pull their colors from the warm palette defined in
`hermes-theme/firmcraft.yaml`. Banners are dismissible by default; users
who click `×` won't see that banner again on that browser (state lives in
`localStorage` under `firmcraft-notice-dismissed-<id>`).

## Notice schema

`notices.json` is an object with a single `notices` array. Multiple
notices stack top-to-bottom on the dashboard.

```jsonc
{
  "notices": [
    {
      "id":          "unique-id",                    // required — also the dismissal key
      "type":        "maintenance-scheduled",        // required — one of the four types above
      "title":       "Scheduled maintenance",        // optional — bolded prefix
      "message":     "Plain-text message body.",    // required
      "starts_at":   "2026-05-14T21:00:00-05:00",   // optional ISO 8601 — shown as meta
      "ends_at":     "2026-05-14T21:30:00-05:00",   // optional
      "created_at":  "2026-05-12T10:00:00-05:00",   // required for upgrade-complete auto-hide
      "dismissible": true                            // optional, default true
    }
  ]
}
```

Pushing an empty array (`{"notices": []}`) — or running
`./push-notice.sh --clear` — removes all banners on next poll.

## push-notice.sh in one paragraph

It SSHs to one or many hosts (one per line in an inventory file, `#`
comments allowed), validates `notices.json` is well-formed, and atomically
writes it to `/root/.hermes/plugins/firmcraft-brand/notices.json` on each
host. Atomic = write-to-`.tmp`-then-rename, so the dashboard's polling
fetch can never read a half-written file. Dry-run by default; pass
`--apply` to push. Failures are reported per-host at the end with a
copy-pasteable command to retry just the failed hosts.

```bash
# Standard fleet push
./push-notice.sh --inventory ./clients.txt --notices ./notices.json --apply

# Single host (override default ssh user too):
./push-notice.sh --host ops@1.2.3.4 --notices ./notices.json --apply --ssh-user ops

# Clear all banners on the fleet:
./push-notice.sh --inventory ./clients.txt --clear --apply
```

## How the plugin picks up the file

1. On page load, `firmcraft-brand` (the dashboard plugin) `fetch()`es
   `./notices.json` relative to its own script URL. With the standard
   `deploy.sh` layout that resolves to
   `/plugins/firmcraft-brand/notices.json`.
2. It re-fetches every 5 minutes, so a banner pushed during business
   hours appears on already-open dashboards within that window.
3. Each banner respects its dismissal flag (per-browser `localStorage`).
4. `upgrade-complete` banners check `created_at` against `now()`; if
   more than 72h have passed, the banner is filtered out before render.

## Tone guidelines for the emails

Firmcraft's writing voice is in the founder-letter mold:

- Warm and direct. Lead with the human, not the system.
- Specific, not corporate. "About 5 minutes of downtime" beats "a brief
  service interruption".
- Calm under pressure. The rollback email should feel like a steady hand,
  not a defensive shield.
- One CTA per email. Don't bury asks.
- Sign with a first name. Always.

The four templates already follow this voice — if you fork one, keep the
shape and just change the placeholders. If you need to add a fifth, model
it on the others.
