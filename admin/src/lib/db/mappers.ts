import type { Client, ClientStatus } from '@/lib/mock-clients'
import type { PlanTier } from '@/lib/survey'

export type SurveyStatus = 'pending' | 'in_progress' | 'submitted' | 'not_applicable'

export type ClientRow = {
  id: string
  name: string
  slug: string | null
  industry: string | null
  status: ClientStatus
  survey_status: SurveyStatus | null
  plan_tier: PlanTier
  contact_name: string | null
  contact_email: string | null
  monthly_price: string | number
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  litellm_key_id: string | null
  vps_ip: string | null
  hermes_port: number | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

const PLAN_DEFAULTS: Record<PlanTier, { seats: number; aiCallsLimit: number }> = {
  // Operator rebrand
  solo:  { seats: 2,  aiCallsLimit: 8000 },
  team:  { seats: 5,  aiCallsLimit: 25000 },
  pro:   { seats: 10, aiCallsLimit: 80000 },
  pilot: { seats: 3,  aiCallsLimit: 4000 },
  // Legacy (kept for backfill safety; new clients never get these)
  spark: { seats: 8,  aiCallsLimit: 8000 },
  flow:  { seats: 15, aiCallsLimit: 25000 },
  forge: { seats: 60, aiCallsLimit: 80000 },
}

export function rowToClient(row: ClientRow): Client {
  const planDefaults = PLAN_DEFAULTS[row.plan_tier] ?? PLAN_DEFAULTS.solo
  return {
    id: row.id,
    name: row.name,
    industry: row.industry ?? '',
    status: row.status,
    planTier: row.plan_tier,
    contactName: row.contact_name ?? '',
    contactEmail: row.contact_email ?? '',
    createdAt: row.created_at,
    monthlyRevenue: Number(row.monthly_price),
    usage: {
      // TODO: activeUsers should come from auth/session data once seats are wired up.
      activeUsers: 0,
      seats: planDefaults.seats,
      // Real values populated by getClient() — these are fallbacks when callers
      // bypass that aggregation (eg. list views).
      aiCallsThisMonth: 0,
      aiCallsLimit: planDefaults.aiCallsLimit,
      skillsActive: 0,
      integrationsConnected: 0,
    },
    survey: {},
  }
}

export type ClientCreateInput = {
  name: string
  industry?: string
  status?: ClientStatus
  planTier?: PlanTier
  contactName?: string
  contactEmail?: string
  monthlyPrice?: number
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  litellmKeyId?: string
  vpsIp?: string
  hermesPort?: number
}

export type ClientUpdateInput = Partial<ClientCreateInput>

export function clientInputToRow(input: ClientCreateInput | ClientUpdateInput) {
  const row: Record<string, unknown> = {}
  if (input.name !== undefined) row.name = input.name
  if (input.industry !== undefined) row.industry = input.industry
  if (input.status !== undefined) row.status = input.status
  if (input.planTier !== undefined) row.plan_tier = input.planTier
  if (input.contactName !== undefined) row.contact_name = input.contactName
  if (input.contactEmail !== undefined) row.contact_email = input.contactEmail
  if (input.monthlyPrice !== undefined) row.monthly_price = input.monthlyPrice
  if (input.stripeCustomerId !== undefined) row.stripe_customer_id = input.stripeCustomerId
  if (input.stripeSubscriptionId !== undefined) row.stripe_subscription_id = input.stripeSubscriptionId
  if (input.litellmKeyId !== undefined) row.litellm_key_id = input.litellmKeyId
  if (input.vpsIp !== undefined) row.vps_ip = input.vpsIp
  if (input.hermesPort !== undefined) row.hermes_port = input.hermesPort
  return row
}
