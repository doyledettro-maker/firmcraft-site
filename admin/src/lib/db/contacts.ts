import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import type { Company } from './companies'

export type ContactStatus =
  | 'targeted'
  | 'draft'
  | 'queued'
  | 'sent'
  | 'opened'
  | 'clicked'
  | 'replied'
  | 'bounced'
  | 'unsubscribed'

export const CONTACT_STATUSES: ContactStatus[] = [
  'targeted',
  'draft',
  'queued',
  'sent',
  'opened',
  'clicked',
  'replied',
  'bounced',
  'unsubscribed',
]

export type Contact = {
  id: string
  companyId: string
  contactName: string | null
  title: string | null
  email: string | null
  phone: string | null
  subjectLine: string | null
  emailBody: string | null
  notes: string | null
  status: ContactStatus
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

type ContactRow = {
  id: string
  company_id: string
  contact_name: string | null
  title: string | null
  email: string | null
  phone: string | null
  subject_line: string | null
  email_body: string | null
  notes: string | null
  status: ContactStatus
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

export type ContactInput = {
  companyId: string
  contactName?: string | null
  title?: string | null
  email?: string | null
  phone?: string | null
  subjectLine?: string | null
  emailBody?: string | null
  notes?: string | null
  status?: ContactStatus
}

export type ContactUpdate = Partial<ContactInput> & {
  resendMessageId?: string | null
  sentAt?: string | null
  openedAt?: string | null
  clickedAt?: string | null
  repliedAt?: string | null
  bouncedAt?: string | null
  unsubscribedAt?: string | null
}

export type ContactWithCompany = Contact & { company: Company }

function rowToContact(row: ContactRow): Contact {
  return {
    id: row.id,
    companyId: row.company_id,
    contactName: row.contact_name,
    title: row.title,
    email: row.email,
    phone: row.phone,
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

function inputToRow(input: ContactInput | ContactUpdate): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if ('companyId' in input && input.companyId !== undefined) row.company_id = input.companyId
  if ('contactName' in input && input.contactName !== undefined) row.contact_name = input.contactName
  if ('title' in input && input.title !== undefined) row.title = input.title
  if ('email' in input && input.email !== undefined) row.email = input.email
  if ('phone' in input && input.phone !== undefined) row.phone = input.phone
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

type ContactRowWithCompany = ContactRow & { companies: Record<string, unknown> | null }

function rowToContactWithCompany(row: ContactRowWithCompany): ContactWithCompany {
  const contact = rowToContact(row)
  const c = row.companies ?? {}
  return {
    ...contact,
    company: {
      id: (c.id as string) ?? row.company_id,
      companyName: (c.company_name as string) ?? '',
      industry: (c.industry as string | null) ?? null,
      employeeCount: (c.employee_count as number | null) ?? null,
      phone: (c.phone as string | null) ?? null,
      website: (c.website as string | null) ?? null,
      city: (c.city as string | null) ?? null,
      state: (c.state as string | null) ?? null,
      status: (c.status as Company['status']) ?? 'active',
      segment: (c.segment as Company['segment']) ?? 'small',
      assignedTo: (c.assigned_to as string | null) ?? null,
      notes: (c.notes as string | null) ?? null,
      createdAt: (c.created_at as string) ?? row.created_at,
      updatedAt: (c.updated_at as string) ?? row.updated_at,
    },
  }
}

const CONTACT_WITH_COMPANY_SELECT = `
  id, company_id, contact_name, title, email, phone,
  subject_line, email_body, notes, status, resend_message_id,
  created_at, updated_at,
  sent_at, opened_at, clicked_at, replied_at, bounced_at, unsubscribed_at,
  companies (
    id, company_name, industry, employee_count, phone, website,
    city, state, status, segment, assigned_to, notes, created_at, updated_at
  )
`

// PostgREST caps a single response at 1000 rows, so page through with .range()
// to return every contact (we have thousands).
const PAGE_SIZE = 1000

export async function getContacts(): Promise<ContactWithCompany[]> {
  if (!isSupabaseConfigured()) return []
  const db = getSupabaseAdmin()
  const rows: ContactRowWithCompany[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await db
      .from('contacts')
      .select(CONTACT_WITH_COMPANY_SELECT)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(`getContacts failed: ${error.message}`)
    const batch = (data ?? []) as unknown as ContactRowWithCompany[]
    rows.push(...batch)
    if (batch.length < PAGE_SIZE) break
  }
  return rows.map((row) => rowToContactWithCompany(row))
}

export async function getContactsForCompany(companyId: string): Promise<Contact[]> {
  if (!isSupabaseConfigured()) return []
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('contacts')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(`getContactsForCompany failed: ${error.message}`)
  return (data ?? []).map((row) => rowToContact(row as ContactRow))
}

export async function getContact(id: string): Promise<Contact | undefined> {
  if (!isSupabaseConfigured()) return undefined
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('contacts')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(`getContact(${id}) failed: ${error.message}`)
  if (!data) return undefined
  return rowToContact(data as ContactRow)
}

export async function getContactWithCompany(id: string): Promise<ContactWithCompany | undefined> {
  if (!isSupabaseConfigured()) return undefined
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('contacts')
    .select(CONTACT_WITH_COMPANY_SELECT)
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(`getContactWithCompany(${id}) failed: ${error.message}`)
  if (!data) return undefined
  return rowToContactWithCompany(data as unknown as ContactRowWithCompany)
}

export async function getContactByEmail(email: string): Promise<Contact | undefined> {
  if (!isSupabaseConfigured()) return undefined
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('contacts')
    .select('*')
    .ilike('email', email)
    .maybeSingle()
  if (error) throw new Error(`getContactByEmail failed: ${error.message}`)
  if (!data) return undefined
  return rowToContact(data as ContactRow)
}

export async function createContacts(inputs: ContactInput[]): Promise<Contact[]> {
  if (!isSupabaseConfigured()) {
    throw new Error('createContacts requires Supabase to be configured.')
  }
  if (inputs.length === 0) return []
  const db = getSupabaseAdmin()
  const rows = inputs.map((i) => inputToRow(i))
  const { data, error } = await db.from('contacts').insert(rows).select('*')
  if (error) throw new Error(`createContacts failed: ${error.message}`)
  return (data ?? []).map((r) => rowToContact(r as ContactRow))
}

export async function createContact(input: ContactInput): Promise<Contact> {
  const [created] = await createContacts([input])
  return created
}

export async function updateContact(id: string, input: ContactUpdate): Promise<Contact> {
  if (!isSupabaseConfigured()) {
    throw new Error('updateContact requires Supabase to be configured.')
  }
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('contacts')
    .update(inputToRow(input))
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(`updateContact(${id}) failed: ${error.message}`)
  return rowToContact(data as ContactRow)
}

export async function deleteContact(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('deleteContact requires Supabase to be configured.')
  }
  const db = getSupabaseAdmin()
  const { error } = await db.from('contacts').delete().eq('id', id)
  if (error) throw new Error(`deleteContact(${id}) failed: ${error.message}`)
}

export async function getContactStats() {
  const rows = await getContacts()
  const total = rows.length
  const sent = rows.filter((c) => c.sentAt !== null).length
  const opened = rows.filter((c) => c.openedAt !== null).length
  const clicked = rows.filter((c) => c.clickedAt !== null).length
  const replied = rows.filter((c) => c.repliedAt !== null).length
  const bounced = rows.filter((c) => c.bouncedAt !== null).length
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
