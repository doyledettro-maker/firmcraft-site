# Firmcraft health monitor

Cron-friendly script that polls `admin.firmcraft.ai/api/health` and emails on
state transitions (up → down/degraded, recovery → up).

## Run locally

```sh
DRY_RUN=1 node infra/health-monitor/check-and-alert.mjs
```

## Production cron (every 5 min)

```cron
*/5 * * * * RESEND_API_KEY=re_xxx \
  ALERT_EMAIL=doyle.dettro@emergenext.com \
  STATE_FILE=/var/lib/firmcraft/health-state.json \
  /usr/bin/node /opt/firmcraft/infra/health-monitor/check-and-alert.mjs \
  >> /var/log/firmcraft-health.log 2>&1
```

## Env vars

| Var                | Required | Notes                                                                                  |
|--------------------|----------|----------------------------------------------------------------------------------------|
| `RESEND_API_KEY`   | yes¹     | Resend key for email send. ¹ Skips email silently if unset (Slack still fires).        |
| `ALERT_EMAIL`      | no       | Defaults to `doyle.dettro@emergenext.com`.                                             |
| `ALERT_FROM`       | no       | Defaults to `alerts@firmcraft.ai`.                                                     |
| `SLACK_WEBHOOK_URL`| no       | If set, also posts a brief message to Slack.                                           |
| `HEALTH_URL`       | no       | Override target. Defaults to `https://admin.firmcraft.ai/api/health`.                  |
| `STATE_FILE`       | no       | Persist last-seen status. Defaults to `/tmp/firmcraft-health-state.json`.              |
| `DRY_RUN`          | no       | If `1`, prints the alert payload but doesn’t send.                                     |

## Exit codes

- `0` — all up
- `1` — at least one service down (alert sent)
- `2` — could not reach health endpoint
