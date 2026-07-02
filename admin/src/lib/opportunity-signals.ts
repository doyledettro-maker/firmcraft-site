// Client-safe opportunity domain helpers: stage labels, derived signals, and
// pipeline rollups. No Supabase imports — usable from server pages, API
// routes, and 'use client' components alike.

import type {
  Opportunity,
  OpportunityPlanTier,
  OpportunityPriority,
  OpportunityStage,
} from '@/lib/db/opportunities'

export const STAGE_LABELS: Record<OpportunityStage, string> = {
  qualified: 'Qualified',
  discovery: 'Discovery / Meeting',
  pilot_scoped: 'Pilot Scoped',
  proposal: 'Proposal / Decision',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
  parked: 'Parked',
}

/** Working pipeline — the always-visible kanban columns. */
export const ACTIVE_STAGES: OpportunityStage[] = [
  'qualified',
  'discovery',
  'pilot_scoped',
  'proposal',
]

/** Revealed by the "closed & parked" toggle. */
export const RESOLVED_STAGES: OpportunityStage[] = ['closed_won', 'closed_lost', 'parked']

export const PRIORITY_LABELS: Record<OpportunityPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export const PLAN_TIER_LABELS: Record<OpportunityPlanTier, string> = {
  solo: 'Operator Solo',
  team: 'Operator Team',
  pro: 'Operator Pro',
  pilot: 'Operator Pilot',
}

export function isActiveStage(stage: OpportunityStage): boolean {
  return ACTIVE_STAGES.includes(stage)
}

/** Days without a correspondence touch before an open opp reads as stale. */
export const STALE_DAYS = 14

/** Close window within this many days counts as "closing soon". */
export const CLOSING_SOON_DAYS = 45

export type OpportunitySignal = 'needs_attention' | 'stale' | 'closing_soon'

type SignalInput = Pick<
  Opportunity,
  'stage' | 'specialAttention' | 'nextActionDueAt' | 'expectedCloseStart' | 'expectedCloseEnd' | 'createdAt'
> & { lastTouchAt: string | null }

export function isNextActionOverdue(opp: SignalInput, now = new Date()): boolean {
  return Boolean(opp.nextActionDueAt && new Date(opp.nextActionDueAt) < now)
}

/** Special-attention opp with a missing or overdue next action. */
export function needsAttention(opp: SignalInput, now = new Date()): boolean {
  if (!isActiveStage(opp.stage) || !opp.specialAttention) return false
  return !opp.nextActionDueAt || isNextActionOverdue(opp, now)
}

/** No correspondence or note in STALE_DAYS (falls back to opp age). */
export function isStale(opp: SignalInput, now = new Date()): boolean {
  if (!isActiveStage(opp.stage)) return false
  const reference = opp.lastTouchAt ?? opp.createdAt
  const ageDays = (now.getTime() - new Date(reference).getTime()) / 86_400_000
  return ageDays > STALE_DAYS
}

/** Close window starts within CLOSING_SOON_DAYS, or we're already inside it. */
export function isClosingSoon(opp: SignalInput, now = new Date()): boolean {
  if (!isActiveStage(opp.stage)) return false
  const start = opp.expectedCloseStart ? new Date(opp.expectedCloseStart) : null
  const end = opp.expectedCloseEnd ? new Date(opp.expectedCloseEnd) : null
  const anchor = start ?? end
  if (!anchor) return false
  if (end && end < now) return true // window already slipped — even more urgent
  const horizon = new Date(now.getTime() + CLOSING_SOON_DAYS * 86_400_000)
  return anchor <= horizon
}

export function signalsFor(opp: SignalInput, now = new Date()): OpportunitySignal[] {
  const out: OpportunitySignal[] = []
  if (needsAttention(opp, now)) out.push('needs_attention')
  if (isStale(opp, now)) out.push('stale')
  if (isClosingSoon(opp, now)) out.push('closing_soon')
  return out
}

export function formatCloseWindow(start: string | null, end: string | null): string {
  const fmt = (iso: string) =>
    // Date-only strings parse as UTC midnight; render in UTC so the day is stable.
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  if (start && end) return `${fmt(start)} – ${fmt(end)}`
  if (start) return `from ${fmt(start)}`
  if (end) return `by ${fmt(end)}`
  return '—'
}

export type PipelineSummary = {
  openCount: number
  specialAttentionCount: number
  closingSoonCount: number
  pipelineValue: number
  weightedValue: number
}

export function pipelineSummary(
  opps: Array<SignalInput & Pick<Opportunity, 'estimatedValue' | 'confidence'>>,
  now = new Date(),
): PipelineSummary {
  const active = opps.filter((o) => isActiveStage(o.stage))
  return {
    openCount: active.length,
    specialAttentionCount: active.filter((o) => o.specialAttention).length,
    closingSoonCount: active.filter((o) => isClosingSoon(o, now)).length,
    pipelineValue: active.reduce((s, o) => s + (o.estimatedValue ?? 0), 0),
    weightedValue: active.reduce(
      (s, o) => s + (o.estimatedValue ?? 0) * ((o.confidence ?? 50) / 100),
      0,
    ),
  }
}
