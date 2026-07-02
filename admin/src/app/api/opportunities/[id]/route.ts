import { NextResponse } from 'next/server'
import {
  deleteOpportunity,
  getOpportunity,
  updateOpportunity,
  OPPORTUNITY_PLAN_TIERS,
  OPPORTUNITY_PRIORITIES,
  OPPORTUNITY_STAGES,
  type OpportunityPlanTier,
  type OpportunityPriority,
  type OpportunityStage,
  type OpportunityUpdate,
} from '@/lib/db/opportunities'
import { getContactsForCompany } from '@/lib/db/contacts'
import { getCorrespondenceForCompany } from '@/lib/db/correspondence'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const opportunity = await getOpportunity(params.id)
    if (!opportunity) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const [contacts, correspondence] = await Promise.all([
      getContactsForCompany(opportunity.companyId),
      getCorrespondenceForCompany(opportunity.companyId),
    ])
    return NextResponse.json({ opportunity, contacts, correspondence })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

const CLOSED_STAGES: OpportunityStage[] = ['closed_won', 'closed_lost']

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Body must be an object' }, { status: 400 })
  }
  const r = body as Record<string, unknown>
  const update: OpportunityUpdate = {}

  if ('name' in r) {
    const name = String(r.name ?? '').trim()
    if (!name) return NextResponse.json({ error: 'name cannot be empty' }, { status: 400 })
    update.name = name
  }
  if ('primaryContactId' in r) update.primaryContactId = r.primaryContactId == null ? null : String(r.primaryContactId)
  if ('stage' in r) {
    const s = r.stage as OpportunityStage
    if (!OPPORTUNITY_STAGES.includes(s)) {
      return NextResponse.json({ error: `Invalid stage: ${String(s)}` }, { status: 400 })
    }
    update.stage = s
  }
  if ('priority' in r) {
    const p = r.priority as OpportunityPriority
    if (!OPPORTUNITY_PRIORITIES.includes(p)) {
      return NextResponse.json({ error: `Invalid priority: ${String(p)}` }, { status: 400 })
    }
    update.priority = p
  }
  if ('planTier' in r) {
    if (r.planTier == null) {
      update.planTier = null
    } else {
      const t = r.planTier as OpportunityPlanTier
      if (!OPPORTUNITY_PLAN_TIERS.includes(t)) {
        return NextResponse.json({ error: `Invalid planTier: ${String(t)}` }, { status: 400 })
      }
      update.planTier = t
    }
  }
  if ('specialAttention' in r) update.specialAttention = Boolean(r.specialAttention)
  if ('expectedCloseStart' in r) update.expectedCloseStart = r.expectedCloseStart == null || r.expectedCloseStart === '' ? null : String(r.expectedCloseStart)
  if ('expectedCloseEnd' in r) update.expectedCloseEnd = r.expectedCloseEnd == null || r.expectedCloseEnd === '' ? null : String(r.expectedCloseEnd)
  if ('estimatedValue' in r) update.estimatedValue = r.estimatedValue == null ? null : Number(r.estimatedValue)
  if ('confidence' in r) update.confidence = r.confidence == null ? null : Math.min(100, Math.max(0, Number(r.confidence)))
  if ('owner' in r) update.owner = r.owner == null || String(r.owner).trim() === '' ? null : String(r.owner).trim()
  if ('nextAction' in r) update.nextAction = r.nextAction == null ? null : String(r.nextAction)
  if ('nextActionDueAt' in r) update.nextActionDueAt = r.nextActionDueAt == null || r.nextActionDueAt === '' ? null : String(r.nextActionDueAt)
  if ('useCase' in r) update.useCase = r.useCase == null ? null : String(r.useCase)
  if ('notes' in r) update.notes = r.notes == null ? null : String(r.notes)
  if ('lostReason' in r) update.lostReason = r.lostReason == null ? null : String(r.lostReason)

  try {
    // Stage transitions manage closed_at server-side so clients can't drift:
    // entering a closed stage stamps it, reopening clears it (and lost_reason
    // when leaving closed_lost).
    if (update.stage) {
      const current = await getOpportunity(params.id)
      if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      const wasClosed = CLOSED_STAGES.includes(current.stage)
      const willBeClosed = CLOSED_STAGES.includes(update.stage)
      if (willBeClosed && !wasClosed) update.closedAt = new Date().toISOString()
      if (!willBeClosed && wasClosed) update.closedAt = null
      if (update.stage !== 'closed_lost' && !('lostReason' in r)) update.lostReason = null
    }
    const opportunity = await updateOpportunity(params.id, update)
    return NextResponse.json({ opportunity })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await deleteOpportunity(params.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
