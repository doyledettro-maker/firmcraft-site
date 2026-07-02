import { NextResponse } from 'next/server'
import {
  createOpportunity,
  getOpenOpportunityForCompany,
  getOpportunities,
  OPPORTUNITY_PLAN_TIERS,
  OPPORTUNITY_PRIORITIES,
  OPPORTUNITY_STAGES,
  type OpportunityInput,
  type OpportunityPlanTier,
  type OpportunityPriority,
  type OpportunityStage,
} from '@/lib/db/opportunities'
import { getCompany } from '@/lib/db/companies'
import { getLatestTouchByCompany } from '@/lib/db/correspondence'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const opportunities = await getOpportunities()
    const lastTouch = await getLatestTouchByCompany(opportunities.map((o) => o.companyId))
    return NextResponse.json({
      opportunities: opportunities.map((o) => ({
        ...o,
        lastTouchAt: lastTouch[o.companyId] ?? null,
      })),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: Request) {
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

  const companyId = typeof r.companyId === 'string' ? r.companyId : ''
  if (!companyId) {
    return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
  }

  try {
    const company = await getCompany(companyId)
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Opportunities sit on top of outreach — one open opp per company. If one
    // already exists, hand it back so the UI can link instead of duplicating.
    const existing = await getOpenOpportunityForCompany(companyId)
    if (existing) {
      return NextResponse.json(
        { error: 'Company already has an open opportunity', opportunity: existing },
        { status: 409 },
      )
    }

    const input: OpportunityInput = {
      companyId,
      name:
        typeof r.name === 'string' && r.name.trim()
          ? r.name.trim()
          : `${company.companyName} — Managed AI`,
    }
    if ('primaryContactId' in r) input.primaryContactId = r.primaryContactId == null ? null : String(r.primaryContactId)
    if ('stage' in r) {
      const s = r.stage as OpportunityStage
      if (!OPPORTUNITY_STAGES.includes(s)) {
        return NextResponse.json({ error: `Invalid stage: ${String(s)}` }, { status: 400 })
      }
      input.stage = s
    }
    if ('priority' in r) {
      const p = r.priority as OpportunityPriority
      if (!OPPORTUNITY_PRIORITIES.includes(p)) {
        return NextResponse.json({ error: `Invalid priority: ${String(p)}` }, { status: 400 })
      }
      input.priority = p
    }
    if ('planTier' in r && r.planTier != null) {
      const t = r.planTier as OpportunityPlanTier
      if (!OPPORTUNITY_PLAN_TIERS.includes(t)) {
        return NextResponse.json({ error: `Invalid planTier: ${String(t)}` }, { status: 400 })
      }
      input.planTier = t
    }
    if ('specialAttention' in r) input.specialAttention = Boolean(r.specialAttention)
    if ('expectedCloseStart' in r) input.expectedCloseStart = r.expectedCloseStart == null ? null : String(r.expectedCloseStart)
    if ('expectedCloseEnd' in r) input.expectedCloseEnd = r.expectedCloseEnd == null ? null : String(r.expectedCloseEnd)
    if ('estimatedValue' in r) input.estimatedValue = r.estimatedValue == null ? null : Number(r.estimatedValue)
    if ('confidence' in r) input.confidence = r.confidence == null ? null : Math.min(100, Math.max(0, Number(r.confidence)))
    if ('owner' in r) input.owner = r.owner == null || String(r.owner).trim() === '' ? null : String(r.owner).trim()
    if ('nextAction' in r) input.nextAction = r.nextAction == null ? null : String(r.nextAction)
    if ('nextActionDueAt' in r) input.nextActionDueAt = r.nextActionDueAt == null ? null : String(r.nextActionDueAt)
    if ('useCase' in r) input.useCase = r.useCase == null ? null : String(r.useCase)
    if ('notes' in r) input.notes = r.notes == null ? null : String(r.notes)

    const opportunity = await createOpportunity(input)
    return NextResponse.json({ opportunity }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
