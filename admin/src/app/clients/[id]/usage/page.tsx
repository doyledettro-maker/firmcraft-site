import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, TrendingUp } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Card, CardBody } from '@/components/ui'
import { getClient, getClientUsage } from '@/lib/db'
import { formatSpend } from '@/lib/format'

export const dynamic = 'force-dynamic'

function last30DaysRange(now = new Date()) {
  const to = now.toISOString().slice(0, 10)
  const from = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10)
  return { from, to }
}

type DayBucket = {
  date: string
  label: string
  cost: number
  calls: number
  models: Record<string, { cost: number; calls: number }>
}

export default async function UsagePage({ params }: { params: { id: string } }) {
  const client = await getClient(params.id)
  if (!client) notFound()

  const range = last30DaysRange()
  const usage = await getClientUsage(client.id, range)

  // Bucket events by date
  const bucketMap = new Map<string, DayBucket>()
  for (const e of usage.events) {
    const existing = bucketMap.get(e.date)
    if (existing) {
      existing.cost += e.cost
      existing.calls += e.apiCalls
      const m = existing.models[e.model ?? 'unknown'] ?? { cost: 0, calls: 0 }
      m.cost += e.cost
      m.calls += e.apiCalls
      existing.models[e.model ?? 'unknown'] = m
    } else {
      bucketMap.set(e.date, {
        date: e.date,
        label: new Date(e.date + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        cost: e.cost,
        calls: e.apiCalls,
        models: { [e.model ?? 'unknown']: { cost: e.cost, calls: e.apiCalls } },
      })
    }
  }

  // Sort ascending by date
  const days = Array.from(bucketMap.values()).sort((a, b) => a.date.localeCompare(b.date))
  const maxCost = Math.max(...days.map((d) => d.cost), 0.01)

  // Check last 24h
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const today = new Date().toISOString().slice(0, 10)
  const last24h = days.filter((d) => d.date >= yesterday)
  const hasRecentActivity = last24h.length > 0 && last24h.some((d) => d.calls > 0)

  // Model breakdown across all time
  const modelTotals: Record<string, { cost: number; calls: number }> = {}
  for (const day of days) {
    for (const [model, s] of Object.entries(day.models)) {
      const ms = s as { cost: number; calls: number }
      const existing = modelTotals[model] ?? { cost: 0, calls: 0 }
      existing.cost += ms.cost
      existing.calls += ms.calls
      modelTotals[model] = existing
    }
  }
  const modelList = Object.entries(modelTotals).sort((a, b) => b[1].cost - a[1].cost)

  return (
    <AppShell>
      <Link
        href={`/clients/${client.id}`}
        className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink transition-colors mb-4"
      >
        <ChevronLeft className="w-4 h-4" /> {client.name}
      </Link>

      <div className="flex items-start justify-between gap-6 mb-7">
        <div>
          <div className="eyebrow">Usage</div>
          <h1 className="font-serif-warm text-[36px] leading-[1.05] tracking-[-0.02em] mt-1">
            Daily <em className="text-accent italic">consumption</em>
          </h1>
          <p className="text-ink-2 mt-2 max-w-[500px] leading-relaxed">
            Last 30 days of AI spend for {client.name}.
          </p>
        </div>
        <div className="text-right flex-none">
          <div className="font-mono-warm text-[11px] uppercase tracking-[0.16em] text-muted">Period total</div>
          <div className="font-serif-warm text-[28px] tracking-[-0.02em] mt-1">{formatSpend(usage.totals.cost)}</div>
          <div className="text-[12.5px] text-ink-2">{usage.totals.apiCalls.toLocaleString()} calls</div>
        </div>
      </div>

      {/* Activity status */}
      <Card className="mb-6">
        <CardBody className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${hasRecentActivity ? 'bg-status-up' : 'bg-status-down'}`} />
            <span className="text-[14px]">
              {hasRecentActivity
                ? `Active in the last 24h — ${last24h.reduce((s, d) => s + d.calls, 0)} calls, ${formatSpend(last24h.reduce((s, d) => s + d.cost, 0))}`
                : 'No activity in the last 24 hours'}
            </span>
          </div>
        </CardBody>
      </Card>

      {/* Daily bar chart */}
      <Card className="mb-6">
        <div className="px-6 py-5 border-b border-line">
          <div className="eyebrow">Daily spend</div>
          <h3 className="font-serif-warm text-[20px] tracking-[-0.01em] mt-1">Cost by day</h3>
        </div>
        <CardBody className="px-6 py-5">
          {days.length === 0 ? (
            <p className="text-muted text-[14px]">No usage data for this period.</p>
          ) : (
            <div className="space-y-2">
              {days.map((day) => {
                const pct = Math.max((day.cost / maxCost) * 100, 2)
                const isToday = day.date === today
                const isYesterday = day.date === yesterday
                return (
                  <div key={day.date} className="group">
                    <div className="flex items-center gap-3">
                      <div className="w-[72px] flex-none text-[12px] font-mono-warm text-muted">
                        {day.label}
                        {isToday && <span className="text-accent ml-1">*</span>}
                      </div>
                      <div className="flex-1 h-7 bg-paper-2 rounded overflow-hidden relative">
                        <div
                          className={`h-full rounded transition-all ${isToday || isYesterday ? 'bg-accent' : 'bg-accent-2'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="w-[100px] flex-none text-right">
                        <span className="text-[13px] font-medium">{formatSpend(day.cost)}</span>
                        <span className="text-[11px] text-muted ml-2">{day.calls}c</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Model breakdown */}
      {modelList.length > 0 && (
        <Card>
          <div className="px-6 py-5 border-b border-line">
            <div className="eyebrow">Breakdown</div>
            <h3 className="font-serif-warm text-[20px] tracking-[-0.01em] mt-1">By model</h3>
          </div>
          <ul className="divide-y divide-line">
            {modelList.map(([model, stats]) => (
              <li key={model} className="flex items-center justify-between px-6 py-4">
                <div>
                  <div className="text-[14px] font-medium text-ink">{model}</div>
                  <div className="text-[12px] text-muted">{stats.calls.toLocaleString()} calls</div>
                </div>
                <div className="text-[14px] font-medium">{formatSpend(stats.cost)}</div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </AppShell>
  )
}
