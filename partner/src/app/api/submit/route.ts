import { NextResponse } from 'next/server'
import { getSessionPartner } from '@/lib/session'

export async function POST(req: Request) {
  const partner = await getSessionPartner()
  if (!partner) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!body || typeof body.companyName !== 'string' || !body.companyName.trim()) {
    return NextResponse.json({ error: 'companyName is required.' }, { status: 400 })
  }
  if (typeof body.primaryContactEmail !== 'string' || !body.primaryContactEmail.includes('@')) {
    return NextResponse.json({ error: 'Valid primaryContactEmail is required.' }, { status: 400 })
  }

  const id = `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
  const submission = {
    id,
    partnerId: partner.id,
    partnerSlug: partner.slug,
    submittedAt: new Date().toISOString(),
    status: 'pending' as const,
    partnerNote: typeof body.partnerNote === 'string' ? body.partnerNote : undefined,
    survey: body,
  }

  // Real backend wiring lands later — for now log so the admin team can see
  // submissions in server logs alongside marketing-site /get-started entries.
  console.log('[partner-submit]', JSON.stringify(submission))

  return NextResponse.json({ ok: true, id })
}
