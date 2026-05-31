import { NextResponse } from 'next/server'
import { getProspect, updateProspect } from '@/lib/db/prospects'
import { logTrackingEvent } from '@/lib/db/tracking'
import { TRANSPARENT_PIXEL } from '@/lib/outreach'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const PIXEL_HEADERS: Record<string, string> = {
  'content-type': 'image/gif',
  'content-length': String(TRANSPARENT_PIXEL.byteLength),
  'cache-control': 'no-store, no-cache, must-revalidate, private, max-age=0',
  pragma: 'no-cache',
  expires: '0',
}

function pixelResponse() {
  return new Response(new Uint8Array(TRANSPARENT_PIXEL), {
    status: 200,
    headers: PIXEL_HEADERS,
  })
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const id = params.id.replace(/\.(png|gif|jpg|jpeg)$/i, '')

  // Always return a pixel — never block the response on tracking.
  try {
    const prospect = await getProspect(id)
    if (prospect) {
      const userAgent = req.headers.get('user-agent') ?? ''
      const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        null

      await logTrackingEvent(id, 'open', { user_agent: userAgent, ip })

      const now = new Date().toISOString()
      const patch: Parameters<typeof updateProspect>[1] = { openedAt: now }
      if (!prospect.openedAt) {
        if (prospect.status === 'sent' || prospect.status === 'queued') {
          patch.status = 'opened'
        }
      }
      await updateProspect(id, patch)
    }
  } catch {
    // Swallow — tracking must never break the pixel response.
  }

  return pixelResponse()
}
