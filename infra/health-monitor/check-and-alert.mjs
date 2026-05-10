#!/usr/bin/env node
/**
 * Firmcraft health-monitor: check every public service, alert on failure.
 *
 * Usage (cron-friendly):
 *   ALERT_EMAIL=doyle.dettro@emergenext.com \
 *   RESEND_API_KEY=re_xxx \
 *   node infra/health-monitor/check-and-alert.mjs
 *
 * Optional env:
 *   STATE_FILE        Path to persist last-seen status (defaults to /tmp/firmcraft-health-state.json).
 *                     Used to suppress duplicate alerts and recover-notify.
 *   SLACK_WEBHOOK_URL If set, also posts to Slack.
 *   ALERT_FROM        From-address for Resend (defaults to alerts@firmcraft.ai).
 *   HEALTH_URL        Override health endpoint (defaults to https://admin.firmcraft.ai/api/health).
 *   DRY_RUN           If "1", print the alert payload and skip sending.
 *
 * Exit codes:
 *   0 = all services up (or all degraded/recovered notifications dispatched cleanly)
 *   1 = one or more services down
 *   2 = could not reach health endpoint
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const HEALTH_URL = process.env.HEALTH_URL || 'https://admin.firmcraft.ai/api/health'
const ALERT_EMAIL = process.env.ALERT_EMAIL || 'doyle.dettro@emergenext.com'
const ALERT_FROM = process.env.ALERT_FROM || 'alerts@firmcraft.ai'
const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || ''
const STATE_FILE = process.env.STATE_FILE || '/tmp/firmcraft-health-state.json'
const DRY_RUN = process.env.DRY_RUN === '1'

function log(msg, extra) {
  const ts = new Date().toISOString()
  if (extra !== undefined) {
    console.log(`[${ts}] ${msg}`, extra)
  } else {
    console.log(`[${ts}] ${msg}`)
  }
}

function loadState() {
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf8'))
  } catch {
    return {}
  }
}

function saveState(state) {
  try {
    mkdirSync(dirname(STATE_FILE), { recursive: true })
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
  } catch (err) {
    log('warning: could not persist state', err.message)
  }
}

async function fetchHealth() {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), 15_000)
  try {
    const res = await fetch(HEALTH_URL, {
      signal: controller.signal,
      headers: { 'user-agent': 'firmcraft-health-monitor/1.0' },
    })
    const text = await res.text()
    let json
    try {
      json = JSON.parse(text)
    } catch {
      throw new Error(`Non-JSON response from ${HEALTH_URL} (status ${res.status})`)
    }
    return json
  } finally {
    clearTimeout(t)
  }
}

async function sendResendEmail(subject, html) {
  if (!RESEND_API_KEY) {
    log('skipping email: RESEND_API_KEY not set')
    return
  }
  if (DRY_RUN) {
    log('DRY_RUN: would email', { to: ALERT_EMAIL, subject })
    return
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: ALERT_FROM,
      to: [ALERT_EMAIL],
      subject,
      html,
    }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    log(`email send failed: ${res.status} ${body}`)
  } else {
    log(`email sent: ${subject}`)
  }
}

async function sendSlack(text) {
  if (!SLACK_WEBHOOK_URL) return
  if (DRY_RUN) {
    log('DRY_RUN: would slack', text)
    return
  }
  await fetch(SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text }),
  }).catch((err) => log(`slack post failed: ${err.message}`))
}

function buildAlertHtml({ down, degraded, checkedAt }) {
  const rows = (services, tone) =>
    services
      .map(
        (s) =>
          `<tr>
            <td style="padding:6px 12px 6px 0;font-weight:600;color:${tone};">${s.name}</td>
            <td style="padding:6px 12px;color:#5A4533;">${escapeHtml(s.description || '')}</td>
            <td style="padding:6px 0;color:#8A7560;font-family:monospace;font-size:12px;">${escapeHtml(s.error || s.httpStatus || '')}</td>
          </tr>`,
      )
      .join('')

  return `
    <div style="font-family:system-ui,sans-serif;max-width:560px;color:#2D1F14;">
      <h2 style="margin:0 0 12px;font-size:20px;">Firmcraft service alert</h2>
      <p style="margin:0 0 16px;color:#5A4533;">Checked at ${escapeHtml(checkedAt)}.</p>
      ${
        down.length
          ? `<h3 style="margin:16px 0 8px;color:#8A2A12;">Down (${down.length})</h3><table cellpadding="0" cellspacing="0">${rows(down, '#8A2A12')}</table>`
          : ''
      }
      ${
        degraded.length
          ? `<h3 style="margin:16px 0 8px;color:#7A5215;">Degraded (${degraded.length})</h3><table cellpadding="0" cellspacing="0">${rows(degraded, '#7A5215')}</table>`
          : ''
      }
      <p style="margin:24px 0 0;font-size:13px;color:#8A7560;">
        Status page: <a href="https://admin.firmcraft.ai/status" style="color:#2D1F14;">admin.firmcraft.ai/status</a>
      </p>
    </div>
  `
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function main() {
  let health
  try {
    health = await fetchHealth()
  } catch (err) {
    log(`could not reach ${HEALTH_URL}: ${err.message}`)
    await sendResendEmail(
      '[Firmcraft] Health endpoint unreachable',
      `<p>Could not reach <code>${HEALTH_URL}</code>: ${escapeHtml(err.message)}</p>`,
    )
    await sendSlack(`:rotating_light: Firmcraft health endpoint unreachable: ${err.message}`)
    process.exit(2)
  }

  const services = Array.isArray(health?.services) ? health.services : []
  const down = services.filter((s) => s.status === 'down')
  const degraded = services.filter((s) => s.status === 'degraded')
  const up = services.filter((s) => s.status === 'up')

  log(`overall=${health.overall} up=${up.length} degraded=${degraded.length} down=${down.length}`)

  const prev = loadState()
  const next = {}
  for (const s of services) next[s.id] = s.status

  // Detect transitions to alert on.
  const newlyDown = down.filter((s) => prev[s.id] !== 'down')
  const recovered = services.filter(
    (s) => s.status === 'up' && (prev[s.id] === 'down' || prev[s.id] === 'degraded'),
  )

  if (newlyDown.length > 0 || (degraded.length > 0 && degraded.some((s) => prev[s.id] !== 'degraded'))) {
    const subject = newlyDown.length
      ? `[Firmcraft] ${newlyDown.length} service${newlyDown.length === 1 ? '' : 's'} down`
      : '[Firmcraft] Service degradation detected'
    const html = buildAlertHtml({ down, degraded, checkedAt: health.checkedAt || new Date().toISOString() })
    await sendResendEmail(subject, html)
    const slackText = [
      newlyDown.length ? `:rotating_light: *${newlyDown.length} down*: ${newlyDown.map((s) => s.name).join(', ')}` : '',
      degraded.length ? `:warning: *degraded*: ${degraded.map((s) => s.name).join(', ')}` : '',
    ]
      .filter(Boolean)
      .join('\n')
    await sendSlack(slackText)
  }

  if (recovered.length > 0) {
    const subject = `[Firmcraft] Recovered: ${recovered.map((s) => s.name).join(', ')}`
    const html = `<p>The following services recovered:</p><ul>${recovered
      .map((s) => `<li>${escapeHtml(s.name)}</li>`)
      .join('')}</ul>`
    await sendResendEmail(subject, html)
    await sendSlack(`:white_check_mark: Recovered: ${recovered.map((s) => s.name).join(', ')}`)
  }

  saveState(next)
  process.exit(down.length > 0 ? 1 : 0)
}

main().catch((err) => {
  log(`unexpected error: ${err.stack || err.message}`)
  process.exit(2)
})
