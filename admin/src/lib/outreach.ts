import { Resend } from 'resend'
import type { Prospect } from '@/lib/db/prospects'

const FROM_DEFAULT = 'Doyle Dettro <doyle@firmcraft.ai>'
const REPLY_TO_DEFAULT = 'doyle@firmcraft.ai'

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

let cached: Resend | null = null
function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Resend not configured. Set RESEND_API_KEY.')
  }
  if (!cached) cached = new Resend(process.env.RESEND_API_KEY)
  return cached
}

export function getOutreachFrom(): string {
  return process.env.OUTREACH_FROM_ADDRESS || FROM_DEFAULT
}

export function getOutreachReplyTo(): string {
  return process.env.OUTREACH_REPLY_TO || REPLY_TO_DEFAULT
}

/**
 * Returns the public base URL used to build tracking links. Falls back to
 * the canonical admin host so links work even if env isn't set.
 */
export function getTrackingBaseUrl(): string {
  return (
    process.env.OUTREACH_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_ADMIN_URL ||
    'https://admin.firmcraft.ai'
  ).replace(/\/$/, '')
}

export function buildOpenPixelUrl(prospectId: string): string {
  return `${getTrackingBaseUrl()}/api/outreach/track/open/${prospectId}`
}

export function buildClickUrl(prospectId: string, destination: string): string {
  return `${getTrackingBaseUrl()}/api/outreach/track/click/${prospectId}?u=${encodeURIComponent(destination)}`
}

export function buildUnsubscribeUrl(prospectId: string): string {
  return `${getTrackingBaseUrl()}/api/outreach/track/click/${prospectId}?u=${encodeURIComponent(
    `${getTrackingBaseUrl()}/unsubscribe?id=${prospectId}`,
  )}`
}

const HTTP_LINK_RE = /https?:\/\/[^\s<>"')]+/g

/**
 * Wraps every bare URL in the body with a click-tracker redirect.
 * Leaves anchor tags alone — we rewrite their hrefs in renderEmailHtml.
 */
export function wrapLinksInText(prospectId: string, text: string): string {
  return text.replace(HTTP_LINK_RE, (url) => buildClickUrl(prospectId, url))
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Render the prospect's plain-text email body to a clean HTML email.
 * - Auto-links bare URLs through the click tracker.
 * - Appends an unsubscribe footer and the 1x1 open-tracking pixel.
 * - Looks like a real personal email, not a marketing template.
 */
export function renderEmailHtml(prospect: Prospect): string {
  const body = prospect.emailBody ?? ''
  const escaped = escapeHtml(body).replace(/\r\n/g, '\n')
  const withLinks = escaped.replace(HTTP_LINK_RE, (url) => {
    const tracked = buildClickUrl(prospect.id, url)
    return `<a href="${tracked}" style="color:#2A5BD7;text-decoration:underline">${url}</a>`
  })
  const html = withLinks.split(/\n{2,}/).map((para) => {
    const lines = para.split('\n').map((line) => line.trim()).join('<br/>')
    return `<p style="margin:0 0 14px 0">${lines}</p>`
  }).join('\n')

  const unsubscribeUrl = buildUnsubscribeUrl(prospect.id)
  const pixelUrl = buildOpenPixelUrl(prospect.id)

  return `<!doctype html>
<html>
<head><meta charset="utf-8"/><title>${escapeHtml(prospect.subjectLine ?? '')}</title></head>
<body style="margin:0;padding:0;background:#ffffff;color:#1a1a1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55">
  <div style="max-width:600px;margin:0 auto;padding:24px 20px">
    ${html}
    <div style="margin-top:32px;padding-top:14px;border-top:1px solid #e5e5e5;color:#888;font-size:12px;line-height:1.5">
      If you'd rather not hear from me, <a href="${unsubscribeUrl}" style="color:#888;text-decoration:underline">unsubscribe here</a>.
    </div>
    <img src="${pixelUrl}" alt="" width="1" height="1" style="display:block;width:1px;height:1px;border:0;opacity:0" />
  </div>
</body>
</html>`
}

export function renderEmailText(prospect: Prospect): string {
  const body = prospect.emailBody ?? ''
  const wrapped = wrapLinksInText(prospect.id, body)
  const unsub = `${getTrackingBaseUrl()}/unsubscribe?id=${prospect.id}`
  return `${wrapped}\n\n---\nIf you'd rather not hear from me, unsubscribe: ${unsub}`
}

export type SendResult = {
  prospectId: string
  ok: boolean
  messageId?: string
  error?: string
}

export async function sendProspectEmail(prospect: Prospect): Promise<SendResult> {
  if (!prospect.email || !prospect.subjectLine || !prospect.emailBody) {
    return {
      prospectId: prospect.id,
      ok: false,
      error: 'Missing email, subject, or body',
    }
  }
  if (!isResendConfigured()) {
    return {
      prospectId: prospect.id,
      ok: false,
      error: 'Resend not configured (RESEND_API_KEY missing)',
    }
  }
  try {
    const resend = getResend()
    const { data, error } = await resend.emails.send({
      from: getOutreachFrom(),
      to: [prospect.email],
      replyTo: getOutreachReplyTo(),
      subject: prospect.subjectLine,
      html: renderEmailHtml(prospect),
      text: renderEmailText(prospect),
      headers: {
        'List-Unsubscribe': `<${getTrackingBaseUrl()}/unsubscribe?id=${prospect.id}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    })
    if (error) {
      return { prospectId: prospect.id, ok: false, error: error.message }
    }
    return { prospectId: prospect.id, ok: true, messageId: data?.id }
  } catch (err) {
    return {
      prospectId: prospect.id,
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown send error',
    }
  }
}

// 1x1 transparent GIF (43 bytes). Used as the open-tracking pixel response.
export const TRANSPARENT_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
)
