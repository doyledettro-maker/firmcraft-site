import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export type ServiceStatus = 'up' | 'degraded' | 'down' | 'unknown'

export type InfrastructureRecord = {
  id: string
  clientId: string
  serviceName: string
  endpoint: string | null
  status: ServiceStatus
  lastChecked: string | null
}

type InfrastructureRow = {
  id: string
  client_id: string
  service_name: string
  endpoint: string | null
  status: ServiceStatus
  last_checked: string | null
}

function rowToRecord(row: InfrastructureRow): InfrastructureRecord {
  return {
    id: row.id,
    clientId: row.client_id,
    serviceName: row.service_name,
    endpoint: row.endpoint,
    status: row.status,
    lastChecked: row.last_checked,
  }
}

export async function getInfrastructureStatus(
  clientId: string,
): Promise<InfrastructureRecord[]> {
  if (!isSupabaseConfigured()) return []

  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('infrastructure')
    .select('*')
    .eq('client_id', clientId)
    .order('service_name', { ascending: true })

  if (error) {
    throw new Error(`getInfrastructureStatus(${clientId}) failed: ${error.message}`)
  }
  return (data ?? []).map((r) => rowToRecord(r as InfrastructureRow))
}
