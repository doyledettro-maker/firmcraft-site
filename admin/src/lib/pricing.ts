import type { PlanTier } from './survey'

export type PlanPricing = {
  tier: PlanTier
  name: string
  /** Recurring monthly subscription (USD) */
  monthlyPrice: number
  /** AI token allowance included in the monthly price (USD of token spend at cost) */
  tokenInclusion: number
  /** One-time setup fee (USD) */
  setupFee: number
}

export const PLAN_PRICING: Record<PlanTier, PlanPricing> = {
  // Operator rebrand (current naming).
  solo:  { tier: 'solo',  name: 'Operator Solo',  monthlyPrice: 399,  tokenInclusion: 100, setupFee: 1000 },
  team:  { tier: 'team',  name: 'Operator Team',  monthlyPrice: 799,  tokenInclusion: 200, setupFee: 2000 },
  pro:   { tier: 'pro',   name: 'Operator Pro',   monthlyPrice: 1499, tokenInclusion: 300, setupFee: 3500 },
  pilot: { tier: 'pilot', name: 'Operator Pilot', monthlyPrice: 50,   tokenInclusion: 20,  setupFee: 0 },
  // Legacy aliases — kept so old records render. Do not use for new clients.
  spark: { tier: 'spark', name: 'Spark (legacy)', monthlyPrice: 399,  tokenInclusion: 100, setupFee: 1000 },
  flow:  { tier: 'flow',  name: 'Flow (legacy)',  monthlyPrice: 799,  tokenInclusion: 200, setupFee: 2000 },
  forge: { tier: 'forge', name: 'Forge (legacy)', monthlyPrice: 1499, tokenInclusion: 300, setupFee: 3500 },
}

/** Multiplier applied to actual token cost when billing overage usage. */
export const OVERAGE_MARKUP = 1.2

/** Standard partner share (30%). */
export const PARTNER_COMMISSION_RATE = 0.3
