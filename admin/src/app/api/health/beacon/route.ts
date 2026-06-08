import { NextResponse } from 'next/server'
import { recordBeacon, evaluateHealth, type BeaconInput } from '@/lib/db/health-beacons'
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

  const evald = evaluateHealth(beacon, Date.now(), budgetPercent)
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
