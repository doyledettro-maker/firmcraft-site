import { NextResponse } from 'next/server'
import { getJobDetail, resolveTenant, updateJob, type JobPatch } from '@/lib/dispatch/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/dispatch/jobs/:id  → full job detail + status history + customer
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const tenant = await resolveTenant()
  if (!tenant) return NextResponse.json({ error: 'No tenant resolved' }, { status: 404 })
  try {
    const detail = await getJobDetail(tenant.id, params.id)
    if (!detail) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    return NextResponse.json(detail)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load job'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

const ALLOWED_FIELDS: (keyof JobPatch)[] = [
  'technician_id', 'scheduled_start', 'scheduled_end', 'status', 'priority', 'title', 'internal_notes',
]

// PATCH /api/dispatch/jobs/:id  → drag/drop, resize, assign, status change, cancel
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const tenant = await resolveTenant()
  if (!tenant) return NextResponse.json({ error: 'No tenant resolved' }, { status: 404 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const patch: JobPatch = {}
  for (const key of ALLOWED_FIELDS) {
    if (key in body) (patch as Record<string, unknown>)[key] = body[key]
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 })
  }

  try {
    const job = await updateJob(tenant.id, params.id, patch)
    return NextResponse.json(job)
  } catch (e) {
    // The status-transition trigger raises on invalid moves — surface as 422 so
    // the client can show the rejection (e.g. "created → completed not allowed").
    const message = e instanceof Error ? e.message : 'Update failed'
    const isTransition = /transition|status/i.test(message)
    return NextResponse.json({ error: message }, { status: isTransition ? 422 : 500 })
  }
}
