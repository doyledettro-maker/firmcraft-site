import { NextResponse } from 'next/server'
import {
  getContactWithCompany,
  updateContact,
  deleteContact,
  CONTACT_STATUSES,
  type ContactStatus,
  type ContactUpdate,
} from '@/lib/db/contacts'
import { getCorrespondenceForContact } from '@/lib/db/correspondence'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const contact = await getContactWithCompany(params.id)
    if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const correspondence = await getCorrespondenceForContact(params.id)
    return NextResponse.json({ contact, correspondence })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
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
  const update: ContactUpdate = {}
  if ('companyId' in r && r.companyId !== undefined) update.companyId = String(r.companyId)
  if ('contactName' in r) update.contactName = r.contactName == null ? null : String(r.contactName)
  if ('title' in r) update.title = r.title == null ? null : String(r.title)
  if ('email' in r) update.email = String(r.email ?? '')
  if ('phone' in r) update.phone = r.phone == null ? null : String(r.phone)
  if ('subjectLine' in r) update.subjectLine = r.subjectLine == null ? null : String(r.subjectLine)
  if ('emailBody' in r) update.emailBody = r.emailBody == null ? null : String(r.emailBody)
  if ('notes' in r) update.notes = r.notes == null ? null : String(r.notes)
  if ('status' in r) {
    const s = r.status as ContactStatus
    if (!CONTACT_STATUSES.includes(s)) {
      return NextResponse.json({ error: `Invalid status: ${String(s)}` }, { status: 400 })
    }
    update.status = s
  }

  try {
    const updated = await updateContact(params.id, update)
    return NextResponse.json({ contact: updated })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await deleteContact(params.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
