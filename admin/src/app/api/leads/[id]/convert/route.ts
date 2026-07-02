import { NextResponse } from 'next/server'
import { getLead, updateLead } from '@/lib/db/leads'
import {
  getCompany,
  searchCompaniesByName,
  upsertCompanyByName,
  type Company,
  type CompanySegment,
} from '@/lib/db/companies'
import {
  createContact,
  getContactsForCompany,
  updateContact,
  findCompanyIdsByEmailDomain,
} from '@/lib/db/contacts'
import { logCorrespondence } from '@/lib/db/correspondence'
import {
  createOpportunity,
  getOpenOpportunityForCompany,
} from '@/lib/db/opportunities'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Personal-mail domains never identify a company.
const FREE_MAIL = new Set([
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com',
  'aol.com', 'live.com', 'msn.com', 'me.com', 'proton.me', 'protonmail.com',
])

function emailDomain(email: string): string | null {
  const domain = email.split('@')[1]?.toLowerCase().trim()
  if (!domain || FREE_MAIL.has(domain)) return null
  return domain
}

/**
 * GET — suggestions for the convert modal: existing outreach companies that
 * look like this lead (by company-name match or contact email domain), each
 * flagged with its open opportunity if one exists.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const lead = await getLead(params.id)
    if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const byName = lead.company ? await searchCompaniesByName(lead.company) : []
    const domain = emailDomain(lead.email)
    const domainCompanyIds = domain ? await findCompanyIdsByEmailDomain(domain) : []
    const domainCompanies = (
      await Promise.all(domainCompanyIds.map((id) => getCompany(id)))
    ).filter((c): c is Company => Boolean(c))

    const seen = new Set<string>()
    const candidates = [...byName, ...domainCompanies].filter((c) => {
      if (seen.has(c.id)) return false
      seen.add(c.id)
      return true
    }).slice(0, 6)

    const suggestions = await Promise.all(
      candidates.map(async (company) => {
        const openOpp = await getOpenOpportunityForCompany(company.id)
        return {
          company,
          openOpportunityId: openOpp?.id ?? null,
          openOpportunityStage: openOpp?.stage ?? null,
        }
      }),
    )

    return NextResponse.json({
      suggestions,
      defaultCompanyName: lead.company?.trim() || lead.name,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/**
 * POST — convert the lead. Promotes it onto the outreach graph and opens an
 * opportunity; the lead row is only stamped, never moved:
 *   1. resolve company (link existing via body.companyId, or create by name)
 *   2. create (or reuse) the contact from the lead's name/email/phone
 *   3. log the lead's message as correspondence at the lead's created_at
 *   4. create the opportunity at stage 'qualified' — or link the company's
 *      existing open opportunity (one open opp per company, enforced by index)
 *   5. mark the lead 'converted' with company/contact/opportunity FKs
 *
 * Body: { companyId?: string, companyName?: string, owner?: string }
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  let body: Record<string, unknown> = {}
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    // empty body is fine — everything has defaults from the lead
  }

  try {
    const lead = await getLead(params.id)
    if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (lead.opportunityId) {
      return NextResponse.json(
        { error: 'Lead already converted', opportunityId: lead.opportunityId },
        { status: 409 },
      )
    }

    const owner =
      typeof body.owner === 'string' && body.owner.trim() ? body.owner.trim() : null

    // 1. Resolve company
    let company: Company
    if (typeof body.companyId === 'string' && body.companyId) {
      const existing = await getCompany(body.companyId)
      if (!existing) return NextResponse.json({ error: 'Company not found' }, { status: 404 })
      company = existing
    } else {
      const companyName =
        (typeof body.companyName === 'string' && body.companyName.trim()) ||
        lead.company?.trim() ||
        lead.name
      company = await upsertCompanyByName({
        companyName,
        phone: lead.phone,
        status: 'engaged',
        segment: (lead.segment ?? 'small') as CompanySegment,
        assignedTo: owner,
        notes: lead.notes,
      })
    }

    // 2. Contact — reuse an existing contact at this company with the same
    // email; otherwise create one. Inbound leads have engaged by definition.
    const existingContacts = await getContactsForCompany(company.id)
    let contact = existingContacts.find(
      (c) => c.email && c.email.toLowerCase() === lead.email.toLowerCase(),
    )
    if (!contact) {
      contact = await createContact({
        companyId: company.id,
        contactName: lead.name,
        email: lead.email,
        phone: lead.phone,
        status: 'replied',
        notes: `Inbound lead via ${lead.source ?? 'website'}`,
      })
      contact = await updateContact(contact.id, { repliedAt: lead.createdAt })
    }

    // 3. Preserve the lead's message on the correspondence timeline
    await logCorrespondence({
      contactId: contact.id,
      companyId: company.id,
      type: 'email_replied',
      subject: `Inbound lead via ${lead.source ?? 'website'}`,
      body: lead.message,
      metadata: { inbound_lead_id: lead.id },
      occurredAt: lead.createdAt,
    })

    // 4. Opportunity — link the existing open one, or create at 'qualified'
    const existingOpp = await getOpenOpportunityForCompany(company.id)
    const opportunity =
      existingOpp ??
      (await createOpportunity({
        companyId: company.id,
        primaryContactId: contact.id,
        name: `${company.companyName} — Managed AI`,
        stage: 'qualified',
        owner: owner ?? company.assignedTo,
        useCase: lead.message,
        notes: `Converted from inbound lead (${lead.source ?? 'website'})`,
      }))

    // 5. Stamp the lead
    const updated = await updateLead(lead.id, {
      status: 'converted',
      companyId: company.id,
      contactId: contact.id,
      opportunityId: opportunity.id,
    })

    return NextResponse.json(
      { lead: updated, opportunity, linkedExisting: Boolean(existingOpp) },
      { status: existingOpp ? 200 : 201 },
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
