'use client'

import { useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Badge } from './ui'
import type { ServiceCheck, ServiceStatus } from '@/lib/health-checks'

type HealthResponse = {
  overall: ServiceStatus
  checkedAt: string
  services: ServiceCheck[]
}

export function ServiceStatusList({
  intervalMs = 60_000,
  showOverall = true,
}: {
  intervalMs?: number
  showOverall?: boolean
}) {
  const [data, setData] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  async function load() {
    try {
      setLoading(true)
      const res = await fetch('/api/health', { cache: 'no-store' })
      const json = (await res.json()) as HealthResponse
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
    if (intervalMs > 0) {
      timer.current = setInterval(load, intervalMs)
    }
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs])

  return (
    <div>
      {showOverall ? (
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <OverallDot status={data?.overall} />
            <div>
              <div className="font-serif-warm text-[22px] tracking-[-0.01em] leading-tight">
                {overallLabel(data?.overall, loading && !data)}
              </div>
              <div className="text-[12.5px] text-muted font-mono-warm">
                {lastFetch
                  ? `Last checked ${lastFetch.toLocaleTimeString()}`
                  : loading
                    ? 'Checking…'
                    : '—'}
                {intervalMs > 0 ? ` · auto-refresh ${Math.round(intervalMs / 1000)}s` : ''}
              </div>
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 text-[13px] text-ink-2 hover:text-ink disabled:opacity-50 px-3 py-1.5 rounded-full border border-line-2 hover:border-accent transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-[#F87171]/30 bg-[#2A1520] px-4 py-3 text-[13.5px] text-[#FCA5A5] mb-4">
          Couldn’t reach health API: {error}
        </div>
      ) : null}

      <ul className="grid gap-2">
        {(data?.services ?? placeholder()).map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl border border-line bg-paper"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Dot status={s.status} />
              <div className="min-w-0">
                <div className="font-medium text-ink truncate">{s.name}</div>
                <div className="text-[12.5px] text-muted truncate">{s.description}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-none">
              <span className="font-mono-warm text-[11.5px] text-muted hidden sm:inline">
                {s.latencyMs != null ? `${s.latencyMs}ms` : '—'}
              </span>
              <StatusBadge status={s.status} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Dot({ status }: { status: ServiceStatus }) {
  const cls =
    status === 'up'
      ? 'bg-status-up shadow-[0_0_8px_rgba(127,184,112,0.5)]'
      : status === 'degraded'
        ? 'bg-status-warn shadow-[0_0_8px_rgba(232,178,85,0.5)]'
        : 'bg-status-down shadow-[0_0_8px_rgba(232,112,79,0.5)]'
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${cls}`} aria-hidden />
}

function OverallDot({ status }: { status?: ServiceStatus }) {
  if (!status) {
    return <span className="inline-block w-3.5 h-3.5 rounded-full bg-line-2" aria-hidden />
  }
  const cls =
    status === 'up'
      ? 'bg-status-up shadow-[0_0_10px_rgba(127,184,112,0.55)]'
      : status === 'degraded'
        ? 'bg-status-warn shadow-[0_0_10px_rgba(232,178,85,0.55)]'
        : 'bg-status-down shadow-[0_0_10px_rgba(232,112,79,0.55)]'
  return <span className={`inline-block w-3.5 h-3.5 rounded-full ${cls}`} aria-hidden />
}

function StatusBadge({ status }: { status: ServiceStatus }) {
  if (status === 'up') return <Badge tone="green">Operational</Badge>
  if (status === 'degraded') return <Badge tone="amber">Degraded</Badge>
  return <Badge tone="red">Down</Badge>
}

function overallLabel(status: ServiceStatus | undefined, loading: boolean) {
  if (loading) return 'Checking services…'
  if (!status) return 'Unknown'
  if (status === 'up') return 'All systems operational'
  if (status === 'degraded') return 'Some services degraded'
  return 'Service incident in progress'
}

function placeholder(): ServiceCheck[] {
  // Render rows in unknown state until we have real data.
  return [
    skeleton('litellm', 'LiteLLM Proxy', 'llm.firmcraft.ai'),
    skeleton('langfuse', 'Langfuse', 'langfuse.firmcraft.ai'),
    skeleton('hermes', 'Hermes Agent', 'firmcraft.firmcraft.ai'),
    skeleton('admin', 'Admin Dashboard', 'admin.firmcraft.ai'),
    skeleton('marketing', 'Marketing Site', 'firmcraft.ai'),
  ]
}

function skeleton(id: string, name: string, description: string): ServiceCheck {
  return {
    id,
    name,
    description,
    url: '',
    status: 'degraded',
    latencyMs: null,
    httpStatus: null,
    error: null,
    checkedAt: '',
  }
}
