import { NextResponse } from 'next/server'
import { getContact, updateContact } from '@/lib/db/contacts'
import { logCorrespondence } from '@/lib/db/correspondence'

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
    const contact = await getContact(params.id)
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
        type: 'email_clicked',
        metadata: { link_url: destination, user_agent: userAgent, ip },
        occurredAt: now,
      })

      const patch: Parameters<typeof updateContact>[1] = { clickedAt: now }
      if (!contact.openedAt) patch.openedAt = now
      if (contact.status === 'sent' || contact.status === 'opened' || contact.status === 'queued') {
        patch.status = 'clicked'
      }
      await updateContact(params.id, patch)
    }
  } catch {
    // Swallow — never block the redirect on tracking.
  }

  return NextResponse.redirect(destination, 302)
}
