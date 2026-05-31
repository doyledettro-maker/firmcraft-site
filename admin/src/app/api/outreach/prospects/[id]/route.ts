import { NextResponse } from 'next/server'
import { updateProspect, type ProspectStatus, type ProspectUpdate } from '@/lib/db/prospects'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const VALID_STATUS: ProspectStatus[] = [
  'draft', 'queued', 'sent', 'opened', 'clicked', 'replied', 'bounced', 'unsubscribed',
]

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
  const update: ProspectUpdate = {}

  if ('companyName' in r) update.companyName = String(r.companyName ?? '')
  if ('industry' in r) update.industry = r.industry == null ? null : String(r.industry)
  if ('employeeCount' in r) update.employeeCount = r.employeeCount == null ? null : Number(r.employeeCount)
  if ('city' in r) update.city = r.city == null ? null : String(r.city)
  if ('state' in r) update.state = r.state == null ? null : String(r.state)
  if ('contactName' in r) update.contactName = r.contactName == null ? null : String(r.contactName)
  if ('email' in r) update.email = String(r.email ?? '')
  if ('phone' in r) update.phone = r.phone == null ? null : String(r.phone)
  if ('website' in r) update.website = r.website == null ? null : String(r.website)
  if ('subjectLine' in r) update.subjectLine = r.subjectLine == null ? null : String(r.subjectLine)
  if ('emailBody' in r) update.emailBody = r.emailBody == null ? null : String(r.emailBody)
  if ('notes' in r) update.notes = r.notes == null ? null : String(r.notes)
  if ('status' in r) {
    const s = r.status as ProspectStatus
    if (!VALID_STATUS.includes(s)) {
      return NextResponse.json({ error: `Invalid status: ${String(s)}` }, { status: 400 })
    }
    update.status = s
  }

  try {
    const updated = await updateProspect(params.id, update)
    return NextResponse.json({ prospect: updated })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
