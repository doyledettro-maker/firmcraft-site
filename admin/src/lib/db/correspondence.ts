import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export type CorrespondenceType =
  | 'email_sent'
  | 'email_opened'
  | 'email_clicked'
  | 'email_replied'
  | 'email_bounced'
  | 'email_unsubscribed'
  | 'call'
  | 'meeting'
  | 'note'
  | 'sms'

export const CORRESPONDENCE_TYPES: CorrespondenceType[] = [
  'email_sent',
  'email_opened',
  'email_clicked',
  'email_replied',
  'email_bounced',
  'email_unsubscribed',
  'call',
  'meeting',
  'note',
  'sms',
]

export type Correspondence = {
  id: string
  contactId: string
  companyId: string
  type: CorrespondenceType
  subject: string | null
  body: string | null
  metadata: Record<string, unknown>
  occurredAt: string
  createdAt: string
}

type CorrespondenceRow = {
  id: string
  contact_id: string
  company_id: string
  type: CorrespondenceType
  subject: string | null
  body: string | null
  metadata: Record<string, unknown> | null
  occurred_at: string
  created_at: string
}

export type CorrespondenceInput = {
  contactId: string
  companyId: string
  type: CorrespondenceType
  subject?: string | null
  body?: string | null
  metadata?: Record<string, unknown>
  occurredAt?: string
}

function rowToCorrespondence(row: CorrespondenceRow): Correspondence {
  return {
    id: row.id,
    contactId: row.contact_id,
    companyId: row.company_id,
    type: row.type,
    subject: row.subject,
    body: row.body,
    metadata: row.metadata ?? {},
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
  }
}

export async function logCorrespondence(input: CorrespondenceInput): Promise<Correspondence> {
  if (!isSupabaseConfigured()) {
    throw new Error('logCorrespondence requires Supabase to be configured.')
  }
  const db = getSupabaseAdmin()
  const row: Record<string, unknown> = {
    contact_id: input.contactId,
    company_id: input.companyId,
    type: input.type,
    metadata: input.metadata ?? {},
  }
  if (input.subject !== undefined) row.subject = input.subject
  if (input.body !== undefined) row.body = input.body
  if (input.occurredAt !== undefined) row.occurred_at = input.occurredAt
  const { data, error } = await db
    .from('correspondence')
    .insert(row)
    .select('*')
    .single()
  if (error) throw new Error(`logCorrespondence failed: ${error.message}`)
  return rowToCorrespondence(data as CorrespondenceRow)
}

export async function getCorrespondenceForContact(contactId: string): Promise<Correspondence[]> {
  if (!isSupabaseConfigured()) return []
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('correspondence')
    .select('*')
    .eq('contact_id', contactId)
    .order('occurred_at', { ascending: false })
  if (error) throw new Error(`getCorrespondenceForContact failed: ${error.message}`)
  return (data ?? []).map((r) => rowToCorrespondence(r as CorrespondenceRow))
}

export async function getCorrespondenceForCompany(companyId: string): Promise<Correspondence[]> {
  if (!isSupabaseConfigured()) return []
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('correspondence')
    .select('*')
    .eq('company_id', companyId)
    .order('occurred_at', { ascending: false })
  if (error) throw new Error(`getCorrespondenceForCompany failed: ${error.message}`)
  return (data ?? []).map((r) => rowToCorrespondence(r as CorrespondenceRow))
}

export async function deleteCorrespondence(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('deleteCorrespondence requires Supabase to be configured.')
  }
  const db = getSupabaseAdmin()
  const { error } = await db.from('correspondence').delete().eq('id', id)
  if (error) throw new Error(`deleteCorrespondence(${id}) failed: ${error.message}`)
}
