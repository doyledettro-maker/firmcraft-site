import { NextResponse } from 'next/server'
import { saveLead, sendLeadEmail, isValidEmail } from '@/lib/leads'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Body = {
  name?: unknown
  email?: unknown
  company?: unknown
  phone?: unknown
  message?: unknown
  source?: unknown
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

export async function POST(req: Request) {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const name = asString(body.name).trim()
  const email = asString(body.email).trim()
  const company = asString(body.company).trim()
  const phone = asString(body.phone).trim()
  const message = asString(body.message).trim()
  const source = asString(body.source).trim() || 'contact'

  if (!name) {
    return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 })
  }
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  let lead
  try {
    lead = await saveLead({ name, email, company, phone, message, source })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[leads] save failed:', msg)
    return NextResponse.json({ error: 'Could not save your message. Please try again.' }, { status: 500 })
  }

  // Email is best-effort — the lead is already saved, so a notification
  // failure should not surface as an error to the visitor.
  const notify = await sendLeadEmail(lead)
  if (!notify.ok) {
    console.error('[leads] notification email failed:', notify.error)
  }

  return NextResponse.json({ ok: true, id: lead.id })
}
