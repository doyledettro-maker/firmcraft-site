import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import { getClients } from './clients'
import {
  matchIocs,
  describeIocMatches,
  classifyPublicListeners,
  type OutboundRemote,
} from '@/lib/health-iocs'

export type ContainerStatus = 'running' | 'stopped' | 'restarting' | 'unknown'
export type GatewayState = 'connected' | 'disconnected' | 'unknown'
export type HealthLight = 'green' | 'yellow' | 'red'

/** A service bound to a public network interface (P0 exposure signal). */
export type PublicListener = {
  port: number
  bindAddr: string
  proc: string | null
}

/** System load averages (P1a cryptominer signal). */
export type LoadAvg = {
  one: number | null
  five: number | null
  fifteen: number | null
}

/** Agent-config keys that grant arbitrary code execution. */
export const DANGEROUS_CONFIG_KEYS = [
  'startup_hooks',
  'mcp_servers',
  'shell_hooks',
  'post_start_script',
] as const
export type DangerousConfigKey = (typeof DANGEROUS_CONFIG_KEYS)[number]

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
  // Security signals (post-incident upgrade) — all optional/nullable.
  publicListeners?: PublicListener[] | null
  cpuPercent?: number | null
  loadAvg?: LoadAvg | null
  cpuCores?: number | null
  configHash?: string | null
  dangerousConfigKeys?: string[] | null
  outboundRemotes?: OutboundRemote[] | null
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
  publicListeners: PublicListener[] | null
  cpuPercent: number | null
  loadAvg: LoadAvg | null
  cpuCores: number | null
  configHash: string | null
  dangerousConfigKeys: string[] | null
  outboundRemotes: OutboundRemote[] | null
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
  public_listeners: unknown
  cpu_percent: number | string | null
  load_avg: unknown
  cpu_cores: number | null
  config_hash: string | null
  dangerous_config_keys: unknown
  outbound_remotes: unknown
  extra: Record<string, unknown> | null
}

function num(v: number | string | null): number | null {
  if (v == null) return null
  const n = typeof v === 'string' ? Number(v) : v
  return Number.isFinite(n) ? n : null
}

/** Coerce a stored jsonb value into a PublicListener[] (resilient to junk). */
function toPublicListeners(v: unknown): PublicListener[] | null {
  if (!Array.isArray(v)) return null
  const out: PublicListener[] = []
  for (const item of v) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const port = num(o.port as number | string | null)
    if (port == null) continue
    out.push({
      port,
      bindAddr: typeof o.bind_addr === 'string' ? o.bind_addr : String(o.bindAddr ?? ''),
      proc: typeof o.proc === 'string' && o.proc ? o.proc : null,
    })
  }
  return out
}

function toLoadAvg(v: unknown): LoadAvg | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  return {
    one: num(o.one as number | string | null),
    five: num(o.five as number | string | null),
    fifteen: num(o.fifteen as number | string | null),
  }
}

function toStringArray(v: unknown): string[] | null {
  if (!Array.isArray(v)) return null
  return v.filter((x): x is string => typeof x === 'string')
}

function toOutboundRemotes(v: unknown): OutboundRemote[] | null {
  if (!Array.isArray(v)) return null
  const out: OutboundRemote[] = []
  for (const item of v) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const port = num(o.port as number | string | null)
    if (typeof o.ip !== 'string' || port == null) continue
    out.push({
      ip: o.ip,
      port,
      host: typeof o.host === 'string' && o.host ? o.host : null,
    })
  }
  return out
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
    publicListeners: toPublicListeners(row.public_listeners),
    cpuPercent: num(row.cpu_percent),
    loadAvg: toLoadAvg(row.load_avg),
    cpuCores: row.cpu_cores,
    configHash: row.config_hash,
    dangerousConfigKeys: toStringArray(row.dangerous_config_keys),
    outboundRemotes: toOutboundRemotes(row.outbound_remotes),
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
    public_listeners: input.publicListeners ?? null,
    cpu_percent: input.cpuPercent ?? null,
    load_avg: input.loadAvg ?? null,
    cpu_cores: input.cpuCores ?? null,
    config_hash: input.configHash ?? null,
    dangerous_config_keys: input.dangerousConfigKeys ?? null,
    outbound_remotes: input.outboundRemotes ?? null,
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

/**
 * Recent beacons grouped per client, newest-first. Powers the sustained-load and
 * config-change rules which need each client's last few heartbeats, not just the
 * latest one. Pulls the same recent window as getLatestBeacons.
 */
export async function getRecentBeaconsByClient(perClient = 6): Promise<Map<string, Beacon[]>> {
  const byClient = new Map<string, Beacon[]>()
  if (!isSupabaseConfigured()) return byClient
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('client_health_beacons')
    .select('*')
    .order('reported_at', { ascending: false })
    .limit(2000)
  if (error) throw new Error(`getRecentBeaconsByClient failed: ${error.message}`)

  for (const r of (data ?? []) as BeaconRow[]) {
    const list = byClient.get(r.client_id)
    if (list) {
      if (list.length < perClient) list.push(rowToBeacon(r))
    } else {
      byClient.set(r.client_id, [rowToBeacon(r)])
    }
  }
  return byClient
}

export const RED_AFTER_MS = 15 * 60 * 1000
export const DISK_WARN_PCT = 80
export const MEM_WARN_PCT = 90
export const BUDGET_WARN_PCT = 80

// --- Security thresholds (post-incident upgrade) ---
// Ports that legitimately bind to a public interface on a Hermes VPS.
export const ALLOWED_PUBLIC_PORTS = [22, 443]
// Sustained high load (per-core) that flags a possible cryptominer. Requires the
// current beacon AND the previous SUSTAINED_LOAD_HISTORY beacons to exceed it,
// so a brief spike (e.g. a deploy) doesn't trip the alarm.
export const SUSTAINED_LOAD_PER_CORE = 1.5
export const SUSTAINED_LOAD_HISTORY = 2

export type HealthEval = {
  light: HealthLight
  staleMs: number
  reasons: string[]
  /** Reasons that are security findings (rendered prominently in the UI). */
  securityReasons?: string[]
  /**
   * Public listeners that were allowed (proxy/system/known-good) — not a
   * security concern, surfaced as an informational note in the UI. Rendered
   * strings like "8765 (print_bridge.py) — known-good".
   */
  allowedPublicNotes?: string[]
}

/** Per-core load for a beacon, or null when load data is unavailable. */
function loadPerCore(b: Beacon): number | null {
  const one = b.loadAvg?.one
  const cores = b.cpuCores
  if (one == null || cores == null || cores <= 0) return null
  return one / cores
}

/** True when the agent dashboard's listen port is exposed publicly. */
function isAgentDashboardPort(port: number): boolean {
  return port === 9119
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
  // Prior beacons for this client, newest-first (excludes `beacon`). Used for
  // the sustained-load check and config-change detection. Optional so existing
  // single-beacon callers keep working.
  priorBeacons: Beacon[] = [],
): HealthEval {
  if (!beacon) {
    return { light: 'red', staleMs: Infinity, reasons: ['No heartbeat received'] }
  }
  const staleMs = now - new Date(beacon.reportedAt).getTime()
  const reasons: string[] = []
  const securityReasons: string[] = []

  // ---- Security red conditions (evaluated first; these dominate everything) ----

  // P0 — exposure. The raw public_listeners array is reported regardless (for
  // visibility), but only a *direct app* bound to a public interface is a
  // security concern. Reverse proxies (caddy/nginx/…) and system services
  // (sshd/resolver) are expected — auth lives at the proxy — and per-client
  // known-good services (e.g. Mike's print bridge) are allowlisted. A direct app
  // (node/python/hermes) on a public bind — including the agent dashboard port —
  // is the original attack and stays RED.
  const hostname =
    typeof beacon.extra?.hostname === 'string' ? (beacon.extra.hostname as string) : null
  const classified = classifyPublicListeners(beacon.publicListeners, [beacon.clientId, hostname])
  const flagged = classified.filter((l) => l.verdict === 'flagged')
  const allowedPublicNotes = classified
    .filter((l) => l.verdict === 'allowed')
    .map(
      (l) =>
        `${l.port}${l.proc ? ` (${l.proc})` : ''} — ${
          l.allowReason === 'proxy-or-system' ? 'proxy/system' : 'known-good'
        }`,
    )
  if (flagged.length > 0) {
    const dash = flagged.find((l) => isAgentDashboardPort(l.port))
    if (dash) {
      securityReasons.push(
        `Agent dashboard EXPOSED on public interface (${dash.bindAddr}:${dash.port}, ${
          dash.proc ?? 'unknown proc'
        }) — unauthenticated access risk`,
      )
    }
    const others = flagged.filter((l) => !isAgentDashboardPort(l.port))
    if (others.length > 0) {
      const list = others.map((l) => `${l.port}${l.proc ? ` (${l.proc})` : ''}`).join(', ')
      securityReasons.push(`Service exposed on public interface: ${list}`)
    }
  }

  // P2 — IOC match against outbound endpoints (exfil / mining C2).
  const iocMatches = matchIocs(beacon.outboundRemotes)
  if (iocMatches.length > 0) {
    securityReasons.push(`Malicious outbound endpoint: ${describeIocMatches(iocMatches)}`)
  }

  // P1b — dangerous agent-config keys present.
  const dangerous = beacon.dangerousConfigKeys ?? []
  if (dangerous.length > 0) {
    securityReasons.push(`Dangerous agent-config keys present: ${dangerous.join(', ')}`)
  }

  // P1a — sustained high CPU/load across the current + prior beacons.
  const cur = loadPerCore(beacon)
  if (cur != null && cur > SUSTAINED_LOAD_PER_CORE) {
    const window = priorBeacons.slice(0, SUSTAINED_LOAD_HISTORY)
    const haveHistory = window.length >= SUSTAINED_LOAD_HISTORY
    const allHigh =
      haveHistory &&
      window.every((b) => {
        const pc = loadPerCore(b)
        return pc != null && pc > SUSTAINED_LOAD_PER_CORE
      })
    if (allHigh) {
      securityReasons.push(
        `Sustained high CPU (possible cryptominer) — load/core ${cur.toFixed(2)} over ${
          SUSTAINED_LOAD_HISTORY + 1
        } beacons`,
      )
    }
  }

  const notes = allowedPublicNotes.length > 0 ? { allowedPublicNotes } : {}

  if (securityReasons.length > 0) {
    return { light: 'red', staleMs, reasons: securityReasons, securityReasons, ...notes }
  }

  // ---- Operational red conditions ----
  if (staleMs > RED_AFTER_MS) {
    reasons.push(`No heartbeat in ${Math.round(staleMs / 60000)} min`)
  }
  if (beacon.containerStatus === 'stopped') {
    reasons.push('Container stopped')
  }
  const isRed = reasons.length > 0
  if (isRed) return { light: 'red', staleMs, reasons, ...notes }

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

  // P1b — config hash changed vs the previous beacon (no dangerous keys here, or
  // we'd have gone red above). Yellow: config drift worth a human glance.
  const prev = priorBeacons[0]
  if (
    beacon.configHash != null &&
    prev?.configHash != null &&
    beacon.configHash !== prev.configHash
  ) {
    reasons.push('Agent config changed')
  }

  if (reasons.length > 0) return { light: 'yellow', staleMs, reasons, ...notes }

  return { light: 'green', staleMs, reasons: [], ...notes }
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
  /** Subset of reasons that are security findings (shown prominently in the UI). */
  securityReasons: string[]
  /** Allowlisted public listeners (proxy/system/known-good) — informational. */
  allowedPublicNotes: string[]
  beacon: Beacon | null
}

/**
 * The full /health view: every client that has ever reported, plus every active
 * client in the DB that has a VPS but hasn't reported (so a silent client still
 * shows up — as red). Computes budget % from each client's monthly allowance.
 */
export async function getClientHealthOverview(now = Date.now()): Promise<ClientHealth[]> {
  const [history, clients] = await Promise.all([
    getRecentBeaconsByClient(),
    getClients().catch(() => []),
  ])

  // Latest beacon per client is the head of each history list (newest-first).
  const beacons: Beacon[] = []
  history.forEach((list) => {
    if (list[0]) beacons.push(list[0])
  })

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
    // Prior beacons for this client (everything after the latest), newest-first.
    const prior = (history.get(clientId) ?? []).slice(1)
    const evald = evaluateHealth(beacon, now, budgetPercent, prior)
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
      securityReasons: evald.securityReasons ?? [],
      allowedPublicNotes: evald.allowedPublicNotes ?? [],
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
