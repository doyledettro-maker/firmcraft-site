import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export type OpportunityStage =
  | 'qualified'
  | 'discovery'
  | 'pilot_scoped'
  | 'proposal'
  | 'closed_won'
  | 'closed_lost'
  | 'parked'

export const OPPORTUNITY_STAGES: OpportunityStage[] = [
  'qualified',
  'discovery',
  'pilot_scoped',
  'proposal',
  'closed_won',
  'closed_lost',
  'parked',
]

export type OpportunityPriority = 'low' | 'medium' | 'high'

export const OPPORTUNITY_PRIORITIES: OpportunityPriority[] = ['low', 'medium', 'high']

export type OpportunityPlanTier = 'solo' | 'team' | 'pro' | 'pilot'

export const OPPORTUNITY_PLAN_TIERS: OpportunityPlanTier[] = ['solo', 'team', 'pro', 'pilot']

/** Stages that keep an opportunity "on the board" (blocks duplicates per company). */
export const NON_CLOSED_STAGES: OpportunityStage[] = [
  'qualified',
  'discovery',
  'pilot_scoped',
  'proposal',
  'parked',
]

export type Opportunity = {
  id: string
  companyId: string
  primaryContactId: string | null
  name: string
  stage: OpportunityStage
  priority: OpportunityPriority
  specialAttention: boolean
  expectedCloseStart: string | null
  expectedCloseEnd: string | null
  estimatedValue: number | null
  planTier: OpportunityPlanTier | null
  confidence: number | null
  owner: string | null
  nextAction: string | null
  nextActionDueAt: string | null
  useCase: string | null
  notes: string | null
  lostReason: string | null
  closedAt: string | null
  createdAt: string
  updatedAt: string
}

export type OpportunityCompany = {
  id: string
  companyName: string
  industry: string | null
  city: string | null
  state: string | null
  phone: string | null
  website: string | null
  status: string
  segment: string
  assignedTo: string | null
  notes: string | null
}

export type OpportunityContact = {
  id: string
  contactName: string | null
  title: string | null
  email: string | null
  phone: string | null
  status: string
}

export type OpportunityWithRelations = Opportunity & {
  company: OpportunityCompany
  primaryContact: OpportunityContact | null
  /** Latest correspondence timestamp for the company; merged in by callers. */
  lastTouchAt: string | null
}

type OpportunityRow = {
  id: string
  company_id: string
  primary_contact_id: string | null
  name: string
  stage: OpportunityStage
  priority: OpportunityPriority
  special_attention: boolean
  expected_close_start: string | null
  expected_close_end: string | null
  estimated_value: number | string | null
  plan_tier: OpportunityPlanTier | null
  confidence: number | null
  owner: string | null
  next_action: string | null
  next_action_due_at: string | null
  use_case: string | null
  notes: string | null
  lost_reason: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
}

type OpportunityRowWithRelations = OpportunityRow & {
  companies: Record<string, unknown> | null
  primary_contact: Record<string, unknown> | null
}

export type OpportunityInput = {
  companyId: string
  primaryContactId?: string | null
  name: string
  stage?: OpportunityStage
  priority?: OpportunityPriority
  specialAttention?: boolean
  expectedCloseStart?: string | null
  expectedCloseEnd?: string | null
  estimatedValue?: number | null
  planTier?: OpportunityPlanTier | null
  confidence?: number | null
  owner?: string | null
  nextAction?: string | null
  nextActionDueAt?: string | null
  useCase?: string | null
  notes?: string | null
}

export type OpportunityUpdate = Partial<OpportunityInput> & {
  lostReason?: string | null
  closedAt?: string | null
}

function rowToOpportunity(row: OpportunityRow): Opportunity {
  return {
    id: row.id,
    companyId: row.company_id,
    primaryContactId: row.primary_contact_id,
    name: row.name,
    stage: row.stage,
    priority: row.priority,
    specialAttention: row.special_attention,
    expectedCloseStart: row.expected_close_start,
    expectedCloseEnd: row.expected_close_end,
    estimatedValue: row.estimated_value == null ? null : Number(row.estimated_value),
    planTier: row.plan_tier,
    confidence: row.confidence,
    owner: row.owner,
    nextAction: row.next_action,
    nextActionDueAt: row.next_action_due_at,
    useCase: row.use_case,
    notes: row.notes,
    lostReason: row.lost_reason,
    closedAt: row.closed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function rowToOpportunityWithRelations(row: OpportunityRowWithRelations): OpportunityWithRelations {
  const c = row.companies ?? {}
  const p = row.primary_contact
  return {
    ...rowToOpportunity(row),
    company: {
      id: (c.id as string) ?? row.company_id,
      companyName: (c.company_name as string) ?? '',
      industry: (c.industry as string | null) ?? null,
      city: (c.city as string | null) ?? null,
      state: (c.state as string | null) ?? null,
      phone: (c.phone as string | null) ?? null,
      website: (c.website as string | null) ?? null,
      status: (c.status as string) ?? 'active',
      segment: (c.segment as string) ?? 'small',
      assignedTo: (c.assigned_to as string | null) ?? null,
      notes: (c.notes as string | null) ?? null,
    },
    primaryContact: p
      ? {
          id: p.id as string,
          contactName: (p.contact_name as string | null) ?? null,
          title: (p.title as string | null) ?? null,
          email: (p.email as string | null) ?? null,
          phone: (p.phone as string | null) ?? null,
          status: (p.status as string) ?? 'draft',
        }
      : null,
    lastTouchAt: null,
  }
}

function inputToRow(input: OpportunityInput | OpportunityUpdate): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if ('companyId' in input && input.companyId !== undefined) row.company_id = input.companyId
  if ('primaryContactId' in input && input.primaryContactId !== undefined) row.primary_contact_id = input.primaryContactId
  if ('name' in input && input.name !== undefined) row.name = input.name
  if ('stage' in input && input.stage !== undefined) row.stage = input.stage
  if ('priority' in input && input.priority !== undefined) row.priority = input.priority
  if ('specialAttention' in input && input.specialAttention !== undefined) row.special_attention = input.specialAttention
  if ('expectedCloseStart' in input && input.expectedCloseStart !== undefined) row.expected_close_start = input.expectedCloseStart
  if ('expectedCloseEnd' in input && input.expectedCloseEnd !== undefined) row.expected_close_end = input.expectedCloseEnd
  if ('estimatedValue' in input && input.estimatedValue !== undefined) row.estimated_value = input.estimatedValue
  if ('planTier' in input && input.planTier !== undefined) row.plan_tier = input.planTier
  if ('confidence' in input && input.confidence !== undefined) row.confidence = input.confidence
  if ('owner' in input && input.owner !== undefined) row.owner = input.owner
  if ('nextAction' in input && input.nextAction !== undefined) row.next_action = input.nextAction
  if ('nextActionDueAt' in input && input.nextActionDueAt !== undefined) row.next_action_due_at = input.nextActionDueAt
  if ('useCase' in input && input.useCase !== undefined) row.use_case = input.useCase
  if ('notes' in input && input.notes !== undefined) row.notes = input.notes
  if ('lostReason' in input && input.lostReason !== undefined) row.lost_reason = input.lostReason
  if ('closedAt' in input && input.closedAt !== undefined) row.closed_at = input.closedAt
  return row
}

/**
 * True when the opportunities table hasn't been migrated yet (42P01 =
 * undefined_table from Postgres; PGRST205 = PostgREST schema-cache miss).
 * Read paths treat this as "no opportunities yet" so the admin can deploy
 * ahead of the migration without taking down the dashboard/outreach pages.
 */
function isMissingTableError(error: { code?: string; message: string }): boolean {
  return error.code === '42P01' || error.code === 'PGRST205'
}

const OPPORTUNITY_WITH_RELATIONS_SELECT = `
  *,
  companies (
    id, company_name, industry, city, state, phone, website,
    status, segment, assigned_to, notes
  ),
  primary_contact:contacts (
    id, contact_name, title, email, phone, status
  )
`

export async function getOpportunities(
  opts: { openOnly?: boolean } = {},
): Promise<OpportunityWithRelations[]> {
  if (!isSupabaseConfigured()) return []
  const db = getSupabaseAdmin()
  let query = db
    .from('opportunities')
    .select(OPPORTUNITY_WITH_RELATIONS_SELECT)
    .order('created_at', { ascending: false })
  if (opts.openOnly) {
    query = query.in('stage', NON_CLOSED_STAGES)
  }
  const { data, error } = await query
  if (error) {
    if (isMissingTableError(error)) return []
    throw new Error(`getOpportunities failed: ${error.message}`)
  }
  return ((data ?? []) as unknown as OpportunityRowWithRelations[]).map((row) =>
    rowToOpportunityWithRelations(row),
  )
}

export async function getOpportunity(id: string): Promise<OpportunityWithRelations | undefined> {
  if (!isSupabaseConfigured()) return undefined
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('opportunities')
    .select(OPPORTUNITY_WITH_RELATIONS_SELECT)
    .eq('id', id)
    .maybeSingle()
  if (error) {
    if (isMissingTableError(error)) return undefined
    throw new Error(`getOpportunity(${id}) failed: ${error.message}`)
  }
  if (!data) return undefined
  return rowToOpportunityWithRelations(data as unknown as OpportunityRowWithRelations)
}

export async function getOpenOpportunityForCompany(
  companyId: string,
): Promise<Opportunity | undefined> {
  if (!isSupabaseConfigured()) return undefined
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('opportunities')
    .select('*')
    .eq('company_id', companyId)
    .in('stage', NON_CLOSED_STAGES)
    .maybeSingle()
  if (error) {
    if (isMissingTableError(error)) return undefined
    throw new Error(`getOpenOpportunityForCompany failed: ${error.message}`)
  }
  if (!data) return undefined
  return rowToOpportunity(data as OpportunityRow)
}

export async function createOpportunity(input: OpportunityInput): Promise<Opportunity> {
  if (!isSupabaseConfigured()) {
    throw new Error('createOpportunity requires Supabase to be configured.')
  }
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('opportunities')
    .insert(inputToRow(input))
    .select('*')
    .single()
  if (error) throw new Error(`createOpportunity failed: ${error.message}`)
  return rowToOpportunity(data as OpportunityRow)
}

export async function updateOpportunity(id: string, input: OpportunityUpdate): Promise<Opportunity> {
  if (!isSupabaseConfigured()) {
    throw new Error('updateOpportunity requires Supabase to be configured.')
  }
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('opportunities')
    .update(inputToRow(input))
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(`updateOpportunity(${id}) failed: ${error.message}`)
  return rowToOpportunity(data as OpportunityRow)
}

export async function deleteOpportunity(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('deleteOpportunity requires Supabase to be configured.')
  }
  const db = getSupabaseAdmin()
  const { error } = await db.from('opportunities').delete().eq('id', id)
  if (error) throw new Error(`deleteOpportunity(${id}) failed: ${error.message}`)
}
