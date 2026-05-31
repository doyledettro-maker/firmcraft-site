import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export type ProspectStatus =
  | 'draft'
  | 'queued'
  | 'sent'
  | 'opened'
  | 'clicked'
  | 'replied'
  | 'bounced'
  | 'unsubscribed'

export type Prospect = {
  id: string
  companyName: string
  industry: string | null
  employeeCount: number | null
  city: string | null
  state: string | null
  contactName: string | null
  email: string
  phone: string | null
  website: string | null
  subjectLine: string | null
  emailBody: string | null
  notes: string | null
  status: ProspectStatus
  resendMessageId: string | null
  createdAt: string
  updatedAt: string
  sentAt: string | null
  openedAt: string | null
  clickedAt: string | null
  repliedAt: string | null
  bouncedAt: string | null
  unsubscribedAt: string | null
}

type ProspectRow = {
  id: string
  company_name: string
  industry: string | null
  employee_count: number | null
  city: string | null
  state: string | null
  contact_name: string | null
  email: string
  phone: string | null
  website: string | null
  subject_line: string | null
  email_body: string | null
  notes: string | null
  status: ProspectStatus
  resend_message_id: string | null
  created_at: string
  updated_at: string
  sent_at: string | null
  opened_at: string | null
  clicked_at: string | null
  replied_at: string | null
  bounced_at: string | null
  unsubscribed_at: string | null
}

export type ProspectInput = {
  companyName: string
  industry?: string | null
  employeeCount?: number | null
  city?: string | null
  state?: string | null
  contactName?: string | null
  email: string
  phone?: string | null
  website?: string | null
  subjectLine?: string | null
  emailBody?: string | null
  notes?: string | null
  status?: ProspectStatus
}

export type ProspectUpdate = Partial<ProspectInput> & {
  resendMessageId?: string | null
  sentAt?: string | null
  openedAt?: string | null
  clickedAt?: string | null
  repliedAt?: string | null
  bouncedAt?: string | null
  unsubscribedAt?: string | null
}

function rowToProspect(row: ProspectRow): Prospect {
  return {
    id: row.id,
    companyName: row.company_name,
    industry: row.industry,
    employeeCount: row.employee_count,
    city: row.city,
    state: row.state,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone,
    website: row.website,
    subjectLine: row.subject_line,
    emailBody: row.email_body,
    notes: row.notes,
    status: row.status,
    resendMessageId: row.resend_message_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sentAt: row.sent_at,
    openedAt: row.opened_at,
    clickedAt: row.clicked_at,
    repliedAt: row.replied_at,
    bouncedAt: row.bounced_at,
    unsubscribedAt: row.unsubscribed_at,
  }
}

function inputToRow(input: ProspectInput | ProspectUpdate): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if ('companyName' in input && input.companyName !== undefined) row.company_name = input.companyName
  if ('industry' in input && input.industry !== undefined) row.industry = input.industry
  if ('employeeCount' in input && input.employeeCount !== undefined) row.employee_count = input.employeeCount
  if ('city' in input && input.city !== undefined) row.city = input.city
  if ('state' in input && input.state !== undefined) row.state = input.state
  if ('contactName' in input && input.contactName !== undefined) row.contact_name = input.contactName
  if ('email' in input && input.email !== undefined) row.email = input.email
  if ('phone' in input && input.phone !== undefined) row.phone = input.phone
  if ('website' in input && input.website !== undefined) row.website = input.website
  if ('subjectLine' in input && input.subjectLine !== undefined) row.subject_line = input.subjectLine
  if ('emailBody' in input && input.emailBody !== undefined) row.email_body = input.emailBody
  if ('notes' in input && input.notes !== undefined) row.notes = input.notes
  if ('status' in input && input.status !== undefined) row.status = input.status
  if ('resendMessageId' in input && input.resendMessageId !== undefined) row.resend_message_id = input.resendMessageId
  if ('sentAt' in input && input.sentAt !== undefined) row.sent_at = input.sentAt
  if ('openedAt' in input && input.openedAt !== undefined) row.opened_at = input.openedAt
  if ('clickedAt' in input && input.clickedAt !== undefined) row.clicked_at = input.clickedAt
  if ('repliedAt' in input && input.repliedAt !== undefined) row.replied_at = input.repliedAt
  if ('bouncedAt' in input && input.bouncedAt !== undefined) row.bounced_at = input.bouncedAt
  if ('unsubscribedAt' in input && input.unsubscribedAt !== undefined) row.unsubscribed_at = input.unsubscribedAt
  return row
}

export async function getProspects(): Promise<Prospect[]> {
  if (!isSupabaseConfigured()) return []
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('prospects')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(`getProspects failed: ${error.message}`)
  return (data ?? []).map((row) => rowToProspect(row as ProspectRow))
}

export async function getProspect(id: string): Promise<Prospect | undefined> {
  if (!isSupabaseConfigured()) return undefined
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('prospects')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(`getProspect(${id}) failed: ${error.message}`)
  if (!data) return undefined
  return rowToProspect(data as ProspectRow)
}

export async function getProspectByEmail(email: string): Promise<Prospect | undefined> {
  if (!isSupabaseConfigured()) return undefined
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('prospects')
    .select('*')
    .ilike('email', email)
    .maybeSingle()
  if (error) throw new Error(`getProspectByEmail failed: ${error.message}`)
  if (!data) return undefined
  return rowToProspect(data as ProspectRow)
}

export async function createProspects(inputs: ProspectInput[]): Promise<Prospect[]> {
  if (!isSupabaseConfigured()) {
    throw new Error('createProspects requires Supabase to be configured.')
  }
  if (inputs.length === 0) return []
  const db = getSupabaseAdmin()
  const rows = inputs.map((i) => inputToRow(i))
  const { data, error } = await db.from('prospects').insert(rows).select('*')
  if (error) throw new Error(`createProspects failed: ${error.message}`)
  return (data ?? []).map((r) => rowToProspect(r as ProspectRow))
}

export async function updateProspect(id: string, input: ProspectUpdate): Promise<Prospect> {
  if (!isSupabaseConfigured()) {
    throw new Error('updateProspect requires Supabase to be configured.')
  }
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('prospects')
    .update(inputToRow(input))
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(`updateProspect(${id}) failed: ${error.message}`)
  return rowToProspect(data as ProspectRow)
}

export async function getProspectStats() {
  const rows = await getProspects()
  const total = rows.length
  const sent = rows.filter((p) => p.sentAt !== null).length
  const opened = rows.filter((p) => p.openedAt !== null).length
  const clicked = rows.filter((p) => p.clickedAt !== null).length
  const replied = rows.filter((p) => p.repliedAt !== null).length
  const bounced = rows.filter((p) => p.bouncedAt !== null).length
  return {
    total,
    sent,
    opened,
    clicked,
    replied,
    bounced,
    openRate: sent > 0 ? opened / sent : 0,
    clickRate: sent > 0 ? clicked / sent : 0,
    replyRate: sent > 0 ? replied / sent : 0,
  }
}
