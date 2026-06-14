import { NextResponse } from 'next/server'
import {
  recordBeacon,
  evaluateHealth,
  getRecentBeaconsByClient,
  type Beacon,
  type BeaconInput,
  type PublicListener,
  type LoadAvg,
} from '@/lib/db/health-beacons'
import type { OutboundRemote } from '@/lib/health-iocs'
import { getClient } from '@/lib/db/clients'
import { maybeAlertRed, noteRecovered } from '@/lib/health-alerts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Ingest a heartbeat from a client's VPS beacon (admin/scripts/health-beacon.sh).
 * Auth: `Authorization: Bearer <BEACON_TOKEN>`. Records the beacon, then fires a
 * one-shot Resend alert if the client just went red.
 */
function asNum(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

function asInt(v: unknown): number | null {
  const n = asNum(v)
  return n == null ? null : Math.round(n)
}

function asIso(v: unknown): string | null {
  if (typeof v !== 'string' || !v.trim()) return null
  const t = Date.parse(v)
  return Number.isNaN(t) ? null : new Date(t).toISOString()
}

function asStr(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

/** Coerce the beacon's public_listeners array into PublicListener[]. */
function asPublicListeners(v: unknown): PublicListener[] | null {
  if (!Array.isArray(v)) return null
  const out: PublicListener[] = []
  for (const item of v) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const port = asInt(o.port)
    if (port == null) continue
    out.push({
      port,
      bindAddr: asStr(o.bind_addr ?? o.bindAddr) ?? '',
      proc: asStr(o.proc),
    })
  }
  return out
}

function asLoadAvg(v: unknown): LoadAvg | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  return { one: asNum(o.one), five: asNum(o.five), fifteen: asNum(o.fifteen) }
}

function asStrArray(v: unknown): string[] | null {
  if (!Array.isArray(v)) return null
  return v.filter((x): x is string => typeof x === 'string' && x.length > 0)
}

/** Coerce the beacon's outbound_remotes array into OutboundRemote[]. */
function asOutboundRemotes(v: unknown): OutboundRemote[] | null {
  if (!Array.isArray(v)) return null
  const out: OutboundRemote[] = []
  for (const item of v) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const ip = asStr(o.ip)
    const port = asInt(o.port)
    if (ip == null || port == null) continue
    out.push({ ip, port, host: asStr(o.host) })
  }
  return out
}

export async function POST(req: Request) {
  const expected = process.env.BEACON_TOKEN
  if (!expected) {
    return NextResponse.json({ error: 'BEACON_TOKEN not configured' }, { status: 503 })
  }
  const auth = req.headers.get('authorization') || ''
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
  if (!token || token !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Accept snake_case (what the bash beacon sends) or camelCase.
  const pick = (...keys: string[]) => {
    for (const k of keys) if (body[k] != null) return body[k]
    return undefined
  }

  const clientId = String(pick('client_id', 'clientId') ?? '').trim()
  if (!clientId) {
    return NextResponse.json({ error: 'client_id is required' }, { status: 400 })
  }

  const extraRaw = pick('extra')
  const input: BeaconInput = {
    clientId,
    containerStatus: (pick('container_status', 'containerStatus') as BeaconInput['containerStatus']) ?? 'unknown',
    containerUptimeHours: asInt(pick('container_uptime_hours', 'containerUptimeHours')),
    containerRestartCount: asInt(pick('container_restart_count', 'containerRestartCount')),
    diskPercent: asInt(pick('disk_percent', 'diskPercent')),
    memoryPercent: asInt(pick('memory_percent', 'memoryPercent')),
    gatewayState: (pick('gateway_state', 'gatewayState') as BeaconInput['gatewayState']) ?? 'unknown',
    lastActivityAt: asIso(pick('last_activity_at', 'lastActivityAt')),
    tokenSpendToday: asNum(pick('token_spend_today', 'tokenSpendToday')),
    tokenSpendMonth: asNum(pick('token_spend_month', 'tokenSpendMonth')),
    publicListeners: asPublicListeners(pick('public_listeners', 'publicListeners')),
    cpuPercent: asNum(pick('cpu_percent', 'cpuPercent')),
    loadAvg: asLoadAvg(pick('load_avg', 'loadAvg')),
    cpuCores: asInt(pick('cpu_cores', 'cpuCores')),
    configHash: asStr(pick('config_hash', 'configHash')),
    dangerousConfigKeys: asStrArray(pick('dangerous_config_keys', 'dangerousConfigKeys')),
    outboundRemotes: asOutboundRemotes(pick('outbound_remotes', 'outboundRemotes')),
    extra: extraRaw && typeof extraRaw === 'object' ? (extraRaw as Record<string, unknown>) : {},
  }

  let beacon
  try {
    beacon = await recordBeacon(input)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[beacon] record failed:', msg)
    return NextResponse.json({ error: 'Could not record beacon' }, { status: 500 })
  }

  // Compute budget % from the client's allowance (best-effort — never block ingest).
  let budgetPercent: number | null = null
  let clientName = clientId
  try {
    const client = await getClient(clientId)
    if (client) {
      clientName = client.name
      if (client.tokenAllowance > 0 && beacon.tokenSpendMonth != null) {
        budgetPercent = (beacon.tokenSpendMonth / client.tokenAllowance) * 100
      }
    }
  } catch {
    // ignore — clientId may not be a DB uuid
  }

  // Prior beacons (newest-first, excluding the one we just wrote) feed the
  // sustained-load and config-change rules. Best-effort — never block ingest.
  let prior: Beacon[] = []
  try {
    const history = await getRecentBeaconsByClient()
    prior = (history.get(clientId) ?? []).filter((b) => b.id !== beacon.id)
  } catch {
    // ignore — fall back to single-beacon evaluation
  }

  const evald = evaluateHealth(beacon, Date.now(), budgetPercent, prior)
  let alerted = false
  if (evald.light === 'red') {
    const r = await maybeAlertRed(clientId, clientName, evald.reasons, beacon)
    alerted = r.sent
  } else {
    // Recovered (or never red) — clear the dedupe so the next outage re-alerts.
    noteRecovered(clientId)
  }

  return NextResponse.json({
    ok: true,
    id: beacon.id,
    light: evald.light,
    reasons: evald.reasons,
    alerted,
  })
}
