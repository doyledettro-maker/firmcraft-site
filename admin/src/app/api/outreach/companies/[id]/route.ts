import { NextResponse } from 'next/server'
import {
  getCompany,
  updateCompany,
  deleteCompany,
  COMPANY_STATUSES,
  COMPANY_SEGMENTS,
  type CompanyStatus,
  type CompanySegment,
  type CompanyUpdate,
} from '@/lib/db/companies'
import { getContactsForCompany } from '@/lib/db/contacts'
import { getCorrespondenceForCompany } from '@/lib/db/correspondence'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const [company, contacts, correspondence] = await Promise.all([
      getCompany(params.id),
      getContactsForCompany(params.id),
      getCorrespondenceForCompany(params.id),
    ])
    if (!company) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ company, contacts, correspondence })
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
  const update: CompanyUpdate = {}
  if ('companyName' in r) update.companyName = String(r.companyName ?? '')
  if ('industry' in r) update.industry = r.industry == null ? null : String(r.industry)
  if ('employeeCount' in r) update.employeeCount = r.employeeCount == null ? null : Number(r.employeeCount)
  if ('phone' in r) update.phone = r.phone == null ? null : String(r.phone)
  if ('website' in r) update.website = r.website == null ? null : String(r.website)
  if ('city' in r) update.city = r.city == null ? null : String(r.city)
  if ('state' in r) update.state = r.state == null ? null : String(r.state)
  if ('notes' in r) update.notes = r.notes == null ? null : String(r.notes)
  if ('assignedTo' in r) update.assignedTo = r.assignedTo == null || String(r.assignedTo).trim() === '' ? null : String(r.assignedTo).trim()
  if ('status' in r) {
    const s = r.status as CompanyStatus
    if (!COMPANY_STATUSES.includes(s)) {
      return NextResponse.json({ error: `Invalid status: ${String(s)}` }, { status: 400 })
    }
    update.status = s
  }
  if ('segment' in r) {
    const seg = r.segment as CompanySegment
    if (!COMPANY_SEGMENTS.includes(seg)) {
      return NextResponse.json({ error: `Invalid segment: ${String(seg)}` }, { status: 400 })
    }
    update.segment = seg
  }
  try {
    const updated = await updateCompany(params.id, update)
    return NextResponse.json({ company: updated })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await deleteCompany(params.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
