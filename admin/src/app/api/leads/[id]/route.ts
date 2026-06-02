import { NextResponse } from 'next/server'
import { updateLead, LEAD_STATUSES, type LeadStatus, type LeadUpdate } from '@/lib/db/leads'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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
  const update: LeadUpdate = {}

  if ('status' in r) {
    const s = r.status as LeadStatus
    if (!LEAD_STATUSES.includes(s)) {
      return NextResponse.json({ error: `Invalid status: ${String(s)}` }, { status: 400 })
    }
    update.status = s
  }
  if ('notes' in r) {
    update.notes = r.notes == null ? null : String(r.notes)
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  try {
    const lead = await updateLead(params.id, update)
    return NextResponse.json({ lead })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
