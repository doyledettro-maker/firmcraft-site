import { NextResponse } from 'next/server'
import { getProspect, updateProspect } from '@/lib/db/prospects'
import { logTrackingEvent } from '@/lib/db/tracking'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const prospect = await getProspect(params.id)
    if (!prospect) {
      return NextResponse.json({ ok: true, found: false })
    }

    const userAgent = req.headers.get('user-agent') ?? ''
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      null

    await logTrackingEvent(prospect.id, 'unsubscribe', { user_agent: userAgent, ip })

    if (prospect.status !== 'unsubscribed') {
      await updateProspect(prospect.id, {
        status: 'unsubscribed',
        unsubscribedAt: new Date().toISOString(),
      })
    }

    return NextResponse.json({ ok: true, found: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
