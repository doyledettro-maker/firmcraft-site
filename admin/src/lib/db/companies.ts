import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export type CompanyStatus = 'active' | 'engaged' | 'customer' | 'archived'

export const COMPANY_STATUSES: CompanyStatus[] = [
  'active',
  'engaged',
  'customer',
  'archived',
]

export type CompanySegment = 'small' | 'midmarket' | 'enterprise' | 'pe'

export const COMPANY_SEGMENTS: CompanySegment[] = ['small', 'midmarket', 'enterprise', 'pe']

export type Company = {
  id: string
  companyName: string
  industry: string | null
  employeeCount: number | null
  phone: string | null
  website: string | null
  city: string | null
  state: string | null
  status: CompanyStatus
  segment: CompanySegment
  notes: string | null
  createdAt: string
  updatedAt: string
}

type CompanyRow = {
  id: string
  company_name: string
  industry: string | null
  employee_count: number | null
  phone: string | null
  website: string | null
  city: string | null
  state: string | null
  status: CompanyStatus
  segment: CompanySegment
  notes: string | null
  created_at: string
  updated_at: string
}

export type CompanyInput = {
  companyName: string
  industry?: string | null
  employeeCount?: number | null
  phone?: string | null
  website?: string | null
  city?: string | null
  state?: string | null
  status?: CompanyStatus
  segment?: CompanySegment
  notes?: string | null
}

export type CompanyUpdate = Partial<CompanyInput>

function rowToCompany(row: CompanyRow): Company {
  return {
    id: row.id,
    companyName: row.company_name,
    industry: row.industry,
    employeeCount: row.employee_count,
    phone: row.phone,
    website: row.website,
    city: row.city,
    state: row.state,
    status: row.status,
    segment: row.segment,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function inputToRow(input: CompanyInput | CompanyUpdate): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if ('companyName' in input && input.companyName !== undefined) row.company_name = input.companyName
  if ('industry' in input && input.industry !== undefined) row.industry = input.industry
  if ('employeeCount' in input && input.employeeCount !== undefined) row.employee_count = input.employeeCount
  if ('phone' in input && input.phone !== undefined) row.phone = input.phone
  if ('website' in input && input.website !== undefined) row.website = input.website
  if ('city' in input && input.city !== undefined) row.city = input.city
  if ('state' in input && input.state !== undefined) row.state = input.state
  if ('status' in input && input.status !== undefined) row.status = input.status
  if ('segment' in input && input.segment !== undefined) row.segment = input.segment
  if ('notes' in input && input.notes !== undefined) row.notes = input.notes
  return row
}

// PostgREST caps a single response at 1000 rows, so page through with .range()
// to return every company (we have thousands).
const PAGE_SIZE = 1000

export async function getCompanies(): Promise<Company[]> {
  if (!isSupabaseConfigured()) return []
  const db = getSupabaseAdmin()
  const rows: CompanyRow[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await db
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(`getCompanies failed: ${error.message}`)
    const batch = (data ?? []) as CompanyRow[]
    rows.push(...batch)
    if (batch.length < PAGE_SIZE) break
  }
  return rows.map((row) => rowToCompany(row))
}

export async function getCompany(id: string): Promise<Company | undefined> {
  if (!isSupabaseConfigured()) return undefined
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('companies')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(`getCompany(${id}) failed: ${error.message}`)
  if (!data) return undefined
  return rowToCompany(data as CompanyRow)
}

export async function findCompanyByName(name: string): Promise<Company | undefined> {
  if (!isSupabaseConfigured()) return undefined
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('companies')
    .select('*')
    .ilike('company_name', name)
    .maybeSingle()
  if (error) throw new Error(`findCompanyByName failed: ${error.message}`)
  if (!data) return undefined
  return rowToCompany(data as CompanyRow)
}

export async function createCompany(input: CompanyInput): Promise<Company> {
  if (!isSupabaseConfigured()) {
    throw new Error('createCompany requires Supabase to be configured.')
  }
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('companies')
    .insert(inputToRow(input))
    .select('*')
    .single()
  if (error) throw new Error(`createCompany failed: ${error.message}`)
  return rowToCompany(data as CompanyRow)
}

/**
 * Look up a company by case-insensitive name; create it if missing.
 * Returns the company row.
 */
export async function upsertCompanyByName(input: CompanyInput): Promise<Company> {
  const existing = await findCompanyByName(input.companyName)
  if (existing) return existing
  return createCompany(input)
}

export async function updateCompany(id: string, input: CompanyUpdate): Promise<Company> {
  if (!isSupabaseConfigured()) {
    throw new Error('updateCompany requires Supabase to be configured.')
  }
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('companies')
    .update(inputToRow(input))
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(`updateCompany(${id}) failed: ${error.message}`)
  return rowToCompany(data as CompanyRow)
}

export async function deleteCompany(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('deleteCompany requires Supabase to be configured.')
  }
  const db = getSupabaseAdmin()
  const { error } = await db.from('companies').delete().eq('id', id)
  if (error) throw new Error(`deleteCompany(${id}) failed: ${error.message}`)
}
