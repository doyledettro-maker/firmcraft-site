import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getClientHealthOverview } from '@/lib/db/health-beacons'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Authorize a read: an authenticated Clerk session (the admin browser) OR a
 * `Bearer <BEACON_TOKEN>` for server-to-server callers (the Hermes client-health
 * skill). The route is listed as public in middleware so the bearer path isn't
 * pre-empted by a login redirect; this function is the real gate.
 */
async function authorized(req: Request): Promise<boolean> {
  try {
    const { userId } = await auth()
    if (userId) return true
  } catch {
    // Clerk not configured / no session — fall through to token check.
  }
  const expected = process.env.BEACON_TOKEN
  if (!expected) return false
  const header = req.headers.get('authorization') || ''
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : ''
  return token !== '' && token === expected
}

/**
 * Latest health for every client (reporting or expected-but-silent), with a
 * derived traffic-light. Powers the admin /health grid.
 */
export async function GET(req: Request) {
  if (!(await authorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
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
