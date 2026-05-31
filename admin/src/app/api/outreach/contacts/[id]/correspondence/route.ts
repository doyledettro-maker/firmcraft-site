import { NextResponse } from 'next/server'
import { getContact } from '@/lib/db/contacts'
import {
  getCorrespondenceForContact,
  logCorrespondence,
  CORRESPONDENCE_TYPES,
  type CorrespondenceType,
} from '@/lib/db/correspondence'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const correspondence = await getCorrespondenceForContact(params.id)
    return NextResponse.json({ correspondence })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/**
 * Append a manual correspondence entry (note, call, meeting, etc.) for a contact.
 * Body: { type, subject?, body?, occurredAt?, metadata? }
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Body must be an object' }, { status: 400 })
  }
  const r = body as Record<string, unknown>
  const type = r.type as CorrespondenceType | undefined
  if (!type || !CORRESPONDENCE_TYPES.includes(type)) {
    return NextResponse.json({ error: `Invalid type: ${String(type)}` }, { status: 400 })
  }

  try {
    const contact = await getContact(params.id)
    if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })

    const entry = await logCorrespondence({
      contactId: contact.id,
      companyId: contact.companyId,
      type,
      subject: r.subject == null ? null : String(r.subject),
      body: r.body == null ? null : String(r.body),
      occurredAt: typeof r.occurredAt === 'string' ? r.occurredAt : undefined,
      metadata: (r.metadata && typeof r.metadata === 'object'
        ? (r.metadata as Record<string, unknown>)
        : {}) as Record<string, unknown>,
    })
    return NextResponse.json({ entry })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
