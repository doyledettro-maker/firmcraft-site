import { Resend } from 'resend'

export type NotifySection = {
  id: string
  number: number
  title: string
  questions: { id: string; prompt: string; answer: string }[]
}

export type SubmissionPayload = {
  receivedAt: string
  method: 'conversational' | 'markdown'
  companyHint: string
  sections: NotifySection[]
}

const FROM_ADDRESS = process.env.RESEND_FROM || 'notifications@skillcalibrate.com'
const TO_ADDRESS = process.env.NOTIFY_TO || 'doyle.dettro@emergenext.com'

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function deriveCompanyName(payload: SubmissionPayload): string {
  if (payload.companyHint) return payload.companyHint
  const company = payload.sections.find((s) => s.id === 'company')
  const overview = company?.questions.find((q) => q.id === 'overview')?.answer
  if (overview) {
    const firstLine = overview.split('\n')[0].trim()
    if (firstLine) return firstLine.slice(0, 80)
  }
  return 'unnamed'
}

function buildHtml(payload: SubmissionPayload): string {
  const sectionsHtml = payload.sections
    .map((section) => {
      const answered = section.questions.filter((q) => q.answer.trim().length > 0)
      if (answered.length === 0) return ''
      const rows = answered
        .map(
          (q) => `
            <div style="margin:0 0 14px;">
              <div style="font-size:13px;color:#334155;font-weight:600;margin-bottom:4px;">${escapeHtml(q.prompt)}</div>
              <div style="font-size:14px;color:#0F172A;white-space:pre-wrap;background:#F4F6FA;border-left:3px solid rgba(15,23,42,0.18);padding:10px 12px;border-radius:4px;">${escapeHtml(q.answer)}</div>
            </div>`,
        )
        .join('')
      return `
        <section style="margin:0 0 28px;">
          <h3 style="margin:0 0 12px;font-size:16px;color:#0F172A;border-bottom:1px solid rgba(15,23,42,0.10);padding-bottom:6px;">
            ${section.number}. ${escapeHtml(section.title)}
          </h3>
          ${rows}
        </section>`
    })
    .filter(Boolean)
    .join('')

  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:640px;margin:0 auto;color:#0F172A;padding:24px;">
      <h2 style="margin:0 0 6px;font-size:22px;">New onboarding submission</h2>
      <p style="margin:0 0 24px;color:#64748B;font-size:13px;">
        ${escapeHtml(payload.method)} flow · received ${escapeHtml(payload.receivedAt)}
      </p>
      ${sectionsHtml || '<p style="color:#64748B;">No answers provided.</p>'}
    </div>
  `
}

export async function sendSubmissionEmail(payload: SubmissionPayload): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { ok: false, error: 'RESEND_API_KEY not set' }
  }
  const resend = new Resend(apiKey)
  const company = deriveCompanyName(payload)
  const subject = `New onboarding submission from ${company}`
  try {
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [TO_ADDRESS],
      subject,
      html: buildHtml(payload),
    })
    if (result.error) {
      return { ok: false, error: result.error.message || String(result.error) }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
