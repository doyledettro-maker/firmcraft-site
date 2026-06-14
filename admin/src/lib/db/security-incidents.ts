import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical'
export type IncidentStatus = 'open' | 'investigating' | 'contained' | 'resolved'

export type SecurityIncident = {
  id: string
  occurredAt: string
  resolvedAt: string | null
  severity: IncidentSeverity
  status: IncidentStatus
  title: string
  affectedHost: string | null
  summary: string
  rootCause: string | null
  remediation: string | null
  iocs: Record<string, unknown>
  docPath: string | null
  createdAt: string
}

type IncidentRow = {
  id: string
  occurred_at: string
  resolved_at: string | null
  severity: IncidentSeverity
  status: IncidentStatus
  title: string
  affected_host: string | null
  summary: string
  root_cause: string | null
  remediation: string | null
  iocs: Record<string, unknown> | null
  doc_path: string | null
  created_at: string
}

function rowToIncident(row: IncidentRow): SecurityIncident {
  return {
    id: row.id,
    occurredAt: row.occurred_at,
    resolvedAt: row.resolved_at,
    severity: row.severity,
    status: row.status,
    title: row.title,
    affectedHost: row.affected_host,
    summary: row.summary,
    rootCause: row.root_cause,
    remediation: row.remediation,
    iocs: row.iocs ?? {},
    docPath: row.doc_path,
    createdAt: row.created_at,
  }
}

/** All security incidents, newest occurrence first. */
export async function getSecurityIncidents(): Promise<SecurityIncident[]> {
  if (!isSupabaseConfigured()) return []
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('security_incidents')
    .select('*')
    .order('occurred_at', { ascending: false })
  if (error) throw new Error(`getSecurityIncidents failed: ${error.message}`)
  return (data ?? []).map((r) => rowToIncident(r as IncidentRow))
}
