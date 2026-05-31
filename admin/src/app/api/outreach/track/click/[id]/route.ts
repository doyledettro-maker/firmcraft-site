import { NextResponse } from 'next/server'
import { getProspect, updateProspect } from '@/lib/db/prospects'
import { logTrackingEvent } from '@/lib/db/tracking'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const FALLBACK_DESTINATION = 'https://firmcraft.ai'

function safeDestination(raw: string | null): string {
  if (!raw) return FALLBACK_DESTINATION
  try {
    const u = new URL(raw)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return FALLBACK_DESTINATION
    return u.toString()
  } catch {
    return FALLBACK_DESTINATION
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const url = new URL(req.url)
  const destination = safeDestination(url.searchParams.get('u'))

  try {
    const prospect = await getProspect(params.id)
    if (prospect) {
      const userAgent = req.headers.get('user-agent') ?? ''
      const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        null

      await logTrackingEvent(params.id, 'click', {
        link_url: destination,
        user_agent: userAgent,
        ip,
      })

      const now = new Date().toISOString()
      const patch: Parameters<typeof updateProspect>[1] = { clickedAt: now }
      if (!prospect.openedAt) patch.openedAt = now
      if (prospect.status === 'sent' || prospect.status === 'opened' || prospect.status === 'queued') {
        patch.status = 'clicked'
      }
      await updateProspect(params.id, patch)
    }
  } catch {
    // Swallow — never block the redirect on tracking.
  }

  return NextResponse.redirect(destination, 302)
}
