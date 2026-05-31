import { NextResponse } from 'next/server'
import {
  getContact,
  getContacts,
  updateContact,
  type Contact,
} from '@/lib/db/contacts'
import { logCorrespondence } from '@/lib/db/correspondence'
import { sendContactEmail, type SendResult } from '@/lib/outreach'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type SendBody = {
  contactId?: string
  contactIds?: string[]
  // Legacy aliases for backwards-compatible callers.
  prospectId?: string
  prospectIds?: string[]
  sendAllQueued?: boolean
}

/**
 * Send one or more contact emails through Resend.
 * Body shapes:
 *   { contactId: "<uuid>" }
 *   { contactIds: ["<uuid>"] }
 *   { sendAllQueued: true }   // every contact whose status is `queued`
 */
export async function POST(req: Request) {
  let body: SendBody
  try {
    body = (await req.json()) as SendBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const singleId = body.contactId ?? body.prospectId
  const manyIds = body.contactIds ?? body.prospectIds

  let targets: Contact[] = []
  try {
    if (singleId) {
      const c = await getContact(singleId)
      if (!c) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
      targets = [c]
    } else if (Array.isArray(manyIds) && manyIds.length > 0) {
      const all = await getContacts()
      const wanted = new Set(manyIds)
      targets = all.filter((c) => wanted.has(c.id))
    } else if (body.sendAllQueued) {
      const all = await getContacts()
      targets = all.filter((c) => c.status === 'queued')
    } else {
      return NextResponse.json(
        { error: 'Specify contactId, contactIds, or sendAllQueued' },
        { status: 400 },
      )
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  if (targets.length === 0) {
    return NextResponse.json({ sent: 0, results: [] })
  }

  const results: SendResult[] = []
  for (const contact of targets) {
    const result = await sendContactEmail(contact)
    results.push(result)
    try {
      if (result.ok) {
        const sentAt = new Date().toISOString()
        await updateContact(contact.id, {
          status: 'sent',
          resendMessageId: result.messageId ?? null,
          sentAt,
        })
        await logCorrespondence({
          contactId: contact.id,
          companyId: contact.companyId,
          type: 'email_sent',
          subject: contact.subjectLine,
          body: contact.emailBody,
          occurredAt: sentAt,
          metadata: result.messageId ? { resend_message_id: result.messageId } : {},
        })
      }
    } catch (err) {
      result.error = `Send succeeded but DB update failed: ${err instanceof Error ? err.message : String(err)}`
    }
  }

  return NextResponse.json({
    sent: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  })
}
