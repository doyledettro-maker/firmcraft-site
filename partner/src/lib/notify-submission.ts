import { Resend } from 'resend'
import { sectionTitles, type SurveyData } from './survey'

export type PartnerSubmissionPayload = {
  id: string
  partnerId: string
  partnerSlug: string
  partnerName?: string
  submittedAt: string
  status: 'pending'
  partnerNote?: string
  survey: SurveyData
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

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) {
    if (value.length === 0) return ''
    if (value.every((v) => typeof v === 'object' && v !== null && 'name' in v)) {
      return (value as { name: string; email: string }[])
        .filter((c) => c.name || c.email)
        .map((c) => `${c.name}${c.email ? ` <${c.email}>` : ''}`)
        .join('\n')
    }
    return value.map((v) => String(v)).join(', ')
  }
  return String(value)
}

const sectionLayout: { title: string; fields: { label: string; key: keyof SurveyData }[] }[] = [
  {
    title: sectionTitles[0],
    fields: [
      { label: 'Company', key: 'companyName' },
      { label: 'Industry', key: 'industry' },
      { label: 'Size', key: 'companySize' },
      { label: 'Website', key: 'website' },
      { label: 'Primary contact', key: 'primaryContactName' },
      { label: 'Contact email', key: 'primaryContactEmail' },
      { label: 'Contact role', key: 'primaryContactRole' },
    ],
  },
  {
    title: sectionTitles[1],
    fields: [
      { label: 'CRM', key: 'crm' },
      { label: 'Project management', key: 'projectManagement' },
      { label: 'Communication tools', key: 'communicationTools' },
      { label: 'Cloud provider', key: 'cloudProvider' },
      { label: 'Existing AI tools', key: 'existingAITools' },
    ],
  },
  {
    title: sectionTitles[2],
    fields: [
      { label: 'Technical maturity (1–5)', key: 'technicalMaturity' },
      { label: 'Data infrastructure', key: 'dataInfrastructure' },
      { label: 'Team AI familiarity (1–5)', key: 'teamAIFamiliarity' },
    ],
  },
  {
    title: sectionTitles[3],
    fields: [{ label: 'Use case priorities (ranked)', key: 'useCasePriorities' }],
  },
  {
    title: sectionTitles[4],
    fields: [
      { label: 'Systems to connect', key: 'systemsToConnect' },
      { label: 'API availability', key: 'apiAvailability' },
      { label: 'SSO provider', key: 'ssoProvider' },
      { label: 'Data sources', key: 'dataSources' },
    ],
  },
  {
    title: sectionTitles[5],
    fields: [
      { label: 'Industry regulations', key: 'industryRegulations' },
      { label: 'Data residency', key: 'dataResidency' },
      { label: 'Audit needs', key: 'auditNeeds' },
      { label: 'Existing frameworks', key: 'existingFrameworks' },
    ],
  },
  {
    title: sectionTitles[6],
    fields: [
      { label: 'Number of users', key: 'numberOfUsers' },
      { label: 'Departments', key: 'departments' },
      { label: 'Admin contacts', key: 'adminContacts' },
      { label: 'Training preference', key: 'trainingPreference' },
    ],
  },
  {
    title: sectionTitles[7],
    fields: [
      { label: 'Plan tier', key: 'planTier' },
      { label: 'Implementation timeline', key: 'implementationTimeline' },
      { label: 'Success metrics', key: 'successMetrics' },
    ],
  },
  {
    title: sectionTitles[8],
    fields: [
      { label: 'Primary contact method', key: 'primaryContactMethod' },
      { label: 'Update frequency', key: 'updateFrequency' },
      { label: 'Escalation contacts', key: 'escalationContacts' },
    ],
  },
  {
    title: sectionTitles[9],
    fields: [
      { label: 'Special needs', key: 'specialNeeds' },
      { label: 'Priority features', key: 'priorityFeatures' },
      { label: 'Deal-breakers', key: 'dealBreakers' },
    ],
  },
]

function buildHtml(payload: PartnerSubmissionPayload): string {
  const sectionsHtml = sectionLayout
    .map((section, idx) => {
      const rows = section.fields
        .map((f) => {
          const formatted = formatValue(payload.survey[f.key])
          if (!formatted) return ''
          return `
            <div style="margin:0 0 12px;">
              <div style="font-size:13px;color:#5A4533;font-weight:600;margin-bottom:4px;">${escapeHtml(f.label)}</div>
              <div style="font-size:14px;color:#2D1F14;white-space:pre-wrap;background:#FBF7F2;border-left:3px solid #C9B89C;padding:10px 12px;border-radius:4px;">${escapeHtml(formatted)}</div>
            </div>`
        })
        .filter(Boolean)
        .join('')
      if (!rows) return ''
      return `
        <section style="margin:0 0 24px;">
          <h3 style="margin:0 0 12px;font-size:16px;color:#2D1F14;border-bottom:1px solid #E5D9C7;padding-bottom:6px;">
            ${idx + 1}. ${escapeHtml(section.title)}
          </h3>
          ${rows}
        </section>`
    })
    .filter(Boolean)
    .join('')

  const note = payload.partnerNote
    ? `<div style="margin:0 0 24px;padding:14px 16px;background:#F5EDDF;border-radius:6px;">
         <div style="font-size:12px;color:#5A4533;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Partner note</div>
         <div style="font-size:14px;color:#2D1F14;white-space:pre-wrap;">${escapeHtml(payload.partnerNote)}</div>
       </div>`
    : ''

  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:640px;margin:0 auto;color:#2D1F14;padding:24px;">
      <h2 style="margin:0 0 6px;font-size:22px;">New partner submission</h2>
      <p style="margin:0 0 16px;color:#8A7560;font-size:13px;">
        Partner: <strong style="color:#2D1F14;">${escapeHtml(payload.partnerName || payload.partnerSlug)}</strong> ·
        submission <code>${escapeHtml(payload.id)}</code> · ${escapeHtml(payload.submittedAt)}
      </p>
      ${note}
      ${sectionsHtml}
    </div>
  `
}

export async function sendPartnerSubmissionEmail(payload: PartnerSubmissionPayload): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY not set' }
  const resend = new Resend(apiKey)
  const partner = payload.partnerName || payload.partnerSlug
  const company = payload.survey.companyName?.trim() || 'unnamed'
  const subject = `New partner submission from ${partner} for ${company}`
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
