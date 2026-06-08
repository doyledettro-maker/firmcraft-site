import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import { getClients } from './clients'

export type ContainerStatus = 'running' | 'stopped' | 'restarting' | 'unknown'
export type GatewayState = 'connected' | 'disconnected' | 'unknown'
export type HealthLight = 'green' | 'yellow' | 'red'

/** A single heartbeat as written by a client's beacon script. */
export type BeaconInput = {
  clientId: string
  containerStatus?: ContainerStatus
  containerUptimeHours?: number | null
  containerRestartCount?: number | null
  diskPercent?: number | null
  memoryPercent?: number | null
  gatewayState?: GatewayState
  lastActivityAt?: string | null
  tokenSpendToday?: number | null
  tokenSpendMonth?: number | null
  extra?: Record<string, unknown>
}

export type Beacon = {
  id: string
  clientId: string
  reportedAt: string
  containerStatus: ContainerStatus
  containerUptimeHours: number | null
  containerRestartCount: number | null
  diskPercent: number | null
  memoryPercent: number | null
  gatewayState: GatewayState
  lastActivityAt: string | null
  tokenSpendToday: number | null
  tokenSpendMonth: number | null
  extra: Record<string, unknown>
}

type BeaconRow = {
  id: string
  client_id: string
  reported_at: string
  container_status: ContainerStatus
  container_uptime_hours: number | null
  container_restart_count: number | null
  disk_percent: number | null
  memory_percent: number | null
  gateway_state: GatewayState
  last_activity_at: string | null
  token_spend_today: number | string | null
  token_spend_month: number | string | null
  extra: Record<string, unknown> | null
}

function num(v: number | string | null): number | null {
  if (v == null) return null
  const n = typeof v === 'string' ? Number(v) : v
  return Number.isFinite(n) ? n : null
}

function rowToBeacon(row: BeaconRow): Beacon {
  return {
    id: row.id,
    clientId: row.client_id,
    reportedAt: row.reported_at,
    containerStatus: row.container_status,
    containerUptimeHours: row.container_uptime_hours,
    containerRestartCount: row.container_restart_count,
    diskPercent: row.disk_percent,
    memoryPercent: row.memory_percent,
    gatewayState: row.gateway_state,
    lastActivityAt: row.last_activity_at,
    tokenSpendToday: num(row.token_spend_today),
    tokenSpendMonth: num(row.token_spend_month),
    extra: row.extra ?? {},
  }
}

const CONTAINER_STATUSES: ContainerStatus[] = ['running', 'stopped', 'restarting', 'unknown']
const GATEWAY_STATES: GatewayState[] = ['connected', 'disconnected', 'unknown']

/** Insert one heartbeat. Beacons are append-only — history powers trends. */
export async function recordBeacon(input: BeaconInput): Promise<Beacon> {
  if (!isSupabaseConfigured()) {
    throw new Error('recordBeacon requires Supabase to be configured.')
  }
  const db = getSupabaseAdmin()
  const row = {
    client_id: input.clientId,
    container_status: CONTAINER_STATUSES.includes(input.containerStatus as ContainerStatus)
      ? input.containerStatus
      : 'unknown',
    container_uptime_hours: input.containerUptimeHours ?? null,
    container_restart_count: input.containerRestartCount ?? null,
    disk_percent: input.diskPercent ?? null,
    memory_percent: input.memoryPercent ?? null,
    gateway_state: GATEWAY_STATES.includes(input.gatewayState as GatewayState)
      ? input.gatewayState
      : 'unknown',
    last_activity_at: input.lastActivityAt ?? null,
    token_spend_today: input.tokenSpendToday ?? null,
    token_spend_month: input.tokenSpendMonth ?? null,
    extra: input.extra ?? {},
  }
  const { data, error } = await db
    .from('client_health_beacons')
    .insert(row)
    .select('*')
    .single()
  if (error) throw new Error(`recordBeacon failed: ${error.message}`)
  return rowToBeacon(data as BeaconRow)
}

/**
 * Latest beacon per client. We pull a recent window ordered newest-first and
 * keep the first row seen per client_id — cheaper and more portable than
 * `distinct on` through the JS client, and fine at our client count.
 */
export async function getLatestBeacons(): Promise<Beacon[]> {
  if (!isSupabaseConfigured()) return []
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('client_health_beacons')
    .select('*')
    .order('reported_at', { ascending: false })
    .limit(2000)
  if (error) throw new Error(`getLatestBeacons failed: ${error.message}`)

  const latest = new Map<string, Beacon>()
  for (const r of (data ?? []) as BeaconRow[]) {
    if (!latest.has(r.client_id)) latest.set(r.client_id, rowToBeacon(r))
  }
  return Array.from(latest.values())
}

export const RED_AFTER_MS = 15 * 60 * 1000
export const DISK_WARN_PCT = 80
export const MEM_WARN_PCT = 90
export const BUDGET_WARN_PCT = 80

export type HealthEval = {
  light: HealthLight
  staleMs: number
  reasons: string[]
}

/**
 * Traffic-light from a beacon. Red dominates yellow.
 *   red    — no heartbeat in 15 min, or container not running
 *   yellow — disk > 80%, memory > 90%, gateway disconnected, or budget > 80%
 *   green  — everything nominal
 * budgetPercent is computed by the caller (needs the client's allowance, which
 * lives admin-side, not in the beacon).
 */
export function evaluateHealth(
  beacon: Beacon | null,
  now: number,
  budgetPercent: number | null,
): HealthEval {
  if (!beacon) {
    return { light: 'red', staleMs: Infinity, reasons: ['No heartbeat received'] }
  }
  const staleMs = now - new Date(beacon.reportedAt).getTime()
  const reasons: string[] = []

  // ---- Red conditions ----
  if (staleMs > RED_AFTER_MS) {
    reasons.push(`No heartbeat in ${Math.round(staleMs / 60000)} min`)
  }
  if (beacon.containerStatus === 'stopped') {
    reasons.push('Container stopped')
  }
  const isRed = reasons.length > 0
  if (isRed) return { light: 'red', staleMs, reasons }

  // ---- Yellow conditions ----
  if (beacon.containerStatus === 'restarting') reasons.push('Container restarting')
  if (beacon.diskPercent != null && beacon.diskPercent > DISK_WARN_PCT) {
    reasons.push(`Disk ${beacon.diskPercent}%`)
  }
  if (beacon.memoryPercent != null && beacon.memoryPercent > MEM_WARN_PCT) {
    reasons.push(`Memory ${beacon.memoryPercent}%`)
  }
  if (beacon.gatewayState === 'disconnected') reasons.push('Gateway disconnected')
  if (budgetPercent != null && budgetPercent > BUDGET_WARN_PCT) {
    reasons.push(`Budget ${Math.round(budgetPercent)}%`)
  }
  if (reasons.length > 0) return { light: 'yellow', staleMs, reasons }

  return { light: 'green', staleMs, reasons: [] }
}

/** One client's row in the health dashboard: identity + latest beacon + verdict. */
export type ClientHealth = {
  clientId: string
  clientName: string
  // True when client_id matched a row in the clients table.
  known: boolean
  plan: string | null
  vpsIp: string | null
  tokenAllowance: number | null
  budgetPercent: number | null
  light: HealthLight
  staleMs: number | null
  reasons: string[]
  beacon: Beacon | null
}

/**
 * The full /health view: every client that has ever reported, plus every active
 * client in the DB that has a VPS but hasn't reported (so a silent client still
 * shows up — as red). Computes budget % from each client's monthly allowance.
 */
export async function getClientHealthOverview(now = Date.now()): Promise<ClientHealth[]> {
  const [beacons, clients] = await Promise.all([
    getLatestBeacons(),
    getClients().catch(() => []),
  ])

  const beaconByClient = new Map(beacons.map((b) => [b.clientId, b]))
  // Index clients by id so a beacon's client_id (we deploy with the uuid) resolves.
  const clientById = new Map(clients.map((c) => [c.id, c]))

  const out: ClientHealth[] = []
  const seen = new Set<string>()

  function push(clientId: string, beacon: Beacon | null) {
    if (seen.has(clientId)) return
    seen.add(clientId)
    const client = clientById.get(clientId)
    const allowance = client?.tokenAllowance ?? null
    const spend = beacon?.tokenSpendMonth ?? null
    const budgetPercent =
      allowance != null && allowance > 0 && spend != null ? (spend / allowance) * 100 : null
    const evald = evaluateHealth(beacon, now, budgetPercent)
    out.push({
      clientId,
      clientName: client?.name ?? clientId,
      known: Boolean(client),
      plan: client?.planTier ?? null,
      vpsIp: (beacon?.extra?.host_ip as string | undefined) ?? null,
      tokenAllowance: allowance,
      budgetPercent,
      light: evald.light,
      staleMs: beacon ? evald.staleMs : null,
      reasons: evald.reasons,
      beacon,
    })
  }

  // Clients that have reported.
  for (const b of beacons) push(b.clientId, b)
  // Active clients with a VPS configured but no beacon yet → surface as red.
  for (const c of clients) {
    if (seen.has(c.id)) continue
    if (c.status !== 'active') continue
    if (!beaconByClient.has(c.id)) push(c.id, null)
  }

  // Stable order: red first, then yellow, then green; alpha within a tier.
  const rank: Record<HealthLight, number> = { red: 0, yellow: 1, green: 2 }
  out.sort((a, b) => rank[a.light] - rank[b.light] || a.clientName.localeCompare(b.clientName))
  return out
}
