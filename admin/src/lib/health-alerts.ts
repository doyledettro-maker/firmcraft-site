import { Resend } from 'resend'
import type { Beacon } from '@/lib/db/health-beacons'

// Reuse the shared Resend account. Only skillcalibrate.com is a verified sender,
// so the From stays on that domain until firmcraft.ai is verified in Resend.
const FROM_ADDRESS = process.env.RESEND_FROM || 'notifications@skillcalibrate.com'
// firmcraft.ai mailboxes aren't fully live yet — default to emergenext, override
// with HEALTH_ALERT_TO once Workspace is verified.
const TO_ADDRESS =
  process.env.HEALTH_ALERT_TO || 'doyle.dettro@emergenext.com'

/**
 * In-memory dedupe so a client that's red for an hour generates one alert, not
 * twelve (a beacon arrives every 5 min). Keyed by clientId; cleared when the
 * client recovers. Process-local — good enough for a single Vercel lambda and
 * intentionally fail-soft (a cold start re-sends one alert, never silences).
 */
const alertedRed = new Set<string>()

export function noteRecovered(clientId: string): void {
  alertedRed.delete(clientId)
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildHtml(clientName: string, reasons: string[], beacon: Beacon | null): string {
  const reasonList = reasons.length
    ? `<ul style="margin:8px 0 0;padding-left:18px;color:#0F172A;font-size:14px;">${reasons
        .map((r) => `<li>${escapeHtml(r)}</li>`)
        .join('')}</ul>`
    : ''
  const detail = beacon
    ? `<table style="border-collapse:collapse;margin-top:14px;font-size:13px;color:#334155;">
        <tr><td style="padding:3px 14px 3px 0;color:#64748B;">Container</td><td>${escapeHtml(beacon.containerStatus)}</td></tr>
        <tr><td style="padding:3px 14px 3px 0;color:#64748B;">Gateway</td><td>${escapeHtml(beacon.gatewayState)}</td></tr>
        <tr><td style="padding:3px 14px 3px 0;color:#64748B;">Disk</td><td>${beacon.diskPercent ?? '—'}%</td></tr>
        <tr><td style="padding:3px 14px 3px 0;color:#64748B;">Last heartbeat</td><td>${escapeHtml(beacon.reportedAt)}</td></tr>
      </table>`
    : '<p style="margin-top:12px;color:#64748B;font-size:13px;">No heartbeat has been received from this client.</p>'

  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#0F172A;padding:24px;">
      <h2 style="margin:0 0 4px;font-size:21px;color:#B91C1C;">🔴 ${escapeHtml(clientName)} is unhealthy</h2>
      <p style="margin:0 0 4px;color:#64748B;font-size:13px;">Firmcraft client health alert</p>
      ${reasonList}
      ${detail}
      <p style="margin:22px 0 0;font-size:12px;color:#94A3B8;">
        View the live grid at <a href="https://admin.firmcraft.ai/health">admin.firmcraft.ai/health</a>.
      </p>
    </div>`
}

/**
 * Fire a red-state alert at most once per outage. Returns whether an email was
 * actually sent (false = deduped or no API key). Best-effort: a send failure is
 * logged, never thrown, so it can't break the beacon ingest path.
 */
export async function maybeAlertRed(
  clientId: string,
  clientName: string,
  reasons: string[],
  beacon: Beacon | null,
): Promise<{ sent: boolean; error?: string }> {
  if (alertedRed.has(clientId)) return { sent: false }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    // Still mark as alerted so we don't busy-loop trying; surface via logs.
    console.error('[health-alert] RESEND_API_KEY not set; cannot notify')
    alertedRed.add(clientId)
    return { sent: false, error: 'RESEND_API_KEY not set' }
  }

  // Mark before awaiting so concurrent beacons don't double-send.
  alertedRed.add(clientId)
  try {
    const resend = new Resend(apiKey)
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [TO_ADDRESS],
      subject: `🔴 Firmcraft client unhealthy — ${clientName}`,
      html: buildHtml(clientName, reasons, beacon),
    })
    if (result.error) {
      return { sent: false, error: result.error.message || String(result.error) }
    }
    return { sent: true }
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : String(err) }
  }
}
