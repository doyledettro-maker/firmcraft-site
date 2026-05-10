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
  spark: { tier: 'spark', name: 'Spark', monthlyPrice: 399, tokenInclusion: 100, setupFee: 1000 },
  flow: { tier: 'flow', name: 'Flow', monthlyPrice: 799, tokenInclusion: 200, setupFee: 2000 },
  forge: { tier: 'forge', name: 'Forge', monthlyPrice: 1499, tokenInclusion: 300, setupFee: 3500 },
}

/** Multiplier applied to actual token cost when billing overage usage. */
export const OVERAGE_MARKUP = 1.2

/** Standard partner share (30%). */
export const PARTNER_COMMISSION_RATE = 0.3
