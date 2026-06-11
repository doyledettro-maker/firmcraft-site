import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Card, CardBody } from '@/components/ui'
import { getClient, getClientUsage } from '@/lib/db'
import { formatSpend } from '@/lib/format'

export const dynamic = 'force-dynamic'

type SearchParams = { month?: string | string[] }

type DayBucket = {
  date: string
  label: string
  cost: number
  calls: number
  models: Record<string, { cost: number; calls: number }>
}

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/

function pickFirst(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined
  return Array.isArray(value) ? value[0] : value
}

function currentMonthKey(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function parseMonth(param: string | undefined): { year: number; month: number; key: string } {
  if (param && MONTH_RE.test(param)) {
    const [y, m] = param.split('-').map(Number)
    return { year: y, month: m, key: param }
  }
  const now = new Date()
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    key: currentMonthKey(now),
  }
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function monthRange(year: number, month: number) {
  const from = `${year}-${pad2(month)}-01`
  const to = `${year}-${pad2(month)}-${pad2(daysInMonth(year, month))}`
  return { from, to }
}

function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(year, month - 1 + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

function monthLabel(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

export default async function UsagePage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: SearchParams
}) {
  const client = await getClient(params.id)
  if (!client) notFound()

  const monthParam = pickFirst(searchParams.month)
  const { year, month, key: monthKey } = parseMonth(monthParam)
  const range = monthRange(year, month)
  const usage = await getClientUsage(client.id, range)

  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const nowMonthKey = currentMonthKey()
  const prev = shiftMonth(year, month, -1)
  const next = shiftMonth(year, month, 1)
  const nextKey = `${next.year}-${pad2(next.month)}`
  const prevKey = `${prev.year}-${pad2(prev.month)}`
  const canGoNext = nextKey <= nowMonthKey

  // Aggregate events by date
  const aggregated = new Map<
    string,
    { cost: number; calls: number; models: Record<string, { cost: number; calls: number }> }
  >()
  for (const e of usage.events) {
    const existing = aggregated.get(e.date) ?? { cost: 0, calls: 0, models: {} }
    existing.cost += e.cost
    existing.calls += e.apiCalls
    const modelKey = e.model ?? 'unknown'
    const m = existing.models[modelKey] ?? { cost: 0, calls: 0 }
    m.cost += e.cost
    m.calls += e.apiCalls
    existing.models[modelKey] = m
    aggregated.set(e.date, existing)
  }

  // Build a row for every day in the selected month
  const totalDays = daysInMonth(year, month)
  const days: DayBucket[] = []
  for (let d = 1; d <= totalDays; d++) {
    const date = `${year}-${pad2(month)}-${pad2(d)}`
    const agg = aggregated.get(date)
    days.push({
      date,
      label: new Date(year, month - 1, d).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      cost: agg?.cost ?? 0,
      calls: agg?.calls ?? 0,
      models: agg?.models ?? {},
    })
  }

  const maxCost = Math.max(...days.map((d) => d.cost), 0)

  // Last-24h activity (only meaningful when viewing the current month)
  const showActivityCard = monthKey === nowMonthKey
  const last24h = days.filter((d) => d.date >= yesterday)
  const hasRecentActivity = last24h.some((d) => d.calls > 0)

  // Model breakdown for the selected month
  const modelTotals: Record<string, { cost: number; calls: number }> = {}
  for (const day of days) {
    for (const [model, s] of Object.entries(day.models)) {
      const existing = modelTotals[model] ?? { cost: 0, calls: 0 }
      existing.cost += s.cost
      existing.calls += s.calls
      modelTotals[model] = existing
    }
  }
  const modelList = Object.entries(modelTotals).sort((a, b) => b[1].cost - a[1].cost)

  const periodLabel = monthLabel(year, month)

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
          <h1 className="font-sans font-semibold text-[36px] leading-[1.05] tracking-[-0.02em] mt-1">
            Daily <em className="text-signal not-italic">consumption</em>
          </h1>
          <p className="text-ink-2 mt-2 max-w-[500px] leading-relaxed">
            AI spend for {client.name} in {periodLabel}.
          </p>
        </div>
        <div className="text-right flex-none">
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">Period total</div>
          <div className="font-sans font-semibold text-[28px] tracking-[-0.02em] mt-1">{formatSpend(usage.totals.cost)}</div>
          <div className="text-[12.5px] text-ink-2">{usage.totals.apiCalls.toLocaleString()} calls</div>
        </div>
      </div>

      {showActivityCard && (
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
      )}

      {/* Daily bar chart */}
      <Card className="mb-6">
        <div className="px-6 py-5 border-b border-line flex items-center justify-between gap-4">
          <div>
            <div className="eyebrow">Daily spend</div>
            <h3 className="font-sans font-semibold text-[20px] tracking-[-0.01em] mt-1">Cost by day</h3>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href={`/clients/${client.id}/usage?month=${prevKey}`}
              aria-label={`Previous month (${monthLabel(prev.year, prev.month)})`}
              className="p-1.5 rounded hover:bg-paper-2 text-ink-2 hover:text-ink transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-[150px] text-center text-[13px] font-medium font-mono">
              {periodLabel}
            </div>
            {canGoNext ? (
              <Link
                href={`/clients/${client.id}/usage?month=${nextKey}`}
                aria-label={`Next month (${monthLabel(next.year, next.month)})`}
                className="p-1.5 rounded hover:bg-paper-2 text-ink-2 hover:text-ink transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <span
                aria-disabled="true"
                className="p-1.5 rounded text-muted opacity-40 cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </span>
            )}
          </div>
        </div>
        <CardBody className="px-6 py-5">
          <div className="space-y-2">
            {days.map((day) => {
              const pct = maxCost > 0 && day.cost > 0 ? Math.max((day.cost / maxCost) * 100, 2) : 0
              const isToday = day.date === today
              const isYesterday = day.date === yesterday
              return (
                <div key={day.date} className="group">
                  <div className="flex items-center gap-3">
                    <div className="w-[72px] flex-none text-[12px] font-mono text-muted">
                      {day.label}
                      {isToday && <span className="text-accent ml-1">*</span>}
                    </div>
                    <div className="flex-1 h-7 bg-paper-2 rounded overflow-hidden relative">
                      {pct > 0 && (
                        <div
                          className={`h-full rounded transition-all ${isToday || isYesterday ? 'bg-accent' : 'bg-accent-2'}`}
                          style={{ width: `${pct}%` }}
                        />
                      )}
                    </div>
                    <div className="w-[100px] flex-none text-right">
                      <span className={`text-[13px] font-medium ${day.cost === 0 ? 'text-muted' : ''}`}>
                        {formatSpend(day.cost)}
                      </span>
                      <span className="text-[11px] text-muted ml-2">{day.calls}c</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardBody>
      </Card>

      {/* Model breakdown */}
      {modelList.length > 0 && (
        <Card>
          <div className="px-6 py-5 border-b border-line">
            <div className="eyebrow">Breakdown</div>
            <h3 className="font-sans font-semibold text-[20px] tracking-[-0.01em] mt-1">By model</h3>
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
