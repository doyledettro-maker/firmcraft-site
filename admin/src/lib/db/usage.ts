import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export type DateRange = { from: string; to: string }

export type UsageEvent = {
  id: string
  clientId: string
  date: string
  model: string | null
  inputTokens: number
  outputTokens: number
  cost: number
  apiCalls: number
}

export type UsageSummary = {
  events: UsageEvent[]
  totals: {
    inputTokens: number
    outputTokens: number
    cost: number
    apiCalls: number
  }
}

type UsageRow = {
  id: string
  client_id: string
  date: string
  model: string | null
  input_tokens: number | string
  output_tokens: number | string
  cost: number | string
  api_calls: number | string
}

function rowToEvent(row: UsageRow): UsageEvent {
  return {
    id: row.id,
    clientId: row.client_id,
    date: row.date,
    model: row.model,
    inputTokens: Number(row.input_tokens),
    outputTokens: Number(row.output_tokens),
    cost: Number(row.cost),
    apiCalls: Number(row.api_calls),
  }
}

export async function getClientUsage(
  clientId: string,
  range?: DateRange,
): Promise<UsageSummary> {
  if (!isSupabaseConfigured()) {
    return { events: [], totals: { inputTokens: 0, outputTokens: 0, cost: 0, apiCalls: 0 } }
  }

  const db = getSupabaseAdmin()
  let query = db
    .from('usage_events')
    .select('*')
    .eq('client_id', clientId)
    .order('date', { ascending: false })

  if (range) {
    query = query.gte('date', range.from).lte('date', range.to)
  }

  const { data, error } = await query
  if (error) throw new Error(`getClientUsage(${clientId}) failed: ${error.message}`)

  const events = (data ?? []).map((r) => rowToEvent(r as UsageRow))
  const totals = events.reduce(
    (acc, e) => ({
      inputTokens: acc.inputTokens + e.inputTokens,
      outputTokens: acc.outputTokens + e.outputTokens,
      cost: acc.cost + e.cost,
      apiCalls: acc.apiCalls + e.apiCalls,
    }),
    { inputTokens: 0, outputTokens: 0, cost: 0, apiCalls: 0 },
  )

  return { events, totals }
}

export type ClientUsageTotals = { cost: number; apiCalls: number }

/**
 * Aggregate usage totals per client for a date range, keyed by client_id.
 * One query for the whole tenant list — avoids an N+1 when rendering the
 * clients table's spend progress bars.
 */
export async function getUsageTotalsByClient(
  range?: DateRange,
): Promise<Record<string, ClientUsageTotals>> {
  if (!isSupabaseConfigured()) return {}

  const db = getSupabaseAdmin()
  let query = db.from('usage_events').select('client_id, cost, api_calls')

  if (range) {
    query = query.gte('date', range.from).lte('date', range.to)
  }

  const { data, error } = await query
  if (error) throw new Error(`getUsageTotalsByClient failed: ${error.message}`)

  const byClient: Record<string, ClientUsageTotals> = {}
  for (const r of data ?? []) {
    const row = r as { client_id: string; cost: number | string; api_calls: number | string }
    const acc = byClient[row.client_id] ?? { cost: 0, apiCalls: 0 }
    acc.cost += Number(row.cost)
    acc.apiCalls += Number(row.api_calls)
    byClient[row.client_id] = acc
  }
  return byClient
}

/**
 * Aggregate usage totals across ALL clients for a date range.
 * Used by the summary dashboard to show platform-wide spend & calls.
 */
export async function getAllUsageTotals(
  range?: DateRange,
): Promise<{ cost: number; apiCalls: number }> {
  if (!isSupabaseConfigured()) {
    return { cost: 0, apiCalls: 0 }
  }

  const db = getSupabaseAdmin()
  let query = db
    .from('usage_events')
    .select('cost, api_calls')

  if (range) {
    query = query.gte('date', range.from).lte('date', range.to)
  }

  const { data, error } = await query
  if (error) throw new Error(`getAllUsageTotals failed: ${error.message}`)

  const rows = data ?? []
  return rows.reduce(
    (acc, r) => ({
      cost: acc.cost + Number(r.cost),
      apiCalls: acc.apiCalls + Number(r.api_calls),
    }),
    { cost: 0, apiCalls: 0 },
  )
}
