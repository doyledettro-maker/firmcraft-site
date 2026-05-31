import { NextResponse } from 'next/server'
import {
  getProspects,
  createProspects,
  type ProspectInput,
  type ProspectStatus,
} from '@/lib/db/prospects'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const VALID_STATUS: ProspectStatus[] = [
  'draft', 'queued', 'sent', 'opened', 'clicked', 'replied', 'bounced', 'unsubscribed',
]

export async function GET() {
  try {
    const prospects = await getProspects()
    return NextResponse.json({ prospects }, { headers: { 'cache-control': 'no-store' } })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/**
 * Bulk import. Accepts a JSON body of either an array of prospects or
 * `{ prospects: [...] }`. Each entry needs at minimum `company_name` (or
 * `companyName`) and `email`.
 */
export async function POST(req: Request) {
  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const raw: unknown[] = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { prospects?: unknown[] })?.prospects)
      ? (payload as { prospects: unknown[] }).prospects
      : []

  if (raw.length === 0) {
    return NextResponse.json({ error: 'No prospects provided' }, { status: 400 })
  }

  const inputs: ProspectInput[] = []
  const errors: Array<{ index: number; error: string }> = []

  raw.forEach((item, i) => {
    if (!item || typeof item !== 'object') {
      errors.push({ index: i, error: 'Not an object' })
      return
    }
    const r = item as Record<string, unknown>
    const companyName = (r.companyName ?? r.company_name) as string | undefined
    const email = r.email as string | undefined
    if (!companyName || typeof companyName !== 'string') {
      errors.push({ index: i, error: 'Missing company_name' })
      return
    }
    if (!email || typeof email !== 'string') {
      errors.push({ index: i, error: 'Missing email' })
      return
    }
    const status = r.status as ProspectStatus | undefined
    inputs.push({
      companyName,
      email,
      industry: (r.industry as string | null | undefined) ?? null,
      employeeCount:
        r.employeeCount !== undefined ? Number(r.employeeCount) :
        r.employee_count !== undefined ? Number(r.employee_count) : null,
      city: (r.city as string | null | undefined) ?? null,
      state: (r.state as string | null | undefined) ?? null,
      contactName: (r.contactName ?? r.contact_name) as string | null | undefined ?? null,
      phone: (r.phone as string | null | undefined) ?? null,
      website: (r.website as string | null | undefined) ?? null,
      subjectLine: (r.subjectLine ?? r.subject_line) as string | null | undefined ?? null,
      emailBody: (r.emailBody ?? r.email_body) as string | null | undefined ?? null,
      notes: (r.notes as string | null | undefined) ?? null,
      status: status && VALID_STATUS.includes(status) ? status : 'draft',
    })
  })

  if (inputs.length === 0) {
    return NextResponse.json({ error: 'No valid prospects', errors }, { status: 400 })
  }

  try {
    const created = await createProspects(inputs)
    return NextResponse.json({ created: created.length, errors, prospects: created })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
