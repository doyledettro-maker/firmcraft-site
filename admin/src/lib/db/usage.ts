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
