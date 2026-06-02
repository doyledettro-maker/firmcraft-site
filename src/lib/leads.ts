import { Resend } from 'resend'
import { getSupabaseAdmin, isSupabaseConfigured } from './supabase'

export const LEAD_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'converted',
  'archived',
] as const
export type LeadStatus = (typeof LEAD_STATUSES)[number]

export const LEAD_SEGMENTS = ['small', 'midmarket', 'pe'] as const
export type LeadSegment = (typeof LEAD_SEGMENTS)[number]

export type LeadInput = {
  name: string
  email: string
  company?: string | null
  phone?: string | null
  message?: string | null
  source?: string | null
}

export type Lead = LeadInput & {
  id: string
  status: LeadStatus
  segment: LeadSegment | null
  notes: string | null
  createdAt: string
}

const FROM_ADDRESS = process.env.RESEND_FROM || 'notifications@skillcalibrate.com'
const TO_ADDRESS = process.env.LEADS_NOTIFY_TO || 'doyle@firmcraft.ai'

/**
 * Best-effort segment guess from the company name. We can't know much from a
 * contact form, but PE/VC firms are recognizable by name and worth routing
 * differently. Everything else falls through to null (let an admin tag it).
 */
export function guessSegment(company?: string | null): LeadSegment | null {
  if (!company) return null
  const c = company.toLowerCase()
  const peSignals = [
    'capital',
    'partners',
    'equity',
    'ventures',
    'venture',
    'holdings',
    'private equity',
    'buyout',
    'advisors',
    'asset management',
  ]
  if (peSignals.some((s) => c.includes(s))) return 'pe'
  return null
}

/** True for a syntactically plausible email. Intentionally lenient. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function saveLead(input: LeadInput): Promise<Lead> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured — cannot save lead.')
  }
  const db = getSupabaseAdmin()
  const row = {
    name: input.name.trim(),
    email: input.email.trim(),
    company: input.company?.trim() || null,
    phone: input.phone?.trim() || null,
    message: input.message?.trim() || null,
    source: input.source?.trim() || null,
    segment: guessSegment(input.company),
  }
  const { data, error } = await db
    .from('inbound_leads')
    .insert(row)
    .select('*')
    .single()
  if (error) throw new Error(`saveLead failed: ${error.message}`)
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    company: data.company,
    phone: data.phone,
    message: data.message,
    source: data.source,
    status: data.status,
    segment: data.segment,
    notes: data.notes,
    createdAt: data.created_at,
  }
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function detailRow(label: string, value: string | null | undefined): string {
  const safe = value && value.trim()
    ? escapeHtml(value)
    : '<span style="color:#94A3B8;font-style:italic;">—</span>'
  return `
    <tr>
      <td style="padding:8px 14px 8px 0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#64748B;font-weight:600;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td>
      <td style="padding:8px 0;font-size:14px;color:#0F172A;">${safe}</td>
    </tr>`
}

function buildHtml(lead: Lead): string {
  const messageBlock = lead.message?.trim()
    ? `<div style="margin-top:18px;">
         <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#64748B;font-weight:600;margin-bottom:6px;">Message</div>
         <div style="font-size:14px;color:#0F172A;white-space:pre-wrap;background:#F4F6FA;border-left:3px solid rgba(15,23,42,0.18);padding:12px 14px;border-radius:4px;">${escapeHtml(lead.message)}</div>
       </div>`
    : ''
  const segmentBadge = lead.segment
    ? ` <span style="font-size:10px;letter-spacing:0.1em;text-transform:uppercase;background:#0F172A;color:#fff;padding:2px 8px;border-radius:99px;vertical-align:middle;">${escapeHtml(lead.segment)}</span>`
    : ''
  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#0F172A;padding:24px;">
      <h2 style="margin:0 0 4px;font-size:21px;">New lead — ${escapeHtml(lead.name)}${segmentBadge}</h2>
      <p style="margin:0 0 18px;color:#64748B;font-size:13px;">
        via ${escapeHtml(lead.source || 'website')} · received ${escapeHtml(lead.createdAt)}
      </p>
      <table style="border-collapse:collapse;width:100%;">
        ${detailRow('Name', lead.name)}
        ${detailRow('Email', lead.email)}
        ${detailRow('Company', lead.company)}
        ${detailRow('Phone', lead.phone)}
        ${detailRow('Source', lead.source)}
      </table>
      ${messageBlock}
      <p style="margin:22px 0 0;font-size:12px;color:#94A3B8;">
        Reply directly to this person at ${escapeHtml(lead.email)}, or work the lead in the admin panel under Leads.
      </p>
    </div>`
}

export async function sendLeadEmail(lead: Lead): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY not set' }
  const resend = new Resend(apiKey)
  const subject = `New lead · ${lead.name}${lead.company ? ` (${lead.company})` : ''} · ${lead.source || 'website'}`
  try {
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [TO_ADDRESS],
      replyTo: lead.email,
      subject,
      html: buildHtml(lead),
    })
    if (result.error) {
      return { ok: false, error: result.error.message || String(result.error) }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
