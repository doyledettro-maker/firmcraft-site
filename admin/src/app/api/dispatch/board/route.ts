import { NextResponse } from 'next/server'
import { getBoardData, resolveTenant } from '@/lib/dispatch/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/dispatch/board?from=ISO&to=ISO
// Board snapshot (tenant, technicians, job types, jobs) for the active window.
// Also the refetch target for realtime/polling updates.
export async function GET(req: Request) {
  const tenant = await resolveTenant()
  if (!tenant) {
    return NextResponse.json({ error: 'No tenant resolved' }, { status: 404 })
  }
  const url = new URL(req.url)
  const from = url.searchParams.get('from') ?? undefined
  const to = url.searchParams.get('to') ?? undefined

  try {
    const board = await getBoardData(tenant.id, { from, to })
    if (!board) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    return NextResponse.json(board)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load board'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
