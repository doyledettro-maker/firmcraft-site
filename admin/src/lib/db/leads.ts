import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'archived'

export const LEAD_STATUSES: LeadStatus[] = [
  'new',
  'contacted',
  'qualified',
  'converted',
  'archived',
]

export type LeadSegment = 'small' | 'midmarket' | 'pe'

export type Lead = {
  id: string
  name: string
  email: string
  company: string | null
  phone: string | null
  message: string | null
  source: string | null
  status: LeadStatus
  segment: LeadSegment | null
  notes: string | null
  createdAt: string
  // Set by lead → opportunity conversion (see /api/leads/[id]/convert).
  companyId: string | null
  contactId: string | null
  opportunityId: string | null
}

type LeadRow = {
  id: string
  name: string
  email: string
  company: string | null
  phone: string | null
  message: string | null
  source: string | null
  status: LeadStatus
  segment: LeadSegment | null
  notes: string | null
  created_at: string
  company_id?: string | null
  contact_id?: string | null
  opportunity_id?: string | null
}

function rowToLead(row: LeadRow): Lead {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    company: row.company,
    phone: row.phone,
    message: row.message,
    source: row.source,
    status: row.status,
    segment: row.segment,
    notes: row.notes,
    createdAt: row.created_at,
    companyId: row.company_id ?? null,
    contactId: row.contact_id ?? null,
    opportunityId: row.opportunity_id ?? null,
  }
}

export async function getLeads(): Promise<Lead[]> {
  if (!isSupabaseConfigured()) return []
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('inbound_leads')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(`getLeads failed: ${error.message}`)
  return (data ?? []).map((r) => rowToLead(r as LeadRow))
}

export async function getLead(id: string): Promise<Lead | undefined> {
  if (!isSupabaseConfigured()) return undefined
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('inbound_leads')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(`getLead(${id}) failed: ${error.message}`)
  if (!data) return undefined
  return rowToLead(data as LeadRow)
}

export type LeadUpdate = {
  status?: LeadStatus
  notes?: string | null
  companyId?: string | null
  contactId?: string | null
  opportunityId?: string | null
}

export async function updateLead(id: string, update: LeadUpdate): Promise<Lead> {
  if (!isSupabaseConfigured()) {
    throw new Error('updateLead requires Supabase to be configured.')
  }
  const db = getSupabaseAdmin()
  const row: Record<string, unknown> = {}
  if (update.status !== undefined) row.status = update.status
  if (update.notes !== undefined) row.notes = update.notes
  if (update.companyId !== undefined) row.company_id = update.companyId
  if (update.contactId !== undefined) row.contact_id = update.contactId
  if (update.opportunityId !== undefined) row.opportunity_id = update.opportunityId
  const { data, error } = await db
    .from('inbound_leads')
    .update(row)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(`updateLead(${id}) failed: ${error.message}`)
  return rowToLead(data as LeadRow)
}

export type LeadStats = {
  total: number
  byStatus: Record<LeadStatus, number>
}

export function getLeadStats(leads: Lead[]): LeadStats {
  const byStatus = {
    new: 0,
    contacted: 0,
    qualified: 0,
    converted: 0,
    archived: 0,
  } as Record<LeadStatus, number>
  for (const l of leads) byStatus[l.status]++
  return { total: leads.length, byStatus }
}
