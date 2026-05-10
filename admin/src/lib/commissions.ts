import type { PlanTier } from './survey'
import { OVERAGE_MARKUP, PARTNER_COMMISSION_RATE, PLAN_PRICING } from './pricing'

/**
 * Inputs for computing a partner commission for a single client-month.
 *
 * `tokenCost` is the actual cost (at our cost, before markup) of AI tokens
 * the client consumed in the month. `tokenOverageCharge` is the dollar
 * amount we billed the client for overage on top of the inclusion — i.e.
 * (tokenCost - tokenInclusion) * OVERAGE_MARKUP when tokenCost > inclusion.
 * Pass it in explicitly so callers can match the actual invoice.
 */
export type CommissionInput = {
  planTier: PlanTier
  /** Actual token cost (at cost) consumed in the month, in USD. */
  tokenCost: number
  /** Dollars billed to the client for overage usage (1.2x markup), in USD. */
  tokenOverageCharge: number
  /** Override the default 30% partner share if needed. */
  rate?: number
}

export type CommissionBreakdown = {
  /** Commission on subscription portion, net of token inclusion. */
  nonTokenCommission: number
  /** Commission on the token-inclusion margin (when client uses < inclusion). */
  inclusionMarginCommission: number
  /** Commission on the 20% margin embedded in overage charges. */
  overageMarginCommission: number
  /** Sum of all three. */
  total: number
}

/**
 * Partners get 30% commission, computed from three streams:
 *
 *   1. Non-token revenue: (subscription_price - token_inclusion) * rate
 *   2. Inclusion margin: when actual token cost < inclusion, partner gets
 *      rate * (inclusion - actual_cost) — the unused inclusion is margin.
 *   3. Overage margin: overage is billed at 1.2x cost, so 20% of every overage
 *      dollar is margin. Partner gets rate * overage_charge * (0.2 / 1.2).
 *
 * Example: Spark ($399/mo, $100 inclusion), client uses $40 of tokens, no overage:
 *   - non-token        = (399 - 100) * 0.30 = 89.70
 *   - inclusion margin = (100 - 40) * 0.30  = 18.00
 *   - overage margin   = 0
 *   - total            = 107.70
 */
export function calculateCommission(input: CommissionInput): CommissionBreakdown {
  const { planTier, tokenCost, tokenOverageCharge } = input
  const rate = input.rate ?? PARTNER_COMMISSION_RATE
  const plan = PLAN_PRICING[planTier]

  const nonTokenCommission = (plan.monthlyPrice - plan.tokenInclusion) * rate

  const inclusionUnused = Math.max(0, plan.tokenInclusion - tokenCost)
  const inclusionMarginCommission = inclusionUnused * rate

  const overageMarginShare = (OVERAGE_MARKUP - 1) / OVERAGE_MARKUP // 0.2 / 1.2 ≈ 0.1667
  const overageMarginCommission = tokenOverageCharge * overageMarginShare * rate

  const total = nonTokenCommission + inclusionMarginCommission + overageMarginCommission

  return {
    nonTokenCommission: round2(nonTokenCommission),
    inclusionMarginCommission: round2(inclusionMarginCommission),
    overageMarginCommission: round2(overageMarginCommission),
    total: round2(total),
  }
}

/** Aggregate a list of breakdowns into a single total. */
export function sumCommissions(breakdowns: CommissionBreakdown[]): CommissionBreakdown {
  return breakdowns.reduce<CommissionBreakdown>(
    (acc, b) => ({
      nonTokenCommission: round2(acc.nonTokenCommission + b.nonTokenCommission),
      inclusionMarginCommission: round2(acc.inclusionMarginCommission + b.inclusionMarginCommission),
      overageMarginCommission: round2(acc.overageMarginCommission + b.overageMarginCommission),
      total: round2(acc.total + b.total),
    }),
    { nonTokenCommission: 0, inclusionMarginCommission: 0, overageMarginCommission: 0, total: 0 },
  )
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}
