import { NextResponse } from 'next/server'
import {
  getCompanies,
  createCompany,
  upsertCompanyByName,
  type CompanyInput,
  type CompanyStatus,
  type CompanySegment,
} from '@/lib/db/companies'
import {
  createContacts,
  type ContactInput,
  type ContactStatus,
} from '@/lib/db/contacts'
import { CONTACT_STATUSES } from '@/lib/db/contacts'
import { COMPANY_STATUSES, COMPANY_SEGMENTS } from '@/lib/db/companies'

function parseSegment(raw: unknown): CompanySegment {
  return COMPANY_SEGMENTS.includes(raw as CompanySegment) ? (raw as CompanySegment) : 'small'
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const companies = await getCompanies()
    return NextResponse.json({ companies }, { headers: { 'cache-control': 'no-store' } })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/**
 * Bulk import. Accepts either:
 *   1. `{ company: {...}, contacts: [{...}] }`  — single company, many contacts
 *   2. `[{ companyName, email, ... }, ...]`     — flat per-contact array
 *      (legacy prospects shape, auto-grouped by company_name)
 *   3. `{ companies: [...] }`                   — bare companies (no contacts)
 */
export async function POST(req: Request) {
  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Shape 1: { company, contacts }
  if (payload && typeof payload === 'object' && 'company' in (payload as Record<string, unknown>)) {
    const obj = payload as { company: unknown; contacts?: unknown }
    const company = parseCompany(obj.company)
    if (!company) return NextResponse.json({ error: 'Invalid company' }, { status: 400 })
    try {
      const created = await createCompany(company)
      let createdContacts: Awaited<ReturnType<typeof createContacts>> = []
      if (Array.isArray(obj.contacts) && obj.contacts.length > 0) {
        const contactInputs = obj.contacts
          .map((c) => parseContact(c, created.id))
          .filter((c): c is ContactInput => c !== null)
        createdContacts = await createContacts(contactInputs)
      }
      return NextResponse.json({ company: created, contacts: createdContacts, created: 1 })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  }

  // Shape 2: flat per-contact array (legacy prospects shape)
  const raw: unknown[] = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { companies?: unknown[] })?.companies)
      ? (payload as { companies: unknown[] }).companies
      : []

  if (raw.length === 0) {
    return NextResponse.json({ error: 'No items provided' }, { status: 400 })
  }

  // Bucket by lower(companyName)
  type Bucket = { company: CompanyInput; contacts: Omit<ContactInput, 'companyId'>[] }
  const buckets = new Map<string, Bucket>()
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

    const key = companyName.toLowerCase().trim()
    if (!buckets.has(key)) {
      buckets.set(key, {
        company: {
          companyName,
          industry: (r.industry as string | null | undefined) ?? null,
          employeeCount:
            r.employeeCount !== undefined ? Number(r.employeeCount) :
            r.employee_count !== undefined ? Number(r.employee_count) : null,
          phone: (r.phone as string | null | undefined) ?? null,
          website: (r.website as string | null | undefined) ?? null,
          city: (r.city as string | null | undefined) ?? null,
          state: (r.state as string | null | undefined) ?? null,
          status: 'active',
          segment: parseSegment(r.segment),
          notes: null,
        },
        contacts: [],
      })
    }
    const contactStatusRaw = r.status as ContactStatus | undefined
    const contactStatus =
      contactStatusRaw && CONTACT_STATUSES.includes(contactStatusRaw) ? contactStatusRaw : 'targeted'
    buckets.get(key)!.contacts.push({
      contactName: (r.contactName ?? r.contact_name) as string | null | undefined ?? null,
      title: (r.title as string | null | undefined) ?? null,
      email,
      phone: (r.phone as string | null | undefined) ?? null,
      subjectLine: (r.subjectLine ?? r.subject_line) as string | null | undefined ?? null,
      emailBody: (r.emailBody ?? r.email_body) as string | null | undefined ?? null,
      notes: (r.notes as string | null | undefined) ?? null,
      status: contactStatus,
    })
  })

  if (buckets.size === 0) {
    return NextResponse.json({ error: 'No valid rows', errors }, { status: 400 })
  }

  try {
    const createdCompanies = []
    let totalContacts = 0
    const bucketList: Bucket[] = Array.from(buckets.values())
    for (const bucket of bucketList) {
      const company = await upsertCompanyByName(bucket.company)
      createdCompanies.push(company)
      if (bucket.contacts.length > 0) {
        const inputs: ContactInput[] = bucket.contacts.map(
          (c: Omit<ContactInput, 'companyId'>) => ({ ...c, companyId: company.id }),
        )
        const inserted = await createContacts(inputs)
        totalContacts += inserted.length
      }
    }
    return NextResponse.json({
      created: createdCompanies.length,
      contactsCreated: totalContacts,
      companies: createdCompanies,
      errors,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

function parseCompany(raw: unknown): CompanyInput | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const name = (r.companyName ?? r.company_name) as string | undefined
  if (!name || typeof name !== 'string') return null
  const status = r.status as CompanyStatus | undefined
  return {
    companyName: name,
    industry: (r.industry as string | null | undefined) ?? null,
    employeeCount:
      r.employeeCount !== undefined ? Number(r.employeeCount) :
      r.employee_count !== undefined ? Number(r.employee_count) : null,
    phone: (r.phone as string | null | undefined) ?? null,
    website: (r.website as string | null | undefined) ?? null,
    city: (r.city as string | null | undefined) ?? null,
    state: (r.state as string | null | undefined) ?? null,
    status: status && COMPANY_STATUSES.includes(status) ? status : 'active',
    segment: parseSegment(r.segment),
    notes: (r.notes as string | null | undefined) ?? null,
  }
}

function parseContact(raw: unknown, companyId: string): ContactInput | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const email = r.email as string | undefined
  if (!email || typeof email !== 'string') return null
  const status = r.status as ContactStatus | undefined
  return {
    companyId,
    contactName: (r.contactName ?? r.contact_name) as string | null | undefined ?? null,
    title: (r.title as string | null | undefined) ?? null,
    email,
    phone: (r.phone as string | null | undefined) ?? null,
    subjectLine: (r.subjectLine ?? r.subject_line) as string | null | undefined ?? null,
    emailBody: (r.emailBody ?? r.email_body) as string | null | undefined ?? null,
    notes: (r.notes as string | null | undefined) ?? null,
    status: status && CONTACT_STATUSES.includes(status) ? status : 'targeted',
  }
}
