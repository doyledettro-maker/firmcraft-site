import { NextResponse } from 'next/server'
import { getContact, updateContact } from '@/lib/db/contacts'
import { logCorrespondence } from '@/lib/db/correspondence'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const contact = await getContact(params.id)
    if (!contact) {
      return NextResponse.json({ ok: true, found: false })
    }

    const userAgent = req.headers.get('user-agent') ?? ''
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      null

    const now = new Date().toISOString()
    await logCorrespondence({
      contactId: contact.id,
      companyId: contact.companyId,
      type: 'email_unsubscribed',
      metadata: { user_agent: userAgent, ip },
      occurredAt: now,
    })

    if (contact.status !== 'unsubscribed') {
      await updateContact(contact.id, {
        status: 'unsubscribed',
        unsubscribedAt: now,
      })
    }

    return NextResponse.json({ ok: true, found: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
