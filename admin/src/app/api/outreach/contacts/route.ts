import { NextResponse } from 'next/server'
import {
  getContacts,
  createContacts,
  CONTACT_STATUSES,
  type ContactInput,
  type ContactStatus,
} from '@/lib/db/contacts'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const contacts = await getContacts()
    return NextResponse.json({ contacts }, { headers: { 'cache-control': 'no-store' } })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/**
 * Create one or more contacts. Body shapes:
 *   { companyId, email, contactName?, ... }
 *   [{ companyId, email, ... }, ...]
 */
export async function POST(req: Request) {
  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const raw: unknown[] = Array.isArray(payload) ? payload : [payload]
  const inputs: ContactInput[] = []
  const errors: Array<{ index: number; error: string }> = []

  raw.forEach((item, i) => {
    if (!item || typeof item !== 'object') {
      errors.push({ index: i, error: 'Not an object' })
      return
    }
    const r = item as Record<string, unknown>
    const companyId = r.companyId as string | undefined
    const email = r.email as string | undefined
    if (!companyId) {
      errors.push({ index: i, error: 'Missing companyId' })
      return
    }
    if (!email) {
      errors.push({ index: i, error: 'Missing email' })
      return
    }
    const status = r.status as ContactStatus | undefined
    inputs.push({
      companyId,
      contactName: (r.contactName as string | null | undefined) ?? null,
      title: (r.title as string | null | undefined) ?? null,
      email,
      phone: (r.phone as string | null | undefined) ?? null,
      subjectLine: (r.subjectLine as string | null | undefined) ?? null,
      emailBody: (r.emailBody as string | null | undefined) ?? null,
      notes: (r.notes as string | null | undefined) ?? null,
      status: status && CONTACT_STATUSES.includes(status) ? status : 'draft',
    })
  })

  if (inputs.length === 0) {
    return NextResponse.json({ error: 'No valid contacts', errors }, { status: 400 })
  }

  try {
    const created = await createContacts(inputs)
    return NextResponse.json({ created: created.length, errors, contacts: created })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
