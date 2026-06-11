'use client'

import { useEffect, useRef, useState } from 'react'
import { RefreshCw, Server, HardDrive, Cpu, Coins, Activity, Wifi, WifiOff } from 'lucide-react'
import { Badge } from './ui'
import type { ClientHealth, HealthLight } from '@/lib/db/health-beacons'

type HealthResponse = {
  checkedAt: string
  counts: Record<HealthLight, number>
  clients: ClientHealth[]
}

export function ClientHealthGrid({ intervalMs = 60_000 }: { intervalMs?: number }) {
  const [data, setData] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  async function load() {
    try {
      setLoading(true)
      const res = await fetch('/api/health/clients', { cache: 'no-store' })
      const json = (await res.json()) as HealthResponse & { error?: string }
      if (json.error) throw new Error(json.error)
      setData(json)
      setError(null)
      setLastFetch(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    if (intervalMs > 0) timer.current = setInterval(load, intervalMs)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs])

  const counts = data?.counts ?? { green: 0, yellow: 0, red: 0 }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <div className="flex items-center gap-2.5">
          <CountPill light="red" n={counts.red} label="Down" />
          <CountPill light="yellow" n={counts.yellow} label="Warning" />
          <CountPill light="green" n={counts.green} label="Healthy" />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12.5px] text-muted font-mono">
            {lastFetch
              ? `Updated ${lastFetch.toLocaleTimeString()}`
              : loading
                ? 'Loading…'
                : '—'}
            {intervalMs > 0 ? ` · auto ${Math.round(intervalMs / 1000)}s` : ''}
          </span>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 text-[13px] text-ink-2 hover:text-ink disabled:opacity-50 px-3 py-1.5 rounded-full border border-line-2 hover:border-accent transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-[#F87171]/30 bg-[#2A1520] px-4 py-3 text-[13.5px] text-[#FCA5A5] mb-4">
          Couldn’t reach health API: {error}
        </div>
      ) : null}

      {data && data.clients.length === 0 ? (
        <div className="rounded-xl border border-line bg-paper px-5 py-8 text-center text-muted text-[14px]">
          No client beacons yet. Install <code className="font-mono">health-beacon.sh</code> on a
          client VPS to start receiving heartbeats.
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {(data?.clients ?? skeletons()).map((c) => (
          <HealthCard key={c.clientId} c={c} />
        ))}
      </div>
    </div>
  )
}

function HealthCard({ c }: { c: ClientHealth }) {
  const accent =
    c.light === 'green'
      ? 'border-l-[3px] border-l-status-up'
      : c.light === 'yellow'
        ? 'border-l-[3px] border-l-status-warn'
        : 'border-l-[3px] border-l-status-down'

  return (
    <div className={`rounded-xl border border-line bg-paper ${accent} px-4 py-4`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Dot light={c.light} />
            <span className="font-medium text-ink truncate">{c.clientName}</span>
          </div>
          <div className="text-[11.5px] text-muted font-mono mt-0.5 truncate">
            {c.known ? (c.plan ? `${c.plan} plan` : 'client') : 'unregistered'}
            {c.beacon ? ` · ${heartbeatAgo(c.staleMs)}` : ' · never reported'}
          </div>
        </div>
        <LightBadge light={c.light} />
      </div>

      {c.reasons.length > 0 ? (
        <div className="text-[12px] text-ink-2 mb-3 leading-snug">
          {c.reasons.join(' · ')}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12.5px]">
        <Metric
          icon={<Server className="w-3.5 h-3.5" />}
          label="Container"
          value={c.beacon?.containerStatus ?? '—'}
          tone={c.beacon?.containerStatus === 'running' ? 'ok' : c.beacon ? 'bad' : 'muted'}
        />
        <Metric
          icon={
            c.beacon?.gatewayState === 'connected' ? (
              <Wifi className="w-3.5 h-3.5" />
            ) : (
              <WifiOff className="w-3.5 h-3.5" />
            )
          }
          label="Gateway"
          value={c.beacon?.gatewayState ?? '—'}
          tone={
            c.beacon?.gatewayState === 'connected'
              ? 'ok'
              : c.beacon?.gatewayState === 'disconnected'
                ? 'bad'
                : 'muted'
          }
        />
        <Metric
          icon={<HardDrive className="w-3.5 h-3.5" />}
          label="Disk"
          value={c.beacon?.diskPercent != null ? `${c.beacon.diskPercent}%` : '—'}
          tone={c.beacon?.diskPercent != null && c.beacon.diskPercent > 80 ? 'warn' : 'muted'}
        />
        <Metric
          icon={<Cpu className="w-3.5 h-3.5" />}
          label="Memory"
          value={c.beacon?.memoryPercent != null ? `${c.beacon.memoryPercent}%` : '—'}
          tone={c.beacon?.memoryPercent != null && c.beacon.memoryPercent > 90 ? 'warn' : 'muted'}
        />
        <Metric
          icon={<Activity className="w-3.5 h-3.5" />}
          label="Uptime"
          value={c.beacon?.containerUptimeHours != null ? fmtUptime(c.beacon.containerUptimeHours) : '—'}
          tone="muted"
        />
        <Metric
          icon={<Coins className="w-3.5 h-3.5" />}
          label="Spend (mo)"
          value={
            c.beacon?.tokenSpendMonth != null
              ? `$${c.beacon.tokenSpendMonth.toFixed(2)}${
                  c.budgetPercent != null ? ` · ${Math.round(c.budgetPercent)}%` : ''
                }`
              : '—'
          }
          tone={c.budgetPercent != null && c.budgetPercent > 80 ? 'warn' : 'muted'}
        />
      </div>
    </div>
  )
}

function Metric({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string
  tone: 'ok' | 'warn' | 'bad' | 'muted'
}) {
  const valueCls =
    tone === 'ok'
      ? 'text-status-up'
      : tone === 'warn'
        ? 'text-status-warn'
        : tone === 'bad'
          ? 'text-status-down'
          : 'text-ink'
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-muted flex-none">{icon}</span>
      <span className="text-muted flex-none">{label}</span>
      <span className={`ml-auto font-mono truncate ${valueCls}`}>{value}</span>
    </div>
  )
}

function Dot({ light }: { light: HealthLight }) {
  const cls =
    light === 'green'
      ? 'bg-status-up shadow-[0_0_8px_rgba(127,184,112,0.5)]'
      : light === 'yellow'
        ? 'bg-status-warn shadow-[0_0_8px_rgba(232,178,85,0.5)]'
        : 'bg-status-down shadow-[0_0_8px_rgba(232,112,79,0.5)]'
  return <span className={`inline-block w-2.5 h-2.5 rounded-full flex-none ${cls}`} aria-hidden />
}

function LightBadge({ light }: { light: HealthLight }) {
  if (light === 'green') return <Badge tone="green">Healthy</Badge>
  if (light === 'yellow') return <Badge tone="amber">Warning</Badge>
  return <Badge tone="red">Down</Badge>
}

function CountPill({ light, n, label }: { light: HealthLight; n: number; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-line bg-paper">
      <Dot light={light} />
      <span className="font-mono text-[14px] text-ink">{n}</span>
      <span className="text-[12px] text-muted">{label}</span>
    </div>
  )
}

function heartbeatAgo(staleMs: number | null): string {
  if (staleMs == null) return 'no heartbeat'
  const min = Math.round(staleMs / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const h = Math.round(min / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

function fmtUptime(hours: number): string {
  if (hours < 24) return `${hours}h`
  return `${Math.round(hours / 24)}d`
}

function skeletons(): ClientHealth[] {
  return Array.from({ length: 3 }, (_, i) => ({
    clientId: `skeleton-${i}`,
    clientName: '—',
    known: false,
    plan: null,
    vpsIp: null,
    tokenAllowance: null,
    budgetPercent: null,
    light: 'yellow' as HealthLight,
    staleMs: null,
    reasons: [],
    beacon: null,
  }))
}
