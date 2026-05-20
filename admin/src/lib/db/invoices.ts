import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'

export type Invoice = {
  id: string
  clientId: string
  stripeInvoiceId: string | null
  amount: number
  status: InvoiceStatus
  periodStart: string | null
  periodEnd: string | null
  paidAt: string | null
}

type InvoiceRow = {
  id: string
  client_id: string
  stripe_invoice_id: string | null
  amount: number | string
  status: InvoiceStatus
  period_start: string | null
  period_end: string | null
  paid_at: string | null
}

function rowToInvoice(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    clientId: row.client_id,
    stripeInvoiceId: row.stripe_invoice_id,
    amount: Number(row.amount),
    status: row.status,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    paidAt: row.paid_at,
  }
}

export async function getClientInvoices(clientId: string): Promise<Invoice[]> {
  if (!isSupabaseConfigured()) return []

  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('invoices')
    .select('*')
    .eq('client_id', clientId)
    .order('period_end', { ascending: false })

  if (error) throw new Error(`getClientInvoices(${clientId}) failed: ${error.message}`)
  return (data ?? []).map((r) => rowToInvoice(r as InvoiceRow))
}
