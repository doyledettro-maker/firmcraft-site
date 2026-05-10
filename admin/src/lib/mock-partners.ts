import type { Client } from './mock-clients'
import { mockClients } from './mock-clients'
import type { CommissionBreakdown } from './commissions'
import { calculateCommission, sumCommissions } from './commissions'
import { PLAN_PRICING } from './pricing'

export type PartnerStatus = 'active' | 'paused'

export type Partner = {
  id: string
  name: string
  /** Slug used in the partner portal URL and login. */
  slug: string
  contactName: string
  contactEmail: string
  status: PartnerStatus
  createdAt: string
  /** 0.30 default. Each partner can have a custom rate. */
  commissionRate: number
  notes?: string
}

export const mockPartners: Partner[] = [
  {
    id: 'prt_north_ridge',
    name: 'North Ridge Advisors',
    slug: 'north-ridge',
    contactName: 'Hannah Whitmore',
    contactEmail: 'hannah@northridge.partners',
    status: 'active',
    createdAt: '2025-12-01T15:00:00Z',
    commissionRate: 0.3,
    notes: 'Boutique consulting firm focused on legal & professional services.',
  },
  {
    id: 'prt_lattice_group',
    name: 'Lattice Group',
    slug: 'lattice',
    contactName: 'Mateo Alvarez',
    contactEmail: 'mateo@latticegroup.io',
    status: 'active',
    createdAt: '2026-01-18T17:30:00Z',
    commissionRate: 0.3,
    notes: 'Architecture & AEC vertical specialist.',
  },
  {
    id: 'prt_silvercreek',
    name: 'Silvercreek Operations',
    slug: 'silvercreek',
    contactName: 'Priya Raman',
    contactEmail: 'priya@silvercreek.ops',
    status: 'paused',
    createdAt: '2025-08-05T19:45:00Z',
    commissionRate: 0.3,
  },
]

/**
 * Maps client id → partner id. Not all clients have partners
 * (some are direct sales). This is the source of truth for
 * the partner_id field on clients during the mock-data phase.
 */
export const clientPartnerLinks: Record<string, string> = {
  cli_acme_law: 'prt_north_ridge',
  cli_summit_cpa: 'prt_north_ridge',
  cli_brightside_arch: 'prt_lattice_group',
  cli_prairie_dental: 'prt_lattice_group',
  // cli_redwood_pe — direct sale (no partner)
  // cli_oakhill_realty — direct sale (no partner)
}

/** Mock current-month token usage for commission examples (USD, at cost). */
export const mockTokenUsage: Record<string, { tokenCost: number; tokenOverageCharge: number }> = {
  cli_acme_law: { tokenCost: 145, tokenOverageCharge: 54 }, // Flow inclusion=200… overage charge example
  cli_summit_cpa: { tokenCost: 38, tokenOverageCharge: 0 }, // under inclusion
  cli_brightside_arch: { tokenCost: 0, tokenOverageCharge: 0 }, // onboarding, no usage
  cli_redwood_pe: { tokenCost: 412, tokenOverageCharge: 134 }, // Forge, with overage
  cli_oakhill_realty: { tokenCost: 0, tokenOverageCharge: 0 }, // suspended
  cli_prairie_dental: { tokenCost: 0, tokenOverageCharge: 0 }, // onboarding
}

export function getPartner(id: string): Partner | undefined {
  return mockPartners.find((p) => p.id === id)
}

export function getPartnerBySlug(slug: string): Partner | undefined {
  return mockPartners.find((p) => p.slug === slug)
}

export function getPartnerForClient(clientId: string): Partner | undefined {
  const partnerId = clientPartnerLinks[clientId]
  if (!partnerId) return undefined
  return getPartner(partnerId)
}

export function getClientsForPartner(partnerId: string): Client[] {
  const ids = Object.entries(clientPartnerLinks)
    .filter(([, pid]) => pid === partnerId)
    .map(([cid]) => cid)
  return mockClients.filter((c) => ids.includes(c.id))
}

export type ClientCommissionRow = {
  client: Client
  /** null when client is not billable yet (onboarding/suspended) */
  breakdown: CommissionBreakdown | null
  tokenCost: number
  tokenOverageCharge: number
}

/**
 * Compute the current-month commission breakdown for every client
 * assigned to a given partner. Onboarding/suspended clients return
 * a null breakdown so the UI can render "—" for them.
 */
export function commissionRowsForPartner(partnerId: string): ClientCommissionRow[] {
  const partner = getPartner(partnerId)
  const rate = partner?.commissionRate ?? 0.3
  return getClientsForPartner(partnerId).map((client) => {
    const usage = mockTokenUsage[client.id] ?? { tokenCost: 0, tokenOverageCharge: 0 }
    const billable = client.status === 'active'
    const breakdown = billable
      ? calculateCommission({
          planTier: client.planTier,
          tokenCost: usage.tokenCost,
          tokenOverageCharge: usage.tokenOverageCharge,
          rate,
        })
      : null
    return { client, breakdown, tokenCost: usage.tokenCost, tokenOverageCharge: usage.tokenOverageCharge }
  })
}

export function partnerTotalCommission(partnerId: string): CommissionBreakdown {
  const rows = commissionRowsForPartner(partnerId).map((r) => r.breakdown).filter((b): b is CommissionBreakdown => b !== null)
  return sumCommissions(rows)
}

export function partnerClientCount(partnerId: string): number {
  return getClientsForPartner(partnerId).length
}

/** Plan-by-plan summary for a partner's book of business. */
export function partnerPlanMix(partnerId: string): Array<{ tier: keyof typeof PLAN_PRICING; count: number }> {
  const clients = getClientsForPartner(partnerId)
  const out: Record<string, number> = { spark: 0, flow: 0, forge: 0 }
  for (const c of clients) out[c.planTier] = (out[c.planTier] ?? 0) + 1
  return (Object.keys(PLAN_PRICING) as Array<keyof typeof PLAN_PRICING>).map((tier) => ({ tier, count: out[tier] ?? 0 }))
}
