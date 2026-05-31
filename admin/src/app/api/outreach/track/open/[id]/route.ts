import { getContact, updateContact } from '@/lib/db/contacts'
import { logCorrespondence } from '@/lib/db/correspondence'
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
    const contact = await getContact(id)
    if (contact) {
      const userAgent = req.headers.get('user-agent') ?? ''
      const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        null

      const now = new Date().toISOString()
      await logCorrespondence({
        contactId: contact.id,
        companyId: contact.companyId,
        type: 'email_opened',
        metadata: { user_agent: userAgent, ip },
        occurredAt: now,
      })

      const patch: Parameters<typeof updateContact>[1] = { openedAt: now }
      if (!contact.openedAt) {
        if (contact.status === 'sent' || contact.status === 'queued') {
          patch.status = 'opened'
        }
      }
      await updateContact(id, patch)
    }
  } catch {
    // Swallow — tracking must never break the pixel response.
  }

  return pixelResponse()
}
