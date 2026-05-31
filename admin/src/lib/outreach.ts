import { Resend } from 'resend'
import type { Contact } from '@/lib/db/contacts'

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

export function buildOpenPixelUrl(contactId: string): string {
  return `${getTrackingBaseUrl()}/api/outreach/track/open/${contactId}`
}

export function buildClickUrl(contactId: string, destination: string): string {
  return `${getTrackingBaseUrl()}/api/outreach/track/click/${contactId}?u=${encodeURIComponent(destination)}`
}

export function buildUnsubscribeUrl(contactId: string): string {
  return `${getTrackingBaseUrl()}/api/outreach/track/click/${contactId}?u=${encodeURIComponent(
    `${getTrackingBaseUrl()}/unsubscribe?id=${contactId}`,
  )}`
}

const HTTP_LINK_RE = /https?:\/\/[^\s<>"')]+/g

export function wrapLinksInText(contactId: string, text: string): string {
  return text.replace(HTTP_LINK_RE, (url) => buildClickUrl(contactId, url))
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function renderEmailHtml(contact: Contact): string {
  const body = contact.emailBody ?? ''
  const escaped = escapeHtml(body).replace(/\r\n/g, '\n')
  const withLinks = escaped.replace(HTTP_LINK_RE, (url) => {
    const tracked = buildClickUrl(contact.id, url)
    return `<a href="${tracked}" style="color:#2A5BD7;text-decoration:underline">${url}</a>`
  })
  const html = withLinks.split(/\n{2,}/).map((para) => {
    const lines = para.split('\n').map((line) => line.trim()).join('<br/>')
    return `<p style="margin:0 0 14px 0">${lines}</p>`
  }).join('\n')

  const unsubscribeUrl = buildUnsubscribeUrl(contact.id)
  const pixelUrl = buildOpenPixelUrl(contact.id)

  return `<!doctype html>
<html>
<head><meta charset="utf-8"/><title>${escapeHtml(contact.subjectLine ?? '')}</title></head>
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

export function renderEmailText(contact: Contact): string {
  const body = contact.emailBody ?? ''
  const wrapped = wrapLinksInText(contact.id, body)
  const unsub = `${getTrackingBaseUrl()}/unsubscribe?id=${contact.id}`
  return `${wrapped}\n\n---\nIf you'd rather not hear from me, unsubscribe: ${unsub}`
}

export type SendResult = {
  contactId: string
  ok: boolean
  messageId?: string
  error?: string
}

export async function sendContactEmail(contact: Contact): Promise<SendResult> {
  if (!contact.email || !contact.subjectLine || !contact.emailBody) {
    return {
      contactId: contact.id,
      ok: false,
      error: 'Missing email, subject, or body',
    }
  }
  if (!isResendConfigured()) {
    return {
      contactId: contact.id,
      ok: false,
      error: 'Resend not configured (RESEND_API_KEY missing)',
    }
  }
  try {
    const resend = getResend()
    const { data, error } = await resend.emails.send({
      from: getOutreachFrom(),
      to: [contact.email],
      replyTo: getOutreachReplyTo(),
      subject: contact.subjectLine,
      html: renderEmailHtml(contact),
      text: renderEmailText(contact),
      headers: {
        'List-Unsubscribe': `<${getTrackingBaseUrl()}/unsubscribe?id=${contact.id}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    })
    if (error) {
      return { contactId: contact.id, ok: false, error: error.message }
    }
    return { contactId: contact.id, ok: true, messageId: data?.id }
  } catch (err) {
    return {
      contactId: contact.id,
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
