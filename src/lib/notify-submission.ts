import { Resend } from 'resend'
import { SURVEY_SECTIONS, answerKey, type SurveyAnswers } from './survey'
import type { CompanyAnswerWithMeta } from './survey-tokens'

export type RespondentSummary = {
  email: string
  name: string
  role: string
  submittedAt: string | null
  answers: SurveyAnswers
}

export type SubmissionPayload = {
  receivedAt: string
  token: string
  companyName: string
  /** Email of the respondent who just hit submit (highlighted in the email). */
  submittingRespondentEmail: string
  companyAnswers: CompanyAnswerWithMeta[]
  respondents: RespondentSummary[]
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

function answerBlock(prompt: string, answer: string, footnote?: string): string {
  const safeAnswer = answer.trim()
    ? escapeHtml(answer)
    : '<span style="color:#94A3B8;font-style:italic;">— not answered —</span>'
  const note = footnote
    ? `<div style="font-size:11px;color:#94A3B8;margin-top:4px;">${escapeHtml(footnote)}</div>`
    : ''
  return `
    <div style="margin:0 0 14px;">
      <div style="font-size:13px;color:#334155;font-weight:600;margin-bottom:4px;">${escapeHtml(prompt)}</div>
      <div style="font-size:14px;color:#0F172A;white-space:pre-wrap;background:#F4F6FA;border-left:3px solid rgba(15,23,42,0.18);padding:10px 12px;border-radius:4px;">${safeAnswer}</div>
      ${note}
    </div>`
}

function buildCompanySection(payload: SubmissionPayload): string {
  // Group company answers by section_id, preserving the order from SURVEY_SECTIONS.
  const bySection = new Map<string, CompanyAnswerWithMeta[]>()
  for (const row of payload.companyAnswers) {
    const arr = bySection.get(row.section.id) ?? []
    arr.push(row)
    bySection.set(row.section.id, arr)
  }

  const sections = SURVEY_SECTIONS.filter((s) => s.scope === 'company')
    .map((section) => {
      const rows = bySection.get(section.id) ?? []
      const blocks = rows
        .map((r) => {
          const note = r.updatedByEmail
            ? `last edited by ${r.updatedByEmail}`
            : undefined
          return answerBlock(r.question.prompt, r.answer, note)
        })
        .join('')
      return `
        <section style="margin:0 0 24px;">
          <h3 style="margin:0 0 12px;font-size:16px;color:#0F172A;border-bottom:1px solid rgba(15,23,42,0.10);padding-bottom:6px;">
            ${section.number}. ${escapeHtml(section.title)}
          </h3>
          ${blocks}
        </section>`
    })
    .join('')

  return `
    <div style="background:#EEF2F7;border-radius:10px;padding:18px;margin:0 0 28px;">
      <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#475569;font-weight:600;margin-bottom:10px;">
        Company-wide answers
      </div>
      ${sections}
    </div>`
}

function buildRespondentSection(payload: SubmissionPayload, r: RespondentSummary): string {
  const sections = SURVEY_SECTIONS.filter((s) => s.scope === 'individual')
    .map((section) => {
      const blocks = section.questions
        .map((q) => answerBlock(q.prompt, r.answers[answerKey(section.id, q.id)] ?? ''))
        .join('')
      return `
        <section style="margin:0 0 24px;">
          <h3 style="margin:0 0 12px;font-size:16px;color:#0F172A;border-bottom:1px solid rgba(15,23,42,0.10);padding-bottom:6px;">
            ${section.number}. ${escapeHtml(section.title)}
          </h3>
          ${blocks}
        </section>`
    })
    .join('')

  const isSubmitter =
    r.email.toLowerCase() === payload.submittingRespondentEmail.toLowerCase()
  const badge = isSubmitter
    ? ' <span style="font-size:10px;letter-spacing:0.1em;text-transform:uppercase;background:#0F172A;color:#fff;padding:2px 8px;border-radius:99px;vertical-align:middle;">just submitted</span>'
    : ''

  const submittedNote = r.submittedAt
    ? `Submitted ${escapeHtml(r.submittedAt)}`
    : 'In progress — has not finalized yet'

  return `
    <div style="background:#FFFFFF;border:1px solid rgba(15,23,42,0.10);border-radius:10px;padding:18px;margin:0 0 18px;">
      <div style="margin-bottom:14px;">
        <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#475569;font-weight:600;margin-bottom:6px;">
          Respondent${badge}
        </div>
        <div style="font-size:16px;color:#0F172A;font-weight:600;">
          ${escapeHtml(r.name)} <span style="color:#64748B;font-weight:400;">— ${escapeHtml(r.role)}</span>
        </div>
        <div style="font-size:13px;color:#475569;margin-top:2px;">
          ${escapeHtml(r.email)} · ${submittedNote}
        </div>
      </div>
      ${sections}
    </div>`
}

function buildHtml(payload: SubmissionPayload): string {
  const totalAnswered = payload.companyAnswers.filter((r) => r.answer.trim().length > 0).length
  const respondentCount = payload.respondents.length

  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:720px;margin:0 auto;color:#0F172A;padding:24px;">
      <h2 style="margin:0 0 4px;font-size:22px;">Onboarding submission — ${escapeHtml(payload.companyName)}</h2>
      <p style="margin:0 0 18px;color:#64748B;font-size:13px;">
        Token <code style="background:#F1F5F9;padding:2px 6px;border-radius:4px;">${escapeHtml(payload.token)}</code>
        · ${respondentCount} respondent${respondentCount === 1 ? '' : 's'}
        · ${totalAnswered} company-wide answers on file
        · received ${escapeHtml(payload.receivedAt)}
      </p>
      ${buildCompanySection(payload)}
      <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#475569;font-weight:600;margin:0 0 10px;">
        Individual responses
      </div>
      ${payload.respondents.map((r) => buildRespondentSection(payload, r)).join('')}
    </div>
  `
}

export async function sendSubmissionEmail(payload: SubmissionPayload): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { ok: false, error: 'RESEND_API_KEY not set' }
  }
  const resend = new Resend(apiKey)
  const subject = `Onboarding submission · ${payload.companyName} · ${payload.submittingRespondentEmail}`
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
