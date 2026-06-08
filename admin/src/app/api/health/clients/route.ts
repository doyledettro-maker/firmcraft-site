import { NextResponse } from 'next/server'
import { getClientHealthOverview } from '@/lib/db/health-beacons'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Latest health for every client (reporting or expected-but-silent), with a
 * derived traffic-light. Powers the admin /health grid.
 */
export async function GET() {
  try {
    const clients = await getClientHealthOverview()
    const counts = clients.reduce(
      (acc, c) => {
        acc[c.light]++
        return acc
      },
      { green: 0, yellow: 0, red: 0 } as Record<'green' | 'yellow' | 'red', number>,
    )
    return NextResponse.json(
      { checkedAt: new Date().toISOString(), counts, clients },
      { headers: { 'cache-control': 'no-store, max-age=0' } },
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
